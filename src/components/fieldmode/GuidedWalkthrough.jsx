import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle, Calculator, Briefcase, Star, Camera } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Scout & Find Your Field of View',
    icon: '🔭',
    desc: 'Frame foreground + sky before it gets dark. Scout in daylight or Blue Hour — note any hazards.',
    tips: {
      photographer: 'Use Live View or the AR Scout in Sky Planner to preview the Milky Way arc over your scene. Do this before sunset — once it\'s dark, recomposing is hard.',
      smartphone: 'Hold your phone steady and pan the horizon. Use the Star Pointer to see where the galactic core will rise. Scout your spot before dark.',
      experience: 'Find a clear southern aspect for the Milky Way or a northern horizon for aurora. Note any obstacles. Scout in daylight; mark your spot.',
    },
    safetyNote: 'Do this in daylight or Blue Hour. Note trip hazards, drop-offs, and unstable ground before you lose the light.',
    link: null,
  },
  {
    id: 2,
    title: 'Set Up Tripod & Level It',
    icon: '📐',
    desc: 'A shaky tripod means blurry stars. Stable ground is everything.',
    tips: {
      photographer: 'Spread legs wide on solid ground, extend to shooting height. Attach ball head. Use bubble level or phone tilt app. Hang your camera bag as a counterweight if windy.',
      smartphone: 'Use a phone tripod adapter or gorillapod. Tighten clamp fully. Check it won\'t topple if bumped. Avoid soft ground — legs sink over a long session.',
      experience: 'Skip the tripod — just find a stable chair, mat, or reclining position. Comfortable = longer, better session. Still check for safe ground.',
    },
    safetyNote: 'Use your red headlamp when setting up in the dark. Check the ground for uneven surfaces before stepping back from your setup.',
    link: null,
  },
  {
    id: 3,
    title: 'Mount Camera & Compose Frame',
    icon: '🖼️',
    desc: 'Lock in your composition. You can\'t easily recompose after focusing in the dark.',
    tips: {
      photographer: 'Attach camera, check composition via Live View. Place foreground on lower third, core or trail arc in upper portion. Zoom Live View 5–10× to a horizon edge to check tilt.',
      smartphone: 'Mount phone, open camera app, preview your frame. Landscape orientation gives more sky. Lock exposure if your app supports it. Off-center composition > dead-center.',
      experience: 'Orient toward your target — south for Milky Way, north for aurora. Pick a comfortable, stable viewing direction. Mentally note landmarks for finding objects.',
    },
    safetyNote: null,
    link: null,
  },
  {
    id: 4,
    title: 'Focus at Infinity',
    icon: '🎯',
    desc: 'Sharp stars are non-negotiable. Take a test shot before committing.',
    tips: {
      photographer: 'Switch to Manual focus. Zoom Live View to 10× on the brightest star or a distant light. Slowly dial focus until the star is a pinpoint — then tape the focus ring in place. Take one test frame and pixel-peep.',
      smartphone: 'Tap on the brightest star or distant horizon in your camera app. Use manual focus assist if your app has it (e.g., Halide, ProCamera). Don\'t touch the phone until you\'re done shooting.',
      experience: 'No focus needed — just relax and let your eyes adapt. Skip to the next step.',
    },
    safetyNote: null,
    link: null,
  },
  {
    id: 5,
    title: 'Set Camera Settings & Accessories',
    icon: '⚙️',
    desc: 'Dial in your exposure before total dark. Hook up intervalometer and dew heater.',
    tips: {
      photographer: 'ISO 3200–6400 (lower for bright moon or Bortle 1–3). Aperture: f/2.8 or wider. Shutter: use the Calculator for your focal length. Disable in-camera noise reduction (long exposure NR). Connect intervalometer. Attach dew heater if temp is dropping — dew ruins a session fast.',
      smartphone: 'Enable Night Mode or Pro mode. ISO 1600–3200. Set the longest exposure your app allows. Mount firmly, set a 2–10s self-timer to let vibration settle before the shutter fires.',
      experience: 'No settings needed. Let your eyes dark-adapt fully — 20–30 minutes. Avoid any white lights. Battery check: cold nights drain batteries fast.',
    },
    safetyNote: 'Battery check before you settle in. Cold nights can cut battery life by 50%+. Spare batteries in an inner pocket (body heat keeps them warm).',
    link: { label: 'Open Exposure Calculator', tab: 'camera' },
  },
  {
    id: 6,
    title: 'Start Shooting (or Viewing)',
    icon: '📸',
    desc: 'One step at a time — build your shot.',
    tips: {
      photographer: 'Take one test frame. Review histogram — protect highlights, expose to the right. Then start interval sequence. For panoramas, overlap 30% between frames. Shoot RAW for maximum latitude in post.',
      smartphone: 'Trigger with self-timer or volume button. Night Mode handles multi-second exposure automatically. Stay perfectly still — even breathing can blur. Review your shot before shooting a series.',
      experience: 'Observe methodically — start with naked eye, then binoculars, then telescope. Give each object 5–10 minutes for your eye to pick up detail. Log what you see.',
    },
    safetyNote: 'Keep your red headlamp close. Stay aware of surroundings — don\'t wander from your setup in full dark.',
    shootModeNote: {
      milkyway: 'Pinpoint Stars (Milky Way): Use short exposures to freeze the stars — no trails. Apply the 500 Rule or NPF Rule to find your max shutter speed for your focal length. Single frames or stacked sequences.',
      startrails: 'Star Trails (Intentional Streaks): Use 30s–5min exposures on intervalometer, or a single very long exposure (Bulb mode). The longer the total shoot time, the longer the trails. 45–90 min = dramatic full arcs. Stack in Startrails.net or Sequator.',
    },
    link: { label: 'Open Gear Checklist', tab: 'gear' },
  },
  {
    id: 7,
    title: 'Review, Stack & Wrap Up',
    icon: '🌟',
    desc: 'End the session strong. Note what worked — you\'ll shoot better next time.',
    tips: {
      photographer: 'Chimp final frames: check focus, histogram, composition. Pack up in reverse order — lens cap on first. Back home: stack in Sequator or Starry Landscape Stacker for noise reduction, then process in Lightroom. For foreground color: shoot a separate longer exposure at ISO 800–1600 and blend in post.',
      smartphone: 'Review your shots in-camera. Most phones auto-stack Night Mode — compare with and without. Export full-res before sharing. Share your best to the Explorer Gallery!',
      experience: 'Log what you observed — planets, satellites, shooting stars, ISS passes. Note sky quality (Bortle estimate), any surprises, and what you\'d do differently. Share in the community gallery.',
    },
    safetyNote: null,
    link: null,
  },
];

