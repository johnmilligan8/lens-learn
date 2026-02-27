import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, AlertTriangle, Calculator, Briefcase } from 'lucide-react';

const STEPS = [
  {
    id: 1,
    title: 'Scout & Find Your Field of View',
    icon: '🔭',
    desc: 'Frame your foreground and sky before it gets dark.',
    tips: {
      photographer: 'Use Live View on your camera or the AR Scout in Sky Planner to preview the Milky Way arc over your scene in daylight.',
      smartphone: 'Hold your phone steady and pan the horizon. Use the Star Pointer to locate where the galactic core will rise.',
      experience: 'Scan the horizon and pick a clear southern aspect. Identify landmarks so you can find your spot after dark.',
    },
    safetyNote: null,
    link: null,
  },
  {
    id: 2,
    title: 'Set Up Tripod & Level It',
    icon: '📐',
    desc: 'Stable ground is everything — a shaky tripod means blurry stars.',
    tips: {
      photographer: 'Extend legs to shooting height, spread wide on solid ground. Attach ball head, use bubble level. Hang weight bag if windy.',
      smartphone: 'Use a phone tripod adapter (or gorillapod). Tighten clamp fully. Make sure it won\'t topple.',
      experience: 'Skip the tripod — just find a comfortable, stable chair or blanket. Stable ground still matters for safety.',
    },
    safetyNote: 'Use your red headlamp when setting up in the dark. Check the ground for uneven surfaces before you step back.',
    link: null,
  },
  {
    id: 3,
    title: 'Mount Camera & Compose Frame',
    icon: '🖼️',
    desc: 'Lock in your composition before you lose the light.',
    tips: {
      photographer: 'Attach camera, check composition via Live View. Place foreground on lower third. Remember: you can\'t easily recompose after focusing.',
      smartphone: 'Mount phone, open camera app, preview your frame. Landscape orientation gives more sky. Lock exposure if your app supports it.',
      experience: 'Orient yourself south (toward the galactic core). Pick a comfortable viewing direction and mentally note landmarks.',
    },
    safetyNote: null,
    link: null,
  },
  {
    id: 4,
    title: 'Focus at Infinity',
    icon: '🎯',
    desc: 'Sharp stars are non-negotiable.',
    tips: {
      photographer: 'Switch to Manual focus. Zoom into Live View on a bright star or distant light. Dial focus until the star is a pinpoint. Tape the focus ring in place.',
      smartphone: 'Tap on the brightest star or distant horizon in your camera app. Use MF assist if your app has it. Don\'t touch the phone until you\'re done shooting.',
      experience: 'No focus needed — just enjoy the view! Skip to the next step.',
    },
    safetyNote: null,
    link: null,
  },
  {
    id: 5,
    title: 'Set Camera Settings & Hook Up Accessories',
    icon: '⚙️',
    desc: 'Dial in your exposure. Hook up your intervalometer.',
    tips: {
      photographer: 'ISO 3200–6400 · Aperture f/2.8 or wider · Shutter from the Calculator. Disable long exposure NR. Connect intervalometer. Attach dew heater if temp is dropping.',
      smartphone: 'Enable Night Mode. Use the longest exposure your app allows (Pro mode). ISO 1600–3200. Mount on tripod and use self-timer (2–10s) to avoid shake.',
      experience: 'No settings needed. Just let your eyes dark-adapt fully — 20–30 minutes. Avoid any white lights.',
    },
    safetyNote: null,
    link: { label: 'Open Exposure Calculator', tab: 'camera' },
  },
  {
    id: 6,
    title: 'Start Photographing (or Viewing)',
    icon: '📸',
    desc: 'Build your shot step by step.',
    tips: {
      photographer: 'Single frame first — review histogram. Then start interval sequence. For panoramas, overlap 30% between frames. Shoot RAW.',
      smartphone: 'Trigger with self-timer or volume button. Night Mode will handle multi-second exposure automatically. Stay still.',
      experience: 'Observe methodically — start with naked eye, move to binoculars, then scope if you have one. Give each object 5–10 minutes.',
    },
    safetyNote: 'Keep your red headlamp close. Stay aware of your surroundings — don\'t wander away from your setup in full dark.',
    link: { label: 'Open Gear Checklist', tab: 'gear' },
  },
  {
    id: 7,
    title: 'Review, Stack & Wrap Up',
    icon: '🌟',
    desc: 'End the session strong. Note what worked.',
    tips: {
      photographer: 'Chimp your final frames. Note any focus drift or star trails. Back home: stack in Sequator/Starry Landscape Stacker, then process in Lightroom.',
      smartphone: 'Review your shots in-camera. Most phones auto-process Night Mode — compare with and without. Share your best to the Explorer Gallery!',
      experience: 'Log what you saw — planets, satellites, shooting stars. Note sky quality and any surprises. Share in the community gallery.',
    },
    safetyNote: null,
    link: null,
  },
];

export default function GuidedWalkthrough({ mode, onTabChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const step = STEPS[currentStep];
  const tip = step.tips[mode] || step.tips.photographer;
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  const markComplete = () => {
    setCompleted(prev => new Set([...prev, step.id]));
    if (!isLast) setCurrentStep(prev => prev + 1);
  };

  const progress = Math.round((completed.size / STEPS.length) * 100);

  return (
    <div className="mb-5 rounded-2xl border border-red-900/30 bg-[#0f0a00]/70 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs font-black uppercase tracking-widest">Guided Walkthrough</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-slate-500 text-xs">{completed.size}/{STEPS.length} steps</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-slate-500 text-xs">{collapsed ? '▼' : '▲'}</span>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          {/* Step dots */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
            {STEPS.map((s, i) => {
              const done = completed.has(s.id);
              const active = i === currentStep;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  className={`flex-shrink-0 flex items-center justify-center rounded-full transition-all ${
                    done ? 'w-6 h-6 bg-emerald-600' :
                    active ? 'w-6 h-6 bg-red-600 ring-2 ring-red-400/50' :
                    'w-5 h-5 bg-slate-800 border border-slate-700'
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
          </div>

          {/* Active step card */}
          <div className="rounded-xl bg-[#1a0a00]/60 border border-red-900/20 p-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl leading-none flex-shrink-0">{step.icon}</span>
              <div>
                <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-0.5">Step {step.id} of {STEPS.length}</p>
                <h3 className="text-white font-bold text-sm leading-snug">{step.title}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{step.desc}</p>
              </div>
            </div>

            {/* Mode-aware tip */}
            <div className="bg-black/30 rounded-lg px-3 py-2 mb-3 border-l-2 border-red-700/60">
              <p className="text-[10px] text-red-400 font-bold uppercase mb-1">
                {mode === 'photographer' ? '📷 DSLR/Mirrorless' : mode === 'smartphone' ? '📱 Phone' : '👁 Sky Watching'}
              </p>
              <p className="text-slate-300 text-xs leading-relaxed">{tip}</p>
            </div>

            {/* Safety note */}
            {step.safetyNote && (
              <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs leading-relaxed">{step.safetyNote}</p>
              </div>
            )}

            {/* Tool link */}
            {step.link && step.link.tab && (
              <button
                onClick={() => onTabChange && onTabChange(step.link.tab)}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 mb-3 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                {step.link.label}
              </button>
            )}
          </div>

          {/* Nav buttons */}
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

            <Button
              size="sm"
              onClick={markComplete}
              className={`gap-1 text-xs font-bold ${isLast ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {completed.has(step.id)
                ? isLast ? '🌟 Done!' : 'Next Step'
                : isLast ? '✓ Complete Session' : 'Mark & Continue'
              }
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}