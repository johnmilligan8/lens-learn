import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';

// Mode-specific step definitions
const MODE_STEPS = {
  photographer: [
    {
      id: 1,
      title: 'Scout Field of View with AR Preview',
      icon: '🔭',
      desc: 'Frame foreground + sky. Use Star Pointer or Sky Planner AR to preview the Milky Way arc.',
      tips: 'Use Live View or Star Pointer to see where the galactic core will rise. Do this before sunset — once dark, recomposing is hard.',
      safetyNote: 'Do this in daylight or Blue Hour. Note trip hazards, drop-offs, and unstable ground.',
    },
    {
      id: 2,
      title: 'Set Up Tripod & Level It',
      icon: '📐',
      desc: 'Spread legs wide on solid ground. Use bubble level or phone tilt app.',
      tips: 'Attach ball head. Hang your camera bag as counterweight if windy. Check stability — a shaky tripod means blurry stars.',
      safetyNote: 'Use your red headlamp when setting up in dark. Check ground for uneven surfaces.',
    },
    {
      id: 3,
      title: 'Mount Camera & Compose Frame',
      icon: '🖼️',
      desc: 'Attach camera, check composition via Live View. Place foreground on lower third.',
      tips: 'Zoom Live View 5–10× to a horizon edge to check tilt. Lock in your frame — you can\'t easily recompose in the dark.',
      safetyNote: null,
    },
    {
      id: 4,
      title: 'Manual Focus at Infinity',
      icon: '🎯',
      desc: 'Switch to Manual focus. Zoom Live View to 10× on the brightest star.',
      tips: 'Slowly dial focus until the star is a pinpoint — then tape the focus ring in place. Take one test frame and pixel-peep.',
      safetyNote: 'Sharp stars are non-negotiable. Check your histogram before committing to the full sequence.',
    },
    {
      id: 5,
      title: 'Set Settings & Accessories',
      icon: '⚙️',
      desc: 'ISO 3200–6400, f/2.8 or wider, shutter from calculator. Hook up intervalometer & dew heater.',
      tips: 'Disable in-camera noise reduction. Connect intervalometer. Attach dew heater if temperature is dropping — dew ruins a session fast.',
      safetyNote: 'Battery check before you settle in. Cold nights cut battery life by 50%+. Keep spares in inner pocket (body heat keeps them warm).',
    },
    {
      id: 6,
      title: 'Start Photographing',
      icon: '📸',
      desc: 'Take one test frame. Review histogram — protect highlights, expose to the right.',
      tips: 'Start interval sequence. For panoramas, overlap 30% between frames. Shoot RAW for maximum latitude in post.',
      safetyNote: 'Keep your red headlamp close. Stay aware of surroundings — don\'t wander from your setup in full dark.',
    },
    {
      id: 7,
      title: 'Review, Stack & Wrap Up',
      icon: '🌟',
      desc: 'Check final frames for focus, histogram, composition. Pack up in reverse order.',
      tips: 'Lens cap on first. Back home: stack in Sequator or Starry Landscape Stacker, then process in Lightroom. For foreground color: blend a longer ISO 800–1600 exposure in post.',
      safetyNote: null,
    },
  ],
  smartphone: [
    {
      id: 1,
      title: 'Scout with Phone Preview',
      icon: '📱',
      desc: 'Hold your phone steady and pan the horizon. Use Star Pointer to see where the core rises.',
      tips: 'Scout your spot in daylight or Blue Hour. Landscape orientation = more sky. Test your phone\'s Night Mode in different positions.',
      safetyNote: 'Scout in daylight. Note any obstacles and safe ground before dark.',
    },
    {
      id: 2,
      title: 'Stabilize Phone on Tripod',
      icon: '📐',
      desc: 'Use a phone tripod adapter or gorillapod. Tighten clamp fully.',
      tips: 'Mount firmly on solid, level ground. Avoid soft ground — legs sink over long session. Check it won\'t topple if bumped.',
      safetyNote: 'Test stability before settling in. Avoid wind-exposed ridges.',
    },
    {
      id: 3,
      title: 'Compose Frame in Preview',
      icon: '🖼️',
      desc: 'Open camera app, landscape orientation. Lock exposure if app supports it.',
      tips: 'Off-center composition > dead-center. Foreground on lower third. Don\'t touch the phone until you\'re done shooting.',
      safetyNote: null,
    },
    {
      id: 4,
      title: 'Activate Night Mode & Focus',
      icon: '🎯',
      desc: 'Tap on the brightest star or distant horizon. Enable manual focus assist if available.',
      tips: 'Use apps like Halide or ProCamera for finer control. Let Night Mode prep — most iPhones auto-detect and prepare.',
      safetyNote: 'Don\'t touch the phone once you\'ve focused. Even a nudge can shift focus.',
    },
    {
      id: 5,
      title: 'Configure Exposure Settings',
      icon: '⚙️',
      desc: 'Enable Pro/Expert mode. Set ISO 1600–3200 and longest exposure your app allows.',
      tips: 'Set a 2–10s self-timer to let vibration settle before the shutter fires. Enable manual shutter if available.',
      safetyNote: 'Battery check — cold nights drain batteries fast. Keep a backup power bank in an inner pocket.',
    },
    {
      id: 6,
      title: 'Shoot with Stability',
      icon: '📸',
      desc: 'Trigger with self-timer or volume button. Night Mode handles multi-second exposure automatically.',
      tips: 'Stay perfectly still — even breathing can blur. Review your shot before shooting a series. Tap to refocus between shots if composition drifts.',
      safetyNote: 'Keep your red headlamp close. Stay aware of surroundings.',
    },
    {
      id: 7,
      title: 'Review & Share',
      icon: '🌟',
      desc: 'Compare Night Mode with and without. Export full-res before sharing.',
      tips: 'Review in-camera and adjust for next shots. Most phones auto-stack Night Mode. Share your best to the Explorer Gallery!',
      safetyNote: null,
    },
  ],
  experience: [
    {
      id: 1,
      title: 'Find Clear Southern Horizon',
      icon: '🧭',
      desc: 'Look south for Milky Way, north for aurora. Note any obstacles. Scout in daylight.',
      tips: 'Mark your spot so you can find it in the dark. Test sightlines — avoid trees and buildings that block your view.',
      safetyNote: 'Scout in daylight. Note trip hazards and stable ground.',
    },
    {
      id: 2,
      title: 'Find Comfortable Viewing Position',
      icon: '🪑',
      desc: 'Comfortable = longer, better session. Use a chair, mat, or reclining position.',
      tips: 'Bring a blanket or sleeping bag for warmth. Position yourself so you can lie back and observe for 30+ minutes without neck strain.',
      safetyNote: 'Check the ground for uneven surfaces. Avoid wet grass or muddy areas.',
    },
    {
      id: 3,
      title: 'Dark Adapt Your Eyes',
      icon: '👁️',
      desc: 'Give your eyes 20–30 minutes to fully adapt. Avoid ALL white lights.',
      tips: 'Use only red light for your headlamp or phone. Even a brief white light resets dark adaptation. Sit still and let your pupils dilate.',
      safetyNote: 'No white lights. No phone screens. No flashlights. Red light only.',
    },
    {
      id: 4,
      title: 'Look for Milky Way / Aurora',
      icon: '✨',
      desc: 'Look slightly beside faint objects — peripheral vision is more sensitive.',
      tips: 'Start with naked eye. Look for Milky Way as a faint band across the sky. For aurora, watch for green pulses or red glows on the horizon.',
      safetyNote: null,
    },
    {
      id: 5,
      title: 'Observe Methodically',
      icon: '🔭',
      desc: 'Take your time. Give each object 5–10 minutes for your eye to pick up detail.',
      tips: 'Start with naked eye, then binoculars, then telescope if you have one. Sweep across regions of sky slowly. Notice shooting stars and satellites.',
      safetyNote: 'Battery check for phone (if using). Cold nights drain batteries fast. Keep warm — observation is better when comfortable.',
    },
    {
      id: 6,
      title: 'Log Your Observations',
      icon: '📝',
      desc: 'Note what you saw — planets, satellites, shooting stars, ISS passes.',
      tips: 'Use a red-light pen and paper, or red-light voice recording. Note sky quality (Bortle estimate), time, and direction. Record anything surprising.',
      safetyNote: 'Write or record with red light only. Keep everything in red-light mode.',
    },
    {
      id: 7,
      title: 'Wrap Up & Share',
      icon: '🌟',
      desc: 'Pack up safely. Share observations in the community gallery.',
      tips: 'Reflect on what you learned. What surprised you? What would you do differently next time? Share in the Explorer Gallery to help others.',
      safetyNote: null,
    },
  ],
};

