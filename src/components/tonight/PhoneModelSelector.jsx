import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const PHONE_DEVICES = {
  iphone: [
    { id: 'iphone16pro', label: 'iPhone 16 Pro/Max', capability: 'Full Night Mode + ProRaw' },
    { id: 'iphone15pro', label: 'iPhone 15 Pro/Max', capability: 'Full Night Mode + ProRaw' },
    { id: 'iphone14pro', label: 'iPhone 14 Pro/Max', capability: 'Night Mode + ProRaw' },
    { id: 'iphone13pro', label: 'iPhone 13 Pro/Max', capability: 'Night Mode (limited)' },
    { id: 'iphoneother', label: 'Other iPhone', capability: 'Basic Night Mode' },
  ],
  android: [
    { id: 'pixel9', label: 'Pixel 9 Pro / Pro XL', capability: 'Night Sight + Expert RAW' },
    { id: 'pixel8', label: 'Pixel 8 / 8 Pro', capability: 'Night Sight + Expert RAW' },
    { id: 'galaxy24', label: 'Galaxy S24 Ultra', capability: 'Nightography + Expert mode' },
    { id: 'galaxy23', label: 'Galaxy S23 Ultra', capability: 'Nightography (limited)' },
    { id: 'androidother', label: 'Other Android', capability: 'Basic night mode' },
  ],
  other: [
    { id: 'ipad', label: 'iPad (Air/Pro)', capability: 'Wider lens, Night Mode available' },
    { id: 'unsure', label: "I'm not sure", capability: 'We\'ll give general guidance' },
  ],
};

export default function PhoneModelSelector({ value, onChange, shooterMode }) {
  const [expanded, setExpanded] = useState(!value);

  if (shooterMode !== 'smartphone') return null;

  const selectedDevice = value ? Object.values(PHONE_DEVICES).flat().find(d => d.id === value) : null;

  return (
    <Card className="bg-blue-900/20 border border-blue-500/30 p-5 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-400" />
          <h3 className="text-white font-semibold text-sm">Your Phone / Tablet</h3>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {selectedDevice && !expanded && (
        <p className="text-xs text-blue-300 mt-1">
          {selectedDevice.label} — <span className="text-blue-200">{selectedDevice.capability}</span>
        </p>
      )}

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Warning */}
          <div className="flex gap-2 p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/20">
            <AlertCircle className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-200">
              <strong>Why?</strong> Different phones excel at different tasks. Knowing your device helps us give you exact settings.
            </p>
          </div>

          {/* iPhone */}
          <div>
            <p className="text-slate-300 text-xs uppercase tracking-widest font-semibold mb-2">📱 iPhone</p>
            <div className="space-y-1.5">
              {PHONE_DEVICES.iphone.map(device => (
                <button
                  key={device.id}
                  onClick={() => {
                    onChange(device.id);
                    setExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                    value === device.id
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{device.label}</p>
                    <p className="text-xs text-slate-400">{device.capability}</p>
                  </div>
                  {value === device.id && <Badge className="bg-blue-600 text-white text-[10px]">Selected</Badge>}
                </button>
              ))}
            </div>
          </div>

          {/* Android */}
          <div>
            <p className="text-slate-300 text-xs uppercase tracking-widest font-semibold mb-2">🤖 Android</p>
            <div className="space-y-1.5">
              {PHONE_DEVICES.android.map(device => (
                <button
                  key={device.id}
                  onClick={() => {
                    onChange(device.id);
                    setExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                    value === device.id
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{device.label}</p>
                    <p className="text-xs text-slate-400">{device.capability}</p>
                  </div>
                  {value === device.id && <Badge className="bg-blue-600 text-white text-[10px]">Selected</Badge>}
                </button>
              ))}
            </div>
          </div>

          {/* Tablets & Other */}
          <div>
            <p className="text-slate-300 text-xs uppercase tracking-widest font-semibold mb-2">💻 Tablets & Other</p>
            <div className="space-y-1.5">
              {PHONE_DEVICES.other.map(device => (
                <button
                  key={device.id}
                  onClick={() => {
                    onChange(device.id);
                    setExpanded(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                    value === device.id
                      ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                      : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{device.label}</p>
                    <p className="text-xs text-slate-400">{device.capability}</p>
                  </div>
                  {value === device.id && <Badge className="bg-blue-600 text-white text-[10px]">Selected</Badge>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}