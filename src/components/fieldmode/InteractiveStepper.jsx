import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle, Calculator, Star, Camera } from 'lucide-react';

const STEPS = {
  photographer: [
    {
      id: 1,
      title: 'Scout & Find Your Field of View',
      icon: '🔭',
      desc: 'Frame foreground + sky before it gets dark. Scout in daylight or Blue Hour.',
      tips: 'Use Live View or AR Scout in Sky Planner to preview the Milky Way arc over your scene. Do this before sunset.',
      safetyNote: 'Do this in daylight or Blue Hour. Note trip hazards and unstable ground before you lose the light.',
    },
    {
      id: 2,
      title: 'Set Up Tripod & Level It',
      icon: '📐',
      desc: 'A shaky tripod means blurry stars. Stable ground is everything.',
      tips: 'Spread legs wide on solid ground. Attach ball head. Use bubble level. Hang camera bag as counterweight if windy.',
      safetyNote: 'Use your red headlamp when setting up. Check ground for uneven surfaces.',
    },
    {
      id: 3,
      title: 'Mount Camera & Compose Frame',
      icon: '🖼️',
      desc: 'Lock in your composition. You can\'t recompose after focusing in the dark.',
      tips: 'Attach camera, check composition via Live View. Place foreground on lower third, core in upper portion.',
      safetyNote: null,
    },
    {
      id: 4,
      title: 'Focus at Infinity',
      icon: '🎯',
      desc: 'Sharp stars are non-negotiable. Take a test shot before committing.',
      tips: 'Switch to Manual focus. Zoom Live View 10× on brightest star. Dial focus until it\'s a pinpoint. Tape focus ring.',
      safetyNote: null,
    },
    {
      id: 5,
      title: 'Set Camera Settings',
      icon: '⚙️',
      desc: 'Dial in exposure before total dark. Hook up intervalometer and dew heater.',
      tips: 'ISO 3200–6400, f/2.8 or wider. Use Calculator for shutter speed. Disable noise reduction. Connect intervalometer.',
      safetyNote: 'Battery check before settling in. Cold cuts battery life by 50%+.',
    },
    {
      id: 6,
      title: 'Start Shooting',
      icon: '📸',
      desc: 'Build your shot, one frame at a time.',
      tips: 'Take one test frame. Review histogram — expose to the right. Start interval sequence. Shoot RAW.',
      safetyNote: 'Keep red headlamp close. Stay aware of surroundings.',
      shootModes: true,
    },
    {
      id: 7,
      title: 'Review & Wrap Up',
      icon: '🌟',
      desc: 'End the session strong. Note what worked for next time.',
      tips: 'Chimp final frames. Pack up in reverse order. Back home: stack and process in Lightroom.',
      safetyNote: null,
    },
  ],
  smartphone: [
    {
      id: 1,
      title: 'Scout Your Location',
      icon: '🔭',
      desc: 'Find a clear spot with minimal light pollution.',
      tips: 'Use Star Pointer to see where the galactic core will rise. Scout before dark.',
      safetyNote: 'Find your spot in daylight.',
    },
    {
      id: 2,
      title: 'Set Up Phone Tripod',
      icon: '📱',
      desc: 'Phone needs to be rock-solid for long exposures.',
      tips: 'Use phone tripod adapter or gorillapod. Tighten clamp fully. Avoid soft ground.',
      safetyNote: 'Check it won\'t topple if bumped.',
    },
    {
      id: 3,
      title: 'Mount & Frame',
      icon: '🎬',
      desc: 'Landscape orientation. Lock exposure if your app supports it.',
      tips: 'Open camera app, preview frame. Off-center composition works better than dead-center.',
      safetyNote: null,
    },
    {
      id: 4,
      title: 'Enable Pro Mode',
      icon: '⚙️',
      desc: 'Manual control gives best results for night sky.',
      tips: 'Enable Night Mode or Pro mode. ISO 1600–3200. Use longest exposure your app allows.',
      safetyNote: 'Mount firmly. Use 2–10s self-timer to let vibration settle.',
    },
    {
      id: 5,
      title: 'Start Shooting',
      icon: '📸',
      desc: 'Trigger carefully and stay perfectly still.',
      tips: 'Use self-timer or volume button. Stay perfectly still — even breathing blurs. Review before series.',
      safetyNote: 'Don\'t wander from setup in full dark.',
      shootModes: true,
    },
    {
      id: 6,
      title: 'Wrap Up & Share',
      icon: '🌟',
      desc: 'Review shots and share your best work.',
      tips: 'Most phones auto-stack Night Mode. Export full-res. Share to Explorer Gallery!',
      safetyNote: null,
    },
  ],
  experience: [
    {
      id: 1,
      title: 'Find Your Viewing Spot',
      icon: '👁',
      desc: 'Clear southern sky for Milky Way, northern for aurora.',
      tips: 'Note any obstacles. Find a comfortable spot. Mark your location mentally.',
      safetyNote: 'Scout in daylight if possible.',
    },
    {
      id: 2,
      title: 'Dark Adapt (20–30 mins)',
      icon: '🌙',
      desc: 'Eyes need time to see faint objects. No screens.',
      tips: 'Lie back comfortably. Avoid white lights entirely. Cold nights? Bring a blanket.',
      safetyNote: 'Avoid any bright lights during adaptation.',
    },
    {
      id: 3,
      title: 'Start Observing',
      icon: '✨',
      desc: 'Begin with naked eye, then binoculars or telescope.',
      tips: 'Spend 5–10 minutes per object. Let your eye pick up detail. Use averted vision for faint nebulae.',
      safetyNote: 'Keep aware of surroundings. Don\'t wander alone.',
    },
    {
      id: 4,
      title: 'Log Your Session',
      icon: '📝',
      desc: 'Record what you observed for future reference.',
      tips: 'Note sky quality (Bortle estimate), objects, anything surprising. What would you do differently next time?',
      safetyNote: null,
    },
  ],
};

