import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Cloud, Wind, Droplets, Thermometer, Loader2,
  Eye, ChevronDown, ChevronUp, Activity
} from 'lucide-react';

function cloudCoverRating(pct) {
  if (pct <= 10) return { label: 'Clear', color: 'text-emerald-400', bg: 'bg-emerald-500' };
  if (pct <= 30) return { label: 'Mostly Clear', color: 'text-blue-400', bg: 'bg-blue-500' };
  if (pct <= 60) return { label: 'Partly Cloudy', color: 'text-yellow-400', bg: 'bg-yellow-500' };
  if (pct <= 80) return { label: 'Mostly Cloudy', color: 'text-orange-400', bg: 'bg-orange-500' };
  return { label: 'Overcast', color: 'text-red-400', bg: 'bg-red-500' };
}

function calcAstroScore(cloud, precip, wind, humidity) {
  let score = 10;
  score -= Math.round(cloud / 15);
  if (precip > 0.1) score -= 4;
  if (precip > 0.5) score -= 2;
  if (wind > 30) score -= 2;
  else if (wind > 20) score -= 1;
  if (humidity > 85) score -= 1; // high humidity = dew risk
  return Math.max(0, score);
}

function windBeaufort(kph) {
  if (kph < 2) return 'Calm';
  if (kph < 12) return 'Light breeze';
  if (kph < 20) return 'Gentle breeze';
  if (kph < 29) return 'Moderate';
  if (kph < 39) return 'Fresh — stabilizer risk';
  return 'Strong — tripod risk';
}

function dewRisk(temp, humidity) {
  // Approximate dew point via Magnus formula
  const a = 17.27, b = 237.7;
  const alpha = (a * temp) / (b + temp) + Math.log(humidity / 100);
  const dewPoint = (b * alpha) / (a - alpha);
  const spread = temp - dewPoint;
  if (spread < 2) return { label: 'High dew risk', color: 'text-red-400', dew: Math.round(dewPoint) };
  if (spread < 5) return { label: 'Moderate dew risk', color: 'text-yellow-400', dew: Math.round(dewPoint) };
  return { label: 'Low dew risk', color: 'text-emerald-400', dew: Math.round(dewPoint) };
}

