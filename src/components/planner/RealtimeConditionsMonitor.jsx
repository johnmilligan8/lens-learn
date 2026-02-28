import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Moon, Sun, AlertTriangle, Zap, Clock } from 'lucide-react';

export default function RealtimeConditionsMonitor({ lat, lon, date }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConditions = async () => {
      try {
        const res = await base44.functions.invoke('aggregateRealtimeConditions', { lat, lon, date });
        setData(res.data);
      } catch (e) {
        console.error('Error fetching conditions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchConditions();
  }, [lat, lon, date]);

  if (loading) return <div className="text-slate-400 text-xs">Loading conditions...</div>;
  if (!data) return null;

  const { moon, sun, aurora, recommendation } = data;

  return (
    <div className="rounded-xl border border-slate-700/40 bg-black/40 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-500" />
        <p className="text-yellow-400 text-xs font-black uppercase">Real-Time Conditions</p>
      </div>

      {/* Moon */}
      <div className="bg-slate-900/60 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-medium text-sm">{moon.name}</span>
          </div>
          <span className="text-slate-500 text-xs">{moon.percent}% illuminated</span>
        </div>
        <p className="text-slate-400 text-xs">Impact: {recommendation.moonImpact}</p>
      </div>

      {/* Sun */}
      <div className="bg-slate-900/60 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-orange-400" />
            <span className="text-slate-300 font-medium text-sm">Sun Altitude</span>
          </div>
          <span className="text-slate-500 text-xs">{sun.altitude}°</span>
        </div>
        <p className="text-slate-400 text-xs">
          {sun.isDaytime ? '☀️ Daytime' : sun.altitude > -6 ? '🌅 Twilight' : '🌙 Dark'}
        </p>
      </div>

      {/* Aurora */}
      {aurora.kp !== null && (
        <div className={`rounded-lg p-3 border ${
          aurora.chance === 'high'
            ? 'bg-green-900/20 border-green-600/30'
            : aurora.chance === 'moderate'
            ? 'bg-yellow-900/20 border-yellow-600/30'
            : 'bg-slate-900/60 border-slate-700/40'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-slate-300 font-medium text-sm">Aurora Potential</span>
            </div>
            <span className={`text-xs font-bold ${
              aurora.chance === 'high' ? 'text-green-400' : aurora.chance === 'moderate' ? 'text-yellow-400' : 'text-slate-500'
            }`}>
              {aurora.chance.toUpperCase()} (KP {aurora.kp})
            </span>
          </div>
          <p className="text-slate-400 text-xs">Based on current KP forecast</p>
        </div>
      )}

      {/* Recommendation */}
      <div className="border-t border-slate-700/30 pt-2 mt-2">
        <p className="text-slate-400 text-xs font-semibold mb-1">💡 Personalized Recommendation:</p>
        <p className="text-slate-300 text-xs">
          {recommendation.event && `Focus on ${recommendation.event}`}. {recommendation.moonImpact === 'minimal (dark)' ? '✓ Perfect moon conditions.' : '⚠️ Plan around moon.'}
        </p>
      </div>
    </div>
  );
}