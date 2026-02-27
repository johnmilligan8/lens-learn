import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader, MapPin, Zap, Eye } from 'lucide-react';

const INTENSITY_COLORS = {
  green: { label: 'Low', hex: '#22c55e', rgb: 'rgba(34, 197, 94, 0.3)' },
  yellow: { label: 'Moderate', hex: '#eab308', rgb: 'rgba(234, 179, 8, 0.3)' },
  orange: { label: 'Strong', hex: '#f97316', rgb: 'rgba(249, 115, 22, 0.3)' },
  red: { label: 'Very Strong', hex: '#ef4444', rgb: 'rgba(239, 68, 68, 0.3)' },
};

const AURORA_ZONES = [
  { name: 'Northern Alaska', lat: 68.5, lon: -155, intensity: 'red', likelihood: 'High' },
  { name: 'Northern Canada', lat: 64, lon: -110, intensity: 'orange', likelihood: 'Moderate-High' },
  { name: 'Alaska Panhandle', lat: 57, lon: -136, intensity: 'yellow', likelihood: 'Moderate' },
  { name: 'Northern US Border', lat: 48, lon: -110, intensity: 'green', likelihood: 'Low' },
  { name: 'Montana/Wyoming', lat: 45, lon: -110, intensity: 'green', likelihood: 'Low' },
];

function getKpColor(kp) {
  if (kp >= 7) return INTENSITY_COLORS.red;
  if (kp >= 5) return INTENSITY_COLORS.orange;
  if (kp >= 3) return INTENSITY_COLORS.yellow;
  return INTENSITY_COLORS.green;
}

function HourlyTrendMini({ kpForecast }) {
  const hours = [0, 3, 6, 9, 12, 15, 18, 21];
  const maxKp = Math.max(...hours.map(h => kpForecast[h] || 0));
  
  return (
    <div className="flex items-end gap-1 h-12">
      {hours.map((h, i) => {
        const kp = kpForecast[h] || 0;
        const color = getKpColor(kp);
        const height = maxKp > 0 ? (kp / maxKp) * 100 : 10;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${height}%`, backgroundColor: color.hex, minHeight: '4px' }}
            />
            <span className="text-xs text-slate-500">{h}h</span>
          </div>
        );
      })}
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
  const [currentKp, setCurrentKp] = useState(null);

  useEffect(() => {
    // Simulate hourly KP forecast
    const forecast = {};
    for (let h = 0; h < 24; h++) {
      forecast[h] = Math.max(0, Math.min(9, 
        (auroraForecast?.kp_index || 2) + (Math.sin(h / 4) * 1.5)
      ));
    }
    setKpForecast(forecast);
    setCurrentKp(auroraForecast?.kp_index || null);
    setLoading(false);
  }, [auroraForecast]);

  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border border-white/8 p-6">
        <div className="flex items-center justify-center gap-2 py-12">
          <Loader className="w-5 h-5 animate-spin text-red-400" />
          <span className="text-slate-400 text-sm">Loading aurora map…</span>
        </div>
      </Card>
    );
  }

  const currentColor = getKpColor(currentKp);

  return (
    <Card className="bg-[#1a1a1a] border border-white/8 p-0 overflow-hidden mb-6">
      {/* Header */}
      <div className="p-5 border-b border-white/8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-red-600/15 border border-red-600/20">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Aurora Intensity Map</h3>
            <p className="text-slate-400 text-xs">Color-coded forecast · US/Canada coverage</p>
          </div>
        </div>

        {/* Current KP + Legend */}
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Current KP Index</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black" style={{ color: currentColor.hex }}>
                {currentKp}
              </span>
              <span className="text-sm text-slate-400 pb-1">{currentColor.label}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-3 flex-wrap ml-auto items-end">
            {Object.entries(INTENSITY_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs text-slate-400">{color.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aurora Zones Grid */}
      {isSubscribed ? (
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AURORA_ZONES.map((zone, idx) => {
              const color = INTENSITY_COLORS[zone.intensity];
              return (
                <div
                  key={idx}
                  className="rounded-lg border p-3 transition-all"
                  style={{
                    backgroundColor: color.rgb,
                    borderColor: color.hex,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-semibold text-sm">{zone.name}</p>
                      <p className="text-xs text-slate-300 mt-0.5">
                        <span style={{ color: color.hex }} className="font-bold">{color.label}</span> intensity
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{zone.likelihood}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-48 bg-black/40 flex items-center justify-center border-t border-white/8 p-5">
          <div className="text-center">
            <Eye className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Unlock map to see aurora zones</p>
            <p className="text-xs text-slate-600 mt-1">Available for Plus members</p>
          </div>
        </div>
      )}

      {/* Hourly Trend + Weekly */}
      <div className="p-5 border-t border-white/8 space-y-5">
        {isSubscribed ? (
          <>
            {/* Hourly Trend */}
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-3">24-Hour KP Trend</p>
              <HourlyTrendMini kpForecast={kpForecast} />
            </div>

            {/* Weekly Summary */}
            <div className="bg-black/20 rounded-lg p-3 border border-white/8">
              <p className="text-xs font-semibold text-slate-400 mb-2">7-Day Outlook</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Peak activity expected in next 2–3 days. Best visibility from high-latitude sites (northern Canada, Alaska). 
                From your location, watch for green-to-yellow displays on clear nights KP 5+.
              </p>
            </div>

            {/* Tip */}
            <div className="bg-red-900/20 rounded-lg p-3 border border-red-600/30">
              <p className="text-xs text-red-200">
                🎯 <strong>Tonight:</strong> {currentColor.label} intensity. {
                  currentKp >= 5 ? 'Head north for best views!' 
                  : currentKp >= 3 ? 'Check horizon from dark skies.' 
                  : 'Low activity; check forecast updates.'
                }
              </p>
            </div>
          </>
        ) : (
          <div className="bg-red-900/20 rounded-lg p-3 border border-red-600/30">
            <p className="text-xs text-red-200">
              ✨ <strong>Plus members</strong> unlock hourly trends, 7-day outlook, and location-based visibility alerts.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}