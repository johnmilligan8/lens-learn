import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Cloud, Moon, Eye, RefreshCw, MapPin, Loader, WifiOff } from 'lucide-react';
import { fetchNoaaKpForecast } from '@/functions/fetchAuroraForecast';
import { fetchCloudCoverForecast } from '@/functions/fetchWeatherForecast';
import { getAuroraWithCache, getWeatherWithCache } from '@/functions/offlineCache';

function getMoonPhase(date) {
  const known = new Date('2000-01-06');
  const cycle = 29.53058867;
  const days = (date - known) / 86400000;
  const pos = ((days % cycle) + cycle) % cycle;
  const illum = Math.round((1 - Math.cos((pos / cycle) * 2 * Math.PI)) / 2 * 100);
  let phase = 'New Moon';
  if (pos < 1.85) phase = 'New Moon';
  else if (pos < 7.38) phase = 'Waxing Crescent';
  else if (pos < 9.22) phase = 'First Quarter';
  else if (pos < 14.77) phase = 'Waxing Gibbous';
  else if (pos < 16.61) phase = 'Full Moon';
  else if (pos < 22.15) phase = 'Waning Gibbous';
  else if (pos < 23.99) phase = 'Last Quarter';
  else phase = 'Waning Crescent';
  const emoji = pos < 7.38 ? '🌒' : pos < 14.77 ? '🌔' : pos < 16.61 ? '🌕' : pos < 22.15 ? '🌖' : pos < 28 ? '🌘' : '🌑';
  return { phase, illum, emoji };
}

const VISIBILITY_STYLES = {
  good:     { card: 'border-red-600/30',   badge: 'bg-red-600',   label: 'Good Chance', icon: '🟢' },
  possible: { card: 'border-white/8',      badge: 'bg-slate-600', label: 'Possible',    icon: '🟡' },
  unlikely: { card: 'border-white/8',      badge: 'bg-slate-700', label: 'Unlikely',    icon: '⚫' },
};

const KP_BAR_COLOR = (kp) => {
if (kp >= 5) return 'bg-red-500';
if (kp >= 3) return 'bg-slate-400';
return 'bg-slate-600';
};

