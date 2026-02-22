import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Layers, Wand2, Palette, BarChart3 } from 'lucide-react';

export default function PostProcessingGuide({ gear, shooterMode }) {
  const [expanded, setExpanded] = useState({});

  const toggleSection = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sections = [
    {
      id: 'stacking',
      title: 'Image Stacking',
      icon: Layers,
      subtitle: 'Reduce noise & increase detail',
      color: 'blue',
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">📸 Best Practices</p>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li className="flex gap-2"><span className="text-blue-400">•</span> <span><strong>Shoot 15–30 frames</strong> of the same scene for robust stacking</span></li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> <span>Use <strong>manual focus</strong> (once locked, don't adjust between shots)</span></li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> <span>Disable <strong>image stabilization</strong> on tripod (can introduce artifacts)</span></li>
              <li className="flex gap-2"><span className="text-blue-400">•</span> <span>Keep <strong>ISO, shutter, aperture constant</strong> across all frames</span></li>
            </ul>
          </div>

          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">🛠️ Software Workflow</p>
            <div className="space-y-2">
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">1. Alignment & Stacking</p>
                <p className="text-slate-400">Use <strong>Starry Landscape</strong> or <strong>Sequator</strong> to automatically align sky/foreground, then stack in <strong>Photoshop</strong> (mean or median mode), <strong>Lightroom</strong> (Auto Stack), or free <strong>Siril</strong>.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">2. Noise Reduction Post-Stack</p>
                <p className="text-slate-400">Stacking already reduces thermal noise ~50%. Further denoise with <strong>Topaz DeNoise AI</strong> or <strong>Adobe's Super Resolution</strong> for best results.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">3. Star Removal (Optional)</p>
                <p className="text-slate-400">To enhance Milky Way detail, selectively remove stars using <strong>Photoshop Generative Fill</strong> or <strong>Content-Aware Fill</strong> on a duplicate layer.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">📊 Noise Reduction Impact</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-900/20 border border-emerald-500/40 rounded p-2">
                <p className="font-semibold text-emerald-400">High ISO (3200+)</p>
                <p className="text-slate-400">Stacking reduces noise ~50%; denoise to 70–80% reduction total.</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/40 rounded p-2">
                <p className="font-semibold text-blue-400">Low ISO (1600)</p>
                <p className="text-slate-400">Stacking alone may suffice; minimal denoising needed.</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'denoising',
      title: 'Denoising Techniques',
      icon: Wand2,
      subtitle: 'Remove sensor & amplification noise',
      color: 'emerald',
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">🎯 Denoising Methods</p>
            <div className="space-y-2">
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">Luminance vs. Chrominance</p>
                <p className="text-slate-400">Apply stronger luminance denoising (Y-channel) than color denoising (preserve color detail). Most MW photos benefit from 60–80% luminance reduction.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">AI-Powered Tools (Recommended)</p>
                <p className="text-slate-400"><strong>Topaz DeNoise AI, Adobe Super Resolution,</strong> or <strong>DxO Pure Raw</strong> preserve star detail better than traditional filters.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">Traditional Methods</p>
                <p className="text-slate-400"><strong>Luminosity masks</strong> + <strong>median blur</strong> or <strong>bilateral filter</strong> in Photoshop; less destructive but more manual.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">⚡ Per-Camera ISO Recommendations</p>
            {gear?.cameras?.[0] ? (
              <div className="bg-slate-800/50 rounded p-3 text-sm space-y-1">
                <p className="text-white font-semibold">{gear.cameras[0].name}</p>
                {gear.cameras[0].iso_max >= 3200 && (
                  <p className="text-slate-400">
                    <strong>High ISO capability ({gear.cameras[0].iso_max})</strong> — You can shoot at 3200–6400 with stacking + denoising. Denoise at 70% + stack 20 frames for best SNR.
                  </p>
                )}
                {gear.cameras[0].iso_max < 3200 && (
                  <p className="text-slate-400">
                    <strong>Moderate ISO ({gear.cameras[0].iso_max})</strong> — Keep ISO ≤ 1600; rely more on stacking (25+ frames) than denoising to preserve detail.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Add your gear profile to see ISO-specific recommendations.</p>
            )}
          </div>

          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">🚫 Common Mistakes</p>
            <ul className="space-y-1 text-slate-400 text-sm">
              <li className="flex gap-2"><span className="text-red-400">✗</span> <span>Over-denoising = loss of star detail & milky way structure</span></li>
              <li className="flex gap-2"><span className="text-red-400">✗</span> <span>Denoising before stacking = redundant work</span></li>
              <li className="flex gap-2"><span className="text-red-400">✗</span> <span>Using heavy blur filters on stars = halos & artifacts</span></li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'colorgrading',
      title: 'Color Grading & Tone Mapping',
      icon: Palette,
      subtitle: 'Reveal the Milky Way colors',
      color: 'purple',
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">🎨 Core Grading Workflow</p>
            <div className="space-y-2">
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">1. White Balance</p>
                <p className="text-slate-400">Set <strong>Kelvin to 3500–4500K</strong> to reveal warm MW tones. Avoid neutral (6500K) — it flattens colors.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">2. Boost Shadows & Blacks</p>
                <p className="text-slate-400">Increase <strong>Exposure +0.5 to +1.5</strong> stops, then lift <strong>Blacks to -20 to 0</strong> to reveal faint MW detail.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">3. Clarity & Vibrance</p>
                <p className="text-slate-400"><strong>Clarity +30–50</strong> enhances MW structure. <strong>Vibrance +20–40</strong> boosts color without oversaturation.</p>
              </div>
              <div className="bg-slate-800/50 rounded p-2.5 text-sm">
                <p className="font-semibold text-white mb-1">4. Selective Color Curves</p>
                <p className="text-slate-400">In <strong>RGB curves</strong>, slightly lift red & cyan in shadows to warm the MW. Lift blue in midtones for cosmic feel.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">🌌 Milky Way-Specific Adjustments</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-purple-900/20 border border-purple-500/40 rounded p-2">
                <p className="font-semibold text-purple-400">Shadow Cyan</p>
                <p className="text-slate-400">Lift cyan in deep shadows to enhance MW structure & reveal dust lanes.</p>
              </div>
              <div className="bg-amber-900/20 border border-amber-500/40 rounded p-2">
                <p className="font-semibold text-amber-400">Highlights Warmth</p>
                <p className="text-slate-400">Add slight orange/red to highlights to enhance star colors (Betelgeuse, etc.).</p>
              </div>
              <div className="bg-pink-900/20 border border-pink-500/40 rounded p-2">
                <p className="font-semibold text-pink-400">Saturation Mask</p>
                <p className="text-slate-400">Target reds & magentas separately; boost nebula colors without clipping.</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/40 rounded p-2">
                <p className="font-semibold text-blue-400">Dehaze Sparingly</p>
                <p className="text-slate-400">Small dehaze (5–10) adds contrast; overdoing it creates artifacts.</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">📋 Lightroom Preset Starting Point</p>
            <div className="bg-slate-800/50 rounded p-3 text-xs space-y-1 font-mono">
              <p>Exposure: +0.8</p>
              <p>Shadows: +40 | Blacks: -20</p>
              <p>Clarity: +40 | Vibrance: +25</p>
              <p>Saturation: +5 to 15</p>
              <p>Temp (K): 4000 | Tint: +5</p>
            </div>
            <p className="text-slate-500 text-xs mt-2">Adjust based on your specific shot & mood.</p>
          </div>

          <div>
            <p className="text-slate-300 font-semibold text-sm mb-2">🚫 Overdone MW Grading (Avoid)</p>
            <ul className="space-y-1 text-slate-400 text-sm">
              <li className="flex gap-2"><span className="text-red-400">✗</span> <span>Saturation > 40 = garish, unrealistic colors</span></li>
              <li className="flex gap-2"><span className="text-red-400">✗</span> <span>Vibrance > 60 = posterization & banding</span></li>
              <li className="flex gap-2"><span className="text-red-400">✗</span> <span>Crushed shadows = loss of nebula detail</span></li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'workflow',
      title: 'Complete Workflow Order',
      icon: BarChart3,
      subtitle: 'Step-by-step processing pipeline',
      color: 'indigo',
      content: (
        <div className="space-y-3">
          {[
            { step: 1, title: 'Import & Verify', desc: 'Check all frames are in focus, no tracking errors.' },
            { step: 2, title: 'Stack Frames', desc: 'Align & stack 15–30 images (median or mean method).' },
            { step: 3, title: 'Denoise Stacked Image', desc: 'Apply AI denoise at 60–75% strength on luminance.' },
            { step: 4, title: 'Adjust Levels & Curves', desc: 'Set black point, lift shadows, establish tonal range.' },
            { step: 5, title: 'Color Grade', desc: 'Apply white balance, clarity, vibrance, selective curves.' },
            { step: 6, title: 'Sharpen Selectively', desc: 'Unsharp mask on layer mask (avoid star halos).' },
            { step: 7, title: 'Final Tweaks', desc: 'Crop, vignette, saturation refinement.' },
            { step: 8, title: 'Export for Web/Print', desc: 'sRGB, 100% quality JPEG or ProPhoto TIF.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {item.step}
              </div>
              <div>
                <p className="text-white font-semibold">{item.title}</p>
                <p className="text-slate-400 text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
      <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
        <Palette className="w-5 h-5 text-purple-400" />
        Post-Processing Masterclass
      </h3>

      <div className="space-y-3">
        {sections.map(section => {
          const Icon = section.icon;
          const colorClass = section.color === 'blue' ? 'text-blue-400' : section.color === 'emerald' ? 'text-emerald-400' : section.color === 'purple' ? 'text-purple-400' : 'text-indigo-400';
          const isOpen = expanded[section.id];

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 transition-all"
              >
                <div className="flex items-center gap-3 text-left">
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                  <div>
                    <p className="text-white font-semibold text-sm">{section.title}</p>
                    <p className="text-slate-500 text-xs">{section.subtitle}</p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="bg-slate-800/30 border-l-2 border-slate-700 rounded-b-lg p-4 mt-1">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 p-3 bg-amber-900/20 border border-amber-500/40 rounded-lg">
        <p className="text-amber-300 text-xs font-semibold mb-1">💡 Pro Tip</p>
        <p className="text-slate-400 text-xs">
          Stacking reduces noise ~50% for free. Use denoising as a final 20–30% refinement. Grading is 80% of the "wow factor" — spend time here learning curves & color theory.
        </p>
      </div>
    </Card>
  );
}