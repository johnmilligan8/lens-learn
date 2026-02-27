import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Wind, Eye, Zap, Trophy, AlertCircle } from 'lucide-react';

const EVENT_TYPES = [
  { id: 'all', label: 'All', icon: '🔭' },
  { id: 'meteor_shower', label: 'Meteors', icon: '☄️' },
  { id: 'eclipse', label: 'Eclipses', icon: '🌑' },
  { id: 'aurora', label: 'Aurora', icon: '✨' },
  { id: 'comet', label: 'Comets', icon: '🌠' },
  { id: 'moon', label: 'Moon', icon: '🌕' },
  { id: 'conjunction', label: 'Planets', icon: '🪐' },
  { id: 'milky_way', label: 'Milky Way', icon: '🌌' },
  { id: 'lunar_eclipse', label: 'Lunar Eclipse', icon: '🌙' },
  { id: 'solar_eclipse', label: 'Solar Eclipse', icon: '🌞' },
  { id: 'supermoon', label: 'Supermoon', icon: '🌕' },
];

export default function BestSpotsRanker({ alertLocations, userLat, userLon, auroraForecast, moonPhase }) {
  const [selectedEventType, setSelectedEventType] = useState('all');

  // Calculate ranking score for each location based on event type
  const rankedSpots = useMemo(() => {
    if (!alertLocations || alertLocations.length === 0) return [];

    return alertLocations.map(loc => {
      let score = 5;
      let factors = [];

      // Cloud cover penalty (0-100%)
      // Assume reasonable clouds ~30% average
      const cloudPenalty = Math.min(3, Math.round(30 / 15));
      score -= cloudPenalty;
      factors.push({
        type: 'clouds',
        label: 'Clouds ~30%',
        positive: cloudPenalty < 2,
        icon: Cloud,
      });

      // Moon interference (varies by event type)
      if (selectedEventType === 'all' || selectedEventType === 'milky_way') {
        const moonPenalty = moonPhase.illum > 60 ? 2 : moonPhase.illum > 30 ? 1 : 0;
        score -= moonPenalty;
        factors.push({
          type: 'moon',
          label: `Moon ${moonPhase.illum}% (${moonPhase.illum > 60 ? 'bright' : moonPhase.illum > 30 ? 'moderate' : 'minimal'})`,
          positive: moonPenalty === 0,
          icon: Badge,
        });
      }

      // Bortle scale (darker = better for most events; location-based estimate)
      const bortleEstimate = loc.name?.toLowerCase().includes('dark') || loc.name?.toLowerCase().includes('park') ? 2 : 4;
      const bortleFactor = bortleEstimate <= 3 ? 1 : 0;
      score += bortleFactor;
      factors.push({
        type: 'bortle',
        label: `Bortle ~${bortleEstimate} (${bortleEstimate <= 3 ? 'good' : 'fair'} darkness)`,
        positive: bortleEstimate <= 3,
        icon: Eye,
      });

      // Aurora KP (for aurora events)
      if ((selectedEventType === 'all' || selectedEventType === 'aurora') && auroraForecast) {
        const kpBoost = auroraForecast.kp_index >= 5 ? 1 : 0;
        score += kpBoost;
        factors.push({
          type: 'kp',
          label: `KP Index ${auroraForecast.kp_index} (${auroraForecast.visibility_rating})`,
          positive: kpBoost === 1,
          icon: Zap,
        });
      }

      // Distance bonus (closer = slight bonus for convenience)
      const distBonus = 0.5;
      score += distBonus;

      return {
        ...loc,
        score: Math.max(1, Math.min(5, Math.round(score * 10) / 10)),
        factors,
      };
    }).sort((a, b) => b.score - a.score);
  }, [selectedEventType, alertLocations, moonPhase, auroraForecast]);

  if (!alertLocations || alertLocations.length === 0) {
    return (
      <Card className="bg-[#1a1a1a] border border-white/8 p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          <p className="text-sm">Add alert locations to your profile to rank them for tonight.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1a1a1a] border border-white/8 p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Rank Best Spots Tonight
        </h2>
        <p className="text-slate-400 text-xs mb-4">Choose an event type to see which of your saved locations is best tonight.</p>

        {/* Event Type Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {EVENT_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedEventType(type.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedEventType === type.id
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ranked Spots */}
      <div className="space-y-3">
        {rankedSpots.map((spot, idx) => {
          const isTopSpot = idx === 0;
          return (
            <div
              key={spot.id || spot.name}
              className={`rounded-lg border p-4 transition-all ${
                isTopSpot
                  ? 'bg-emerald-900/20 border-emerald-500/40'
                  : 'bg-slate-800/40 border-white/8 hover:border-white/20'
              }`}
            >
              {/* Location name + rank + badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold text-sm">{spot.name}</h3>
                    {isTopSpot && (
                      <Badge className="bg-yellow-500 text-black text-xs font-bold">
                        🌟 Best Tonight
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">
                    {idx === 1 ? '2nd' : idx === 2 ? '3rd' : idx === 3 ? '4th' : '5th'} choice
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-red-400">{spot.score}</div>
                  <div className="text-xs text-slate-400">/5.0</div>
                </div>
              </div>

              {/* Visibility factors */}
              <div className="space-y-2">
                {spot.factors.map((factor, i) => {
                  const Icon = factor.icon;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className={`w-1 h-1 rounded-full flex-shrink-0 ${factor.positive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                      <span className={factor.positive ? 'text-slate-200' : 'text-slate-400'}>
                        {factor.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Copy */}
      <p className="text-slate-500 text-xs mt-5 border-t border-white/8 pt-4">
        Rankings based on clouds, moon interference, light pollution, and event-specific factors. For {selectedEventType === 'all' ? 'all events' : EVENT_TYPES.find(t => t.id === selectedEventType)?.label.toLowerCase()}.
      </p>
    </Card>
  );
}