import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, Camera, Layers, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';

const techniques = [
  {
    name: 'Panoramic Stacking',
    icon: Navigation,
    color: 'from-blue-600 to-blue-700',
    description: 'Capture wide-angle milky way or landscape scenes by stitching multiple overlapping frames.',
    settings: {
      'Focal Length': '14-35mm (wider = more frames needed)',
      'Shutter Speed': '15-20 sec (rule of 500)',
      'Aperture': 'Widest f-stop (f/1.4-f/2.8)',
      'ISO': '3200-6400 (depends on moon + bortle)',
      'Overlap': '25-40% between frames',
      'Focus': 'Manual focus on stars, hyperfocal distance',
    },
    workflow: [
      'Plan your panorama: decide how many frames (3-9 typical)',
      'Manual focus on bright star or infinity mark',
      'Shoot frames left-to-right or bottom-to-top with consistent spacing',
      'Keep exposure, ISO, WB identical across all frames',
      'Use tripod head with pano marks or markers on ground',
      'Stitch in Lightroom, PTGui, or Hugin (free)',
      'Blend seams with luminosity masks in post-processing',
    ],
    tips: [
      'Wider lenses need fewer frames but more software processing',
      'Longer lenses = more frames but easier stitching',
      'Shoot in RAW for maximum blending flexibility',
      'Test overlap before full shoot — save frames',
      'Wind can shift stars between frames; shoot quickly',
      'Mark frame positions if you need to return to exact spots',
    ],
    gear: [
      'Wide-angle lens (14-24mm)',
      'Sturdy tripod with panoramic head (optional)',
      'Stitching software: Lightroom, PTGui, or Hugin',
      'Luminosity mask tools for blending',
    ],
  },
  {
    name: 'Focus Stacking',
    icon: Layers,
    color: 'from-purple-600 to-purple-700',
    description: 'Combine multiple exposures with different focus points to achieve foreground + stars in sharp focus.',
    settings: {
      'Focal Length': '14-35mm (wider = deeper depth of field)',
      'Shutter Speed': '15-25 sec',
      'Aperture': 'f/2.8-f/4 (balance DOF + star diffraction)',
      'ISO': '3200-6400',
      'Focus Bracket': '2-5 frames (foreground → infinity)',
      'Overlap': 'Ensure sharp transition zones',
    },
    workflow: [
      'Identify foreground interest (landscape element, rocks, etc.)',
      'Take 2-5 exposures: focus on foreground first, then step back to stars/infinity',
      'Use manual focus or focus peaking to verify sharpness',
      'Every other setting (shutter, ISO, WB) stays identical',
      'Use focus helicoid or MF ring to adjust between frames',
      'Stack in post: Photoshop, Luminosity Pro, or free Enfuse',
      'Blend with layer masks to create seamless transition',
    ],
    tips: [
      'f/2.8 gives ~1-2 feet DOF; plan focus points accordingly',
      'Wider lenses = more natural depth of field blend',
      'Use focus peaking (live view) to confirm sharp areas',
      'Diffraction increases above f/5.6 — avoid if possible',
      'Foreground + milky way requires thoughtful composition',
      'Take reference shot at infinity for star sharpness',
    ],
    gear: [
      'Lens with good manual focus (14-35mm prime or fast zoom)',
      'Tripod with secure head',
      'Focus peaking camera or focus confirmation light',
      'Stacking software: Photoshop, Luminosity Pro, or Enfuse',
      'Focus helicoid (optional, for precision)',
    ],
  },
  {
    name: 'Star Tracking / Tracked Sky',
    icon: Camera,
    color: 'from-green-600 to-green-700',
    description: 'Use a star tracker mount to extend shutter speed while keeping stars as points, not trails.',
    settings: {
      'Focal Length': '14-35mm (wider = longer exposures possible)',
      'Shutter Speed': '30-60 sec (vs. 15-20 with rule of 500)',
      'Aperture': 'f/1.4-f/2.8',
      'ISO': '1600-3200 (less needed due to longer exposure)',
      'Tracker': 'Star Adventurer or Peak Design Capture',
      'Polar Alignment': 'Critical ±15 min of arc',
    },
    workflow: [
      'Set up star tracker (Star Adventurer, Timellapse, RM-Z01, etc.)',
      'Polar align tracker using compass or pole finder app',
      'Mount camera + lens on tracker, balance weight',
      'Enable tracker motor at sidereal rate',
      'Use longer exposures (30-60 sec) for brighter skies',
      'Stack multiple tracked exposures for noise reduction',
      'Foreground will blur; composite with static foreground shot',
      'Blend in post: layer mask method for clean foreground boundary',
    ],
    tips: [
      'Star Adventurer is most common ($200-300) — check reviews',
      'Polar alignment is everything — use phone app (PoleMaster, Star Adventurer)',
      'Wider lenses tolerate tracking errors better (35mm = less forgiving)',
      'Can use ISO 1600 instead of 3200 due to longer exposure',
      'Great for extended Milky Way core shots with lower noise',
      'Shoot separate static foreground frame (no tracking) for compositing',
    ],
    gear: [
      'Star tracker mount (Star Adventurer, RM-Z01, Timellapse)',
      'Sturdy tripod + ball head',
      'Polar alignment tool (phone app or Pole Master)',
      'Extra battery for tracker',
      'Wide-angle lens (14-35mm)',
      'Compositing software (Photoshop) for sky/foreground blend',
    ],
  },
];

