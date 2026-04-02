import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const type = body.type || 'forecast'; // 'forecast' | 'current' | 'hourly'

    if (type === 'current') {
      const res = await fetch('https://api.swpc.noaa.gov/json/planetary_k_index_1m.json');
      if (!res.ok) throw new Error(`NOAA KP API error: ${res.status}`);
      const data = await res.json();
      const last = data[data.length - 1];
      return Response.json({ time_tag: last[0], kp: parseFloat(last[1]) || 0, source: 'NOAA' });
    }

    // Both 'forecast' and 'hourly' use the same NOAA endpoint
    const res = await fetch('https://api.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json');
    if (!res.ok) throw new Error(`NOAA API error: ${res.status}`);
    const raw = await res.json();
    const rows = raw.slice(1);

    if (type === 'hourly') {
      const result = rows.slice(0, 24).map(row => {
        const timeTag = String(row[0]);
        const [date, time] = timeTag.split(' ');
        const hour = time ? parseInt(time.split(':')[0], 10) : 0;
        return { time: timeTag, date, hour, kp: parseFloat(row[1]) || 0 };
      });
      return Response.json(result);
    }

    // Default: daily forecast
    const byDay = {};
    rows.forEach(([timeTag, kp]) => {
      const date = String(timeTag).split(' ')[0];
      const kpVal = parseFloat(kp) || 0;
      if (!byDay[date] || kpVal > byDay[date]) byDay[date] = kpVal;
    });

    const result = Object.entries(byDay).slice(0, 7).map(([date, kpMax]) => ({
      date,
      kp_index: Math.round(kpMax * 10) / 10,
      kp_min: Math.max(0, Math.round((kpMax - 0.5) * 10) / 10),
      kp_max: Math.round((kpMax + 0.5) * 10) / 10,
      visibility_rating: kpMax >= 5 ? 'good' : kpMax >= 3 ? 'possible' : 'unlikely',
      source: 'NOAA',
    }));

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});