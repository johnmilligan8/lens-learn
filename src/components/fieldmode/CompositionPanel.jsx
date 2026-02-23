import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const TIPS = {
  milky_way: [
    {
      title: 'Rule of Thirds with the Core',
      body: 'Place the galactic core at a power point (1/3 from left or right) rather than centered. Let the arch sweep across the sky above a dark foreground.',
      icon: '🔲',
    },
    {
      title: 'Foreground Anchoring',
      body: 'A silhouette — tree, rock, person — at the bottom third creates depth. Keep it at ~20% of frame height. Avoid busy foregrounds that compete with the core.',
      icon: '🌲',
    },
    {
      title: 'Leading Lines',
      body: 'Roads, rivers, fence lines pointing toward the galactic center draw the eye. Shoot from a low perspective (ground level) to emphasize these lines.',
      icon: '🛤',
    },
    {
      title: 'Milky Way Arch',
      body: 'In summer you can capture the full arch — use a wider lens (14mm) and shoot in portrait orientation for maximum coverage, then stitch a panorama.',
      icon: '🌈',
    },
    {
      title: 'Negative Space',
      body: 'Wide-open sky as negative space amplifies the density of stars. Don\'t feel obligated to fill every corner — the darkness is part of the story.',
      icon: '✨',
    },
  ],
  aurora: [
    {
      title: 'Reflect in Water',
      body: 'Lakes, puddles, and tidal pools mirror aurora perfectly. Crouch low — even a centimeter change dramatically shifts the reflection geometry.',
      icon: '🌊',
    },
    {
      title: 'Frame the Curtains',
      body: 'Place aurora curtains starting at one vertical third. Leave room on the opposite side for negative sky space, and include a simple dark horizon.',
      icon: '🎨',
    },
    {
      title: 'Include a Human Scale',
      body: 'A single person on a hillside with a headlamp gives instant scale and emotion. Ask them to stand very still during the 3–8s exposure.',
      icon: '🧍',
    },
    {
      title: 'Watch for Pillars',
      body: 'Vertical aurora pillars (KP6+) respond well to portrait orientation. Horizontal undulating bands suit landscape orientation.',
      icon: '⬆️',
    },
  ],
  meteor_shower: [
    {
      title: 'Radiant Off-Center',
      body: 'Point 45–60° away from the radiant (e.g., Perseus for Perseids). Meteors appear shorter near the radiant but longer further away — better for drama.',
      icon: '☄️',
    },
    {
      title: 'Wide Sky, Simple Foreground',
      body: 'Maximize sky coverage with a wide lens. Include only a simple, silhouetted horizon — you\'re capturing the sky, not the land.',
      icon: '🌌',
    },
    {
      title: 'Stack Composites',
      body: 'Take 200+ frames over 2–3 hours. Use Starry Landscape Stacker or Sequator to composite the meteors onto your best single frame — maximally dramatic.',
      icon: '🖼',
    },
  ],
  moon: [
    {
      title: 'Full Frame vs. Context',
      body: '400mm+ for lunar surface detail; 14–50mm for moonrise behind landscape. Plan ahead with The Photographer\'s Ephemeris to know exact rise azimuth.',
      icon: '🌕',
    },
    {
      title: 'Moonlit Landscapes',
      body: 'Full moon is equivalent to a very low-ISO daylight exposure of the landscape. Embrace long exposures at f/8–f/11 for maximum landscape sharpness.',
      icon: '🏔',
    },
    {
      title: 'Moon as Key Light',
      body: 'Place the moon just out of frame and use it as a natural key light for your subject. The soft, directional quality rivals a professional softbox.',
      icon: '💡',
    },
  ],
};

const getFallback = () => TIPS.milky_way;

function getTips(event) {
  const type = event?.event_type;
  return TIPS[type] || getFallback();
}

export default function CompositionPanel({ mode, event, coords }) {
  const tips = getTips(event);
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="space-y-3">
      <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold px-1">
        Composition — {event?.title || 'Night Sky'}
      </p>

      {tips.map((tip, i) => (
        <Card
          key={i}
          className="bg-[#1a1a1a] border border-white/8 overflow-hidden"
        >
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
          >
            <span className="text-xl flex-shrink-0">{tip.icon}</span>
            <span className="text-white text-sm font-bold flex-1">{tip.title}</span>
            {expanded === i
              ? <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
              : <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
            }
          </button>
          {expanded === i && (
            <div className="px-4 pb-4">
              <p className="text-slate-300 text-sm leading-relaxed">{tip.body}</p>
            </div>
          )}
        </Card>
      ))}

      {/* Golden rule card */}
      <Card className="bg-[#1a1a1a] border border-white/8 p-4 mt-2">
        <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-2">🏆 Golden Rule Tonight</p>
        <p className="text-slate-300 text-sm leading-relaxed">
          {mode === 'experience'
            ? 'Stop. Look. Breathe. Let your eyes dark-adapt for 20 minutes before you try to navigate or observe. Red light only. Don\'t rush the process.'
            : mode === 'smartphone'
            ? 'Stability is everything. Use a tripod, bluetooth shutter, and airplane mode. One tiny movement ruins 25 seconds of exposure.'
            : 'Nail your focus before anything else. A perfectly exposed, slightly blurry shot is worthless. Use live view 10× zoom on a bright star to lock focus.'}
        </p>
      </Card>
    </div>
  );
}