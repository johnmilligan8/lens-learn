import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Compass, Sun, Mountain, Eye, Loader2, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ForegroundCompositionGuide({ location, date, gear, lat, lon }) {
  const [expanded, setExpanded] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Get AI-powered location-specific analysis
  useEffect(() => {
    if (!location || !lat || !lon) return;
    getLocationAnalysis();
  }, [location, lat, lon]);

  const getLocationAnalysis = async () => {
    setLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a landscape/astrophotography expert. Analyze this location for Milky Way foreground composition:

Location: ${location}
Coordinates: ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°W

Provide ONLY a JSON response with:
1. "best_direction": string like "South" or "Southwest" (cardinal direction toward Galactic Core based on latitude)
2. "terrain_type": string like "mountain", "desert", "forest", "urban", "lake"
3. "foreground_elements": array of 3-5 likely foreground features (trees, rocks, structures, etc.)
4. "lighting_technique": string describing best way to light the foreground (e.g., "gentle headlamp painting", "long exposure LED", "reflector fill")
5. "focal_length_recommendation": number in mm (e.g., 16, 24, 35)
6. "shooting_position_tip": string with specific angle/height advice (e.g., "shoot from low angle to emphasize foreground depth")
7. "hazards": array of things to avoid (cliffs, water, obstacles)

Be specific to this exact location. JSON only.`,
        response_json_schema: {
          type: 'object',
          properties: {
            best_direction: { type: 'string' },
            terrain_type: { type: 'string' },
            foreground_elements: { type: 'array', items: { type: 'string' } },
            lighting_technique: { type: 'string' },
            focal_length_recommendation: { type: 'number' },
            shooting_position_tip: { type: 'string' },
            hazards: { type: 'array', items: { type: 'string' } },
          }
        },
        add_context_from_internet: true,
      });
      setAiAnalysis(res);
    } catch (err) {
      console.error('Location analysis error:', err);
    }
    setLoading(false);
  };

  // Get compass direction based on AI or fallback
  const getDirectionAdvice = (loc) => {
    if (aiAnalysis) {
      return { direction: aiAnalysis.best_direction, reason: 'toward Galactic Core (AI-optimized for your location)' };
    }
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
        `• Use ${aiAnalysis?.focal_length_recommendation ? `${aiAnalysis.focal_length_recommendation}mm` : gear?.primary_lens ? Math.round(gear.primary_lens.focal_length) + 'mm' : '14–24mm'} lens for dramatic foreground`,
        `• ${aiAnalysis?.foreground_elements?.[0] ? `Focus on: ${aiAnalysis.foreground_elements.slice(0, 2).join(', ')}` : 'Position a tree, rock, or structure in the foreground (1–3 meters away)'}`,
        `• ${aiAnalysis?.lighting_technique ? `Lighting: ${aiAnalysis.lighting_technique}` : 'Light the foreground with a headlamp or long exposure to separate it from sky'}`,
      ],
    },
  ], [goldenHours, directionAdvice, gear, aiAnalysis]);

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
          {aiAnalysis && <span className="text-amber-300 ml-2">✨ AI-optimized</span>}
        </p>
      ) : (
        <div className="space-y-4 mt-4 pt-4 border-t border-slate-700">
          {/* AI Analysis Panel */}
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing location...
            </div>
          ) : aiAnalysis ? (
            <div className="bg-purple-900/20 border border-purple-500/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h4 className="text-white font-semibold text-sm">AI Location Analysis</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold">Terrain</p>
                  <p className="text-white capitalize">{aiAnalysis.terrain_type}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold">Focal Length</p>
                  <p className="text-white">{aiAnalysis.focal_length_recommendation}mm</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-xs mb-1">Position Tip</p>
                <p className="text-white text-xs leading-relaxed">{aiAnalysis.shooting_position_tip}</p>
              </div>

              {aiAnalysis.hazards?.length > 0 && (
                <div>
                  <p className="text-red-300 font-semibold text-xs mb-1">⚠️ Watch For</p>
                  <ul className="space-y-0.5">
                    {aiAnalysis.hazards.map((h, i) => (
                      <li key={i} className="text-slate-400 text-xs">• {h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

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