import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import {
  MapPin, Moon, Eye, AlertCircle, Check, Loader2,
  Sunset, Clock, Star, CloudOff
} from 'lucide-react';

const BORTLE_INFO = [
  { level: '1-2', label: 'Pristine Dark Sky', color: 'text-emerald-400', desc: 'Ideal — Milky Way casts visible shadows' },
  { level: '3-4', label: 'Rural Sky', color: 'text-blue-400', desc: 'Very good — zodiacal light visible' },
  { level: '5-6', label: 'Suburban Sky', color: 'text-yellow-400', desc: 'Moderate — Milky Way visible but washed' },
  { level: '7-9', label: 'Urban Sky', color: 'text-red-400', desc: 'Poor — significant light pollution' },
];

function getMoonPhase(date) {
  const knownNewMoon = new Date('2000-01-06');
  const lunarCycle = 29.53058867;
  const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;
  const pct = Math.round((Math.abs(phase - lunarCycle / 2) / (lunarCycle / 2)) * 100);
  const illum = Math.round((1 - Math.cos((phase / lunarCycle) * 2 * Math.PI)) / 2 * 100);
  let name = 'New Moon';
  if (phase > 1 && phase < 7.4) name = 'Waxing Crescent';
  else if (phase >= 7.4 && phase < 8.4) name = 'First Quarter';
  else if (phase >= 8.4 && phase < 14.8) name = 'Waxing Gibbous';
  else if (phase >= 14.8 && phase < 15.8) name = 'Full Moon';
  else if (phase >= 15.8 && phase < 22.1) name = 'Waning Gibbous';
  else if (phase >= 22.1 && phase < 23.1) name = 'Last Quarter';
  else if (phase >= 23.1 && phase < 29.5) name = 'Waning Crescent';
  return { name, illumination: illum, phase };
}

function getGalacticCoreVisibility(date, lat = 35) {
  const month = date.getMonth(); // 0-11
  // Galactic core best visible April–October in N hemisphere
  const visible = month >= 3 && month <= 9;
  const peak = month >= 5 && month <= 7; // Jun-Aug peak
  return { visible, peak };
}

