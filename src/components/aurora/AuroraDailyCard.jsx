import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Moon, Eye, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const VISIBILITY_COLORS = {
  good: 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300',
  possible: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300',
  unlikely: 'bg-red-600/20 border-red-500/50 text-red-300',
};

const VISIBILITY_LABELS = {
  good: '✓ Good',
  possible: '◐ Possible',
  unlikely: '✗ Unlikely',
};

export default function AuroraDailyCard({ forecast, isTonight, moonPhase, moonIllumination, cloudCover, locationContext }) {
  const date = parseISO(forecast.date);
  const isToday = isTonight ? 'Tonight' : format(date, 'EEE, MMM d');

  return (
    <Card className={`p-5 rounded-lg border ${VISIBILITY_COLORS[forecast.visibility_rating]} bg-slate-900/40 relative overflow-hidden`}>
      {/* Background glow */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {forecast.visibility_rating === 'good' && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent" />}
        {forecast.visibility_rating === 'possible' && <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent" />}
        {forecast.visibility_rating === 'unlikely' && <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent" />}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">{isToday}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{locationContext}</p>
          </div>
          <Badge className={`whitespace-nowrap ${VISIBILITY_COLORS[forecast.visibility_rating].replace('border', 'bg')}`}>
            {VISIBILITY_LABELS[forecast.visibility_rating]}
          </Badge>
        </div>

        {/* KP Index */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-slate-400 font-medium">KP Index</span>
            </div>
            <p className="text-2xl font-black text-white">
              {forecast.kp_min !== undefined && forecast.kp_max !== undefined
                ? `${forecast.kp_min}–${forecast.kp_max}`
                : forecast.kp_index}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {forecast.kp_index >= 5 ? 'Strong activity' : forecast.kp_index >= 3 ? 'Moderate' : 'Weak'}
            </p>
          </div>

          {/* Cloud Cover */}
          <div className="bg-slate-800/60 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Cloud className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400 font-medium">Cloud Cover</span>
            </div>
            <p className="text-2xl font-black text-white">{forecast.cloud_cover_percent || 'N/A'}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {(forecast.cloud_cover_percent || 50) < 30 ? 'Clear' : (forecast.cloud_cover_percent || 50) < 70 ? 'Partly cloudy' : 'Overcast'}
            </p>
          </div>
        </div>

        {/* Moon & Seeing */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-slate-300">
            <Moon className="w-4 h-4 text-slate-400" />
            <span>{moonIllumination}% lit, {moonPhase}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Eye className="w-4 h-4 text-slate-400" />
            <span>Seeing: Fair</span>
          </div>
        </div>

        {/* Brief Explanation */}
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <p className="text-xs text-slate-300 leading-relaxed">
            {forecast.visibility_rating === 'good' && (
              <>KP {forecast.kp_index}+ with {forecast.cloud_cover_percent || 20}% clouds — excellent conditions for aurora viewing tonight. Watch from darker sites for best results.</>
            )}
            {forecast.visibility_rating === 'possible' && (
              <>KP {forecast.kp_index} expected with {forecast.cloud_cover_percent || 50}% cloud cover — faint aurora possible from Bortle 3–4 locations. City lights will reduce visibility significantly.</>
            )}
            {forecast.visibility_rating === 'unlikely' && (
              <>KP {forecast.kp_index} too weak or weather unfavorable. Aurora unlikely {isTonight ? 'tonight' : 'this day'}. Monitor NOAA for updates.</>
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}