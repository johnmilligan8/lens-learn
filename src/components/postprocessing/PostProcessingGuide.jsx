import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Sparkles, Layers, Zap, Palette } from 'lucide-react';

export default function PostProcessingGuide() {
  const [expanded, setExpanded] = useState(false);

  const sections = [
    {
      icon: Layers,
      title: 'Image Stacking',
      color: 'text-blue-400',
      steps: [
        '1. Shoot 5–10 exposures (better signal-to-noise ratio)',
        '2. Use free tools: Sequator, Hugin, or Starry Landscape Stacker',
        '3. Align on stars, not foreground (use "star-only" alignment)',
        '4. Stack with median blend to remove noise & planes',
        '5. Result: Cleaner MW with retained foreground detail',
      ],
    },
    {
      icon: Zap,
      title: 'Denoising & Clarity',
      color: 'text-yellow-400',
      steps: [
        '• Use Lightroom: Reduce luminance noise (40–60), preserve colors',
        '• Alternative: Adobe Camera Raw, ON1 Photo, Neat Image',
        '• Increase clarity/texture to bring out MW detail (be subtle)',
        '• Boost vibrance before saturation (more natural colors)',
        '• Avoid over-sharpening; use high-pass filter instead',
      ],
    },
    {
      icon: Palette,
      title: 'Color Grading',
      color: 'text-purple-400',
      steps: [
        '• Milky Way: Cool blues & teals for sky, warm oranges/golds for core',
        '• Foreground: Lift shadows, darken highlights for separation',
        '• Use curves: S-curve for contrast, pull highlights slightly warm',
        '• Split toning: Cool shadows (blue), warm highlights (gold)',
        '• Calibrate on a monitor with correct gamma/profile',
      ],
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-white font-semibold">Post-Processing Essentials</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-purple-300 hover:text-purple-200"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {!expanded ? (
        <p className="text-slate-400 text-sm">Master stacking, denoising & color grading for stunning Milky Way shots</p>
      ) : (
        <div className="space-y-4 mt-4 pt-4 border-t border-slate-700">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-slate-800/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${section.color}`} />
                  <h4 className="text-white font-semibold text-sm">{section.title}</h4>
                </div>
                <ul className="space-y-1">
                  {section.steps.map((step, i) => (
                    <li key={i} className="text-slate-400 text-xs leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 mt-4">
            <p className="text-emerald-300 text-xs font-semibold mb-1">🎯 Quick Workflow</p>
            <p className="text-slate-400 text-xs">Stack → Denoise → Adjust WB/exposure → Clarity → Split tone → Export as 16-bit TIF</p>
          </div>
        </div>
      )}
    </Card>
  );
}