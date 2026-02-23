/**
 * Fetches real aurora forecast data from NOAA Space Weather Prediction Center
 * Public API — no key required, CORS-enabled
 */
export async function fetchNoaaKpForecast() {
  const response = await fetch(
    'https://api.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json'
  );
  if (!response.ok) throw new Error(`NOAA API error: ${response.status}`);
  const raw = await response.json();

  // First row is column headers: ["time_tag", "kp", "observed", "noaa_scale"]
  const rows = raw.slice(1);

  // Group by day, track max KP per day
  const byDay = {};
  rows.forEach(([timeTag, kp]) => {
    const date = String(timeTag).split(' ')[0];
    const kpVal = parseFloat(kp) || 0;
    if (!byDay[date] || kpVal > byDay[date]) byDay[date] = kpVal;
  });

  return Object.entries(byDay).slice(0, 7).map(([date, kpMax]) => ({
    date,
    kp_index: Math.round(kpMax * 10) / 10,
    kp_min: Math.max(0, Math.round((kpMax - 0.5) * 10) / 10),
    kp_max: Math.round((kpMax + 0.5) * 10) / 10,
    visibility_rating: kpMax >= 5 ? 'good' : kpMax >= 3 ? 'possible' : 'unlikely',
    source: 'NOAA',
  }));
}

/**
 * Fetches current real-time KP index (last observed value)
 */
export async function fetchCurrentKp() {
  const response = await fetch(
    'https://api.swpc.noaa.gov/json/planetary_k_index_1m.json'
  );
  if (!response.ok) throw new Error(`NOAA KP API error: ${response.status}`);
  const data = await response.json();
  // Returns array of [time_tag, kp_index, ...], most recent last
  const last = data[data.length - 1];
  return {
    time_tag: last[0],
    kp: parseFloat(last[1]) || 0,
    source: 'NOAA',
  };
}