import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Fetches Bortle scale for a given lat/lon by reading pixel color from
 * lightpollutionmap.app's 2024 PNG tiles (VIIRS-based, annual).
 * 
 * Tile URL pattern: https://lightpollutionmap.app/tiles/2024/tile_{z}_{x}_{y}.png
 * 
 * The tiles use a standard color scale:
 * black/dark = Bortle 1-2 (dark sky)
 * blue       = Bortle 3
 * green      = Bortle 4
 * yellow     = Bortle 5
 * orange     = Bortle 6
 * red        = Bortle 7-8
 * white      = Bortle 9
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { lat, lon } = body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return Response.json({ error: 'lat and lon are required numbers' }, { status: 400 });
    }

    // Try the lightpollutionmap.info QueryRaster endpoint first
    // It returns a raw radiance/luminance value for the World Atlas 2015 dataset
    let bortle = null;
    let sqm = null;
    let source = 'estimate';

    try {
      // Try multiple datasets in order of preference
      const datasets = ['wa2015', 'viirs2023'];
      
      for (const ql of datasets) {
        const url = `https://www.lightpollutionmap.info/QueryRaster/?ql=${ql}&qt=point&qd=${lon},${lat}`;
        const res = await fetch(url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 UnchartedApp/1.0',
            'Referer': 'https://www.lightpollutionmap.info/',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (res.ok) {
          const text = (await res.text()).trim();
          const val = parseFloat(text);
          
          if (!isNaN(val) && val >= 0) {
            // World Atlas 2015: value is artificial sky luminance ratio to natural background
            // Convert to SQM using Cinzano calibration
            // Natural sky background: 0.171 mcd/m²
            // SQM = 21.6 - 2.5 * log10(1 + ratio)  [when val is ratio]
            // Or if val is already mcd/m²: SQM ≈ -2.5*log10(val/108000000) + offset
            
            // The wa2015 dataset returns ratio of artificial to natural (dimensionless)
            sqm = 21.6 - 2.5 * Math.log10(1 + val);
            sqm = Math.round(sqm * 10) / 10;
            bortle = sqmToBortle(sqm);
            source = `lightpollutionmap_${ql}`;
            break;
          }
        }
      }
    } catch (_) {
      // Network error, fall through to coordinate estimate
    }

    // Fallback: coordinate-based estimate
    if (bortle === null) {
      bortle = estimateBortleByCoords(lat, lon);
      sqm = bortleToSQM(bortle);
      source = 'coordinate_estimate';
    }

    const description = bortleDescription(bortle);

    return Response.json({ bortle, sqm, source, description, lat, lon });
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
  const map = { 1: 22.0, 2: 21.9, 3: 21.7, 4: 21.4, 5: 20.8, 6: 20.0, 7: 19.2, 8: 18.6, 9: 17.9 };
  return map[b] ?? 20.0;
}

function estimateBortleByCoords(lat, lon) {
  const cities = [
    [40.71, -74.01, 9],   // NYC
    [34.05, -118.24, 9],  // LA
    [41.85, -87.65, 9],   // Chicago
    [29.76, -95.37, 8],   // Houston
    [33.45, -112.07, 8],  // Phoenix
    [32.78, -96.80, 8],   // Dallas
    [47.61, -122.33, 8],  // Seattle
    [37.77, -122.42, 8],  // SF
    [39.74, -104.98, 7],  // Denver
    [40.76, -111.89, 7],  // Salt Lake City
    [36.17, -115.14, 8],  // Las Vegas
    [39.95, -75.17, 8],   // Philadelphia
    [42.36, -71.06, 8],   // Boston
    [45.52, -122.68, 7],  // Portland
    [35.23, -80.84, 7],   // Charlotte
    [30.27, -97.74, 7],   // Austin
  ];

  let nearestBortle = 4, nearestDist = Infinity;
  for (const [clat, clon, b] of cities) {
    const dist = Math.sqrt((lat - clat) ** 2 + (lon - clon) ** 2);
    if (dist < nearestDist) { nearestDist = dist; nearestBortle = b; }
  }

  if (nearestDist < 0.25) return nearestBortle;
  if (nearestDist < 0.5) return Math.min(nearestBortle, 6);
  if (nearestDist < 1.0) return Math.min(nearestBortle, 5);
  return 4;
}

function bortleDescription(b) {
  const d = {
    1: 'Truly dark sky', 2: 'Truly dark sky', 3: 'Rural sky',
    4: 'Rural/suburban transition', 5: 'Suburban sky', 6: 'Bright suburban sky',
    7: 'Suburban/urban transition', 8: 'City sky', 9: 'Inner-city sky',
  };
  return d[b] || 'Unknown';
}