export default function ModeSpecificWalkthrough({ mode, onTabChange }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [collapsed, setCollapsed] = useState(false);

  const steps = MODE_STEPS[mode] || MODE_STEPS.photographer;
  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;

  const markComplete = () => {
    setCompleted(prev => new Set([...prev, step.id]));
    if (!isLast) setCurrentStep(prev => prev + 1);
  };

  const progress = Math.round((completed.size / steps.length) * 100);
  const modeLabel = mode === 'photographer' ? '📷 DSLR / Mirrorless' : mode === 'smartphone' ? '📱 Smartphone' : '👁️ Sky Experience';

  return (
    <div className="mb-5 rounded-2xl border border-red-900/30 bg-[#0f0a00]/70 overflow-hidden">
      {/* Header / collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-red-400 text-xs font-black uppercase tracking-widest">Your Field Guide</span>
          <span className="text-slate-600 text-xs">·</span>
          <span className="text-slate-500 text-xs">{completed.size}/{steps.length} steps</span>
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
          {/* Mode badge */}
          <div className="mb-3 inline-block text-[10px] font-bold uppercase tracking-widest text-red-300 bg-red-900/20 border border-red-700/30 px-2.5 py-1 rounded-full">
            {modeLabel}
          </div>

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

            {/* Tip box */}
            <div className="bg-black/30 rounded-lg px-3 py-2.5 border-l-2 border-red-700/60">
              <p className="text-slate-300 text-xs leading-relaxed">{step.tips}</p>
            </div>

            {/* Safety note */}
            {step.safetyNote && (
              <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-300 text-xs leading-relaxed">{step.safetyNote}</p>
              </div>
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

            <div className="text-[10px] text-slate-600 italic">Take your time — build your session</div>

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