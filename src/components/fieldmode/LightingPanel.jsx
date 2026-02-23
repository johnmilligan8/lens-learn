import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Sun, Eye, Zap } from 'lucide-react';

// ─── Red Screen Overlay ─────────────────────────────────────────────────────
function RedScreenMode({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(180, 0, 0, 0.92)' }}
    >
      <div className="text-center text-red-200 p-6">
        <Eye className="w-12 h-12 mx-auto mb-4 text-red-300 opacity-60" />
        <p className="text-lg font-bold mb-2">Red Screen Active</p>
        <p className="text-sm opacity-70 mb-6">Dark adaptation preserved. Use this to read your settings without ruining your night vision.</p>
        <button
          onClick={onClose}
          className="text-sm underline text-red-300 opacity-70 hover:opacity-100"
        >
          Tap to exit
        </button>
      </div>
    </div>
  );
}

// ─── Low-Level Lighting Tips ─────────────────────────────────────────────────
const LOW_LIGHT_TIPS = [
  {
    title: 'Red Light Only — Always',
    icon: '🔴',
    body: 'The human eye has two photoreceptors: rods (night vision) and cones (color). White light bleaches rhodopsin in your rods — recovery takes 20–30 minutes. Red light (wavelength >620nm) barely activates rods. Use a dedicated red-mode headlamp or cover your white light with red cellophane.',
    important: true,
  },
  {
    title: 'Dark Adaptation Protocol',
    icon: '⏱',
    body: '0–5 min: basically blind. 5–15 min: rods kick in. 20–30 min: full dark adaptation (~50,000× more sensitive than in daylight). Even a single glance at a white phone screen resets this process. Plan your setup before darkness, then go hands-off.',
  },
  {
    title: 'Minimum Usable Light',
    icon: '💡',
    body: 'Use the dimmest possible red light for navigation. Many headlamps have a high/low mode — always use low. Cover your viewfinder and any blinking LEDs on your camera with black electrical tape.',
  },
  {
    title: 'Phone Screen Management',
    icon: '📱',
    body: 'Set your phone to full red/night mode (iOS: Color Filters > Red Tint; Android: Night Light + color inversion). Reduce screen brightness to minimum. Use the red screen overlay below to check settings without lighting up the area.',
  },
  {
    title: 'Peripheral Vision at Night',
    icon: '👁',
    body: 'Your rods are most dense in a ring around your central vision — not in the center. To see faint objects (dim nebulae, faint meteors), look slightly to the side (averted vision). The object will appear to pop out.',
  },
  {
    title: 'Headlamp Angle & Spread',
    icon: '🔦',
    body: 'Point your headlamp downward at your gear, never at other people or at the sky. Even reflected red light from clouds or ground can reduce contrast. Shield your lamp with your hand when near other photographers.',
  },
];

// ─── Light Painting Tips ─────────────────────────────────────────────────────
const LIGHT_PAINTING_TIPS = [
  {
    title: 'Settings for Light Painting',
    icon: '⚙️',
    body: 'ISO 400–800, f/8, shutter 15–60s (use Bulb mode for longer). You want enough time to paint large areas, but not so long that ambient stars overexpose. Start conservative and build up.',
    highlight: 'ISO 400–800 · f/8 · 15–60s Bulb',
  },
  {
    title: 'Warm vs. Cool Light Sources',
    icon: '🌡️',
    body: 'Warm LED (3000K) on rock/sand creates a golden, natural feel. Cool white or blue torches mimic moonlight — great for silhouettes and moody scenes. Avoid green light which looks unnatural on skin and rock.',
  },
  {
    title: 'The Sweep Technique',
    icon: '💫',
    body: 'For foreground illumination: stand to the side (not behind the camera), sweep your light slowly across the subject during the exposure. Move constantly — pausing creates hot spots. A diffuse LED panel is better than a bare torch.',
  },
  {
    title: 'Painting the Sky (Star Trails)',
    icon: '🎨',
    body: 'Impossible during your exposure, but you can composite: one short frame with light-painted foreground + a stacked star trail frame = pro result. Align on fixed foreground elements in post.',
  },
  {
    title: 'Steel Wool Spinning',
    icon: '⚡',
    body: 'SAFETY FIRST: do this only on concrete/rock/water with a fire extinguisher at hand. Load fine steel wool (#0000) in a whisk, ignite with 9V battery. Spin on a cable above your head for 5–10s. Spectacular sparks.',
  },
  {
    title: 'Glow Sticks & Orbs',
    icon: '🔮',
    body: 'Spin a glow stick or EL wire on a string to create light orbs. Experiment with speed and radius. Multiple colors = multiple exposures or multiple sticks. The camera sensor doesn\'t care about nausea.',
  },
];

