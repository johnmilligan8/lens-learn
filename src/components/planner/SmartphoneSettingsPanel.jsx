import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Smartphone } from 'lucide-react';

export default function SmartphoneSettingsPanel({ results, gear, date }) {
  if (!results) return null;

  const recommendations = {
    moonLow: results.moon.illumination <= 20,
    conditionsGood: results.overallScore === 'excellent' || results.overallScore === 'good',
    peakWindow: results.bestWindow !== 'Core too low this date',
  };

  return (
    <Card className="bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-500/30 p-5">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm">
        <Smartphone className="w-4 h-4 text-blue-400" /> Smartphone Night Photography Settings
      </h3>

      <div className="space-y-4">
        {/* iPhone Quick Setup */}
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-white font-medium text-xs mb-2 flex items-center gap-1">
            📱 iPhone Setup (Pro / Pro Max Recommended)
          </p>
          <div className="text-xs text-slate-300 space-y-1 ml-4">
            <p><strong>App:</strong> Default Camera or ProRaw app for ISO control</p>
            <p><strong>Mode:</strong> Night Mode (auto) or Pro mode (manual shutter 10–30s)</p>
            <p><strong>Shutter:</strong> Start 10s, extend to 15–30s if you're steady</p>
            <p><strong>ISO:</strong> Auto (device manages) or Expert RAW ~400–1600</p>
            <p><strong>Focus:</strong> Tap brightest star, lock with AF lock</p>
          </div>
        </div>

        {/* Android Quick Setup */}
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-white font-medium text-xs mb-2 flex items-center gap-1">
            📱 Android Setup (Pixel 9 / Galaxy S24)
          </p>
          <div className="text-xs text-slate-300 space-y-1 ml-4">
            <p><strong>App:</strong> Google Camera (Pixel) or Samsung Camera (Galaxy)</p>
            <p><strong>Mode:</strong> Night Sight (Pixel) or Nightography (Galaxy)</p>
            <p><strong>Shutter:</strong> Auto, usually 2–10s (tap to adjust if available)</p>
            <p><strong>ISO:</strong> Auto managed by Night Sight algorithm</p>
            <p><strong>Focus:</strong> Tap sky area, let autofocus lock</p>
          </div>
        </div>

        {/* Moon Impact */}
        <div className={`rounded-lg p-3 border ${recommendations.moonLow ? 'bg-emerald-900/30 border-emerald-500/30' : 'bg-orange-900/30 border-orange-500/30'}`}>
          <p className={`text-xs font-semibold ${recommendations.moonLow ? 'text-emerald-300' : 'text-orange-300'}`}>
            {recommendations.moonLow ? '✅ Moon Impact: Low' : '⚠️ Moon Impact: Moderate–High'}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            {recommendations.moonLow
              ? 'Perfect conditions — moon is low/dark. Your phone sensor will shine.'
              : 'Moon will brighten the scene. Shoot when moon is below horizon for best contrast.'}
          </p>
        </div>

        {/* Recommended Gear */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <p className="text-white font-medium text-xs mb-2">🎯 What to Bring</p>
          <div className="text-xs text-blue-300 space-y-1 ml-4">
            <p>✓ Smartphone (fully charged)</p>
            <p>✓ Mini-tripod or phone clamp (steady = sharper photos)</p>
            <p>✓ Power bank (20,000+ mAh for long night)</p>
            <p>✓ Red headlamp (preserves night vision)</p>
            <p>✓ Warm layers (phones can get cold outdoors)</p>
          </div>
        </div>

        {/* Technique Tips */}
        <div className="bg-slate-800/60 rounded-lg p-3">
          <p className="text-white font-medium text-xs mb-2">💡 Field Technique</p>
          <div className="text-xs text-slate-300 space-y-1 ml-4">
            <p><strong>Stability:</strong> Use tripod or lean phone against object to prevent movement</p>
            <p><strong>One Tap:</strong> Press shutter once, then hands off until exposure completes</p>
            <p><strong>Framing:</strong> Rule of thirds — put horizon in lower 1/3 to emphasize sky</p>
            <p><strong>Wait:</strong> Let auto-processing finish (5–10s after shutter). Don't move phone.</p>
          </div>
        </div>

        {/* Best Shooting Window */}
        {recommendations.peakWindow && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 font-semibold text-xs">⭐ Best Shooting Window</p>
            <p className="text-xs text-slate-300 mt-1">{results.bestWindow}</p>
            <p className="text-xs text-slate-500 mt-1">Milky Way core is highest in sky → cleaner horizon-free shots.</p>
          </div>
        )}

        {/* Reality Check */}
        <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-3">
          <p className="text-slate-400 font-medium text-xs">📌 Know the Limits</p>
          <p className="text-xs text-slate-500 mt-1">
            Smartphones are fantastic for night sky, but sensor size & optics are smaller than cameras. 
            Expect beautiful wide-angle Milky Way shots, but not pinpoint star details. No manual focus tracking, no stacking, no long exposures beyond 30s.
          </p>
        </div>
      </div>
    </Card>
  );
}