import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Check, X, Loader2 } from 'lucide-react';

const OUTCOME_OPTS = [
  { value: 'nailed', label: '🎯 Nailed', color: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300' },
  { value: 'okay', label: '✓ Okay', color: 'bg-blue-900/40 border-blue-700/50 text-blue-300' },
  { value: 'failed', label: '✗ Failed', color: 'bg-red-900/40 border-red-700/50 text-red-300' },
  { value: 'cancelled', label: '⊘ Cancelled', color: 'bg-slate-800 border-slate-700 text-slate-400' },
];

const LIMITING_OPTS = [
  { value: 'clouds', label: 'Clouds / Weather' },
  { value: 'haze', label: 'Haze / Smoke' },
  { value: 'moon', label: 'Moon Interference' },
  { value: 'focus', label: 'Focus Issues' },
  { value: 'noise', label: 'Noise / ISO' },
  { value: 'timing', label: 'Timing' },
  { value: 'wind', label: 'Wind / Stability' },
  { value: 'other', label: 'Other' },
];

const MODES = [
  { value: 'photographer', label: '📷 DSLR/Mirrorless' },
  { value: 'smartphone', label: '📱 Phone' },
  { value: 'experience', label: '👁 Sky Watching' },
];

export default function NewSessionForm({ userEmail, shooterMode, onSaved, onCancel }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    location: '',
    event_type: '',
    shooter_mode: shooterMode || 'photographer',
    pre_shoot_intent: '',
    field_notes: '',
    post_shoot_reflection: '',
    outcome: '',
    limiting_factor: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!form.date) return;
    setSaving(true);
    const data = { ...form, user_email: userEmail, status: 'complete' };
    await base44.entities.ShootSession.create(data);
    setSaving(false);
    onSaved?.();
  };

  const modeLabel = MODES.find(m => m.value === form.shooter_mode)?.label || '';

  return (
    <div className="rounded-2xl border border-red-900/30 bg-[#0f0500]/70 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-red-400 text-xs font-black uppercase tracking-widest">Log New Expedition</p>
        <button onClick={onCancel} className="text-slate-600 hover:text-slate-400 text-sm"><X className="w-4 h-4" /></button>
      </div>

      {/* Date + Location */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-700"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder="e.g. Arches NP, Utah"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-700"
          />
        </div>
      </div>

      {/* Event type + Mode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Event / Target</label>
          <input
            type="text"
            value={form.event_type}
            onChange={e => set('event_type', e.target.value)}
            placeholder="e.g. Milky Way, Aurora"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-700"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Mode</label>
          <select
            value={form.shooter_mode}
            onChange={e => set('shooter_mode', e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-red-700"
          >
            {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Pre-shoot intent */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Pre-Shoot Intent</label>
        <textarea
          value={form.pre_shoot_intent}
          onChange={e => set('pre_shoot_intent', e.target.value)}
          placeholder="What did you plan to capture? What conditions were you hoping for?"
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-700 resize-none"
        />
      </div>

      {/* Field notes */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
          {form.shooter_mode === 'experience' ? 'What I Saw' : 'Field Notes'}
        </label>
        <textarea
          value={form.field_notes}
          onChange={e => set('field_notes', e.target.value)}
          placeholder={
            form.shooter_mode === 'photographer'
              ? 'Conditions, settings used, stacking notes, foreground details...'
              : form.shooter_mode === 'smartphone'
              ? 'Night Mode results, stability, what worked or didn\'t...'
              : 'Objects observed, sky quality, satellites, shooting stars seen...'
          }
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-700 resize-none"
        />
      </div>

      {/* Post-shoot reflection */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Post-Shoot Reflection</label>
        <textarea
          value={form.post_shoot_reflection}
          onChange={e => set('post_shoot_reflection', e.target.value)}
          placeholder="What went well? What would you improve next time?"
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-700 resize-none"
        />
      </div>

      {/* Outcome */}
      <div>
        <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Outcome</label>
        <div className="grid grid-cols-4 gap-1.5">
          {OUTCOME_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => set('outcome', o.value)}
              className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                form.outcome === o.value ? o.color + ' border-2' : 'border border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Limiting factor */}
      {(form.outcome === 'failed' || form.outcome === 'okay') && (
        <div>
          <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Limiting Factor</label>
          <div className="flex flex-wrap gap-1.5">
            {LIMITING_OPTS.map(l => (
              <button
                key={l.value}
                onClick={() => set('limiting_factor', form.limiting_factor === l.value ? '' : l.value)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all ${
                  form.limiting_factor === l.value
                    ? 'bg-yellow-900/40 border-yellow-700/60 text-yellow-300'
                    : 'border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || !form.date}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-2"
      >
        {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><Check className="w-3.5 h-3.5" /> Save Expedition</>}
      </Button>
    </div>
  );
}