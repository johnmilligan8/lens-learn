import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Cloud, Moon, Eye, RefreshCw, MapPin, Loader, WifiOff, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { fetchNoaaKpForecast, fetchCurrentKp, fetchNoaaHourlyKp, fetchHourlyCloudCover } from '@/functions/fetchAuroraForecast';
import { fetchCloudCoverForecast } from '@/functions/fetchWeatherForecast';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

// Default fallback location: Salt Lake City, UT
const DEFAULT_LAT = 40.76;
const DEFAULT_LON = -111.89;
const DEFAULT_LOCATION = 'Salt Lake City, UT';

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

// Derive visibility rating from KP, clouds, moon, and latitude
function deriveVisibility(kp, clouds, moonIllum, lat) {
  if (kp === null) return 'unlikely';
  // Minimum KP for visibility depends on latitude (higher lat = lower threshold)
  const minKp = lat >= 60 ? 2 : lat >= 50 ? 3 : lat >= 40 ? 5 : 7;
  if (kp < minKp) return 'unlikely';
  const clearEnough = clouds === null || clouds < 60;
  const moonOk = moonIllum < 70;
  if (kp >= minKp + 2 && clearEnough && moonOk) return 'good';
  if (kp >= minKp && clearEnough) return 'possible';
  return 'unlikely';
}

function getLocalVisibilityNote(visibility, kp, locationName, lat) {
  const loc = locationName || DEFAULT_LOCATION;
  if (visibility === 'good') return `Aurora likely visible from ${loc} tonight. Face north, find dark skies.`;
  if (visibility === 'possible') return `Faint aurora possible from ${loc}. Monitor NOAA alerts — KP can spike quickly.`;
  if (lat < 45) return `Aurora unlikely from ${loc} tonight. Activity concentrated over northern Canada & Alaska.`;
  return `Geomagnetic activity is quiet from ${loc}. Best aurora viewing is further north.`;
}

// Build 24-48h trend buckets from 3-hourly data
function buildTrend(hourlyKp) {
  if (!hourlyKp?.length) return [];
  const now = new Date();
  return hourlyKp.filter(h => {
    const t = new Date(h.time.replace(' ', 'T') + 'Z');
    const diffH = (t - now) / 3600000;
    return diffH >= -3 && diffH <= 48;
  }).slice(0, 16);
}

// Best viewing windows in next 72h
function getBestViewingWindows(hourlyKp, hourlyCloud) {
  if (!hourlyKp?.length) return [];
  const cloudMap = {};
  hourlyCloud.forEach(h => {
    // Open-Meteo format: "2026-02-28T21:00"
    cloudMap[h.time] = h.cloud_cover;
  });

  return hourlyKp
    .filter(h => {
      const hour = h.hour;
      const isNight = hour >= 20 || hour <= 5;
      // Build the key as Open-Meteo returns it
      const key = `${h.date}T${String(hour).padStart(2, '0')}:00`;
      const cloud = cloudMap[key] ?? 80;
      return isNight && h.kp >= 3 && cloud < 60;
    })
    .slice(0, 3)
    .map(h => {
      const key = `${h.date}T${String(h.hour).padStart(2, '0')}:00`;
      return {
        time: `${h.date} ${String(h.hour).padStart(2, '0')}:00 UTC`,
        kp: h.kp,
        cloud: cloudMap[key] ?? '—',
      };
    });
}

// ── Viewing Probability Timeline ─────────────────────────────────────────────
// Computes a 0–100 aurora viewing probability for each 30-min slot
function calcSlotProb({ kp, clouds, moonIllum, bortle }) {
  if (kp === null || kp === undefined) return 0;
  // Base from KP (0–9 → 0–100 before modifiers)
  let score = Math.min(100, (kp / 9) * 100);
  // Cloud cover penalty: clear (0%) = 0 penalty, overcast (100%) = -70
  score *= (1 - (clouds / 100) * 0.75);
  // Moon penalty: new (0%) = no penalty, full (100%) = -40
  score *= (1 - (moonIllum / 100) * 0.40);
  // Bortle penalty: dark sky (1) = no penalty, inner city (9) = -50
  score *= (1 - ((bortle - 1) / 8) * 0.50);
  return Math.round(Math.max(0, Math.min(100, score)));
}

function probColor(p) {
  if (p >= 65) return '#22c55e';
  if (p >= 40) return '#eab308';
  if (p >= 15) return '#f97316';
  return '#334155';
}

