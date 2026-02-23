import React, { useState } from 'react';
import { X, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const QUESTIONS = {
  photographer: [
    {
      key: 'blue_hour',
      label: 'Include Blue Hour foreground window?',
      options: [
        { value: 'yes', label: '🌇 Yes — include Blue Hour', desc: 'Plan longer exposures with natural ambient light first' },
        { value: 'no', label: '🌌 No — start at full dark', desc: 'Go straight to Milky Way/astro shooting' },
      ]
    },
    {
      key: 'lll',
      label: 'Use Low Level Lighting (LLL) for foreground?',
      options: [
        { value: 'yes', label: '💡 Yes — I have an LED panel', desc: 'Dim constant light during exposure for even illumination' },
        { value: 'no', label: '🌑 No — natural light only', desc: 'Pure ambient or sky glow' },
      ]
    },
    {
      key: 'intent',
      label: 'What\'s your image intent?',
      options: [
        { value: 'sky_first', label: '🌌 Sky-first', desc: 'Maximize sky detail, foreground is secondary' },
        { value: 'balanced', label: '⚖️ Balanced', desc: 'Equal sky and foreground story' },
        { value: 'foreground_first', label: '🏔 Foreground-first', desc: 'Strong subject, sky as backdrop' },
      ]
    },
    {
      key: 'foreground',
      label: 'How much foreground do you want?',
      options: [
        { value: 'minimal', label: 'Minimal', desc: '10–20% of frame' },
        { value: 'moderate', label: 'Moderate', desc: '25–40% of frame' },
        { value: 'dominant', label: 'Dominant', desc: '50%+ — a real subject' },
      ]
    },
    {
      key: 'lighting',
      label: 'Artificial lighting approach?',
      options: [
        { value: 'none', label: 'None', desc: 'Pure natural light only' },
        { value: 'subtle', label: 'Subtle', desc: 'Light painting accent' },
        { value: 'active', label: 'Active', desc: 'Flashlight/speedlight in play' },
      ]
    },
    {
      key: 'people',
      label: 'People or models in scene?',
      options: [
        { value: 'none', label: 'No people', desc: 'Pure landscape' },
        { value: 'silhouette', label: 'Silhouette', desc: 'Shape against the sky' },
        { value: 'featured', label: 'Featured', desc: 'Illuminated, recognizable' },
      ]
    },
  ],
  smartphone: [
    {
      key: 'intent',
      label: 'What do you want to capture?',
      options: [
        { value: 'sky_first', label: '🌌 The sky itself', desc: 'Milky Way, stars, or aurora' },
        { value: 'balanced', label: '⚖️ Sky + a landmark', desc: 'Both sky and a recognizable place' },
        { value: 'foreground_first', label: '🤳 Me in the shot', desc: 'Selfie or silhouette under the stars' },
      ]
    },
    {
      key: 'people',
      label: 'Will you be in the photo?',
      options: [
        { value: 'none', label: 'No', desc: 'Landscape only' },
        { value: 'silhouette', label: 'Silhouette', desc: 'Dark shape against stars' },
        { value: 'featured', label: 'Yes — lit up', desc: 'I want to be visible' },
      ]
    },
  ],
  experience: [
    {
      key: 'intent',
      label: 'What are you hoping to experience?',
      options: [
        { value: 'sky_first', label: '🌌 Full Milky Way', desc: 'The whole band overhead' },
        { value: 'balanced', label: '🌠 Meteors or planets', desc: 'Watching for movement or bright planets' },
        { value: 'foreground_first', label: '🌅 Atmosphere & color', desc: 'Aurora, glow, or twilight events' },
      ]
    },
  ]
};

function buildPlan(answers, event, mode) {
  const { intent, foreground, lighting, people } = answers;

  const compositionHints = {
    sky_first: 'Place your horizon low in the frame — give the sky room to breathe. Position the Galactic Core slightly off-center toward the brightest concentration of stars.',
    balanced: 'Try placing the horizon roughly in the middle third. Let a strong foreground element anchor one side while the core anchors the other.',
    foreground_first: 'Lead with your foreground subject. The sky becomes emotional backdrop — frame it so the stars crown your subject without competing.',
  };

  const foregroundHints = {
    minimal: 'A thin slice of horizon grounds the viewer without stealing attention.',
    moderate: 'Your foreground has a role — make sure it has texture, shape, or meaning.',
    dominant: 'Commit to your foreground. Pre-visualize the scene in daylight. The sky completes the story, it doesn\'t tell it alone.',
  };

  const lightingHints = {
    none: 'Work with ambient star glow only. Longer exposures, wider aperture, and patience.',
    subtle: 'A 2–3 second flashlight sweep can reveal texture without appearing artificial. Practice the motion before your target moment.',
    active: 'Balance ambient and added light carefully. Your foreground exposure may need to be blended in post.',
  };

  const modeHints = {
    smartphone: 'Use Night Mode with your phone on a stable surface or tripod. Avoid touching the phone during exposure. Try the volume-down button as a shutter to reduce shake.',
    photographer: 'Manual mode: aim for 15–25s, f/2.8 or wider, ISO 1600–6400. Check focus via live view zoom.',
    experience: 'Give your eyes 20–30 minutes to dark-adapt. Face away from any lights. Look slightly off-center from your target for faint objects.',
  };

  const blueHourNote = answers.blue_hour === 'yes'
    ? 'Start shooting during Blue Hour (10–30 min after sunset) — ISO 800–1600, 1–4s, f/2.8–4. Use the natural ambient light for your foreground, then transition to full-dark Milky Way settings as the sky darkens.'
    : '';

  const lllNote = answers.lll === 'yes'
    ? 'Include your LLL gear (dim-adjustable LED + warm gel). Set at lowest power, position far back from your subject. Leave on for the full exposure — no painting motion. Use barn doors to prevent sky spill.'
    : '';

  return {
    blue_hour: blueHourNote,
    lll: lllNote,
    composition: compositionHints[intent] || '',
    foreground: foregroundHints[foreground] || '',
    lighting: lightingHints[lighting] || '',
    mode_tip: modeHints[mode] || '',
    risks: event?.viability === 'marginal' ? 'Conditions are marginal tonight. Have a backup plan and monitor clouds up to 30 mins before heading out.' : '',
    people_note: people === 'featured' ? 'For an illuminated person: light them from the side or below at low power. Front-lighting flattens and overpowers.' : people === 'silhouette' ? 'For a silhouette: position them against the brightest part of the sky and keep them completely still during exposure.' : '',
  };
}

export default function GuidedPlanModal({ event, mode, onClose, onSave }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [plan, setPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const questions = QUESTIONS[mode] || QUESTIONS.photographer;

  const handleAnswer = (key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      setPlan(buildPlan(next, event, mode));
    }
  };

  const saveAndClose = async () => {
    setSaving(true);
    await onSave(plan, answers);
    setSaving(false);
    onClose();
  };

  const q = questions[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-white font-bold">Guided Shoot Plan</h3>
            <p className="text-xs text-slate-500">{event?.title} · {event?.window}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {!plan ? (
          <div className="p-5 space-y-4">
            {/* Progress */}
            <div className="flex gap-1.5">
              {questions.map((_, i) => (
                <div key={i} className={`h-1 rounded-full flex-1 transition-all ${i <= step ? 'bg-purple-500' : 'bg-slate-700'}`} />
              ))}
            </div>

            <div>
              <p className="text-white font-semibold text-sm mb-3">{q.label}</p>
              <div className="space-y-2">
                {q.options.map(opt => (
                  <button key={opt.value} onClick={() => handleAnswer(q.key, opt.value)}
                    className="w-full text-left rounded-xl border border-slate-700 bg-slate-800/60 hover:border-purple-500 hover:bg-purple-900/20 px-4 py-3 transition-colors">
                    <p className="text-white text-sm font-medium">{opt.label}</p>
                    <p className="text-slate-500 text-xs">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-emerald-400 text-lg">✓</span>
              <h4 className="text-white font-bold">Your Shoot Plan is Ready</h4>
            </div>

            {[
              { label: plan.blue_hour ? 'Blue Hour Window' : null, value: plan.blue_hour, icon: '🌇' },
              { label: plan.lll ? 'Low Level Lighting' : null, value: plan.lll, icon: '💡' },
              { label: 'Composition', value: plan.composition, icon: '🎯' },
              { label: 'Foreground', value: plan.foreground, icon: '🏔' },
              { label: plan.lighting ? 'Lighting' : null, value: plan.lighting, icon: '🔦' },
              { label: 'Technique', value: plan.mode_tip, icon: '📷' },
              { label: plan.people_note ? 'People' : null, value: plan.people_note, icon: '👤' },
              { label: plan.risks ? 'Risk Note' : null, value: plan.risks, icon: '⚠️' },
            ].filter(s => s.label && s.value).map((s, i) => (
              <div key={i} className="rounded-xl bg-slate-800/60 border border-slate-700 p-3">
                <p className="text-xs text-slate-500 font-semibold mb-1">{s.icon} {s.label}</p>
                <p className="text-slate-200 text-sm leading-relaxed">{s.value}</p>
              </div>
            ))}

            <Button onClick={saveAndClose} disabled={saving} className="w-full bg-purple-600 hover:bg-purple-700 font-bold">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <>Save Plan & Head Out 🚀</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}