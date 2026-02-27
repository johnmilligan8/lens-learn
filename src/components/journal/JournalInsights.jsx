import React from 'react';
import { TrendingUp, AlertTriangle, Sparkles } from 'lucide-react';

const LIMITING_LABELS = {
  clouds: 'Clouds / Weather',
  haze: 'Haze / Smoke',
  moon: 'Moon Interference',
  focus: 'Focus Issues',
  noise: 'Noise / ISO',
  timing: 'Timing',
  wind: 'Wind / Stability',
  other: 'Other',
};

export default function JournalInsights({ sessions }) {
  if (!sessions || sessions.length < 2) return null;

  const complete = sessions.filter(s => s.outcome);

  const outcomeCount = { nailed: 0, okay: 0, failed: 0, cancelled: 0 };
  const limiterCount = {};
  complete.forEach(s => {
    if (s.outcome) outcomeCount[s.outcome] = (outcomeCount[s.outcome] || 0) + 1;
    if (s.limiting_factor) limiterCount[s.limiting_factor] = (limiterCount[s.limiting_factor] || 0) + 1;
  });

  const successRate = complete.length
    ? Math.round((outcomeCount.nailed / complete.length) * 100)
    : 0;

  const topLimiter = Object.entries(limiterCount).sort((a, b) => b[1] - a[1])[0];

  const insights = [];

  if (successRate >= 70) insights.push({ icon: '🎯', text: `You nail ${successRate}% of your sessions — strong consistency!` });
  else if (successRate <= 30 && complete.length >= 3) insights.push({ icon: '📈', text: `${successRate}% success rate — but every failed session teaches you something. Keep logging.` });

  if (topLimiter && topLimiter[1] >= 2) {
    insights.push({ icon: '⚠️', text: `Your top limiter is "${LIMITING_LABELS[topLimiter[0]] || topLimiter[0]}" (${topLimiter[1]}× sessions). Plan around it next time.` });
  }

  if (outcomeCount.moon >= 2) {
    insights.push({ icon: '🌕', text: 'Moon interference shows up often. Try scheduling around new moon windows in the Sky Planner.' });
  }

  if (outcomeCount.clouds >= 2) {
    insights.push({ icon: '☁️', text: 'Clouds are a recurring obstacle. Check 3-day cloud cover forecasts before committing to a session.' });
  }

  if (complete.length >= 5 && outcomeCount.nailed >= 3) {
    insights.push({ icon: '🌟', text: 'You\'re building a strong track record. Patterns in your best sessions can guide your next expedition.' });
  }

  if (!insights.length) insights.push({ icon: '📓', text: 'Keep logging sessions — patterns and insights will appear as your journal grows.' });

  return (
    <div className="rounded-2xl border border-red-900/30 bg-[#0f0500]/60 p-4 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-red-400" />
        <p className="text-red-400 text-xs font-black uppercase tracking-widest">Patterns & Insights</p>
      </div>

      <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
        {[
          { label: 'Sessions', value: sessions.length },
          { label: 'Nailed', value: outcomeCount.nailed },
          { label: 'Success %', value: `${successRate}%` },
        ].map(s => (
          <div key={s.label} className="flex-shrink-0 text-center bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2">
            <p className="text-white font-black text-lg">{s.value}</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-2 bg-black/20 rounded-lg px-3 py-2">
            <span className="text-sm flex-shrink-0">{ins.icon}</span>
            <p className="text-slate-300 text-xs leading-relaxed">{ins.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}