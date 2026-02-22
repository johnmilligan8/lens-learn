import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Eye, Loader2, TrendingUp, MapPin } from 'lucide-react';

// Aurora visibility lookup table: given latitude + KP index, what's the visibility probability
function getAuroraVisibility(lat, kpIndex) {
  const absLat = Math.abs(lat);

  // KP 0-2: Very poor
  if (kpIndex <= 2) {
    if (absLat >= 65) return { prob: 30, note: 'Rare but possible at high latitudes' };
    if (absLat >= 55) return { prob: 5, note: 'Extremely unlikely' };
    return { prob: 0, note: 'No aurora' };
  }

  // KP 3-4: Moderate
  if (kpIndex <= 4) {
    if (absLat >= 65) return { prob: 70, note: 'Good chance at northern latitudes' };
    if (absLat >= 55) return { prob: 20, note: 'Possible on good nights' };
    if (absLat >= 45) return { prob: 5, note: 'Unlikely at this latitude' };
    return { prob: 0, note: 'Too far south' };
  }

  // KP 5-6: Strong
  if (kpIndex <= 6) {
    if (absLat >= 65) return { prob: 90, note: 'Excellent chance' };
    if (absLat >= 55) return { prob: 60, note: 'Good visibility expected' };
    if (absLat >= 45) return { prob: 25, note: 'Possible, especially if skies are clear' };
    if (absLat >= 40) return { prob: 10, note: 'Unlikely but worth watching' };
    return { prob: 0, note: 'Too far south' };
  }

  // KP 7+: Severe
  if (absLat >= 65) return { prob: 95, note: 'Extremely likely — go shoot!' };
  if (absLat >= 55) return { prob: 85, note: 'Very strong display expected' };
  if (absLat >= 45) return { prob: 50, note: 'Possible at lower latitudes during major storms' };
  if (absLat >= 40) return { prob: 25, note: 'Possible during extreme events' };
  if (absLat >= 35) return { prob: 5, note: 'Rare but possible during geomagnetic storms' };
  return { prob: 0, note: 'Too far south' };
}

function getProbColor(prob) {
  if (prob >= 80) return 'text-emerald-400';
  if (prob >= 50) return 'text-blue-400';
  if (prob >= 25) return 'text-yellow-400';
  if (prob >= 10) return 'text-orange-400';
  return 'text-red-400';
}

function getProbBg(prob) {
  if (prob >= 80) return 'bg-emerald-900/30 border-emerald-500/50';
  if (prob >= 50) return 'bg-blue-900/30 border-blue-500/50';
  if (prob >= 25) return 'bg-yellow-900/30 border-yellow-500/50';
  if (prob >= 10) return 'bg-orange-900/30 border-orange-500/50';
  return 'bg-red-900/30 border-red-500/50';
}

export default function AuroraVisibilityCorrelation({ lat, lon, locationName, dateRange = 'next_week' }) {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!lat || !lon) {
        setLoading(false);
        return;
      }

      try {
        // Get aurora forecasts for the next 7 days
        const today = new Date().toISOString().split('T')[0];
        const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        
        const data = await base44.entities.AuroraForecast.filter(
          { date: { $gte: today, $lte: in7days } },
          'date',
          10
        );

        // Enrich with visibility calculations
        const enriched = data.map(forecast => {
          const visibility = getAuroraVisibility(lat, forecast.kp_index);
          return { ...forecast, visibility };
        });

        setForecasts(enriched);
      } catch (err) {
        console.error('Failed to load aurora forecast:', err);
      }
      setLoading(false);
    };

    load();
  }, [lat, lon]);

  if (!lat || !lon) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-6 text-center">
        <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Enter a location to see aurora visibility forecasts.</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading aurora forecasts...</p>
        </div>
      </Card>
    );
  }

  if (forecasts.length === 0) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-6 text-center">
        <p className="text-slate-400 text-sm">No aurora forecasts available.</p>
      </Card>
    );
  }

  // Calculate average visibility
  const avgProb = Math.round(
    forecasts.reduce((sum, f) => sum + f.visibility.prob, 0) / forecasts.length
  );

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-green-400" /> Aurora Visibility Forecast
          </h3>
          <p className="text-slate-400 text-xs mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {locationName} (Lat: {lat.toFixed(1)}°)
          </p>
        </div>
        <div className={`text-right px-3 py-2 rounded-lg border ${getProbBg(avgProb)}`}>
          <p className={`text-2xl font-black ${getProbColor(avgProb)}`}>{avgProb}%</p>
          <p className="text-xs text-slate-400">avg visibility</p>
        </div>
      </div>

      {/* Aurora availability note by latitude */}
      {Math.abs(lat) < 35 ? (
        <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
          <p className="text-orange-300 text-xs font-semibold">⚠️ Aurora is rare at your latitude</p>
          <p className="text-slate-400 text-xs mt-1">
            Aurora is primarily visible above 45° latitude (north/south). During extreme geomagnetic storms (KP 8+), it may extend to lower latitudes.
          </p>
        </div>
      ) : Math.abs(lat) < 45 ? (
        <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
          <p className="text-yellow-300 text-xs font-semibold">⚡ Aurora possible during strong events</p>
          <p className="text-slate-400 text-xs mt-1">
            Your location is at the edge of the aurora oval. Visibility requires high KP indices (6+) and clear skies.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3">
          <p className="text-emerald-300 text-xs font-semibold">✓ Aurora zone!</p>
          <p className="text-slate-400 text-xs mt-1">
            Your location is in the prime aurora zone. Watch KP index — visibility increases significantly at KP 5+.
          </p>
        </div>
      )}

      {/* 7-day forecast */}
      <div>
        <p className="text-slate-300 font-semibold text-sm mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" /> 7-Day Outlook
        </p>
        <div className="space-y-2">
          {forecasts.map((f, i) => {
            const dateObj = new Date(f.date + 'T00:00:00Z');
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
            const prob = f.visibility.prob;
            return (
              <div key={i} className={`rounded-lg p-3 border ${getProbBg(prob)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-semibold text-sm">{dateStr}</p>
                    <p className="text-slate-400 text-xs">KP {f.kp_index} • {f.visibility_rating}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-black ${getProbColor(prob)}`}>{prob}%</p>
                    <p className="text-xs text-slate-400">visibility</p>
                  </div>
                </div>
                <p className="text-slate-400 text-xs">{f.visibility.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action button */}
      {avgProb >= 50 && (
        <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3">
          <p className="text-emerald-300 text-sm font-semibold">🚀 Good aurora week ahead!</p>
          <p className="text-slate-400 text-xs mt-1">Monitor KP index daily and prepare your aurora kit.</p>
        </div>
      )}

      <p className="text-slate-600 text-xs pt-2">
        Visibility is calculated from KP index + your latitude. Check <a href="https://www.swpc.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">NOAA SWPC</a> for real-time alerts.
      </p>
    </Card>
  );
}