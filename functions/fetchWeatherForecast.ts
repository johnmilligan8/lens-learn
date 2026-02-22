/**
 * Fetches real weather forecast from OpenWeather API
 * Returns cloud cover, temp, humidity, and other astrophotography-relevant metrics
 */
export async function fetchWeatherForecast(latitude, longitude, apiKey) {
  try {
    // OpenWeather One Call API (3.0 - free tier gives current + 8 days forecast)
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`OpenWeather API error: ${response.status}`);
    const data = await response.json();
    
    // Extract key astrophotography metrics from daily forecast
    const forecasts = [];
    const daily = data.daily || [];
    
    daily.slice(0, 7).forEach((day) => {
      const date = new Date(day.dt * 1000);
      
      forecasts.push({
        date: date.toISOString().split('T')[0],
        temp_min: Math.round(day.temp.min),
        temp_max: Math.round(day.temp.max),
        humidity: day.humidity,
        clouds: day.clouds, // 0-100%
        visibility: day.visibility ? Math.round(day.visibility / 1000) : null, // km
        dew_point: day.dew_point,
        uvi: day.uvi, // UV Index (higher = worse for night sky)
        wind_speed: day.wind_speed,
        precipitation: day.pop * 100, // % chance of rain
        weather: day.weather[0]?.main || 'Unknown',
        condition: day.weather[0]?.description || '',
      });
    });
    
    return { success: true, data: forecasts };
  } catch (error) {
    console.error('Weather forecast error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Calculates astrophotography score based on weather conditions
 * Higher score = better for shooting
 */
export function calculateAstroScore(weatherData) {
  if (!weatherData) return 0;
  
  const cloudScore = Math.max(0, 100 - weatherData.clouds); // Less clouds = better
  const visibilityScore = weatherData.visibility ? Math.min(100, (weatherData.visibility / 10) * 100) : 50;
  const tempScore = Math.max(0, 100 - Math.abs(weatherData.temp_min)); // Extreme cold is bad for equipment
  const humidityScore = Math.max(0, 100 - Math.abs(weatherData.humidity - 40)); // 40% humidity is ideal
  const windScore = Math.max(0, 100 - weatherData.wind_speed * 5); // Higher wind = shakier tracking
  const rainScore = (1 - weatherData.precipitation / 100) * 100; // % chance of no rain
  
  // Weighted average (clouds & rain have highest weight)
  const score = (cloudScore * 0.3 + visibilityScore * 0.2 + rainScore * 0.2 + 
                 tempScore * 0.1 + humidityScore * 0.1 + windScore * 0.1);
  
  return Math.round(score);
}

/**
 * Determines cloud cover rating for user feedback
 */
export function rateCloudCover(cloudPercentage) {
  if (cloudPercentage < 10) return { rating: 'Clear', color: 'green' };
  if (cloudPercentage < 30) return { rating: 'Mostly Clear', color: 'lime' };
  if (cloudPercentage < 50) return { rating: 'Partly Cloudy', color: 'yellow' };
  if (cloudPercentage < 70) return { rating: 'Mostly Cloudy', color: 'orange' };
  return { rating: 'Overcast', color: 'red' };
}