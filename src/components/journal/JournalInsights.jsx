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
  const recent = sessions.slice(0, 5);

  const outcomeCount = { nailed: 0, okay: 0, failed: 0, cancelled: 0 };
  const limiterCount = {};
  const modeCount = {};
  const eventCount = {};

  complete.forEach(s => {
    if (s.outcome) outcomeCount[s.outcome] = (outcomeCount[s.outcome] || 0) + 1;
    if (s.limiting_factor) limiterCount[s.limiting_factor] = (limiterCount[s.limiting_factor] || 0) + 1;
    if (s.shooter_mode) modeCount[s.shooter_mode] = (modeCount[s.shooter_mode] || 0) + 1;
    if (s.event_type) eventCount[s.event_type] = (eventCount[s.event_type] || 0) + 1;
  });

  const successRate = complete.length ? Math.round((outcomeCount.nailed / complete.length) * 100) : 0;
  const topLimiter = Object.entries(limiterCount).sort((a, b) => b[1] - a[1])[0];
  const topMode = Object.entries(modeCount).sort((a, b) => b[1] - a[1])[0];
  const topEvent = Object.entries(eventCount).sort((a, b) => b[1] - a[1])[0];

  const insights = [];

  // Success trajectory
  const recentSuccess = recent.filter(s => s.outcome === 'nailed').length;
  if (successRate >= 70) {
    insights.push({ icon: '🎯', text: `${successRate}% success rate — excellent consistency! Keep this momentum.` });
  } else if (successRate >= 50 && recentSuccess >= 2) {
    insights.push({ icon: '📈', text: `${successRate}% overall, but trending up. Your recent sessions are stronger.` });
  } else if (successRate <= 30 && complete.length >= 3) {
    insights.push({ icon: '🔄', text: `${successRate}% success rate. Analyze your failed sessions — what's repeating?` });
  }

  // Limiting factor patterns
  if (topLimiter && topLimiter[1] >= 2) {
    insights.push({ icon: '⚠️', text: `"${LIMITING_LABELS[topLimiter[0]] || topLimiter[0]}" blocked ${topLimiter[1]} sessions. Plan around this next time.` });
  }

  // Mode-specific trends
  if (topMode) {
    const modeName = { photographer: 'Camera', smartphone: 'Phone', experience: 'Sky Watching' }[topMode[0]] || topMode[0];
    insights.push({ icon: '📊', text: `You mostly shoot ${modeName.toLowerCase()} (${topMode[1]} sessions). Double-check settings for this mode.` });
  }

  // Event preferences
  if (topEvent && topEvent[1] >= 2) {
    insights.push({ icon: '🌌', text: `${topEvent[0]} is your focus (${topEvent[1]}× sessions). You're building expertise here.` });
  }

  // Moon & cloud patterns
  if (limiterCount.moon >= 2) {
    insights.push({ icon: '🌕', text: 'Moon interference is recurring. Use Sky Planner\'s new moon phase filter to avoid clashes.' });
  }
  if (limiterCount.clouds >= 2) {
    insights.push({ icon: '☁️', text: 'Clouds keep blocking you. Improve location scouting or book during forecast clear windows.' });
  }

  // Growth milestones
  if (complete.length >= 10 && outcomeCount.nailed >= 7) {
    insights.push({ icon: '🌟', text: 'Impressive! 10+ sessions logged, 70%+ success. Request instructor feedback on a tough session.' });
  } else if (complete.length >= 5) {
    insights.push({ icon: '📈', text: 'Strong progression. You\'ve found repeatable patterns — now optimize around them.' });
  }

  if (!insights.length) insights.push({ icon: '📓', text: 'Keep logging. As patterns emerge, detailed insights will help you plan better expeditions.' });

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