export default function StackingTechniquesGuide() {
  const [expanded, setExpanded] = useState(null);

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-white font-bold text-lg mb-1">Advanced Stacking Techniques</h3>
        <p className="text-slate-400 text-sm">Panoramas, focus stacking, and star tracking for premium compositions.</p>
      </div>

      {/* Techniques */}
      <div className="space-y-2">
        {techniques.map((tech, idx) => {
          const Icon = tech.icon;
          const isExpanded = expanded === idx;
          return (
            <div key={idx} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-800/20">
              {/* Header Button */}
              <button
                onClick={() => setExpanded(isExpanded ? null : idx)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${tech.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm">{tech.name}</p>
                    <p className="text-slate-400 text-xs truncate">{tech.description}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-800 p-4 space-y-4 bg-slate-900/30">
                  {/* Settings Table */}
                  <div>
                    <p className="text-slate-300 font-semibold text-sm mb-2">Recommended Settings</p>
                    <div className="grid gap-1 text-xs bg-slate-900/60 rounded p-2">
                      {Object.entries(tech.settings).map(([key, val]) => (
                        <div key={key} className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
                          <span className="text-slate-400 font-medium">{key}:</span>
                          <span className="text-slate-300">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Workflow */}
                  <div>
                    <p className="text-slate-300 font-semibold text-sm mb-2">Workflow</p>
                    <ol className="space-y-1 text-xs text-slate-400">
                      {tech.workflow.map((step, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="font-bold text-slate-500 flex-shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Tips */}
                  <div>
                    <p className="text-slate-300 font-semibold text-sm mb-2">Pro Tips</p>
                    <div className="space-y-1">
                      {tech.tips.map((tip, i) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gear Required */}
                  <div>
                    <p className="text-slate-300 font-semibold text-sm mb-2">Essential Gear</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tech.gear.map((item, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="bg-slate-800/40 border-slate-700 text-slate-300 text-xs"
                        >
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Key Insight */}
      <div className="bg-blue-900/20 border border-blue-500/40 rounded-lg p-3">
        <p className="text-blue-300 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> When to Use Each Technique
        </p>
        <ul className="text-slate-400 text-xs mt-2 space-y-1 ml-6 list-disc">
          <li><strong>Panoramas:</strong> Wide scenes, milky way core, dramatic horizons</li>
          <li><strong>Focus Stacking:</strong> Foreground + sky sharpness (landscape + astrophoto blend)</li>
          <li><strong>Star Tracking:</strong> Lower noise, extended sky exposure, galaxy details</li>
        </ul>
      </div>

      <p className="text-slate-600 text-xs">Each technique requires post-processing — budget 2-4 hours per shot for expert blending.</p>
    </Card>
  );
}