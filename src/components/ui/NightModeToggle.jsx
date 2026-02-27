import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function NightModeToggle({ nightMode, onToggle, compact = false }) {
  return (
    <button
      onClick={onToggle}
      title={nightMode ? 'Night Vision (On) — tap to turn off' : 'Night Vision – red mode to protect your eyes in the dark'}
      className={`night-vision-exempt flex items-center gap-2 transition-all duration-200 rounded-xl text-xs font-semibold select-none
        ${compact ? 'p-2' : 'px-3 py-2'}
        ${nightMode
          ? 'bg-red-900/70 border border-red-600/80 text-red-300 shadow-[0_0_12px_rgba(220,38,38,0.5)]'
          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/8'
        }`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {nightMode ? (
        <Eye className="w-4 h-4 flex-shrink-0 text-red-400" />
      ) : (
        <EyeOff className="w-4 h-4 flex-shrink-0" />
      )}
      {!compact && (
        <span>{nightMode ? 'Night Vision (On)' : 'Night Vision'}</span>
      )}
      {/* Toggle pill */}
      {!compact && (
        <span className={`ml-1 inline-flex w-8 h-4 rounded-full transition-colors flex-shrink-0 relative ${nightMode ? 'bg-red-600' : 'bg-slate-700'}`}>
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200 ${nightMode ? 'left-4' : 'left-0.5'}`} />
        </span>
      )}
    </button>
  );
}