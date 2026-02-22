import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Loader2, Lightbulb, RefreshCw, Camera } from 'lucide-react';

export default function BestShotSuggestions({ gear, results, weather, date }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateSuggestions = async () => {
    if (!gear || !results) return;
    setLoading(true);

    const prompt = `You are an expert astrophotography advisor. Given this specific gear configuration and sky conditions, suggest 3 specific shot setups for the night of ${date}.

GEAR:
- Camera: ${gear.camera_model || 'Not specified'}
- Sensor: ${gear.sensor_size}
- Widest lens: ${gear.widest_lens_focal_length}mm at f/${gear.f_stop_widest}
- Max ISO: ${gear.iso_max}
- Max shutter speed (untracked): ${gear.max_shutter_speed}s
- Equipment notes: ${gear.equipment_notes || 'None'}

SKY CONDITIONS:
- Location: ${results.coords?.name}
- Moon phase: ${results.moon.name} (${results.moon.illumination}% illuminated)
- Galactic core peak: ${results.gcData.peakTime?.toLocaleTimeString() || 'N/A'} at ${results.gcData.peakAlt}°
- Bortle scale: ${results.bortle}
${weather ? `- Cloud cover: ${weather.current.cloud}%
- Visibility rating: ${weather.current.cloud <= 20 ? 'Excellent' : weather.current.cloud <= 60 ? 'Good' : 'Poor'}` : ''}

For each shot, provide:
1. Shot name (e.g., "Wide Milky Way Panorama")
2. Focal length, aperture, ISO, shutter speed (3-second rule if not tracking)
3. Subject/composition (what to point at)
4. Best time during the night
5. Why this works with the user's gear

Format as numbered list. Be specific and actionable.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
    });

    setSuggestions(res);
    setLoading(false);
  };

  useEffect(() => {
    if (gear && results) {
      setSuggestions(null);
    }
  }, [gear, results]);

  if (!gear || !results) {
    return null;
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" /> AI Best Shot Suggestions
        </h3>
        {!suggestions && (
          <Button
            onClick={generateSuggestions}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-300 hover:bg-amber-900/20 text-xs"
          >
            {loading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading...</> : <><Camera className="w-3 h-3 mr-1" /> Generate</>}
          </Button>
        )}
      </div>

      {suggestions ? (
        <>
          <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto mb-3">
            {suggestions}
          </div>
          <Button
            onClick={() => setSuggestions(null)}
            size="sm"
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> New Suggestions
          </Button>
        </>
      ) : (
        <p className="text-slate-500 text-sm">Configure your gear above to get AI-powered shot suggestions tailored to your equipment.</p>
      )}
    </Card>
  );
}