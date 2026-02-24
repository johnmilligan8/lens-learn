import React from 'react';
import { Moon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NightModeToggle({ nightMode, onToggle, compact = false }) {
  return (
    <button
      onClick={onToggle}
      title={nightMode ? 'Exit Night Vision' : 'Night Vision Mode'}
      className={`night-vision-exempt flex items-center gap-2 transition-all duration-200 rounded-xl px-3 py-2 text-xs font-semibold
        ${nightMode
          ? 'bg-red-950/80 border border-red-800 text-red-300 hover:bg-red-900/80'
          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
        }`}
    >
      {nightMode ? (
        <Eye className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Moon className="w-4 h-4 flex-shrink-0" />
      )}
      {!compact && <span>{nightMode ? 'Exit Night Vision' : 'Night Vision'}</span>}
    </button>
  );
}