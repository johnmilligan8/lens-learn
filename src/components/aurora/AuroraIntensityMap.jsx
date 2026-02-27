import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader, Zap, Eye, TrendingUp } from 'lucide-react';
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const INTENSITY_COLORS = {
  green: { label: 'Low', hex: '#22c55e' },
  yellow: { label: 'Moderate', hex: '#eab308' },
  orange: { label: 'Strong', hex: '#f97316' },
  red: { label: 'Very Strong', hex: '#ef4444' },
};

function getKpColor(kp) {
  if (kp >= 7) return INTENSITY_COLORS.red;
  if (kp >= 5) return INTENSITY_COLORS.orange;
  if (kp >= 3) return INTENSITY_COLORS.yellow;
  return INTENSITY_COLORS.green;
}

function HourlyTrendChart({ kpForecast }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const maxKp = Math.max(...hours.map(h => kpForecast[h] || 0), 1);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400">24-Hour KP Trend</p>
      <div className="flex items-end gap-0.5 h-16 bg-black/20 rounded-lg p-2">
        {hours.map((h) => {
          const kp = kpForecast[h] || 0;
          const color = getKpColor(kp);
          const height = (kp / maxKp) * 100;
          const isNow = h === new Date().getHours();
          
          return (
            <div
              key={h}
              className="flex-1 flex flex-col items-center justify-end relative group"
              style={{ minHeight: '2px' }}
            >
              <div
                className={`w-full rounded-t transition-all ${isNow ? 'ring-2 ring-white' : ''}`}
                style={{
                  height: `${Math.max(height, 3)}%`,
                  backgroundColor: color.hex,
                }}
                title={`${h}h: KP ${kpForecast[h]?.toFixed(1) || '0.0'}`}
              />
              {h % 3 === 0 && (
                <span className="text-xs text-slate-500 mt-1">{h}h</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyOutlook({ weeklyKp }) {
  const days = ['Today', 'Tomorrow', '+2d', '+3d', '+4d', '+5d', '+6d'];
  
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slate-400">7-Day KP Forecast</p>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          const kp = weeklyKp[i] || 2;
          const color = getKpColor(kp);
          return (
            <div key={i} className="text-center">
              <div
                className="h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-all"
                style={{ backgroundColor: color.hex }}
              >
                {kp.toFixed(1)}
              </div>
              <p className="text-xs text-slate-500 mt-1">{day}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AuroraIntensityMap({ 
  isSubscribed, 
  userLat = 40, 
  userLon = -105,
  userLocation = 'Your Location',
  auroraForecast = null 
}) {
  const [loading, setLoading] = useState(true);
  const [kpForecast, setKpForecast] = useState({});
  const [weeklyKp, setWeeklyKp] = useState([]);
  const [currentKp, setCurrentKp] = useState(null);
  const [noaaImageUrl, setNoaaImageUrl] = useState('https://services.swpc.noaa.gov/images/aurora-30-minute-forecast-north.png');

  useEffect(() => {
    // Simulate hourly KP forecast (in production, parse from NOAA 3-day text)
    const forecast = {};
    const baseKp = auroraForecast?.kp_index || 2;
    for (let h = 0; h < 24; h++) {
      const rawKp = Math.max(0, Math.min(9, 
        baseKp + (Math.sin(h / 4) * 1.5) + (Math.random() - 0.5) * 0.5
      ));
      forecast[h] = Math.round(rawKp * 10) / 10;
    }
    setKpForecast(forecast);
    setCurrentKp(Math.round(baseKp * 10) / 10);

    // Simulate 7-day outlook (in production, fetch from NOAA 27-day)
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const rawKp = Math.max(0, Math.min(9, baseKp + (Math.random() - 0.5) * 3));
      return Math.round(rawKp * 10) / 10;
    });
    setWeeklyKp(weekly);

    setLoading(false);
  }, [auroraForecast]);

  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border border-white/8 p-6">
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader className="w-5 h-5 animate-spin text-red-400" />
          <span className="text-slate-400 text-sm">Loading aurora forecast…</span>
        </div>
      </Card>
    );
  }

  const currentColor = getKpColor(currentKp);
  const aurAuroraLikelyFromUser = currentKp >= 5;

  return (
    <Card className="bg-[#1a1a1a] border border-white/8 p-0 overflow-hidden mb-6">
      {/* Header */}
      <div className="p-5 border-b border-white/8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-600/15 border border-red-600/20">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-lg">Aurora Forecast</h3>
            <p className="text-slate-400 text-xs">Color-coded intensity over US/Canada</p>
          </div>
        </div>

        {/* Current KP Display */}
        <div className="flex items-end gap-3 mb-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">Current KP Index</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black" style={{ color: currentColor.hex }}>
                {currentKp.toFixed(1)}
              </span>
              <span className="text-sm text-slate-300 pb-1 font-semibold">{currentColor.label}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-2 ml-auto flex-wrap justify-end">
            {Object.entries(INTENSITY_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: color.hex }} />
                <span className="text-xs text-slate-400">{color.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick insight */}
        <div className={`text-xs p-2 rounded-lg ${aurAuroraLikelyFromUser ? 'bg-red-900/20 border border-red-600/30 text-red-200' : 'bg-slate-900/30 border border-slate-600/20 text-slate-300'}`}>
          {aurAuroraLikelyFromUser 
            ? `🎯 Aurora likely tonight from dark skies! Best odds if you head north of ${userLocation}.`
            : `Aurora unlikely from ${userLocation} tonight. Peak activity expected in northern Canada/Alaska.`
          }
        </div>
      </div>

      {/* Map Section */}
      {isSubscribed ? (
        <div className="border-b border-white/8 bg-black/30" style={{ height: '380px' }}>
            <MapContainer
              center={[50, -100]}
              zoom={4}
              style={{ height: '100%', width: '100%' }}
              attributionControl={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
                opacity={0.5}
              />
              {/* NOAA Aurora Forecast Overlay */}
              <ImageOverlay
                url={noaaImageUrl}
                bounds={[[25, -180], [85, 0]]}
                opacity={0.6}
              />
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="border-b border-white/8 h-48 bg-black/40 flex items-center justify-center p-5">
          <div className="text-center">
            <Eye className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Unlock detailed map view</p>
            <p className="text-xs text-slate-600 mt-1">Available for Plus members</p>
          </div>
        </div>
      )}

      {/* Details Section */}
      <div className="p-5 space-y-5">
        {isSubscribed ? (
          <>
            {/* Hourly Trend */}
            <HourlyTrendChart kpForecast={kpForecast} />

            {/* Weekly Outlook */}
            <WeeklyOutlook weeklyKp={weeklyKp} />

            {/* Location-aware tip */}
            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-600/30 space-y-1">
              <p className="text-xs font-semibold text-blue-200 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Location Visibility
              </p>
              <p className="text-xs text-blue-100 leading-relaxed">
                {currentKp >= 7 
                  ? `Excellent chance to see aurora from ${userLocation}. Look north after midnight.`
                  : currentKp >= 5
                  ? `Good odds from dark skies north of ${userLocation}. Expect green glow on horizon.`
                  : currentKp >= 3
                  ? `Faint possibility from far-north locations (northern Canada, Alaska).`
                  : `Low activity. Check forecast updates in 6–12 hours.`
                }
              </p>
            </div>
          </>
        ) : (
          <div className="bg-red-900/20 rounded-lg p-3 border border-red-600/30 space-y-1">
            <p className="text-xs font-semibold text-red-200">✨ Unlock Full Aurora Forecast</p>
            <p className="text-xs text-red-100 leading-relaxed">
              Plus members get detailed hourly trends, 7-day outlook, color overlay map, and location-based visibility alerts.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}