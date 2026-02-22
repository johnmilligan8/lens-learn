import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Moon, Cloud, Star } from 'lucide-react';

export default function AdvancedForecast({ lat, lon, location, onSelectDate }) {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lat || !lon) return;
    loadForecast();
  }, [lat, lon]);

  const getMoonPhase = (date) => {
    const knownNewMoon = new Date('2000-01-06T00:00:00Z');
    const lunarCycle = 29.53058867;
    const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;
    return Math.round((1 - Math.cos((phase / lunarCycle) * 2 * Math.PI)) / 2 * 100);
  };

  const getGalacticCoreAltitude = (dateStr, lat, lon) => {
    // Simplified: returns approximate peak altitude for the night
    const d = new Date(dateStr + 'T12:00:00Z');
    const month = d.getMonth();
    const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
    
    // Galactic core is at -29° declination
    const coreDec = -29;
    const latRad = lat * Math.PI / 180;
    const decRad = coreDec * Math.PI / 180;
    const alt = Math.asin(Math.sin(decRad) * Math.sin(latRad)) * 180 / Math.PI;
    
    // Seasonal variation
    const seasonalAdjust = Math.sin((dayOfYear / 365) * Math.PI * 2) * 15;
    return Math.round(Math.max(0, alt + seasonalAdjust));
  };

  const loadForecast = async () => {
    setLoading(true);
    const today = new Date();
    const nights = [];

    // Fetch weather for next 14 days
    const forecastDates = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      forecastDates.push(d.toISOString().split('T')[0]);
    }

    try {
      const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        daily: 'cloud_cover_mean,precipitation_sum,wind_speed_10m_max',
        timezone: 'UTC',
        start_date: forecastDates[0],
        end_date: forecastDates[13],
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      const data = await res.json();
      const daily = data.daily;

      // Calculate quality score for each night
      forecastDates.forEach((dateStr, idx) => {
        const moonIllum = getMoonPhase(new Date(dateStr));
        const coreAlt = getGalacticCoreAltitude(dateStr, lat, lon);
        const cloudCover = daily.cloud_cover_mean?.[idx] ?? 50;
        const precip = daily.precipitation_sum?.[idx] ?? 0;

        // Quality scoring (0–100)
        let score = 100;
        score -= cloudCover * 0.5; // Cloud penalty
        if (precip > 0.5) score -= 15; // Rain penalty
        score -= Math.abs(50 - moonIllum) * 0.3; // Prefer new moon
        if (coreAlt < 20) score -= 10; // Low altitude penalty
        if (coreAlt > 45) score += 5; // Bonus for high altitude

        score = Math.max(0, Math.min(100, Math.round(score)));

        nights.push({
          date: dateStr,
          day: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          moonIllum: Math.round(moonIllum),
          cloudCover: Math.round(cloudCover),
          coreAlt: Math.round(coreAlt),
          precip: Math.round(precip * 10) / 10,
          score,
        });
      });

      setForecast(nights);
    } catch (err) {
      console.error('Forecast error:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <h3 className="text-white font-semibold">Loading 14-day forecast...</h3>
        </div>
      </Card>
    );
  }

  if (!forecast.length) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
        <p className="text-slate-400 text-sm">Enter location & date to see forecast</p>
      </Card>
    );
  }

  const bestNight = forecast.reduce((best, night) => night.score > best.score ? night : best);
  const sortedNights = [...forecast].sort((a, b) => b.score - a.score);

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <h3 className="text-white font-semibold">14-Day Forecast for {location}</h3>
      </div>

      {/* Best Night Highlight */}
      <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-lg p-4 mb-4">
        <p className="text-emerald-300 text-xs font-semibold mb-1">🏆 Best Night</p>
        <p className="text-white text-lg font-bold mb-2">{bestNight.day}</p>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div>
            <p className="text-slate-400">Quality</p>
            <p className="text-emerald-400 font-bold text-lg">{bestNight.score}</p>
          </div>
          <div>
            <p className="text-slate-400">Moon</p>
            <p className="text-white font-bold">{bestNight.moonIllum}%</p>
          </div>
          <div>
            <p className="text-slate-400">Cloud</p>
            <p className="text-white font-bold">{bestNight.cloudCover}%</p>
          </div>
          <div>
            <p className="text-slate-400">Core Alt</p>
            <p className="text-white font-bold">{bestNight.coreAlt}°</p>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => onSelectDate(bestNight.date)}
        >
          Select This Date
        </Button>
      </div>

      {/* Quality Ranking Timeline */}
      <div className="space-y-2">
        <p className="text-slate-400 text-xs font-semibold mb-3">TOP 5 NIGHTS</p>
        {sortedNights.slice(0, 5).map((night, idx) => {
          const qualityColor = night.score >= 75 ? 'emerald' : night.score >= 50 ? 'blue' : 'slate';
          const qualityBg = qualityColor === 'emerald' ? 'bg-emerald-500/20 border-emerald-500/30' : qualityColor === 'blue' ? 'bg-blue-500/20 border-blue-500/30' : 'bg-slate-500/10 border-slate-500/20';
          
          return (
            <div
              key={night.date}
              className={`border rounded-lg p-3 transition-all hover:scale-[1.02] cursor-pointer ${qualityBg}`}
              onClick={() => onSelectDate(night.date)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm">{idx + 1}. {night.day}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${qualityColor === 'emerald' ? 'bg-emerald-600 text-white' : qualityColor === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}`}>
                    {night.score}%
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Moon className="w-3 h-3" /> {night.moonIllum}%
                </div>
                <div className="flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> {night.cloudCover}%
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" /> {night.coreAlt}°
                </div>
                <div>Precip: {night.precip} mm</div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-slate-600 text-xs mt-4">
        Score = moon darkness + clear skies + core altitude + seasonal timing. Click a date to plan that night.
      </p>
    </Card>
  );
}