export default function LightingPanel({ mode, event }) {
  const [activeSection, setActiveSection] = useState('low');
  const [expanded, setExpanded] = useState({});
  const [redScreen, setRedScreen] = useState(false);

  const tips = activeSection === 'low' ? LOW_LIGHT_TIPS : LIGHT_PAINTING_TIPS;

  const toggle = (i) => setExpanded(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-4">
      {redScreen && <RedScreenMode onClose={() => setRedScreen(false)} />}

      {/* Section toggle */}
      <div className="flex bg-slate-900/80 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveSection('low')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSection === 'low' ? 'bg-red-900/60 text-red-300 border border-red-800/60' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Low-Level Lighting
        </button>
        <button
          onClick={() => setActiveSection('paint')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeSection === 'paint' ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-800/40' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sun className="w-3.5 h-3.5" /> Light Painting
        </button>
      </div>

      {/* Red screen shortcut */}
      {activeSection === 'low' && (
        <button
          onClick={() => setRedScreen(true)}
          className="w-full flex items-center justify-center gap-2 bg-red-950/70 border border-red-700/50 hover:border-red-500/70 rounded-xl py-3 text-red-300 text-sm font-bold transition-all"
        >
          <Eye className="w-4 h-4" />
          Activate Red Screen — Preserve Night Vision
        </button>
      )}

      {/* Tips */}
      <div className="space-y-3">
        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold px-1">
          {activeSection === 'low' ? '🔴 Low-Level Lighting Guide' : '✨ Light Painting Techniques'}
        </p>

        {tips.map((tip, i) => (
          <Card
            key={i}
            className={`overflow-hidden ${
              tip.important
                ? 'bg-red-950/30 border border-red-700/40'
                : 'bg-slate-900/60 border border-slate-800/60'
            }`}
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <span className="text-xl flex-shrink-0">{tip.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-bold block">{tip.title}</span>
                {tip.highlight && (
                  <span className="text-yellow-400 text-[10px] font-mono mt-0.5 block">{tip.highlight}</span>
                )}
                {tip.important && (
                  <Badge className="bg-red-700/40 text-red-300 border-red-700/30 text-[9px] mt-0.5">CRITICAL</Badge>
                )}
              </div>
              {expanded[i]
                ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
              }
            </button>
            {expanded[i] && (
              <div className="px-4 pb-4">
                <p className="text-slate-300 text-sm leading-relaxed">{tip.body}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Quick reminder card */}
      <Card className="bg-slate-900/40 border border-slate-800/40 p-4">
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
          {activeSection === 'low' ? '🔴 Quick Rules' : '⚡ Quick Settings'}
        </p>
        {activeSection === 'low' ? (
          <ul className="space-y-1.5 text-slate-300 text-sm">
            <li className="flex items-center gap-2"><span className="text-red-400">▸</span> Red light only — always, everywhere</li>
            <li className="flex items-center gap-2"><span className="text-red-400">▸</span> 20–30 min dark adaptation before shooting</li>
            <li className="flex items-center gap-2"><span className="text-red-400">▸</span> Phone at minimum brightness, red-filtered</li>
            <li className="flex items-center gap-2"><span className="text-red-400">▸</span> Never shine any light toward the sky or others</li>
          </ul>
        ) : (
          <ul className="space-y-1.5 text-slate-300 text-sm">
            <li className="flex items-center gap-2"><span className="text-yellow-400">▸</span> ISO 400–800 · f/8 · Bulb 15–60s</li>
            <li className="flex items-center gap-2"><span className="text-yellow-400">▸</span> Move constantly — pausing = hot spots</li>
            <li className="flex items-center gap-2"><span className="text-yellow-400">▸</span> Warm light on warm subjects; cool for moody</li>
            <li className="flex items-center gap-2"><span className="text-yellow-400">▸</span> Composite foreground + sky in post</li>
          </ul>
        )}
      </Card>
    </div>
  );
}