/**
 * Fetches real aurora forecast data from NOAA Space Weather Prediction Center
 * Returns KP index forecast for next 3 days
 */
export async function fetchAuroraForecast() {
  try {
    // NOAA 3-Day Forecast API (public, no key required but optional for higher rate limits)
    const response = await fetch('https://api.swpc.noaa.gov/products/noaa-3day-forecast.json');
    if (!response.ok) throw new Error(`NOAA API error: ${response.status}`);
    
    const data = await response.json();
    
    // Parse KP index forecast for next 3 days
    const forecasts = [];
    const kpForecast = data.kp_forecast || [];
    
    kpForecast.slice(0, 3).forEach((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index);
      
      const kpMin = parseFloat(day.kp_min) || 0;
      const kpMax = parseFloat(day.kp_max) || 5;
      const kpIndex = (kpMin + kpMax) / 2;
      
      // Determine visibility rating based on KP index
      let visibility = 'unlikely';
      if (kpIndex >= 7) visibility = 'good';
      else if (kpIndex >= 4) visibility = 'possible';
      
      forecasts.push({
        date: date.toISOString().split('T')[0],
        kp_index: Math.round(kpIndex * 10) / 10,
        kp_min: kpMin,
        kp_max: kpMax,
        visibility_rating: visibility,
        source: 'NOAA',
      });
    });
    
    return { success: true, data: forecasts };
  } catch (error) {
    console.error('Aurora forecast error:', error);
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Fetches aurora alerts for specific location based on KP index visibility threshold
 */
export async function getAuroraVisibilityForLocation(latitude, longitude, forecastDays = 3) {
  try {
    const forecast = await fetchAuroraForecast();
    if (!forecast.success) return { success: false, error: 'Failed to fetch aurora forecast' };
    
    // Calculate latitude-based visibility threshold (simplified)
    const latAbs = Math.abs(latitude);
    const threshold = latAbs < 50 ? 'good' : (latAbs < 60 ? 'possible' : 'unlikely');
    
    // Filter forecasts where visibility is likely at this latitude
    const visibleDays = forecast.data.filter(day => {
      if (threshold === 'good') return day.visibility_rating === 'good';
      if (threshold === 'possible') return ['good', 'possible'].includes(day.visibility_rating);
      return true;
    });
    
    return {
      success: true,
      location: { latitude, longitude },
      threshold_rating: threshold,
      visible_days: visibleDays,
      alert_active: visibleDays.length > 0,
    };
  } catch (error) {
    console.error('Aurora visibility error:', error);
    return { success: false, error: error.message };
  }
}