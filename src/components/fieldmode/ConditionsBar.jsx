import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

function getMoonIllum() {
  const knownNew = new Date('2000-01-06T00:00:00Z');
  const cycle = 29.53058867;
  const diff = (Date.now() - knownNew.getTime()) / 86400000;
  const phase = ((diff % cycle) + cycle) % cycle;
  return Math.round((1 - Math.cos((phase / cycle) * 2 * Math.PI)) / 2 * 100);
}

function getMoonEmoji(illum) {
  if (illum < 6) return '🌑';
  if (illum < 25) return '🌒';
  if (illum < 50) return '🌓';
  if (illum < 75) return '🌔';
  if (illum < 95) return '🌕';
  return '🌕';
}

export default function ConditionsBar({ coords, mode }) {
  const [weather, setWeather] = useState(null);
  const moonIllum = getMoonIllum();
  const moonEmoji = getMoonEmoji(moonIllum);

  useEffect(() => {
    if (!coords) return;
    const today = new Date().toISOString().split('T')[0];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=cloud_cover,temperature_2m&timezone=UTC`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data?.current) {
          setWeather({
            cloud_cover: data.current.cloud_cover,
            temp_c: data.current.temperature_2m,
          });
        }
      })
      .catch(() => {});
  }, [coords]);

  const items = [
    {
      icon: moonEmoji,
      label: 'Moon',
      value: `${moonIllum}%`,
      color: moonIllum < 30 ? 'text-emerald-400' : moonIllum < 60 ? 'text-yellow-400' : 'text-red-400',
    },
    weather && {
      icon: '☁️',
      label: 'Cloud',
      value: `${weather.cloud_cover ?? '?'}%`,
      color: (weather.cloud_cover ?? 100) < 30 ? 'text-emerald-400' : (weather.cloud_cover ?? 100) < 60 ? 'text-yellow-400' : 'text-red-400',
    },
    weather && {
      icon: '🌡️',
      label: 'Temp',
      value: weather.temp_c !== undefined ? `${Math.round(weather.temp_c)}°C` : '–',
      color: 'text-slate-300',
    },
    coords && {
      icon: '📍',
      label: coords.label || 'GPS',
      value: `${coords.lat.toFixed(1)}°, ${coords.lon.toFixed(1)}°`,
      color: 'text-slate-400',
    },
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-4 overflow-x-auto px-4 pb-2 pt-1 scrollbar-none">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs">{item.icon}</span>
          <span className="text-slate-600 text-[10px]">{item.label}</span>
          <span className={`text-[10px] font-bold ${item.color}`}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}