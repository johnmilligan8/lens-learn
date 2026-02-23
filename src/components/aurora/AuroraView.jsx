import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Loader, RefreshCw } from 'lucide-react';
import AuroraDailyCard from './AuroraDailyCard';
import AuroraWeeklyList from './AuroraWeeklyList';
import { fetchNoaaKpForecast } from '@/functions/fetchAuroraForecast';
import { fetchCloudCoverForecast } from '@/functions/fetchWeatherForecast';

// Moon calculations
function getMoonPhaseAndIllumination(date) {
  const known_new_moon = new Date('2000-01-06');
  const moonCycle = 29.53058867;
  const daysElapsed = (date - known_new_moon) / (1000 * 60 * 60 * 24);
  const dayInCycle = daysElapsed % moonCycle;
  const illumination = Math.round(50 * (1 + Math.cos((dayInCycle / moonCycle) * Math.PI * 2)));
  
  let phase = 'New';
  if (dayInCycle > 1 && dayInCycle < 7) phase = 'Waxing Crescent';
  else if (dayInCycle > 7 && dayInCycle < 14) phase = 'Waxing Gibbous';
  else if (dayInCycle > 14 && dayInCycle < 16) phase = 'Full';
  else if (dayInCycle > 16 && dayInCycle < 22) phase = 'Waning Gibbous';
  else if (dayInCycle > 22 && dayInCycle < 29) phase = 'Waning Crescent';

  return { phase, illumination };
}

export default function AuroraView({ isSubscribed, userLocation = 'Utah', userLat = null, userLon = null }) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('daily');
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch NOAA KP forecast + cloud cover in parallel
      const [kpData, weatherData] = await Promise.all([
        fetchNoaaKpForecast(),
        (userLat && userLon)
          ? fetchCloudCoverForecast(userLat, userLon, 7)
          : Promise.resolve([]),
      ]);

      // Merge KP + cloud cover by date
      const weatherByDate = {};
      weatherData.forEach(w => { weatherByDate[w.date] = w; });

      const merged = kpData.map((f, i) => ({
        id: `forecast-${i}`,
        ...f,
        cloud_cover_percent: weatherByDate[f.date]?.clouds ?? null,
        precipitation: weatherByDate[f.date]?.precipitation ?? null,
      }));

      setForecasts(merged);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Aurora data error:', err);
      setError('Could not load live data. NOAA may be temporarily unavailable.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userLat, userLon]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-5 h-5 animate-spin text-purple-400" />
      </div>
    );
  }

  const today = new Date();
  const dailyForecasts = forecasts.slice(0, 2);
  const weeklyForecasts = forecasts.slice(0, 7);

  const tonight = dailyForecasts[0];
  const { phase: moonPhase, illumination: moonIllumination } = getMoonPhaseAndIllumination(today);

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="bg-blue-900/30 border border-blue-500/50 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-300">Aurora forecasts are updated daily.</p>
          <p className="text-xs text-blue-300/70 mt-1">
            Data source: Mock forecasts (NOAA integration coming). Monitor{' '}
            <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">
              NOAA Space Weather
            </a>{' '}
            for real-time updates. Conditions can change rapidly.
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-slate-800">
        <button
          onClick={() => setTab('daily')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            tab === 'daily'
              ? 'border-purple-600 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          24–48 Hours
        </button>
        <button
          onClick={() => setTab('weekly')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            tab === 'weekly'
              ? 'border-purple-600 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          7 Days
        </button>
      </div>

      {/* Daily View */}
      {tab === 'daily' && (
        <div className="space-y-4">
          {!isSubscribed && (
            <Card className="bg-yellow-900/20 border border-yellow-500/50 p-4">
              <p className="text-sm text-yellow-300">
                ✨ <strong>Plus members</strong> get detailed daily aurora alerts & weekly trends. Unlock for full insights.
              </p>
            </Card>
          )}

          {dailyForecasts.map((forecast, idx) => (
            <AuroraDailyCard
              key={forecast.id}
              forecast={forecast}
              isTonight={idx === 0}
              moonPhase={moonPhase}
              moonIllumination={moonIllumination}
              cloudCover={forecast.cloud_cover_percent}
              locationContext={userLocation}
            />
          ))}
        </div>
      )}

      {/* Weekly View */}
      {tab === 'weekly' && (
        <div className="space-y-4">
          {!isSubscribed && (
            <Card className="bg-yellow-900/20 border border-yellow-500/50 p-4">
              <p className="text-sm text-yellow-300">
                ✨ <strong>Plus members</strong> get detailed daily aurora alerts & weekly trends. Unlock for full insights.
              </p>
            </Card>
          )}

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              7-Day Outlook — {userLocation}
            </h3>
            <AuroraWeeklyList forecasts={weeklyForecasts} />
          </div>

          {/* Weekly Summary */}
          <Card className="bg-slate-900/40 border-slate-800 p-4">
            <h4 className="text-white font-semibold mb-2">This Week's Summary</h4>
            <p className="text-sm text-slate-300">
              Best nights: {weeklyForecasts.filter(f => f.visibility_rating === 'good').length} day(s) with good conditions.{' '}
              {weeklyForecasts.some(f => f.visibility_rating === 'good')
                ? 'Head to a dark-sky site for maximum aurora potential.'
                : 'Modest activity expected; monitor for improvements.'}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}