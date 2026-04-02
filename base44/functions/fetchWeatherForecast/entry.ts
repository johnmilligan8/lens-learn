/**
 * Fetches weather forecast from Open-Meteo (free, no API key required, CORS-enabled)
 * Returns cloud cover, precipitation, temperature, and wind for astrophotography planning
 */
export async function fetchCloudCoverForecast(lat, lon, days = 7) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: 'cloud_cover_mean,precipitation_sum,wind_speed_10m_max,temperature_2m_min',
    timezone: 'auto',
    forecast_days: days,
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error(`Open-Meteo API error: ${response.status}`);
  const data = await response.json();

  return data.daily.time.map((date, i) => ({
    date,
    clouds: Math.round(data.daily.cloud_cover_mean?.[i] ?? 50),
    precipitation: Math.round((data.daily.precipitation_sum?.[i] ?? 0) * 10) / 10,
    wind_speed: Math.round(data.daily.wind_speed_10m_max?.[i] ?? 0),
    temp_min: Math.round(data.daily.temperature_2m_min?.[i] ?? 0),
  }));
}

/**
 * Rates cloud cover for astrophotography
 */
export function rateCloudCover(cloudPercent) {
  if (cloudPercent < 15) return { label: 'Clear', color: 'emerald' };
  if (cloudPercent < 35) return { label: 'Mostly Clear', color: 'lime' };
  if (cloudPercent < 55) return { label: 'Partly Cloudy', color: 'yellow' };
  if (cloudPercent < 75) return { label: 'Mostly Cloudy', color: 'orange' };
  return { label: 'Overcast', color: 'red' };
}

/**
 * Combined astro score 0–100 for a night
 */
export function calcAstroScore({ clouds = 50, precipitation = 0, wind_speed = 0, moonIllum = 50 }) {
  let score = 100;
  score -= clouds * 0.5;
  if (precipitation > 0.5) score -= 20;
  if (wind_speed > 30) score -= 10;
  score -= moonIllum * 0.2;
  return Math.max(0, Math.min(100, Math.round(score)));
}