function ViewingProbabilityTimeline({ hourlyCloud, kpBlocks, moonIllum, bortle }) {
  // Build 30-min slots for the next 12 hours
  const now = new Date();
  const slots = [];
  for (let i = 0; i < 24; i++) {
    const t = new Date(now.getTime() + i * 30 * 60000);
    // Match to nearest kp block (3-hr)
    const kpEntry = kpBlocks?.find(b => {
      const bt = new Date(b.time.replace(' ', 'T') + 'Z');
      return Math.abs(bt - t) <= 1.5 * 3600000;
    }) || kpBlocks?.[0];
    // Match hourly cloud (Open-Meteo gives hourly)
    const tKey = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}T${String(t.getHours()).padStart(2,'0')}:00`;
    const cloudEntry = hourlyCloud?.find(h => h.time === tKey);
    const clouds = cloudEntry?.cloud_cover ?? 50;
    const kp = kpEntry?.kp ?? 0;
    const prob = calcSlotProb({ kp, clouds, moonIllum, bortle: bortle ?? 5 });
    const label = t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    slots.push({ t, label, prob, clouds, kp });
  }

  return (
    <div className="mb-4">
      <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
        <Eye className="w-3.5 h-3.5 text-slate-500" /> Viewing Probability — Next 12 Hours (30-min)
      </p>
      <div className="flex items-end gap-px h-14 bg-black/20 rounded-lg p-2">
        {slots.map((s, i) => {
          const h = Math.max(4, (s.prob / 100) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end group relative" title={`${s.label}: ${s.prob}% (KP ${s.kp.toFixed(1)}, ☁️ ${s.clouds}%)`}>
              <div
                className="w-full rounded-t transition-all"
                style={{ height: `${h}%`, backgroundColor: probColor(s.prob) }}
              />
              <span className="text-[8px] text-slate-700 group-hover:text-white absolute -bottom-3 whitespace-nowrap">
                {i % 4 === 0 ? s.label : ''}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-5 flex-wrap">
        {[{ c: '#22c55e', l: '65%+ Good' }, { c: '#eab308', l: '40%+ Possible' }, { c: '#f97316', l: '15%+ Low' }, { c: '#334155', l: 'Unlikely' }].map(x => (
          <div key={x.l} className="flex items-center gap-1">
            <div style={{ background: x.c }} className="w-2.5 h-2.5 rounded-sm" />
            <span className="text-[10px] text-slate-500">{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const VISIBILITY_STYLES = {
  good:     { card: 'border-green-600/30',  badge: 'bg-green-700',   label: 'Good Chance', icon: '🟢' },
  possible: { card: 'border-yellow-600/20', badge: 'bg-yellow-700',  label: 'Possible',    icon: '🟡' },
  unlikely: { card: 'border-white/8',       badge: 'bg-slate-700',   label: 'Unlikely',    icon: '⚫' },
};

const KP_COLOR = (kp) => kp >= 5 ? 'bg-red-500' : kp >= 3 ? 'bg-yellow-500' : 'bg-slate-600';
const KP_TEXT_COLOR = (kp) => kp >= 5 ? 'text-red-400' : kp >= 3 ? 'text-yellow-400' : 'text-slate-500';

export default function AuroraPredictionCard({ userLat, userLon, locationName }) {
  const [data, setData] = useState(null);
  const [currentKp, setCurrentKp] = useState(null);
  const [trend, setTrend] = useState([]);
  const [viewingWindows, setViewingWindows] = useState([]);
  const [hourlyCloud, setHourlyCloud] = useState([]);
  const [bortle, setBortle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDefault, setUsingDefault] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const moon = getMoonPhase(new Date());

  // Resolve effective lat/lon — fallback to SLC if unset
  const hasUserLocation = userLat != null && userLon != null;
  const lat = hasUserLocation ? userLat : DEFAULT_LAT;
  const lon = hasUserLocation ? userLon : DEFAULT_LON;
  const displayLocation = locationName || (hasUserLocation ? 'Your Location' : DEFAULT_LOCATION);

  const load = async () => {
    setLoading(true);
    setError(null);
    setUsingDefault(!hasUserLocation);

    try {
      const [forecastData, liveKp, hourlyKp, weatherData, hourlyCloudData, bortleData] = await Promise.all([
        fetchNoaaKpForecast(),
        fetchCurrentKp().catch(() => null),
        fetchNoaaHourlyKp().catch(() => []),
        fetchCloudCoverForecast(lat, lon, 7).catch(() => []),
        fetchHourlyCloudCover(lat, lon).catch(() => []),
        base44.functions.invoke('fetchBortle', { lat, lon }).catch(() => null),
      ]);
      const hourlyCloud = hourlyCloudData;

      const todayForecast = forecastData.find(f => f.date === today) || forecastData[0] || null;
      const todayWeather = weatherData.find(f => f.date === today) || weatherData[0] || null;

      const kpVal = todayForecast?.kp_index != null ? Math.round(todayForecast.kp_index * 10) / 10 : null;
      const clouds = todayWeather?.clouds ?? null;
      const visibility = deriveVisibility(kpVal, clouds, moon.illum, lat);

      setCurrentKp(liveKp);
      setTrend(buildTrend(hourlyKp));
      setViewingWindows(getBestViewingWindows(hourlyKp, hourlyCloud));
      setHourlyCloud(hourlyCloud);
      if (bortleData?.data?.bortle) setBortle(bortleData.data.bortle);
      setData({
        kp: kpVal,
        kp_min: todayForecast?.kp_min != null ? Math.round(todayForecast.kp_min * 10) / 10 : null,
        kp_max: todayForecast?.kp_max != null ? Math.round(todayForecast.kp_max * 10) / 10 : null,
        visibility,
        clouds,
        precipitation: todayWeather?.precipitation ?? null,
        wind: todayWeather?.wind_speed ?? null,
        temp: todayWeather?.temp_min ?? null,
        forecast: forecastData.slice(0, 5),
      });
    } catch (e) {
      console.error('Aurora card error:', e);
      setError('Live data unavailable – check NOAA for latest.');
      setData({ kp: null, kp_min: null, kp_max: null, visibility: 'unlikely', clouds: null, precipitation: null, wind: null, temp: null, forecast: [] });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userLat, userLon]);

  const style = VISIBILITY_STYLES[data?.visibility || 'unlikely'];
  const localNote = data ? getLocalVisibilityNote(data.visibility, data.kp, displayLocation, lat) : null;

  return (
    <Card className={`bg-[#1a1a1a] ${style?.card} border p-6 mb-6`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/15 border border-red-600/20">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">Aurora Forecast</h3>
            <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {displayLocation}
              {usingDefault && <span className="text-slate-600 ml-1">· default</span>}
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

      {/* Fallback location notice */}
      {usingDefault && !loading && (
        <div className="mb-4 flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-white/5">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
          <p className="text-xs text-slate-400">
            <a href={createPageUrl('Profile')} className="underline text-yellow-400 hover:text-yellow-300">Set your home base</a> for personalized data. Showing {DEFAULT_LOCATION} by default.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-4">
          <Loader className="w-4 h-4 animate-spin" />
          <span className="text-sm">Fetching live NOAA data…</span>
        </div>
      ) : error ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-yellow-400 py-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
          {currentKp && (
            <p className="text-xs text-slate-500">Last known KP: <span className="text-white font-bold">{Math.round(currentKp.kp * 10) / 10}</span></p>
          )}
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
                  <p className={`text-3xl font-black ${KP_TEXT_COLOR(data.kp)}`}>{data.kp.toFixed(1)}</p>
                  {data.kp_min != null && data.kp_max != null && (
                    <p className="text-xs text-slate-500 mt-0.5">Range {data.kp_min.toFixed(1)}–{data.kp_max.toFixed(1)}</p>
                  )}
                  <div className="mt-2 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${KP_COLOR(data.kp)}`} style={{ width: `${Math.min(100, (data.kp / 9) * 100)}%` }} />
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
                    <div className={`h-full rounded-full ${data.clouds < 30 ? 'bg-slate-400' : data.clouds < 60 ? 'bg-yellow-600' : 'bg-red-600'}`} style={{ width: `${data.clouds}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{data.clouds < 30 ? 'Clear skies' : data.clouds < 60 ? 'Partly cloudy' : 'Heavy cloud'}</p>
                </>
              ) : (
                <p className="text-xl font-bold text-slate-500">—</p>
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

          {/* Local visibility note */}
          {localNote && (
            <div className="mb-4 p-3 rounded-lg bg-black/30 border border-white/5 flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">{localNote}</p>
            </div>
          )}

          {/* Live KP now */}
          {currentKp && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-black/30 border border-white/5">
              <TrendingUp className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              <span className="text-xs text-slate-300">
                <span className="text-white font-bold">Live KP: {(Math.round(currentKp.kp * 10) / 10).toFixed(1)}</span>
                <span className="text-slate-500 ml-1">· observed {new Date(currentKp.time_tag).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${currentKp.kp >= 5 ? 'bg-red-600 text-white' : currentKp.kp >= 3 ? 'bg-yellow-600/80 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {currentKp.kp >= 5 ? 'Active' : currentKp.kp >= 3 ? 'Moderate' : 'Quiet'}
              </span>
            </div>
          )}

          {/* Viewing Probability Timeline */}
          <ViewingProbabilityTimeline
            hourlyCloud={hourlyCloud}
            kpBlocks={trend}
            moonIllum={moon.illum}
            bortle={bortle}
          />

          {/* Bortle scale info */}
          {bortle && (
            <div className="flex items-center gap-2 mb-4 p-2.5 rounded-lg bg-black/20 border border-white/5">
              <span className="text-xs text-slate-400">🔭 Bortle <span className="text-white font-bold">{bortle}</span></span>
              <span className="text-xs text-slate-600">·</span>
              <span className="text-xs text-slate-400">
                {bortle <= 3 ? 'Dark rural sky — ideal' : bortle <= 5 ? 'Suburban sky — usable' : 'Light polluted — head further out'}
              </span>
            </div>
          )}

          {/* 24-48h Trend */}
          {trend.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> 24–48h KP Forecast
                <span className="text-slate-600 font-normal">(NOAA publishes 3-hr blocks)</span>
              </p>
              <div className="flex items-end gap-0.5 h-12">
                {trend.map((h, i) => {
                  const heightPct = Math.max(8, Math.min(100, (h.kp / 9) * 100));
                  const d = new Date(h.time.replace(' ', 'T') + 'Z');
                  const label = d.toLocaleTimeString([], { hour: 'numeric', hour12: true }).replace(':00', '').toLowerCase();
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                      <span className="text-[8px] text-white/60 font-bold opacity-0 group-hover:opacity-100 absolute -top-4 whitespace-nowrap">{h.kp.toFixed(1)}</span>
                      <div
                        className={`w-full rounded-t transition-all ${KP_COLOR(h.kp)} opacity-80 group-hover:opacity-100`}
                        style={{ height: `${heightPct}%` }}
                        title={`${label} – KP ${h.kp}`}
                      />
                      {i % 2 === 0 && (
                        <span className="text-[8px] text-slate-600 absolute -bottom-4 whitespace-nowrap">
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6" />
            </div>
          )}

          {/* Best Viewing Windows */}
          {viewingWindows.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-green-400" /> Best Viewing Windows (next 72h)
              </p>
              <div className="space-y-1.5">
                {viewingWindows.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-green-900/15 border border-green-600/20">
                    <span className="text-green-300 text-xs font-bold">{w.time}</span>
                    <span className="text-slate-400 text-xs ml-auto">KP {w.kp} · ☁️ {typeof w.cloud === 'number' ? `${w.cloud}%` : w.cloud}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-day KP forecast strip */}
          {data.forecast?.length > 1 && (
            <div className="mb-4">
              <p className="text-xs text-slate-400 font-semibold mb-2">7-Day KP Outlook</p>
              <div className="flex gap-1.5">
                {data.forecast.map((f, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 bg-black/20 rounded-lg py-2 px-1">
                    <span className="text-[10px] text-slate-500">{new Date(f.date + 'T12:00:00Z').toLocaleDateString('en', { weekday: 'short' })}</span>
                    <span className={`text-sm font-black ${KP_TEXT_COLOR(f.kp_index)}`}>{f.kp_index.toFixed(1)}</span>
                    <div className="w-full h-1 rounded-full bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${KP_COLOR(f.kp_index)}`} style={{ width: `${Math.min(100, (f.kp_index / 9) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weather row */}
          {(data.wind !== null || data.temp !== null || data.precipitation !== null) && (
            <div className="flex gap-4 flex-wrap text-xs text-slate-400 border-t border-white/5 pt-4">
              {data.wind !== null && <span>💨 Wind: {data.wind} km/h</span>}
              {data.precipitation > 0 && <span>💧 Rain: {data.precipitation}mm</span>}
              {data.temp !== null && <span>🌡 Low: {data.temp}°C</span>}
            </div>
          )}

          {/* Tip */}
          <div className="mt-4 p-3 rounded-lg bg-black/20 border border-white/5">
            <p className="text-xs text-slate-300 leading-relaxed">
              {data.visibility === 'good' && '🎯 Wide-angle lens, ISO 1600–3200, 10–20s facing north. Get away from city lights!'}
              {data.visibility === 'possible' && '💡 Monitor NOAA alerts hourly — KP can spike quickly. Have your gear ready.'}
              {data.visibility === 'unlikely' && '📚 Great night for planning your next shoot or processing images from your last session.'}
            </p>
          </div>

          {/* Windy Cloud & Wind Map */}
          <WindyMapEmbed lat={lat} lon={lon} />

          <p className="text-[10px] text-slate-600 mt-3">
            Source: NOAA SWPC · Open-Meteo · Windy.com · Aurora forecast – personalized when location set
          </p>
        </>
      )}
    </Card>
  );
}