import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Returns Bortle class + SQM for a lat/lon.
 * 
 * Strategy:
 * 1. Try lightpollutionmap.info QueryRaster (World Atlas 2015 dataset)
 *    — returns artificial sky brightness ratio → convert to SQM → Bortle
 * 2. Fall back to distance-based city proximity estimate
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { lat, lon } = body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return Response.json({ error: 'lat and lon required' }, { status: 400 });
    }

    let bortle = null;
    let sqm = null;
    let source = 'estimate';

    // Attempt 1: lightpollutionmap.info World Atlas 2015
    try {
      const url = `https://www.lightpollutionmap.info/QueryRaster/?ql=wa2015&qt=point&qd=${lon.toFixed(5)},${lat.toFixed(5)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; astronomy-app)',
          'Accept': 'text/plain,*/*',
          'Referer': 'https://www.lightpollutionmap.info/',
          'Origin': 'https://www.lightpollutionmap.info',
        },
        signal: AbortSignal.timeout(7000),
      });

      if (res.ok) {
        const text = (await res.text()).trim();
        const ratio = parseFloat(text);
        if (!isNaN(ratio) && ratio >= 0) {
          // ratio = artificial sky brightness / natural background (dimensionless)
          // SQM formula: Falchi et al. (2016) calibration
          // Natural sky: 21.7 mag/arcsec² → ratio 0 means pristine sky (Bortle 1-2)
          sqm = Math.round((21.7 - 2.5 * Math.log10(1 + ratio)) * 10) / 10;
          sqm = Math.min(22.0, Math.max(15.0, sqm));
          bortle = sqmToBortle(sqm);
          source = 'lightpollutionmap_wa2015';
        }
      }
    } catch (_) { /* network error */ }

    // Attempt 2: VIIRS 2023 dataset
    if (bortle === null) {
      try {
        const url = `https://www.lightpollutionmap.info/QueryRaster/?ql=viirs2023&qt=point&qd=${lon.toFixed(5)},${lat.toFixed(5)}`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; astronomy-app)',
            'Referer': 'https://www.lightpollutionmap.info/',
          },
          signal: AbortSignal.timeout(7000),
        });
        if (res.ok) {
          const text = (await res.text()).trim();
          const radiance = parseFloat(text); // nW/cm²/sr
          if (!isNaN(radiance) && radiance >= 0) {
            // VIIRS radiance → SQM conversion (approximate)
            // Reference: 0 nW/cm²/sr ≈ SQM 22, 100 ≈ SQM 18
            if (radiance < 0.01) { sqm = 22.0; }
            else { sqm = Math.round((22.0 - 2.5 * Math.log10(1 + radiance * 50)) * 10) / 10; }
            sqm = Math.min(22.0, Math.max(15.0, sqm));
            bortle = sqmToBortle(sqm);
            source = 'lightpollutionmap_viirs2023';
          }
        }
      } catch (_) { /* network error */ }
    }

    // Fallback: coordinate proximity estimate
    if (bortle === null) {
      bortle = estimateBortleByCoords(lat, lon);
      sqm = bortleToSQM(bortle);
      source = 'coordinate_estimate';
    }

    return Response.json({ bortle, sqm, source, description: bortleDescription(bortle), lat, lon });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function sqmToBortle(sqm) {
  if (sqm >= 21.99) return 1;
  if (sqm >= 21.89) return 2;
  if (sqm >= 21.69) return 3;
  if (sqm >= 21.25) return 4;
  if (sqm >= 20.49) return 5;
  if (sqm >= 19.50) return 6;
  if (sqm >= 18.95) return 7;
  if (sqm >= 18.38) return 8;
  return 9;
}

function bortleToSQM(b) {
  return { 1: 22.0, 2: 21.9, 3: 21.7, 4: 21.4, 5: 20.8, 6: 20.0, 7: 19.2, 8: 18.6, 9: 17.9 }[b] ?? 20.0;
}

function estimateBortleByCoords(lat, lon) {
  // [lat, lon, bortle_at_core]
  const cities = [
    [40.71, -74.01, 9],  // NYC
    [34.05, -118.24, 9], // LA
    [41.85, -87.65, 9],  // Chicago
    [29.76, -95.37, 8],  // Houston
    [33.45, -112.07, 8], // Phoenix
    [32.78, -96.80, 8],  // Dallas
    [47.61, -122.33, 8], // Seattle
    [37.77, -122.42, 8], // SF
    [39.74, -104.98, 7], // Denver
    [40.76, -111.89, 7], // Salt Lake City
    [36.17, -115.14, 8], // Las Vegas
    [39.95, -75.17, 8],  // Philadelphia
    [42.36, -71.06, 8],  // Boston
    [45.52, -122.68, 7], // Portland
    [35.23, -80.84, 7],  // Charlotte
    [30.27, -97.74, 7],  // Austin
    [25.77, -80.19, 8],  // Miami
    [33.75, -84.39, 7],  // Atlanta
    [41.50, -81.69, 7],  // Cleveland
    [44.98, -93.27, 7],  // Minneapolis
    [41.23, -111.97, 6], // Ogden UT
    [40.23, -111.66, 6], // Provo UT
    [37.09, -113.57, 5], // St George UT
    [41.74, -111.83, 5], // Logan UT
    [43.62, -116.20, 7], // Boise ID
    [46.87, -113.99, 6], // Missoula MT
    [35.47, -97.52, 7],  // OKC
    [36.17, -86.78, 7],  // Nashville
  ];

  let nearestBortle = 9, nearestDist = Infinity;
  for (const [clat, clon, b] of cities) {
    const dist = Math.sqrt((lat - clat) ** 2 + (lon - clon) ** 2);
    if (dist < nearestDist) { nearestDist = dist; nearestBortle = b; }
  }

  if (nearestDist < 0.15) return nearestBortle;
  if (nearestDist < 0.30) return Math.max(nearestBortle - 1, 4);
  if (nearestDist < 0.60) return Math.min(5, nearestBortle);
  if (nearestDist < 1.0)  return Math.min(4, nearestBortle);
  if (nearestDist < 2.0)  return 3;
  return 2; // remote
}

function bortleDescription(b) {
  return {
    1: 'Truly dark sky', 2: 'Truly dark sky', 3: 'Rural sky',
    4: 'Rural/suburban transition', 5: 'Suburban sky', 6: 'Bright suburban sky',
    7: 'Suburban/urban transition', 8: 'City sky', 9: 'Inner-city sky',
  }[b] || 'Unknown';
}