function seeingEstimate(wind, humidity, cloud) {
  // Simplified atmospheric seeing estimate
  let score = 5;
  if (wind < 10) score += 2;
  else if (wind < 20) score += 1;
  else if (wind > 30) score -= 2;
  if (humidity > 80) score -= 1;
  if (cloud > 50) score -= 2;
  score = Math.max(1, Math.min(5, score));
  const labels = ['', 'Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
  return { score, label: labels[score] };
}

export default function DetailedWeatherCard({ weather, weatherLoading, weatherError, onFetch, hasResults }) {
  const [showHourly, setShowHourly] = useState(false);
  const [showDays, setShowDays] = useState(false);

  if (!hasResults) return null;

  if (weatherLoading) return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        <span className="text-slate-400 text-sm">Fetching detailed weather...</span>
      </div>
    </Card>
  );

  if (weatherError) return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-1">
            <Cloud className="w-4 h-4 text-blue-400" /> Weather Forecast
          </h3>
          <p className="text-slate-500 text-xs">{weatherError}</p>
        </div>
        <Button size="sm" variant="outline" onClick={onFetch} className="border-blue-500/40 text-blue-300 hover:bg-blue-900/20 text-xs">
          Retry
        </Button>
      </div>
    </Card>
  );

  if (!weather) return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-400" /> Weather Forecast
        </h3>
        <Button size="sm" variant="outline" onClick={onFetch} className="border-blue-500/40 text-blue-300 hover:bg-blue-900/20 text-xs">
          Load Weather
        </Button>
      </div>
      <p className="text-slate-500 text-xs mt-2">Wind, temp, humidity, dew risk & seeing estimate.</p>
    </Card>
  );

  const c = weather.current;
  const score = calcAstroScore(c.cloud, c.precip_mm, c.wind_kph, c.humidity ?? 60);
  const scoreColor = score >= 8 ? 'text-emerald-400' : score >= 5 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = score >= 8 ? 'bg-emerald-900/30 border-emerald-500/30' : score >= 5 ? 'bg-yellow-900/30 border-yellow-500/30' : 'bg-red-900/30 border-red-500/30';
  const cloud = cloudCoverRating(c.cloud);
  const dew = dewRisk(c.temp_c, c.humidity ?? 60);
  const seeing = seeingEstimate(c.wind_kph, c.humidity ?? 60, c.cloud);

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Cloud className="w-4 h-4 text-blue-400" /> Detailed Weather
        </h3>
        <div className={`px-3 py-1 rounded-full border text-xs font-bold ${scoreBg} ${scoreColor}`}>
          Astro Score: {score}/10
        </div>
      </div>

      {/* 5-metric grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <Cloud className="w-4 h-4 mx-auto mb-1 text-slate-400" />
          <p className="text-slate-400 text-[10px]">Cloud</p>
          <p className={`font-bold text-sm ${cloud.color}`}>{c.cloud}%</p>
          <p className={`text-[10px] ${cloud.color}`}>{cloud.label}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <Wind className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
          <p className="text-slate-400 text-[10px]">Wind</p>
          <p className="text-white font-bold text-sm">{c.wind_kph} km/h</p>
          <p className="text-slate-500 text-[10px]">{windBeaufort(c.wind_kph).split(' ')[0]}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <Thermometer className="w-4 h-4 mx-auto mb-1 text-orange-400" />
          <p className="text-slate-400 text-[10px]">Temp</p>
          <p className="text-white font-bold text-sm">{c.temp_c}°C</p>
          <p className="text-slate-500 text-[10px]">Feels {c.feelslike_c}°C</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <Droplets className="w-4 h-4 mx-auto mb-1 text-blue-400" />
          <p className="text-slate-400 text-[10px]">Humidity</p>
          <p className="text-white font-bold text-sm">{c.humidity ?? '—'}%</p>
          <p className={`text-[10px] ${dew.color}`}>Dew {dew.dew}°C</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl p-3 text-center">
          <Eye className="w-4 h-4 mx-auto mb-1 text-purple-400" />
          <p className="text-slate-400 text-[10px]">Seeing</p>
          <p className="text-white font-bold text-sm">{seeing.score}/5</p>
          <p className="text-purple-300 text-[10px]">{seeing.label}</p>
        </div>
      </div>

      {/* Astrophoto advice */}
      <div className={`mb-4 rounded-lg p-3 border text-xs ${scoreBg}`}>
        <p className={`font-semibold ${scoreColor} mb-1`}>
          {score >= 8 ? '✅ Excellent night for astrophotography' : score >= 5 ? '⚠️ Partially suitable — check for cloud breaks' : '❌ Poor conditions — consider rescheduling'}
        </p>
        <ul className="text-slate-400 space-y-0.5">
          {c.wind_kph > 25 && <li>• Wind at {c.wind_kph} km/h — use mirror lock-up & weighted tripod</li>}
          {(c.humidity ?? 0) > 80 && <li>• High humidity ({c.humidity}%) — bring dew heater, check lens every 20 min</li>}
          {dew.spread < 3 && <li>• Dew point close to air temp — fogging likely within 1–2 hrs</li>}
          {seeing.score <= 2 && <li>• Poor seeing — avoid planetary / double star work tonight</li>}
          {c.precip_mm > 0.1 && <li>• Precipitation expected — protect gear with rain sleeve</li>}
          {score >= 8 && <li>• Conditions look great — shoot wide open and stack frames for best results</li>}
        </ul>
      </div>

      {/* Night hourly breakdown */}
      {weather.nightHours?.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setShowHourly(!showHourly)}
            className="w-full flex items-center justify-between text-left text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-widest mb-2 transition-colors"
          >
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Hourly Night Breakdown</span>
            {showHourly ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showHourly && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[360px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-slate-500 pb-1.5 pr-2 font-medium">Time UTC</th>
                    <th className="text-center text-slate-500 pb-1.5 px-1 font-medium">☁️</th>
                    <th className="text-center text-slate-500 pb-1.5 px-1 font-medium">🌧️</th>
                    <th className="text-center text-slate-500 pb-1.5 px-1 font-medium">💨 km/h</th>
                    <th className="text-center text-slate-500 pb-1.5 px-1 font-medium">🌡️°C</th>
                    <th className="text-center text-slate-500 pb-1.5 px-1 font-medium">💧%</th>
                  </tr>
                </thead>
                <tbody>
                  {weather.nightHours.slice(0, 12).map((h, i) => {
                    const cc = cloudCoverRating(h.cloud);
                    return (
                      <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                        <td className="py-1.5 pr-2 text-slate-300 font-mono">{h.time?.slice(11, 16)}</td>
                        <td className={`py-1.5 px-1 text-center font-semibold ${cc.color}`}>{h.cloud}%</td>
                        <td className="py-1.5 px-1 text-center text-slate-400">{h.precip > 0 ? `${h.precip}` : '—'}</td>
                        <td className={`py-1.5 px-1 text-center ${h.wind > 25 ? 'text-red-400' : 'text-slate-300'}`}>{h.wind}</td>
                        <td className="py-1.5 px-1 text-center text-slate-300">{h.temp}</td>
                        <td className={`py-1.5 px-1 text-center ${(h.humidity ?? 0) > 80 ? 'text-yellow-400' : 'text-slate-400'}`}>{h.humidity ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3-day strip */}
      {weather.forecast?.length > 0 && (
        <div>
          <button
            onClick={() => setShowDays(!showDays)}
            className="w-full flex items-center justify-between text-left text-slate-400 hover:text-white text-xs font-semibold uppercase tracking-widest mb-2 transition-colors"
          >
            <span>3-Day Forecast</span>
            {showDays ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showDays && (
            <div className="grid grid-cols-3 gap-2">
              {weather.forecast.slice(0, 3).map((day, i) => {
                const dc = cloudCoverRating(day.cloud ?? 50);
                return (
                  <div key={i} className={`rounded-lg p-2.5 border text-center ${i === 0 ? 'border-blue-500/40 bg-blue-900/20' : 'border-slate-700/50 bg-slate-800/40'}`}>
                    <p className="text-slate-400 text-[10px] mb-1">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day.date?.slice(5)}</p>
                    <p className="text-lg mb-0.5">{day.cloud <= 20 ? '☀️' : day.cloud <= 60 ? '⛅' : day.precip_mm > 0.5 ? '🌧️' : '☁️'}</p>
                    <p className={`text-xs font-semibold ${dc.color}`}>{day.cloud}%</p>
                    <p className="text-slate-500 text-[10px]">{day.wind_kph} km/h</p>
                    <p className="text-slate-400 text-[10px]">{day.temp_max}° / {day.temp_min}°</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-slate-700 text-[10px] mt-3">Open-Meteo · free weather API</p>
    </Card>
  );
}