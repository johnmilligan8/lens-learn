import { fetchAuroraForecast, getAuroraVisibilityForLocation } from './fetchAuroraForecast.js';
import { fetchWeatherForecast, calculateAstroScore, rateCloudCover } from './fetchWeatherForecast.js';

/**
 * Main integration function: fetches both aurora and weather for planning
 * Called by frontend components via base44 SDK
 */
export async function getCompleteForecast(latitude, longitude, userApiKey) {
  try {
    // Fetch both in parallel
    const [auroraResult, weatherResult] = await Promise.all([
      getAuroraVisibilityForLocation(latitude, longitude),
      fetchWeatherForecast(latitude, longitude, userApiKey),
    ]);
    
    if (!auroraResult.success || !weatherResult.success) {
      return {
        success: false,
        error: 'Failed to fetch forecast data',
        aurora: null,
        weather: null,
      };
    }
    
    // Enrich weather data with astrophotography scores
    const weatherWithScores = weatherResult.data.map(day => ({
      ...day,
      astro_score: calculateAstroScore(day),
      cloud_rating: rateCloudCover(day.clouds),
    }));
    
    // Find best shooting night
    const bestNight = weatherWithScores.reduce((best, current) => 
      current.astro_score > best.astro_score ? current : best, weatherWithScores[0]);
    
    return {
      success: true,
      aurora: auroraResult,
      weather: {
        success: true,
        forecast: weatherWithScores,
        best_night: bestNight,
      },
      combined_recommendation: generateRecommendation(auroraResult, bestNight),
    };
  } catch (error) {
    console.error('Complete forecast error:', error);
    return {
      success: false,
      error: error.message,
      aurora: null,
      weather: null,
    };
  }
}

/**
 * Generates human-readable recommendation based on aurora & weather
 */
function generateRecommendation(auroraData, bestWeatherDay) {
  const recommendations = [];
  
  if (auroraData.alert_active) {
    recommendations.push('🌌 Aurora activity likely in next 3 days—high priority window!');
  } else {
    recommendations.push('🌌 Aurora activity low—focus on Milky Way or deep sky objects.');
  }
  
  if (bestWeatherDay.astro_score > 80) {
    recommendations.push(`✅ ${bestWeatherDay.date} is your best shot (${bestWeatherDay.astro_score}/100 clarity).`);
  } else if (bestWeatherDay.astro_score > 60) {
    recommendations.push(`⚠️ ${bestWeatherDay.date} is decent but check cloud cover (${bestWeatherDay.astro_score}/100).`);
  } else {
    recommendations.push('❌ Poor conditions next 7 days—consider indoor planning or location change.');
  }
  
  if (bestWeatherDay.precipitation > 30) {
    recommendations.push(`💧 ${Math.round(bestWeatherDay.precipitation)}% rain chance—have backup plan.`);
  }
  
  return recommendations.join(' ');
}

/**
 * Caches forecast data to reduce API calls
 * Frontend can call this to get fresh data every 6 hours
 */
const forecastCache = new Map();

export function getCachedForecast(cacheKey, maxAgeMinutes = 360) {
  const cached = forecastCache.get(cacheKey);
  if (!cached) return null;
  
  const age = (Date.now() - cached.timestamp) / 60000;
  if (age > maxAgeMinutes) {
    forecastCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

export function setCachedForecast(cacheKey, data) {
  forecastCache.set(cacheKey, { data, timestamp: Date.now() });
}