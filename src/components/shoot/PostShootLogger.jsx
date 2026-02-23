import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { CheckCircle, AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import UpgradeNudge from '../upsell/UpgradeNudge';

export default function PostShootLogger({ userEmail, sessionId, onSessionLogged, isSubscribed }) {
  const [expanded, setExpanded] = useState(false);
  const [outcome, setOutcome] = useState('nailed');
  const [limitingFactor, setLimitingFactor] = useState('');
  const [reflection, setReflection] = useState('');
  const [fieldNotes, setFieldNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleLog = async () => {
    if (!sessionId || !userEmail) return;
    setLoading(true);
    try {
      await base44.entities.ShootSession.update(sessionId, {
        outcome,
        limiting_factor: limitingFactor,
        post_shoot_reflection: reflection,
        field_notes: fieldNotes,
        status: 'complete',
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSessionLogged?.();
    } catch (err) {
      console.error('Failed to log shoot:', err);
    }
    setLoading(false);
  };

  if (!expanded) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-4">
        <Button
          onClick={() => setExpanded(true)}
          variant="outline"
          className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-900/20"
        >
          <BarChart3 className="w-4 h-4 mr-2" /> Log Post-Shoot Results
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Post-Shoot Analysis</h3>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)} className="text-slate-400">✕</Button>
      </div>

      {/* Outcome */}
      <div>
        <label className="text-slate-300 text-sm font-semibold mb-2 block">How did it go?</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'nailed', label: 'Nailed', icon: '🎯', color: 'bg-emerald-900/40 border-emerald-500/50' },
            { value: 'okay', label: 'Okay', icon: '✓', color: 'bg-blue-900/40 border-blue-500/50' },
            { value: 'failed', label: 'Failed', icon: '✗', color: 'bg-red-900/40 border-red-500/50' },
            { value: 'cancelled', label: 'Cancelled', icon: '⊘', color: 'bg-slate-800/40 border-slate-500/50' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setOutcome(opt.value)}
              className={`p-3 rounded-lg border transition-all text-center ${
                outcome === opt.value ? opt.color + ' border-2' : 'border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50'
              }`}
            >
              <span className="text-lg mb-1 block">{opt.icon}</span>
              <span className="text-xs font-semibold text-white">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Limiting Factor */}
      <div>
        <label className="text-slate-300 text-sm font-semibold mb-2 block">What was the biggest limitation?</label>
        <div className="space-y-2">
          {[
            'Weather/Clouds',
            'Light Pollution',
            'Equipment Issue',
            'Planning',
            'Technique',
            'Time',
            'Moon',
            'Location Access',
          ].map(factor => (
            <button
              key={factor}
              onClick={() => setLimitingFactor(factor)}
              className={`w-full text-left p-2.5 rounded border transition-all text-sm ${
                limitingFactor === factor
                  ? 'bg-purple-900/40 border-purple-500 text-white'
                  : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {factor}
            </button>
          ))}
        </div>
      </div>

      {/* Field Notes */}
      <div>
        <label className="text-slate-300 text-sm font-semibold mb-2 block">Field Notes</label>
        <textarea
          value={fieldNotes}
          onChange={e => setFieldNotes(e.target.value)}
          placeholder="What did you see in the field? Atmospheric conditions, foreground details, etc."
          className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 h-20 resize-none"
        />
      </div>

      {/* Post-Shoot Reflection */}
      <div>
        <label className="text-slate-300 text-sm font-semibold mb-2 block">What would you do differently?</label>
        <textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          placeholder="Exposure settings, composition, timing, equipment... what would improve the next shoot?"
          className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 h-20 resize-none"
        />
      </div>

      {saved && (
        <div className="bg-emerald-900/30 border border-emerald-500/50 rounded p-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-300 text-sm">Results logged! Building your learning profile...</p>
        </div>
      )}

      {/* Post-shoot upsell: Pro for insights, or course for basics */}
      {!isSubscribed && saved && (
        <UpgradeNudge
          headline="Improve your results — unlock Pro insights"
          body="Pattern analysis across all your shoots helps you identify what's holding you back. Unlock Pro for $14.99/mo."
          cta="See Pro Plan →"
          tier="pro"
        />
      )}

      <Button
        onClick={handleLog}
        disabled={loading || !outcome}
        className="w-full bg-purple-600 hover:bg-purple-700 h-10 font-bold"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Results'}
      </Button>
    </Card>
  );
}