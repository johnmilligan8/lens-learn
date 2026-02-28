import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Share2 } from 'lucide-react';

const OUTCOME_ICONS = { nailed: '🎯', okay: '✓', failed: '✗', cancelled: '⊘' };
const MODE_LABELS = { photographer: '📷 DSLR', smartphone: '📱 Phone', experience: '👁 Sky' };

export default function ExportJournal({ sessions }) {
  const [exporting, setExporting] = useState(false);

  const exportAllSessions = () => {
    if (!sessions.length) return;
    setExporting(true);

    const lines = [
      'UNCHARTED SKY COMPANION — Expedition Journal',
      '==========================================',
      `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
      `Total Sessions: ${sessions.length}`,
      '',
    ];

    // Summary stats
    const completed = sessions.filter(s => s.outcome);
    const succeeded = completed.filter(s => s.outcome === 'nailed').length;
    const successRate = completed.length ? Math.round((succeeded / completed.length) * 100) : 0;

    lines.push('SUMMARY STATS');
    lines.push('=============');
    lines.push(`Sessions Logged: ${sessions.length}`);
    lines.push(`Sessions Completed: ${completed.length}`);
    lines.push(`Success Rate: ${successRate}%`);
    lines.push('');

    // Detailed sessions
    lines.push('DETAILED SESSION LOG');
    lines.push('===================');
    lines.push('');

    sessions.forEach((s, idx) => {
      lines.push(`[${idx + 1}] ${s.location || 'Unnamed'} — ${s.date || 'Date TBD'}`);
      lines.push(`    Mode: ${MODE_LABELS[s.shooter_mode] || s.shooter_mode || 'Unknown'}`);
      lines.push(`    Event: ${s.event_type || 'General'}`);
      lines.push(`    Outcome: ${s.outcome ? OUTCOME_ICONS[s.outcome] + ' ' + s.outcome : 'Not recorded'}`);
      if (s.limiting_factor) lines.push(`    Limiting Factor: ${s.limiting_factor}`);
      if (s.pre_shoot_intent) lines.push(`    Intent: ${s.pre_shoot_intent}`);
      if (s.field_notes) lines.push(`    Field Notes: ${s.field_notes}`);
      if (s.post_shoot_reflection) lines.push(`    Reflection: ${s.post_shoot_reflection}`);
      lines.push('');
    });

    lines.push('==========================================');
    lines.push('Exported from Uncharted Sky Companion');
    lines.push('www.uncharted.net/galaxy');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expedition-journal-${new Date().getTime()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const exportJSON = () => {
    if (!sessions.length) return;
    setExporting(true);

    const data = {
      app: 'Uncharted Sky Companion',
      exported_at: new Date().toISOString(),
      total_sessions: sessions.length,
      sessions: sessions.map(s => ({
        date: s.date,
        location: s.location,
        event_type: s.event_type,
        shooter_mode: s.shooter_mode,
        outcome: s.outcome,
        limiting_factor: s.limiting_factor,
        pre_shoot_intent: s.pre_shoot_intent,
        field_notes: s.field_notes,
        post_shoot_reflection: s.post_shoot_reflection,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expedition-journal-${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  if (!sessions.length) return null;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={exportAllSessions}
        disabled={exporting}
        className="border-slate-700 text-slate-400 hover:text-white text-xs gap-1.5 flex-1"
      >
        <FileText className="w-3.5 h-3.5" /> Export TXT
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={exportJSON}
        disabled={exporting}
        className="border-slate-700 text-slate-400 hover:text-white text-xs gap-1.5 flex-1"
      >
        <Download className="w-3.5 h-3.5" /> Export JSON
      </Button>
    </div>
  );
}