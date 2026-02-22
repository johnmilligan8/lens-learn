import React from 'react';
import { Camera, Smartphone, Eye } from 'lucide-react';

const MODES = [
  {
    key: 'photographer',
    icon: Camera,
    title: 'DSLR / Mirrorless',
    subtitle: 'Photographer',
    desc: 'Deep guidance on exposure, stacking, composition, and advanced field technique.',
    color: 'purple',
  },
  {
    key: 'smartphone',
    icon: Smartphone,
    title: 'Smartphone',
    subtitle: 'Night Mode Shooter',
    desc: 'Night Mode tips, stability tricks, and realistic expectations for phone cameras.',
    color: 'blue',
  },
  {
    key: 'experience',
    icon: Eye,
    title: 'No Camera',
    subtitle: 'Sky Experience',
    desc: 'Pure visibility forecasts — what to expect, where to look, and when to go.',
    color: 'indigo',
  },
];

const COLOR = {
  purple: { border: 'border-purple-500 bg-purple-900/20', icon: 'text-purple-400', badge: 'bg-purple-600', ring: 'ring-purple-500' },
  blue:   { border: 'border-blue-500 bg-blue-900/20', icon: 'text-blue-400', badge: 'bg-blue-600', ring: 'ring-blue-500' },
  indigo: { border: 'border-indigo-500 bg-indigo-900/20', icon: 'text-indigo-400', badge: 'bg-indigo-600', ring: 'ring-indigo-500' },
};

export default function ModeSelector({ value, onChange, compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
      {MODES.map(m => {
        const selected = value === m.key;
        const c = COLOR[m.color];
        const Icon = m.icon;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            className={`text-left rounded-xl border-2 p-4 transition-all ${selected ? `${c.border} ring-2 ${c.ring}` : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'}`}
          >
            <Icon className={`w-6 h-6 mb-2 ${selected ? c.icon : 'text-slate-500'}`} />
            {!compact && (
              <>
                <p className={`font-bold text-sm ${selected ? 'text-white' : 'text-slate-300'}`}>{m.title}</p>
                <p className={`text-xs mb-2 ${selected ? c.icon : 'text-slate-500'}`}>{m.subtitle}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
              </>
            )}
            {compact && (
              <p className={`font-semibold text-xs ${selected ? 'text-white' : 'text-slate-400'}`}>{m.subtitle}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}