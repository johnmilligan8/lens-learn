import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Settings, Copy, Check } from 'lucide-react';

export default function ExposureCalculator({ gear, results, date }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!gear || !results) return null;

  // Get primary camera & lens
  const primaryCamera = gear.cameras?.find(c => c.is_primary) || gear.cameras?.[0];
  const primaryLens = gear.lenses?.find(l => l.is_primary) || gear.lenses?.[0];

  if (!primaryCamera || !primaryLens) return null;

  // Crop factor lookup
  const cropFactors = {
    full_frame: 1,
    crop_sensor: 1.5,
    smartphone: 2.5,
  };
  const cropFactor = cropFactors[primaryCamera.sensor_size] || 1;

  // 500 Rule: Max shutter before star trails
  const focalLength = primaryLens.focal_length;
  const maxShutter = 500 / (focalLength * cropFactor);

  // Recommend 70% of max to be safe
  const recommendedShutter = Math.round(maxShutter * 0.7 * 10) / 10;

  // ISO recommendation based on:
  // - Moon illumination (higher moon = lower ISO needed)
  // - Bortle scale (darker sky = lower ISO needed)
  // - Lens aperture (wider = lower ISO)
  const moonIllum = results.moon?.illumination || 50;
  const bortle = results.bortle || 5;
  const apertureF = primaryLens.f_stop_widest || 2.8;

  // Base ISO calculation
  let baseISO = 1600; // Default for urban/suburban skies
  
  // Adjust for Bortle
  if (bortle <= 2) baseISO = 800;
  else if (bortle <= 3) baseISO = 1000;
  else if (bortle <= 4) baseISO = 1200;
  else if (bortle <= 5) baseISO = 1600;
  else if (bortle <= 6) baseISO = 2000;
  else if (bortle <= 7) baseISO = 3200;
  else baseISO = 6400;

  // Adjust for moon interference
  if (moonIllum > 60) baseISO = Math.round(baseISO * 1.5);
  else if (moonIllum > 30) baseISO = Math.round(baseISO * 1.2);
  else if (moonIllum < 10) baseISO = Math.round(baseISO * 0.8);

  // Adjust for aperture (wider apertures = lower ISO)
  const apertureFactors = {
    1.2: 0.7,
    1.4: 0.75,
    1.8: 0.85,
    2.0: 0.9,
    2.8: 1.0,
    4.0: 1.3,
    5.6: 1.6,
  };
  const closestAperture = Object.keys(apertureFactors).reduce((a, b) =>
    Math.abs(parseFloat(b) - apertureF) < Math.abs(parseFloat(a) - apertureF) ? b : a
  );
  baseISO = Math.round(baseISO * apertureFactors[closestAperture]);

  // Clamp to camera's reasonable range
  const maxISO = primaryCamera.iso_max || 3200;
  const recommendedISO = Math.min(baseISO, maxISO);

  // Format settings as string
  const settingsString = `ISO ${recommendedISO} | f/${apertureF} | ${recommendedShutter}"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(settingsString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Alternative exposure scenarios
  const scenarios = [
    {
      name: 'Single Shot',
      iso: recommendedISO,
      shutter: recommendedShutter,
      frames: 1,
      totalTime: recommendedShutter,
      snr: '1x',
      description: 'Quick composition test',
    },
    {
      name: 'High SNR Stack',
      iso: Math.max(800, Math.round(recommendedISO * 0.7)),
      shutter: recommendedShutter,
      frames: 20,
      totalTime: recommendedShutter * 20,
      snr: '4.5x',
      description: 'Reduced noise, cleaner MW (~7 min shoot)',
    },
    {
      name: 'Fast Stack',
      iso: recommendedISO,
      shutter: recommendedShutter,
      frames: 10,
      totalTime: recommendedShutter * 10,
      snr: '3.2x',
      description: 'Balance speed & noise (~3.5 min shoot)',
    },
  ];

  // Advice based on conditions
  let advice = '✅ Use these settings as your starting point.';
  if (recommendedISO >= maxISO * 0.9) {
    advice = '⚠️ ISO is near camera max. Stack multiple frames to reduce noise instead.';
  }
  if (moonIllum > 70) {
    advice = '🌕 High moon illumination. Shoot away from moon or wait for moonset.';
  }
  if (bortle > 6) {
    advice = '🏙️ Urban area. Stack to reduce noise or use wider lens if possible.';
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-purple-400" />
          <h3 className="text-white font-semibold">Exposure Calculator</h3>
        </div>
        <Badge variant="outline" className="text-xs">{primaryCamera.name} + {primaryLens.name.split(' ')[0]}</Badge>
      </div>

      {/* Main recommended settings */}
      <div className="bg-slate-800/60 rounded-xl p-4 mb-4">
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Recommended for Tonight</p>
        <div className="flex items-center justify-between">
          <p className="text-white font-mono text-xl font-bold">{settingsString}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="border-purple-500/40 text-purple-300 hover:bg-purple-900/20"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <p className="text-slate-500 text-xs mt-2">{advice}</p>
      </div>

      {/* Breakdown & details */}
      {expanded && (
        <div className="space-y-3 mb-4 pt-4 border-t border-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Max Shutter (500 Rule)</p>
              <p className="text-slate-300 font-mono">{maxShutter.toFixed(2)}"</p>
              <p className="text-slate-500 text-xs mt-0.5">Using {recommendedShutter}" = 70% safety margin</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Crop Factor</p>
              <p className="text-slate-300 font-mono">{cropFactor}x</p>
              <p className="text-slate-500 text-xs mt-0.5">{primaryCamera.sensor_size.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Moon Impact</p>
              <p className="text-slate-300">{results.moon?.illumination || 0}% illuminated</p>
              <p className="text-slate-500 text-xs mt-0.5">{results.moonImpact?.desc}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest">Light Pollution</p>
              <p className="text-slate-300">Bortle {results.bortle}</p>
              <p className="text-slate-500 text-xs mt-0.5">{results.bortleInfo?.label}</p>
            </div>
          </div>

          {/* Exposure Scenarios */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Exposure Scenarios</p>
            <div className="space-y-2">
              {scenarios.map((scenario, i) => (
                <div key={i} className="bg-slate-800/50 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white font-semibold text-sm">{scenario.name}</p>
                    <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">SNR: {scenario.snr}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                    <div>
                      <p className="text-slate-500">ISO</p>
                      <p className="text-white font-mono">{scenario.iso}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Frames</p>
                      <p className="text-white font-mono">{scenario.frames}x {scenario.shutter}"</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Time</p>
                      <p className="text-white font-mono">{(scenario.totalTime / 60).toFixed(1)} min</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs">{scenario.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative lenses */}
          {gear.lenses && gear.lenses.length > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Alternative Lenses</p>
              <div className="space-y-1">
                {gear.lenses.slice(0, 3).map((lens, i) => {
                  const altMaxShutter = 500 / (lens.focal_length * cropFactor);
                  const altRecShutter = Math.round(altMaxShutter * 0.7 * 10) / 10;
                  return (
                    <div key={i} className="bg-slate-800/50 rounded p-2 text-xs">
                      <p className="text-white font-semibold">{lens.name}</p>
                      <p className="text-slate-400">f/{lens.f_stop_widest} | {altRecShutter}" shutter</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-3">
            <p className="text-blue-300 text-xs font-semibold mb-1">💡 Pro Tips</p>
            <ul className="text-slate-400 text-xs space-y-1">
              <li>• Stacking reduces noise ~50% per doubling of frames</li>
              <li>• High SNR stack = slower but cleaner; fast stack = quick iteration</li>
              <li>• Use RAW for maximum post-processing flexibility</li>
              <li>• Focus manually on a bright star using live view</li>
            </ul>
          </div>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-purple-300 hover:text-purple-200 text-xs"
      >
        {expanded ? '− Hide Details' : '+ Show Details'}
      </Button>
    </Card>
  );
}