import React from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SCORE_CONFIG = {
  excellent: { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-500/30', dot: 'bg-emerald-400' },
  good:      { label: 'Good',      color: 'text-blue-400',    bg: 'bg-blue-900/20 border-blue-500/30',       dot: 'bg-blue-400' },
  marginal:  { label: 'Marginal',  color: 'text-yellow-400',  bg: 'bg-yellow-900/20 border-yellow-500/30',   dot: 'bg-yellow-400' },
  poor:      { label: 'Poor',      color: 'text-red-400',     bg: 'bg-red-900/20 border-red-500/30',         dot: 'bg-red-400' },
};

export default function EventRankCard({ event, rank, isSubscribed, onCommit, mode }) {
  const sc = SCORE_CONFIG[event.viability] ?? SCORE_CONFIG.marginal;

  return (
    <div className={`rounded-xl border p-4 ${sc.bg} relative overflow-hidden`}>
      {rank === 1 && (
        <div className="absolute top-0 right-0">
          <div className="bg-yellow-500 text-black text-[10px] font-black px-2 py-0.5 rounded-bl-lg">TOP EVENT</div>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">{event.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-white font-bold text-sm">{event.title}</h3>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${sc.bg}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              <span className={`text-[10px] font-semibold ${sc.color}`}>{sc.label}</span>
            </div>
          </div>

          {/* Free: plain explanation */}
          <p className="text-slate-400 text-xs leading-relaxed mb-2">{event.summary}</p>

          {/* Free: time window */}
          {event.window && (
            <p className="text-slate-500 text-xs flex items-center gap-1">
              🕐 Best window: <span className="text-white font-medium ml-1">{event.window}</span>
            </p>
          )}

          {/* Paid: detailed drivers */}
          {isSubscribed ? (
            <div className="mt-3 space-y-2">
              {event.drivers && event.drivers.length > 0 && (
                <div className="space-y-1">
                  {event.drivers.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={`mt-0.5 flex-shrink-0 ${d.positive ? 'text-emerald-400' : 'text-red-400'}`}>{d.positive ? '✓' : '✗'}</span>
                      <span className="text-slate-300">{d.text}</span>
                    </div>
                  ))}
                </div>
              )}
              {event.expectation && (
                <p className="text-xs text-slate-400 italic border-l-2 border-slate-600 pl-2">{event.expectation}</p>
              )}
              {mode !== 'experience' && (
                <button
                  onClick={() => onCommit(event)}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg py-2 transition-colors"
                >
                  Commit & Build Shoot Plan <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 border border-slate-700/50 rounded-lg px-3 py-2 bg-slate-900/40">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Full viability score, drivers & shoot plan — <strong className="text-purple-300">Paid</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}