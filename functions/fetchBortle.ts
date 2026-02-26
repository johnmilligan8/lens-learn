import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Fetches Bortle scale / SQM for a given lat/lon
 * Uses the light pollution map tile data from lightpollutionmap.info
 * which provides World Atlas of Artificial Night Sky Brightness data.
 * 
 * The endpoint: https://www.lightpollutionmap.info/QueryRaster/?ql=wa2015&qt=point&qd=lon,lat
 * Returns SQM (mag/arcsec²) value which we convert to Bortle.
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

    // Try lightpollutionmap.info World Atlas 2015 dataset
    // This returns a radiance value we convert to SQM → Bortle
    let bortle = null;
    let sqm = null;
    let source = 'estimate';

    try {
      const url = `https://www.lightpollutionmap.info/QueryRaster/?ql=wa2015&qt=point&qd=${lon},${lat}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'UnchartedApp/1.0' },
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const text = await res.text();
        // Response is a plain number (artificial sky luminance in mcd/m²)
        const radiance = parseFloat(text.trim());
        
        if (!isNaN(radiance) && radiance >= 0) {
          // Convert artificial sky brightness (mcd/m²) to SQM (mag/arcsec²)
          // Formula: SQM ≈ 21.6 - 2.5 * log10(1 + radiance/0.171168465)
          // Reference: Cinzano 2001 calibration
          sqm = 21.6 - 2.5 * Math.log10(1 + radiance / 0.171168465);
          sqm = Math.round(sqm * 10) / 10;
          
          // Convert SQM to Bortle scale
          // Bortle 1: SQM > 21.99
          // Bortle 2: 21.89–21.99
          // Bortle 3: 21.69–21.89
          // Bortle 4: 21.25–21.69
          // Bortle 5: 20.49–21.25
          // Bortle 6: 19.50–20.49
          // Bortle 7: 18.95–19.50
          // Bortle 8: 18.38–18.95
          // Bortle 9: < 18.38
          if (sqm >= 21.99) bortle = 1;
          else if (sqm >= 21.89) bortle = 2;
          else if (sqm >= 21.69) bortle = 3;
          else if (sqm >= 21.25) bortle = 4;
          else if (sqm >= 20.49) bortle = 5;
          else if (sqm >= 19.50) bortle = 6;
          else if (sqm >= 18.95) bortle = 7;
          else if (sqm >= 18.38) bortle = 8;
          else bortle = 9;

          source = 'lightpollutionmap';
        }
      }
    } catch (_) {
      // fall through to coordinate-based estimate
    }

    // Fallback: coordinate-based estimate if API failed
    if (bortle === null) {
      bortle = estimateBortleByCoords(lat, lon);
      source = 'coordinate_estimate';
    }

    const description = bortleDescription(bortle);

    return Response.json({ bortle, sqm, source, description, lat, lon });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function estimateBortleByCoords(lat, lon) {
  // Known major cities and their approximate Bortle ratings
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

  let nearestBortle = 9;
  let nearestDist = Infinity;
  for (const [clat, clon, b] of cities) {
    const dist = Math.sqrt((lat - clat) ** 2 + (lon - clon) ** 2);
    if (dist < nearestDist) { nearestDist = dist; nearestBortle = b; }
  }

  if (nearestDist < 0.25) return nearestBortle;
  if (nearestDist < 0.5) return Math.min(nearestBortle, 6);
  if (nearestDist < 1.0) return Math.min(nearestBortle, 5);
  return 4; // default rural
}

function bortleDescription(b) {
  const descriptions = {
    1: 'Truly dark sky',
    2: 'Truly dark sky',
    3: 'Rural sky',
    4: 'Rural/suburban transition',
    5: 'Suburban sky',
    6: 'Bright suburban sky',
    7: 'Suburban/urban transition',
    8: 'City sky',
    9: 'Inner-city sky',
  };
  return descriptions[b] || 'Unknown';
}