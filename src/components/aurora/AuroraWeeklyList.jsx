import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ChevronRight } from 'lucide-react';

const VISIBILITY_COLORS = {
  good: 'bg-emerald-500/20 border-l-4 border-emerald-500',
  possible: 'bg-yellow-500/20 border-l-4 border-yellow-500',
  unlikely: 'bg-red-500/20 border-l-4 border-red-500',
};

const VISIBILITY_LABELS = {
  good: 'Good',
  possible: 'Possible',
  unlikely: 'Unlikely',
};

const BADGE_COLORS = {
  good: 'bg-emerald-600 text-white',
  possible: 'bg-yellow-600 text-white',
  unlikely: 'bg-red-600 text-white',
};

export default function AuroraWeeklyList({ forecasts }) {
  return (
    <div className="space-y-2">
      {forecasts.map((forecast) => {
        const date = parseISO(forecast.date);
        return (
          <div
            key={forecast.id}
            className={`p-4 rounded-lg transition-all hover:scale-[1.02] cursor-pointer ${VISIBILITY_COLORS[forecast.visibility_rating]}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold text-white text-sm">{format(date, 'EEE, MMM d')}</h4>
                  <Badge className={BADGE_COLORS[forecast.visibility_rating]}>{VISIBILITY_LABELS[forecast.visibility_rating]}</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-300">
                  <span className="font-medium">KP {forecast.kp_min ?? forecast.kp_index}–{forecast.kp_max ?? forecast.kp_index}</span>
                  {forecast.cloud_cover_percent !== null && forecast.cloud_cover_percent !== undefined
                    ? <span>☁ {forecast.cloud_cover_percent}%</span>
                    : null}
                  {forecast.precipitation > 0 ? <span>💧 {forecast.precipitation}mm</span> : null}
                  <span className="text-slate-500 text-xs">{forecast.source === 'NOAA' ? '🛰 NOAA' : 'mock'}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}