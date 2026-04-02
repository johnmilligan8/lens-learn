/**
 * Combined data integration helper — merges aurora + weather for planning
 */
import { fetchNoaaKpForecast } from './fetchAuroraForecast.js';
import { fetchCloudCoverForecast, calcAstroScore, rateCloudCover } from './fetchWeatherForecast.js';

/**
 * Returns a merged 7-day forecast with aurora KP + weather cloud cover
 * for a given lat/lon
 */
export async function getMergedForecast(lat, lon) {
  const [kpData, weatherData] = await Promise.all([
    fetchNoaaKpForecast(),
    fetchCloudCoverForecast(lat, lon, 7),
  ]);

  const weatherByDate = {};
  weatherData.forEach(w => { weatherByDate[w.date] = w; });

  return kpData.map(f => {
    const w = weatherByDate[f.date] || {};
    const moonIllum = getMoonIllum(new Date(f.date));
    const score = calcAstroScore({ clouds: w.clouds, precipitation: w.precipitation, wind_speed: w.wind_speed, moonIllum });
    return {
      ...f,
      clouds: w.clouds ?? null,
      precipitation: w.precipitation ?? null,
      wind_speed: w.wind_speed ?? null,
      temp_min: w.temp_min ?? null,
      moon_illum: moonIllum,
      astro_score: score,
      cloud_rating: w.clouds != null ? rateCloudCover(w.clouds) : null,
    };
  });
}

function getMoonIllum(date) {
  const knownNew = new Date('2000-01-06T00:00:00Z');
  const cycle = 29.53058867;
  const diff = (date - knownNew) / 86400000;
  const phase = ((diff % cycle) + cycle) % cycle;
  return Math.round((1 - Math.cos((phase / cycle) * 2 * Math.PI)) / 2 * 100);
}