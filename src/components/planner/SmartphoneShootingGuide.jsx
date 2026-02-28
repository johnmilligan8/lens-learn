import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Smartphone, Settings, Lightbulb } from 'lucide-react';

const PHONE_MODELS = {
  iphone: [
    { model: 'iPhone 16 Pro/Max', nightMode: 'Night Mode + ProRaw', shutterRange: '1–30s', isoStrategy: 'Auto (device manages)' },
    { model: 'iPhone 15 Pro/Max', nightMode: 'Night Mode + ProRaw', shutterRange: '1–30s', isoStrategy: 'Auto (device manages)' },
    { model: 'iPhone 14 Pro/Max', nightMode: 'Night Mode + ProRaw', shutterRange: '1–30s', isoStrategy: 'Auto (device manages)' },
  ],
  android: [
    { model: 'Pixel 9 Pro / 8 Pro', nightMode: 'Night Sight', shutterRange: '2–15s', isoStrategy: 'Auto or Manual via Expert RAW' },
    { model: 'Galaxy S24 Ultra', nightMode: 'Nightography mode', shutterRange: '1–10s', isoStrategy: 'Auto or Manual via Expert mode' },
  ],
};

const UNIVERSAL_TIPS = [
  { title: 'Framing', desc: 'Use rule of thirds — place horizon in lower third to emphasize sky. Include interesting foreground.' },
  { title: 'Stability', desc: 'Hold steady or use mini-tripod. Lean on object, control breathing. Any movement causes blur.' },
  { title: 'Patience', desc: 'Let the app capture. Don\'t tap shutter repeatedly. One good 15–30s exposure beats shaky bursts.' },
  { title: 'Focus', desc: 'Tap the brightest star to lock focus. If using manual mode, focus to infinity (∞).' },
  { title: 'Composition', desc: 'Foreground interest (trees, rocks, tent) makes photos pop. Sky alone is usually boring.' },
];

const NOT_APPLICABLE = [
  'Panorama stacking (computational, no control)',
  'Focus stacking or focus breathing (single lens)',
  'Long-exposure NR (auto-applied, no toggle)',
  'Star tracking (no mount support)',
  'Intervalometer (computational, no manual trigger)',
  'Dew heater (phone won\'t condense like big glass)',
  'Lightroom/advanced post-processing (mobile editing only)',
];

export default function SmartphoneShootingGuide() {
  const [expandedPhone, setExpandedPhone] = useState(null);
  const [expandedTip, setExpandedTip] = useState(null);

  return (
    <div className="space-y-4">
      {/* iPhone Guide */}
      <Card className="bg-[#1a1a1a] border-white/8 p-5">
        <button
          onClick={() => setExpandedPhone(expandedPhone === 'iphone' ? null : 'iphone')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" /> iPhone Night Mode Setup
          </h3>
          {expandedPhone === 'iphone' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {expandedPhone === 'iphone' && (
          <div className="mt-3 space-y-3">
            {PHONE_MODELS.iphone.map((phone, i) => (
              <div key={i} className="bg-slate-800/40 rounded-lg p-3 space-y-1.5">
                <p className="text-sm font-semibold text-white">{phone.model}</p>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><strong>Night Mode:</strong> {phone.nightMode}</p>
                  <p><strong>Typical shutter:</strong> {phone.shutterRange}</p>
                  <p><strong>ISO:</strong> {phone.isoStrategy}</p>
                </div>
              </div>
            ))}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-3">
              <p className="text-xs text-blue-300 leading-relaxed">
                <strong>Quick Start:</strong> Open Camera → Night Mode appears automatically in low light. Hold phone steady on tripod or lean on object. 
                Let it expose for 10–30s. Tap shutter once and wait. Don't move the phone.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Android Guide */}
      <Card className="bg-[#1a1a1a] border-white/8 p-5">
        <button
          onClick={() => setExpandedPhone(expandedPhone === 'android' ? null : 'android')}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-green-400" /> Android Night Sight / Nightography
          </h3>
          {expandedPhone === 'android' ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {expandedPhone === 'android' && (
          <div className="mt-3 space-y-3">
            {PHONE_MODELS.android.map((phone, i) => (
              <div key={i} className="bg-slate-800/40 rounded-lg p-3 space-y-1.5">
                <p className="text-sm font-semibold text-white">{phone.model}</p>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><strong>Mode:</strong> {phone.nightMode}</p>
                  <p><strong>Typical shutter:</strong> {phone.shutterRange}</p>
                  <p><strong>ISO:</strong> {phone.isoStrategy}</p>
                </div>
              </div>
            ))}
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mt-3">
              <p className="text-xs text-green-300 leading-relaxed">
                <strong>Quick Start (Pixel):</strong> Open Google Camera → Night Sight. 
                <strong>(Galaxy):</strong> Camera app → Mode → Nightography. 
                Hold steady. Shutter captures automatically; don't tap repeatedly. If available, Expert RAW gives manual control.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Universal Photography Principles */}
      <Card className="bg-[#1a1a1a] border-white/8 p-5">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-yellow-400" /> Universal Photography Principles
        </h3>
        <div className="space-y-2">
          {UNIVERSAL_TIPS.map((tip, i) => (
            <button
              key={i}
              onClick={() => setExpandedTip(expandedTip === i ? null : i)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
            >
              <span className="text-slate-300 font-medium text-sm">{tip.title}</span>
              {expandedTip === i ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
          ))}
        </div>
        {expandedTip !== null && (
          <div className="mt-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/60">
            <p className="text-xs text-slate-300 leading-relaxed">{UNIVERSAL_TIPS[expandedTip].desc}</p>
          </div>
        )}
      </Card>

      {/* Not Applicable - Grayed Out */}
      <Card className="bg-slate-900/30 border border-slate-700/30 p-5">
        <h3 className="text-slate-400 font-semibold text-sm flex items-center gap-2 mb-3">
          ⊘ Not Applicable to Smartphone Shooting
        </h3>
        <div className="space-y-1">
          {NOT_APPLICABLE.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
              <p className="text-xs text-slate-500 line-through">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3 italic">These features are designed for dedicated camera equipment or require advanced post-processing. Smartphones have automatic handling.</p>
      </Card>
    </div>
  );
}