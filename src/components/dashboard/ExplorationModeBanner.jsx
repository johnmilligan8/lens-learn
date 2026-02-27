import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Telescope, Edit2 } from 'lucide-react';

const MODE_INFO = {
  photographer: {
    emoji: '📷',
    label: 'DSLR / Mirrorless',
    description: 'Full camera settings, stacking, and field technique.'
  },
  smartphone: {
    emoji: '📱',
    label: 'Smartphone',
    description: 'Night Mode tips and stability tricks.'
  },
  experience: {
    emoji: '👁️',
    label: 'Sky Watching',
    description: 'Visibility forecasts — what to see and when.'
  }
};

export default function ExplorationModeBanner({ mode, onEdit }) {
  const info = MODE_INFO[mode] || MODE_INFO.photographer;

  const bgClass = {
    photographer: 'bg-purple-900/20 border-purple-600/30',
    smartphone: 'bg-blue-900/20 border-blue-600/30',
    experience: 'bg-indigo-900/20 border-indigo-600/30'
  }[mode] || 'bg-purple-900/20 border-purple-600/30';

  return (
    <Card className={`border ${bgClass} p-5 mb-8 flex items-center justify-between group hover:shadow-lg transition-all`}>
      <div className="flex items-center gap-4">
        <div className="text-3xl">{info.emoji}</div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
            {info.label} Mode Active
          </p>
          <p className="text-slate-400 text-xs mt-0.5">{info.description}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="text-slate-400 hover:text-red-400 font-medium gap-1 flex-shrink-0"
      >
        <Edit2 className="w-4 h-4" />
        <span className="hidden sm:inline">Change</span>
      </Button>
    </Card>
  );
}