export default function InteractiveStepper({ mode, isSubscribed, onTabChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);
  const [shootMode, setShootMode] = useState('milkyway');

  const steps = STEPS[mode] || STEPS.photographer;
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const hasShootModes = step.shootModes;

  const markComplete = () => {
    setCompleted(prev => new Set([...prev, step.id]));
    if (!isLast) setCurrentStep(prev => prev + 1);
  };

  const progress = Math.round((completed.size / steps.length) * 100);

  if (!isSubscribed) return null;

  return (
    <div className="mb-5 rounded-2xl border border-red-900/30 bg-[#0f0a00]/70 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs font-black uppercase tracking-widest">Guided Walkthrough</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-slate-500 text-xs">{completed.size}/{steps.length} steps</span>
        </div>
        <div className="flex items-center gap-3">
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
            {steps.map((s, i) => {
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
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>

          {/* Active Step Card */}
          <div className="rounded-xl bg-[#1a0a00]/60 border border-red-900/20 p-4 space-y-3">
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
              <p className="text-slate-300 text-xs leading-relaxed">{step.tips}</p>
            </div>

            {/* Shoot Mode Toggle (if applicable) */}
            {hasShootModes && (
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
                    ? '⭐ Pinpoint Stars: Short exposures — use 500 Rule or NPF Rule. Single frames or stacked sequences (10–30+ shots).'
                    : '🌀 Star Trails: 30s–5min exposures on intervalometer or one long Bulb. 45–90 min = dramatic full arcs. Stack in Startrails.net or Sequator.'
                  }
                </div>
              </div>
            )}

            {/* Safety Note */}
            {step.safetyNote && (
              <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs leading-relaxed">{step.safetyNote}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
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

            <div className="text-[10px] text-slate-600 italic">One step at a time</div>

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