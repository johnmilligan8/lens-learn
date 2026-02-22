import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Compass, Sun, Mountain, Eye } from 'lucide-react';

export default function ForegroundCompositionGuide({ location, date, gear }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate golden hour times (simplified)
  const getGoldenHours = (dateStr) => {
    if (!dateStr) return { sunrise: '6:30 AM', sunset: '7:45 PM', twilight: '8:20 PM' };
    const d = new Date(dateStr);
    const month = d.getMonth();
    const isWinter = month < 2 || month > 10;
    return {
      sunrise: isWinter ? '7:15 AM' : '5:45 AM',
      sunset: isWinter ? '5:30 PM' : '8:30 PM',
      twilight: isWinter ? '6:10 PM' : '9:15 PM',
    };
  };

  const goldenHours = getGoldenHours(date);

  // Get compass direction based on location name (mock implementation)
  const getDirectionAdvice = (loc) => {
    if (!loc) return { direction: 'South', reason: 'toward Galactic Core' };
    const locLower = loc.toLowerCase();
    if (locLower.includes('mountain') || locLower.includes('hill')) {
      return { direction: 'West-Southwest', reason: 'away from uplift, toward Milky Way arch' };
    }
    if (locLower.includes('valley') || locLower.includes('desert')) {
      return { direction: 'North-South', reason: 'check both for horizon elements' };
    }
    return { direction: 'South', reason: 'toward Galactic Core (Northern Hemisphere)' };
  };

  const directionAdvice = getDirectionAdvice(location);

  const compositionTips = useMemo(() => [
    {
      icon: Mountain,
      title: 'Leading Lines',
      tips: [
        '• Use foreground ridges, roads, or rivers to lead the eye to the Milky Way',
        '• Aim for the "rule of thirds" — position horizon at 1/3 from top',
        '• Converging lines create depth: railroad tracks, fence lines work great',
      ],
    },
    {
      icon: Sun,
      title: 'Golden Hour + Twilight Foreground',
      tips: [
        `• Shoot foreground at ${goldenHours.sunset} (golden light on landscape)`,
        `• Wait until ${goldenHours.twilight} for twilight blue (sky still has color)`,
        '• Blend foreground from golden hour with MW from full dark for best contrast',
      ],
    },
    {
      icon: Compass,
      title: `Best Direction: ${directionAdvice.direction}`,
      tips: [
        `• Face ${directionAdvice.direction} — ${directionAdvice.reason}`,
        '• Scout the location in daylight to identify foreground interest',
        '• Avoid light pollution sources in your frame (towns, road lights)',
      ],
    },
    {
      icon: Eye,
      title: 'Depth & Separation',
      tips: [
        `• Use a wider focal length (${gear?.primary_lens ? Math.round(gear.primary_lens.focal_length) + 'mm' : '14–24mm'}) for dramatic foreground`,
        '• Position a tree, rock, or structure in the foreground (1–3 meters away)',
        '• Light the foreground with a headlamp or long exposure to separate it from sky',
      ],
    },
  ], [goldenHours, directionAdvice, gear]);

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-semibold">Foreground Composition for {location || 'Your Location'}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-amber-300 hover:text-amber-200"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {!expanded ? (
        <p className="text-slate-400 text-sm">
          Best angle: <span className="text-amber-300 font-semibold">{directionAdvice.direction}</span> · Golden hour: <span className="text-amber-300 font-semibold">{goldenHours.sunset}</span>
        </p>
      ) : (
        <div className="space-y-4 mt-4 pt-4 border-t border-slate-700">
          {compositionTips.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div key={idx} className="bg-slate-800/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-amber-400" />
                  <h4 className="text-white font-semibold text-sm">{section.title}</h4>
                </div>
                <ul className="space-y-1">
                  {section.tips.map((tip, i) => (
                    <li key={i} className="text-slate-400 text-xs leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-4">
            <p className="text-blue-300 text-xs font-semibold mb-1">💡 Scout Tip</p>
            <p className="text-slate-400 text-xs">Visit during daylight to identify foreground elements (trees, rocks, structures). Return at twilight with a headlamp to light paint or use long exposures for dynamic foreground separation.</p>
          </div>
        </div>
      )}
    </Card>
  );
}