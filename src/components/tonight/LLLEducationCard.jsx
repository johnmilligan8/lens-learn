import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { X, Lightbulb } from 'lucide-react';

export default function LLLEducationCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card
        className="bg-[#1a1a1a] border border-yellow-700/30 hover:border-yellow-600/50 p-4 cursor-pointer transition-all"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start gap-3">
          <div className="bg-yellow-900/30 border border-yellow-700/30 p-2.5 rounded-xl flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Low Level Lighting</span>
              <span className="bg-yellow-900/40 border border-yellow-700/30 text-yellow-300 text-[10px] px-1.5 py-0.5 rounded font-semibold">LLL Tip</span>
            </div>
            <p className="text-white text-sm font-medium">Gently illuminate foregrounds without pollution</p>
            <p className="text-slate-400 text-xs mt-1">Dim LED constant light during exposure — more uniform than light painting. Tap to learn →</p>
          </div>
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="bg-[#111111] border border-yellow-700/30 rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-900/30 p-2.5 rounded-xl border border-yellow-700/30">
                <Lightbulb className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Low Level Lighting (LLL)</h3>
                <p className="text-yellow-300 text-xs">Foreground Illumination Technique</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-yellow-950/30 border border-yellow-800/30 rounded-xl p-3">
                <p className="text-yellow-200 text-xs font-semibold mb-1">What is LLL?</p>
                <p className="text-slate-300 text-xs leading-relaxed">Low Level Lighting uses a dim, constant LED panel during your long exposure to gently and evenly illuminate your foreground. It's more natural-looking than light painting and reduces the "painted" artifact common in rushed techniques.</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3">
                <p className="text-white text-xs font-semibold mb-2">🔑 Key Principles</p>
                <ul className="text-slate-400 text-xs space-y-1.5">
                  <li>• Set light to <span className="text-white">lowest power</span> — match sky brightness</li>
                  <li>• Place <span className="text-white">far back</span> from subject for even spread</li>
                  <li>• Gel <span className="text-white">warm (3200K)</span> to match natural light tones</li>
                  <li>• Use <span className="text-white">barn doors or flags</span> to prevent spill onto sky</li>
                  <li>• Leave on for <span className="text-white">entire exposure</span> — no painting motion</li>
                </ul>
              </div>
              <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3">
                <p className="text-white text-xs font-semibold mb-1">🏔 Great for Utah Landscapes</p>
                <p className="text-slate-400 text-xs leading-relaxed">Hoodoos, rock arches, and salt flat reflections respond beautifully to LLL. The even glow reveals texture without killing your dark adaptation.</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3">
                <p className="text-white text-xs font-semibold mb-2">🎒 What You Need</p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>• Dim-adjustable LED panel (e.g., Nanlite Compac 20)</li>
                  <li>• Light stand or tripod mount</li>
                  <li>• Warming gel / CTO filter (3200K)</li>
                  <li>• Barn doors or foam flags</li>
                  <li>• Extra power bank / batteries</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}