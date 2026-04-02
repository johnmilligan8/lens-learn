import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Moon phase calculation
function getMoonPhase(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;

  let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  let daysSinceNewMoon = (jd - 2451550.1) % 29.53058867;
  if (daysSinceNewMoon < 0) daysSinceNewMoon += 29.53058867;

  const phase = daysSinceNewMoon / 29.53058867;
  const percent = Math.round(phase * 100);
  
  let phaseName = 'New';
  if (phase > 0.125 && phase <= 0.375) phaseName = 'Waxing Crescent';
  else if (phase > 0.375 && phase <= 0.625) phaseName = 'Waxing Gibbous';
  else if (phase > 0.625 && phase <= 0.875) phaseName = 'Waning Gibbous';
  else if (phase > 0.875) phaseName = 'Waning Crescent';
  else if (phase > 0.25 && phase <= 0.375) phaseName = 'First Quarter';
  else if (phase > 0.625 && phase <= 0.75) phaseName = 'Full';

  return { phase: Math.round(phase * 100), percent, name: phaseName, visibility: Math.abs(50 - percent) };
}

// Sun position (simplified altitude)
function getSunAltitude(lat, lon, date) {
  const d = new Date(date);
  const h = d.getUTCHours() + d.getUTCMinutes() / 60;
  const j = d.getUTCDate();
  const m = d.getUTCMonth() + 1;
  const y = d.getUTCFullYear();

  let n = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + j - 730530;
  let J = n + h / 24;
  let sunLong = 280.46 + 0.9856474 * J;
  let sunMeanAnom = 357.529 + 0.9856003 * J;

  const DtoR = Math.PI / 180;
  let sunElong = sunLong + 1.915 * Math.sin(sunMeanAnom * DtoR) + 0.02 * Math.sin(2 * sunMeanAnom * DtoR);
  let sunObliq = 23.439 - 0.0000004 * J;
  let sunDeclin = Math.asin(Math.sin(sunElong * DtoR) * Math.sin(sunObliq * DtoR)) / DtoR;

  let GMST = 18.697375 + 24.06570982441908 * (J - Math.floor(J));
  let LST = (GMST + lon / 15) % 24;
  let HA = LST * 15 - (sunLong - 0.00569 - 0.00478 * Math.sin(sunMeanAnom * DtoR));

  let altRad = Math.asin(Math.sin(lat * DtoR) * Math.sin(sunDeclin * DtoR) + Math.cos(lat * DtoR) * Math.cos(sunDeclin * DtoR) * Math.cos(HA * DtoR));
  return Math.round(altRad / DtoR);
}

// Fetch KP index for aurora correlation
async function fetchKpIndex() {
  try {
    const res = await fetch('https://services.swpc.noaa.gov/products/noaa-3-day-forecast.json');
    const data = await res.json();
    return data?.[0]?.kp || null;
  } catch (e) {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { lat, lon, date = new Date().toISOString().split('T')[0] } = await req.json();
    if (!lat || !lon) return Response.json({ error: 'lat and lon required' }, { status: 400 });

    const d = new Date(date);
    const moon = getMoonPhase(d);
    const sunAlt = getSunAltitude(lat, lon, d);
    const kp = await fetchKpIndex();

    // Fetch user's journal data to suggest optimal conditions
    const sessions = await base44.entities.ShootSession.filter({ user_email: user.email }, '-created_date', 20);
    const successSessions = sessions.filter(s => s.outcome === 'nailed');
    const topEvent = successSessions.reduce((acc, s) => {
      acc[s.event_type] = (acc[s.event_type] || 0) + 1;
      return acc;
    }, {});
    const topEventType = Object.entries(topEvent).sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

    // Simple aurora potential based on KP
    const auroraChance = kp ? (kp >= 5 ? 'high' : kp >= 3 ? 'moderate' : 'low') : 'unknown';

    return Response.json({
      date,
      moon,
      sun: { altitude: sunAlt, isDaytime: sunAlt > -6 },
      aurora: { kp, chance: auroraChance },
      recommendation: {
        event: topEventType,
        bestTime: sunAlt < -18 ? 'nautical twilight + dark sky' : 'pending',
        moonImpact: moon.visibility > 75 ? 'minimal (dark)' : moon.visibility > 50 ? 'moderate' : 'significant',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});