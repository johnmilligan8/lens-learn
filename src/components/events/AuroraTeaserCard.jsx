import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronRight } from 'lucide-react';

const COLORS = {
  good: 'from-emerald-900/40 to-emerald-800/20 border-emerald-500/30 hover:border-emerald-400/60',
  possible: 'from-yellow-900/40 to-yellow-800/20 border-yellow-500/30 hover:border-yellow-400/60',
  unlikely: 'from-red-900/40 to-red-800/20 border-red-500/30 hover:border-red-400/60',
};

const BADGE_COLORS = {
  good: 'bg-emerald-600 text-white',
  possible: 'bg-yellow-600 text-white',
  unlikely: 'bg-red-600 text-white',
};

export default function AuroraTeaserCard({ kpIndex, cloudCover, visibilityRating, onClick }) {
  if (!kpIndex || kpIndex < 2) return null; // Only show if KP > 2

  const gradientClass = COLORS[visibilityRating] || COLORS.unlikely;
  const badgeClass = BADGE_COLORS[visibilityRating];

  return (
    <Card
      onClick={onClick}
      className={`bg-gradient-to-br ${gradientClass} border p-5 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-600/30">
            <Sparkles className="w-5 h-5 text-purple-300" />
          </div>
          <h3 className="text-lg font-bold text-white">Aurora Tonight</h3>
        </div>
        <Badge className={badgeClass}>
          {visibilityRating === 'good' ? 'Good' : visibilityRating === 'possible' ? 'Possible' : 'Unlikely'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-slate-400">KP Index</p>
          <p className="text-lg font-black text-white">{kpIndex}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Cloud Cover</p>
          <p className="text-lg font-black text-white">{cloudCover}%</p>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-3">
        {visibilityRating === 'good' && 'Aurora likely tonight. Head to a dark-sky site.'}
        {visibilityRating === 'possible' && 'Faint aurora possible. Check forecast details.'}
        {visibilityRating === 'unlikely' && 'Aurora unlikely tonight, but conditions can change.'}
      </p>

      <p className="text-purple-300 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
        View forecast <ChevronRight className="w-3 h-3" />
      </p>
    </Card>
  );
}