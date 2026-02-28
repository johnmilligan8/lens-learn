import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, MapPin, Calendar, Download, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import FeedbackRequestModal from './FeedbackRequestModal';

const OUTCOME_STYLES = {
  nailed: 'bg-emerald-700/40 text-emerald-300 border-emerald-700/40',
  okay: 'bg-blue-700/40 text-blue-300 border-blue-700/40',
  failed: 'bg-red-800/40 text-red-300 border-red-800/40',
  cancelled: 'bg-slate-700/40 text-slate-400 border-slate-700',
};
const OUTCOME_ICONS = { nailed: '🎯', okay: '✓', failed: '✗', cancelled: '⊘' };

const MODE_LABELS = { photographer: '📷 DSLR/Mirrorless', smartphone: '📱 Phone', experience: '👁 Sky Watching' };

const LIMITING_LABELS = {
  clouds: 'Clouds', haze: 'Haze/Smoke', moon: 'Moon', focus: 'Focus',
  noise: 'Noise/ISO', timing: 'Timing', wind: 'Wind', other: 'Other',
};

function exportSession(session) {
  const lines = [
    `UNCHARTED SKY — Expedition Journal`,
    `=====================================`,
    `Date: ${session.date}`,
    `Location: ${session.location || '—'}`,
    `Mode: ${MODE_LABELS[session.shooter_mode] || session.shooter_mode || '—'}`,
    `Event: ${session.event_type || '—'}`,
    `Outcome: ${session.outcome ? (OUTCOME_ICONS[session.outcome] + ' ' + session.outcome) : '—'}`,
    `Limiting Factor: ${session.limiting_factor ? (LIMITING_LABELS[session.limiting_factor] || session.limiting_factor) : '—'}`,
    ``,
    `PRE-SHOOT INTENT`,
    `----------------`,
    session.pre_shoot_intent || 'None',
    ``,
    `FIELD NOTES`,
    `-----------`,
    session.field_notes || 'None',
    ``,
    `POST-SHOOT REFLECTION`,
    `---------------------`,
    session.post_shoot_reflection || 'None',
    ``,
    `=====================================`,
    `Exported from Uncharted Sky Companion`,
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expedition-${session.date || 'session'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SessionCard({ session, isSubscribed }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#111111]/80 overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-semibold truncate">
              {session.location || 'Unnamed Location'}
            </span>
            {session.event_type && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-medium">
                {session.event_type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="w-3 h-3 text-slate-600" />
            <span className="text-slate-500 text-xs">
              {session.date ? format(new Date(session.date), 'MMM d, yyyy') : '—'}
            </span>
            {session.shooter_mode && (
              <span className="text-slate-600 text-xs">{MODE_LABELS[session.shooter_mode]?.split(' ')[0]}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {session.outcome ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${OUTCOME_STYLES[session.outcome] || ''}`}>
              {OUTCOME_ICONS[session.outcome]} {session.outcome}
            </span>
          ) : (
            <span className="text-[10px] text-slate-600 italic">No outcome</span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/40 space-y-3 pt-3">
          {/* Mode label */}
          {session.shooter_mode && (
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
              {MODE_LABELS[session.shooter_mode] || session.shooter_mode}
            </p>
          )}

          {/* Limiting factor */}
          {session.limiting_factor && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Limiting Factor:</span>
              <span className="text-xs text-yellow-300 font-semibold">
                {LIMITING_LABELS[session.limiting_factor] || session.limiting_factor}
              </span>
            </div>
          )}

          {/* Pre-shoot intent */}
          {session.pre_shoot_intent && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Pre-Shoot Intent</p>
              <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/50 rounded-lg px-3 py-2">
                {session.pre_shoot_intent}
              </p>
            </div>
          )}

          {/* Field notes */}
          {session.field_notes && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Field Notes</p>
              <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/50 rounded-lg px-3 py-2">
                {session.field_notes}
              </p>
            </div>
          )}

          {/* Post-shoot reflection */}
          {session.post_shoot_reflection && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Reflection</p>
              <p className="text-slate-300 text-xs leading-relaxed bg-red-900/10 border border-red-900/20 rounded-lg px-3 py-2">
                {session.post_shoot_reflection}
              </p>
            </div>
          )}

          {/* Guided plan summary */}
          {session.guided_plan && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Planned From</p>
              <p className="text-slate-400 text-xs">
                {session.guided_plan.event_name || session.guided_plan.event_type || 'Sky Planner / Tonight?'}
              </p>
            </div>
          )}

          {/* Export */}
          {isSubscribed && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportSession(session)}
              className="border-slate-700 text-slate-400 hover:text-white text-xs gap-1.5 mt-1"
            >
              <Download className="w-3.5 h-3.5" /> Export Session
            </Button>
          )}
        </div>
      )}
    </div>
  );
}