export default function GuidedWalkthrough({ mode, onTabChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [shootMode, setShootMode] = useState('milkyway'); // 'milkyway' | 'startrails'

  const step = STEPS[currentStep];
  const tip = step.tips[mode] || step.tips.photographer;
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;
  const isShootStep = step.id === 6;

  const markComplete = () => {
    setCompleted(prev => new Set([...prev, step.id]));
    if (!isLast) setCurrentStep(prev => prev + 1);
  };

  const progress = Math.round((completed.size / STEPS.length) * 100);

  return (
    <div className="mb-5 rounded-2xl border border-red-900/30 bg-[#0f0a00]/70 overflow-hidden">
      {/* Header / collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs font-black uppercase tracking-widest">Guided Walkthrough</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-slate-500 text-xs">{completed.size}/{STEPS.length} steps</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-slate-500 text-[10px] font-mono">{progress}%</span>
          <span className="text-slate-500 text-xs">{collapsed ? '▼' : '▲'}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
            {STEPS.map((s, i) => {
              const done = completed.has(s.id);
              const active = i === currentStep;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  className={`flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                    done ? 'w-7 h-7 bg-emerald-600 shadow-lg shadow-emerald-900/40' :
                    active ? 'w-7 h-7 bg-red-600 ring-2 ring-red-400/50 shadow-lg shadow-red-900/40' :
                    'w-6 h-6 bg-slate-800 border border-slate-700'
                  }`}
                  title={s.title}
                >
                  {done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    : <span className="text-white text-[9px] font-bold">{s.id}</span>
                  }
                </button>
              );
            })}
            <div className="ml-auto flex-shrink-0 text-[10px] text-slate-600 whitespace-nowrap">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>

          {/* Active step card */}
          <div className="rounded-xl bg-[#1a0a00]/60 border border-red-900/20 p-4 space-y-3">
            {/* Step header */}
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none flex-shrink-0">{step.icon}</span>
              <div>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-0.5">Step {step.id} — {step.title}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{step.desc}</p>
              </div>
            </div>

            {/* Mode-aware tip */}
            <div className="bg-black/30 rounded-lg px-3 py-2.5 border-l-2 border-red-700/60">
              <p className="text-[10px] text-red-400 font-bold uppercase mb-1.5">
                {mode === 'photographer' ? '📷 DSLR / Mirrorless' : mode === 'smartphone' ? '📱 Phone' : '👁 Sky Watching'}
              </p>
              <p className="text-slate-300 text-xs leading-relaxed">{tip}</p>
            </div>

            {/* Shoot mode toggle + notes (step 6 only) */}
            {isShootStep && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Shoot Mode</p>
                  <div className="flex gap-1 bg-slate-900/80 border border-slate-700 rounded-lg p-0.5">
                    <button
                      onClick={() => setShootMode('milkyway')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${shootMode === 'milkyway' ? 'bg-red-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Star className="w-3 h-3" /> Milky Way
                    </button>
                    <button
                      onClick={() => setShootMode('startrails')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${shootMode === 'startrails' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Camera className="w-3 h-3" /> Star Trails
                    </button>
                  </div>
                </div>
                <div className={`rounded-lg px-3 py-2.5 text-xs leading-relaxed border ${shootMode === 'milkyway' ? 'bg-red-900/20 border-red-700/30 text-red-200' : 'bg-blue-900/20 border-blue-700/30 text-blue-200'}`}>
                  {shootMode === 'milkyway'
                    ? '⭐ Pinpoint Stars (Milky Way): Short exposures — stars must be points, not streaks. Apply the 500 Rule or NPF Rule for max shutter at your focal length. Single frames or stacked sequences (10–30+ shots).'
                    : '🌀 Star Trails (Intentional Streaks): 30s–5min exposures on an intervalometer, or one very long Bulb exposure. Longer total shoot time = longer arcs. 45–90 min gives dramatic full arcs. Stack all frames in Startrails.net or Sequator — choose "accumulate" mode.'
                  }
                </div>
              </div>
            )}

            {/* Safety note */}
            {step.safetyNote && (
              <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs leading-relaxed">{step.safetyNote}</p>
              </div>
            )}

            {/* Tool link */}
            {step.link?.tab && (
              <button
                onClick={() => onTabChange && onTabChange(step.link.tab)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-semibold"
              >
                <Calculator className="w-3.5 h-3.5" />
                {step.link.label} →
              </button>
            )}
          </div>

          {/* Nav */}
          <div className="flex items-center justify-between mt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={isFirst}
              className="text-slate-500 hover:text-slate-300 gap-1 text-xs"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            <div className="text-[10px] text-slate-600 italic">One step at a time — build your shot</div>

            <Button
              size="sm"
              onClick={markComplete}
              className={`gap-1 text-xs font-bold ${isLast ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {completed.has(step.id)
                ? isLast ? '🌟 Done!' : 'Next Step'
                : isLast ? '✓ Wrap Session' : 'Mark & Continue'
              }
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}