export default function AuroraPredictionCard({ userLat, userLon, locationName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const moon = getMoonPhase(new Date());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [auroraResult, weatherResult] = await Promise.all([
        getAuroraWithCache(() => fetchNoaaKpForecast()),
        (userLat && userLon)
          ? getWeatherWithCache(userLat, userLon, () => fetchCloudCoverForecast(userLat, userLon, 3))
          : Promise.resolve({ data: [], fromCache: false }),
      ]);

      const todayForecast = (auroraResult.data || []).find(f => f.date === today)
        || auroraResult.data?.[0]
        || null;

      const todayWeather = (weatherResult.data || []).find(f => f.date === today)
        || weatherResult.data?.[0]
        || null;

      setFromCache(auroraResult.fromCache);
      setData({
        kp: todayForecast?.kp_index ?? null,
        kp_min: todayForecast?.kp_min ?? null,
        kp_max: todayForecast?.kp_max ?? null,
        visibility: todayForecast?.visibility_rating ?? 'unlikely',
        clouds: todayWeather?.clouds ?? null,
        precipitation: todayWeather?.precipitation ?? null,
        wind: todayWeather?.wind_speed ?? null,
        temp: todayWeather?.temp_min ?? null,
      });
    } catch (e) {
      setError('Could not load live data.');
      // Fallback placeholders
      setData({
        kp: null, kp_min: null, kp_max: null,
        visibility: 'unlikely', clouds: null, precipitation: null, wind: null, temp: null,
      });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userLat, userLon]);

  const style = VISIBILITY_STYLES[data?.visibility || 'unlikely'];

  return (
    <Card className={`bg-[#1a1a1a] ${style?.card} border p-6 mb-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/15 border border-red-600/20">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Aurora Prediction</h3>
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
              {locationName
                ? <><MapPin className="w-3 h-3" />{locationName}</>
                : 'Tonight · Your Location'}
              {fromCache && <span className="text-slate-600 ml-1">· cached</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <button onClick={load} className="text-slate-500 hover:text-slate-300 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {data && (
            <Badge className={`${style?.badge} text-white text-xs`}>
              {style?.icon} {style?.label}
            </Badge>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-4">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Fetching live NOAA data…</span>
        </div>
      ) : error && !data ? (
        <div className="flex items-center gap-2 text-red-400 py-2">
          <WifiOff className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <>
          {/* Main metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {/* KP Index */}
            <div className="bg-black/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-red-400" />
                <p className="text-xs text-slate-400 font-medium">KP Index</p>
              </div>
              {data.kp !== null ? (
                <>
                  <p className="text-3xl font-black text-white">{data.kp}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Range {data.kp_min}–{data.kp_max}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${KP_BAR_COLOR(data.kp)}`}
                      style={{ width: `${Math.min(100, (data.kp / 9) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">of 9 max</p>
                </>
              ) : (
                <p className="text-xl font-bold text-slate-500">—</p>
              )}
            </div>

            {/* Cloud Cover */}
            <div className="bg-black/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 font-medium">Cloud Cover</p>
              </div>
              {data.clouds !== null ? (
                <>
                  <p className="text-3xl font-black text-white">{data.clouds}<span className="text-lg font-normal text-slate-400">%</span></p>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${data.clouds < 30 ? 'bg-slate-400' : data.clouds < 60 ? 'bg-slate-500' : 'bg-red-600'}`}
                      style={{ width: `${data.clouds}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {data.clouds < 30 ? 'Clear skies' : data.clouds < 60 ? 'Partly cloudy' : 'Heavy cloud'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-slate-500">—</p>
                  <p className="text-[10px] text-slate-600 mt-1">Set location for data</p>
                </>
              )}
            </div>

            {/* Moon Phase */}
            <div className="bg-black/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Moon className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 font-medium">Moon Phase</p>
              </div>
              <p className="text-2xl mb-1">{moon.emoji}</p>
              <p className="text-sm font-bold text-white leading-tight">{moon.phase}</p>
              <p className="text-xs text-slate-500 mt-0.5">{moon.illum}% illuminated</p>
            </div>

            {/* Visibility */}
            <div className="bg-black/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs text-slate-400 font-medium">Visibility</p>
              </div>
              <p className="text-2xl font-black text-white capitalize">{style?.label}</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                {data.visibility === 'good' && 'Head to dark skies tonight'}
                {data.visibility === 'possible' && 'Faint displays may be visible'}
                {data.visibility === 'unlikely' && 'Quiet geomagnetic conditions'}
              </p>
            </div>
          </div>

          {/* Extra weather row */}
          {(data.wind !== null || data.temp !== null || data.precipitation !== null) && (
            <div className="flex gap-4 flex-wrap text-xs text-slate-400 border-t border-white/5 pt-4">
              {data.wind !== null && <span>💨 Wind: {data.wind} km/h</span>}
              {data.precipitation !== null && data.precipitation > 0 && <span>💧 Rain: {data.precipitation}mm</span>}
              {data.temp !== null && <span>🌡 Low: {data.temp}°C</span>}
            </div>
          )}

          {/* Tips */}
          <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-xs text-slate-300 leading-relaxed">
              {data.visibility === 'good' && '🎯 Pro tip: Use a wide-angle lens, ISO 1600–3200, 10–20s exposure facing north. Get away from city lights!'}
              {data.visibility === 'possible' && '💡 Monitor NOAA alerts hourly — KP can spike quickly. Have your gear ready to go.'}
              {data.visibility === 'unlikely' && '📚 Great night for planning your next shoot or processing images from your last session.'}
            </p>
          </div>

          <p className="text-[10px] text-slate-600 mt-3">
            Source: NOAA SWPC · Open-Meteo · Data updates every 3–6 hours
          </p>
        </>
      )}
    </Card>
  );
}