export default function PlannerTool() {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState(null);
  const [aiTips, setAiTips] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const calculate = () => {
    const d = new Date(date + 'T12:00:00');
    const moon = getMoonPhase(d);
    const core = getGalacticCoreVisibility(d);
    const moonOk = moon.illumination < 35;
    
    let visibility = 'poor';
    if (core.visible && moonOk) visibility = core.peak ? 'excellent' : 'good';
    else if (core.visible) visibility = 'moderate';

    const bestStartHour = moon.illumination > 50 ? '11:30 PM' : '10:00 PM';

    setResults({
      moon,
      core,
      moonOk,
      visibility,
      bestTime: core.visible ? `${bestStartHour} – 3:00 AM` : 'Not optimal',
      lensRec: 'f/2.8 or wider, 14–24mm',
      isoRec: 'ISO 3200 – 6400',
      shutterRec: '15–25 seconds (500 rule)',
    });
    setAiTips('');
  };

  const getAITips = async () => {
    if (!location || !date) return;
    setLoadingAI(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `I'm planning to photograph the Milky Way at "${location}" on ${date}. Give me 3 specific, practical tips for this location and season. Be concise (2-3 sentences per tip). Include things like best vantage points, local light pollution considerations, and any seasonal considerations.`,
      add_context_from_internet: true,
    });
    setAiTips(res);
    setLoadingAI(false);
  };

  const visColors = {
    excellent: 'bg-emerald-900/20 border-emerald-500/40 text-emerald-400',
    good: 'bg-blue-900/20 border-blue-500/40 text-blue-400',
    moderate: 'bg-yellow-900/20 border-yellow-500/40 text-yellow-400',
    poor: 'bg-red-900/20 border-red-500/40 text-red-400',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <MapPin className="w-9 h-9 text-purple-400" /> Milky Way Planner
        </h1>
        <p className="text-slate-400 text-lg">Plan the perfect night shoot with precision.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Your Shoot Details</h2>
            <div className="space-y-5">
              <div>
                <Label className="text-slate-300 mb-2 block">Location</Label>
                <Input
                  placeholder="e.g. Joshua Tree, CA"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={calculate}
                disabled={!location || !date}
                className="w-full bg-purple-600 hover:bg-purple-700 h-11"
              >
                Calculate Visibility
              </Button>
              {results && (
                <Button
                  onClick={getAITips}
                  disabled={loadingAI}
                  variant="outline"
                  className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-900/20 h-11"
                >
                  {loadingAI ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting AI Tips...</> : '✨ Get AI Location Tips'}
                </Button>
              )}
            </div>
          </Card>

          {/* Bortle Scale Guide */}
          <Card className="bg-slate-900/60 border-slate-800 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-400" /> Bortle Scale Guide
            </h3>
            <div className="space-y-3">
              {BORTLE_INFO.map(b => (
                <div key={b.level} className="flex items-start gap-3">
                  <span className={`text-sm font-bold w-12 flex-shrink-0 ${b.color}`}>{b.level}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{b.label}</p>
                    <p className="text-slate-500 text-xs">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Results */}
        <div className="space-y-5">
          {results ? (
            <>
              {/* Visibility Card */}
              <Card className={`border p-7 ${visColors[results.visibility]}`}>
                <div className="flex items-center gap-4 mb-3">
                  <Eye className="w-12 h-12" />
                  <div>
                    <p className="text-slate-400 text-sm">Conditions for</p>
                    <h3 className="text-2xl font-bold text-white capitalize">{results.visibility} visibility</h3>
                    <p className="text-slate-300 text-sm">{location}</p>
                  </div>
                </div>
              </Card>

              {/* Moon & Core */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-900/60 border-slate-800 p-5">
                  <Moon className="w-7 h-7 text-blue-300 mb-2" />
                  <p className="text-slate-400 text-xs mb-1">MOON PHASE</p>
                  <p className="text-white font-bold text-lg">{results.moon.name}</p>
                  <p className="text-slate-500 text-sm">{results.moon.illumination}% illuminated</p>
                </Card>
                <Card className="bg-slate-900/60 border-slate-800 p-5">
                  <Clock className="w-7 h-7 text-purple-300 mb-2" />
                  <p className="text-slate-400 text-xs mb-1">BEST WINDOW</p>
                  <p className="text-white font-bold text-lg">{results.bestTime}</p>
                  <p className="text-slate-500 text-sm">{results.core.visible ? results.core.peak ? '🌟 Peak season!' : 'Core visible' : 'Core not visible'}</p>
                </Card>
              </div>

              {/* Camera Settings Rec */}
              <Card className="bg-slate-900/60 border-slate-800 p-6">
                <h3 className="text-white font-semibold mb-4">📷 Recommended Settings</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Aperture', value: 'f/1.8–2.8' },
                    { label: 'ISO', value: '3200–6400' },
                    { label: 'Shutter', value: '15–25s' },
                  ].map(s => (
                    <div key={s.label} className="bg-slate-800/60 rounded-lg p-3">
                      <p className="text-slate-400 text-xs mb-1">{s.label}</p>
                      <p className="text-white font-semibold text-sm">{s.value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* AI Tips */}
              {aiTips && (
                <Card className="bg-purple-900/10 border-purple-500/30 p-6">
                  <h3 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
                    ✨ AI Tips for {location}
                  </h3>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{aiTips}</p>
                </Card>
              )}
            </>
          ) : (
            <Card className="bg-slate-900/60 border-slate-800 p-16 text-center">
              <MapPin className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-500 mb-2">Enter your shoot details</h3>
              <p className="text-slate-600">We'll calculate moon phase, galactic core visibility, and optimal timing.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}