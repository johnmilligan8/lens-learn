import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, Plus, X, Loader2, Star, Lock, Trophy,
  Cloud, Moon, Wind, Zap, ChevronDown
} from 'lucide-react';

// ── Astronomy helpers ────────────────────────────────────────────────────────

function getMoonPhase() {
  const knownNew = new Date('2000-01-06T00:00:00Z');
  const cycle = 29.53058867;
  const diff = (Date.now() - knownNew.getTime()) / 86400000;
  const phase = ((diff % cycle) + cycle) % cycle;
  const illum = Math.round((1 - Math.cos((phase / cycle) * 2 * Math.PI)) / 2 * 100);
  return { phase, illum };
}

function getGCPeakAlt(lat, lon) {
  const today = new Date().toISOString().split('T')[0];
  let peakAlt = -90;
  for (let h = 18; h < 30; h++) {
    const d = new Date(today + 'T00:00:00Z');
    d.setTime(d.getTime() + h * 3600000);
    const jd = d.getTime() / 86400000 + 2440587.5;
    const T = (jd - 2451545.0) / 36525;
    let g = 280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * 0.000387933;
    g = ((g % 360) + 360) % 360;
    const lst = ((g + lon) % 360 + 360) % 360;
    const ra = 266.4, dec = -29.0;
    const ha = (((lst - ra) % 360 + 360) % 360) * Math.PI / 180;
    const decR = dec * Math.PI / 180;
    const latR = lat * Math.PI / 180;
    const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(ha);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
    if (alt > peakAlt) peakAlt = alt;
  }
  return peakAlt;
}

function estimateBortle(lat, lon, name = '') {
  const n = (name || '').toLowerCase();
  if (/national park|dark sky|wilderness|bryce|arches|capitol reef|death valley|big bend|rural/.test(n)) return 2;
  if (/mountain|peak|summit|desert|canyon|valley|forest|lake/.test(n)) return 3;
  if (/suburb|town|village|county/.test(n)) return 6;
  if (/new york|los angeles|chicago|houston|phoenix|london|tokyo|paris/.test(n)) return 8;
  if (/city|urban|downtown|metro/.test(n)) return 7;
  if (Math.abs(lat) > 50) return 3;
  return 4;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

function scoreLocation(locData, eventType, kpIndex) {
  const { cloud, wind, lat, lon, name } = locData;
  const { illum: moonIllum } = getMoonPhase();
  const bortle = estimateBortle(lat, lon, name);
  const month = new Date().getMonth(); // 0-indexed
  const inMWSeason = month >= 2 && month <= 9;
  const gcAlt = getGCPeakAlt(lat, lon);

  let score = 100;
  const factors = [];

  // Cloud cover (0–40 pts)
  const cloudScore = Math.round(Math.max(0, 40 - cloud * 0.5));
  score -= (40 - cloudScore);
  factors.push({
    good: cloud < 30,
    text: `${cloud}% cloud cover`,
  });

  // Bortle (0–20 pts)
  const bortleScore = Math.round(Math.max(0, 20 - (bortle - 1) * 2.5));
  score -= (20 - bortleScore);
  factors.push({ good: bortle <= 3, text: `Bortle ${bortle} (${bortle <= 3 ? 'dark sky' : bortle <= 5 ? 'suburban' : 'light polluted'})` });

  // Wind (0–10 pts)
  const windScore = wind < 15 ? 10 : wind < 25 ? 6 : wind < 35 ? 3 : 0;
  score -= (10 - windScore);
  factors.push({ good: wind < 20, text: `Wind ${wind} km/h` });

  // Event-specific (0–30 pts)
  if (eventType === 'milky_way') {
    const moonPenalty = Math.round(moonIllum * 0.2);
    score -= moonPenalty;
    factors.push({ good: moonIllum < 20, text: `Moon ${moonIllum}% illuminated` });

    const seasonBonus = inMWSeason ? 0 : -15;
    score += seasonBonus;
    factors.push({ good: inMWSeason, text: inMWSeason ? 'Milky Way in season' : 'Off-season (winter)' });

    const altBonus = gcAlt > 30 ? 0 : gcAlt > 15 ? -5 : -15;
    score += altBonus;
    factors.push({ good: gcAlt > 20, text: `Core peaks at ${Math.round(Math.max(gcAlt, 0))}° altitude` });
  } else if (eventType === 'aurora') {
    const kp = kpIndex || 2;
    const kpBonus = kp >= 7 ? 0 : kp >= 5 ? -5 : kp >= 3 ? -15 : -25;
    score += kpBonus;
    factors.push({ good: kp >= 4, text: `KP index ${kp}` });

    // Higher latitude is better for aurora
    const latBonus = lat > 60 ? 0 : lat > 50 ? -5 : lat > 40 ? -15 : -25;
    score += latBonus;
    factors.push({ good: lat > 50, text: `Latitude ${lat.toFixed(1)}° (${lat > 55 ? 'ideal' : lat > 45 ? 'possible' : 'far south'})` });
  } else if (eventType === 'meteor_shower') {
    const moonPenalty = Math.round(moonIllum * 0.15);
    score -= moonPenalty;
    factors.push({ good: moonIllum < 30, text: `Moon ${moonIllum}% illuminated` });
    factors.push({ good: true, text: 'Meteors visible from any location with clear sky' });
  } else if (eventType === 'eclipse') {
    factors.push({ good: true, text: 'Eclipse visibility depends on your region' });
  } else if (eventType === 'comet') {
    const moonPenalty = Math.round(moonIllum * 0.1);
    score -= moonPenalty;
    factors.push({ good: moonIllum < 40, text: `Moon ${moonIllum}% — ${moonIllum < 40 ? 'manageable' : 'adds glow'}` });
    factors.push({ good: bortle <= 4, text: 'Dark sky helps comet visibility' });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)));
  return { score: finalScore, factors, bortle, moonIllum, gcAlt: Math.round(gcAlt) };
}

// ── Event options ─────────────────────────────────────────────────────────────

const EVENT_OPTIONS = [
  { id: 'milky_way', label: 'Milky Way', emoji: '🌌' },
  { id: 'aurora', label: 'Northern Lights', emoji: '🌠' },
  { id: 'meteor_shower', label: 'Meteor Shower', emoji: '☄️' },
  { id: 'eclipse', label: 'Eclipse', emoji: '🌑' },
  { id: 'comet', label: 'Comet', emoji: '🪐' },
];

const FREE_LOCATION_LIMIT = 2;
const PAID_LOCATION_LIMIT = 5;

// ── Main Component ────────────────────────────────────────────────────────────

export default function MultiLocationPredictor({ isSubscribed, homeLocation, homeCoords }) {
  const [locations, setLocations] = useState(() => {
    if (homeLocation && homeCoords) {
      return [{ id: 'home', name: homeLocation, lat: homeCoords.lat, lon: homeCoords.lon, loaded: false }];
    }
    return [];
  });
  const [inputVal, setInputVal] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('milky_way');
  const [rankings, setRankings] = useState(null);
  const [ranking, setRanking] = useState(false);
  const [kpIndex, setKpIndex] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);

  const limit = isSubscribed ? PAID_LOCATION_LIMIT : FREE_LOCATION_LIMIT;

  const geocodeLocation = async (name) => {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Give me the latitude and longitude of: "${name}". Return ONLY a JSON object with "lat" (number), "lon" (number), "display_name" (string, clean short city name).`,
      response_json_schema: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lon: { type: 'number' },
          display_name: { type: 'string' }
        }
      }
    });
    return res;
  };

  const addLocation = async () => {
    if (!inputVal.trim()) return;
    if (locations.length >= limit) {
      if (!isSubscribed) { setShowUpsell(true); return; }
      return;
    }
    setAddingLocation(true);
    const geo = await geocodeLocation(inputVal.trim());
    if (geo?.lat && geo?.lon) {
      setLocations(prev => [...prev, {
        id: Date.now().toString(),
        name: geo.display_name || inputVal.trim(),
        lat: geo.lat,
        lon: geo.lon,
        loaded: false,
      }]);
    }
    setInputVal('');
    setAddingLocation(false);
    setRankings(null);
  };

  const removeLocation = (id) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    setRankings(null);
  };

  const fetchWeather = async (lat, lon) => {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'cloud_cover,wind_speed_10m',
      timezone: 'UTC',
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    const data = await res.json();
    return {
      cloud: Math.round(data.current?.cloud_cover ?? 50),
      wind: Math.round((data.current?.wind_speed_10m ?? 10) * 3.6), // m/s → km/h
    };
  };

  const fetchKp = async () => {
    try {
      const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
      const data = await res.json();
      // Last entry is most recent [time, kp]
      const last = data[data.length - 1];
      return parseFloat(last?.[1] ?? 2);
    } catch {
      return 2;
    }
  };

  const runRankings = async () => {
    if (locations.length === 0) return;
    setRanking(true);
    setRankings(null);

    // Fetch KP if aurora
    let kp = kpIndex;
    if (selectedEvent === 'aurora' && !kp) {
      kp = await fetchKp();
      setKpIndex(kp);
    }

    // Fetch weather for all locations in parallel
    const weatherResults = await Promise.all(
      locations.map(loc => fetchWeather(loc.lat, loc.lon).catch(() => ({ cloud: 50, wind: 15 })))
    );

    // Score each
    const scored = locations.map((loc, i) => {
      const w = weatherResults[i];
      const result = scoreLocation({ ...loc, ...w }, selectedEvent, kp);
      return { ...loc, ...w, ...result };
    });

    // Sort by score descending, assign rank
    scored.sort((a, b) => b.score - a.score);
    const ranked = scored.map((loc, i) => ({ ...loc, rank: i + 1, totalLocations: scored.length }));

    setRankings(ranked);
    setRanking(false);
  };

  const scoreColor = (s) => s >= 75 ? 'text-emerald-400' : s >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = (s) => s >= 75 ? 'bg-emerald-900/30 border-emerald-500/30' : s >= 50 ? 'bg-yellow-900/30 border-yellow-500/30' : 'bg-red-900/30 border-red-500/30';
  const rankLabel = (s) => s >= 80 ? 'Excellent' : s >= 65 ? 'Good' : s >= 45 ? 'Fair' : 'Poor';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Best Spots Tonight
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">Rank up to {limit} locations for the selected event.</p>
      </div>

      {/* Event Selector */}
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Rank for:</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_OPTIONS.map(ev => (
            <button
              key={ev.id}
              onClick={() => { setSelectedEvent(ev.id); setRankings(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                selectedEvent === ev.id
                  ? 'bg-red-600/30 border-red-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <span>{ev.emoji}</span> {ev.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location List */}
      <div className="space-y-2">
        {locations.map((loc, i) => (
          <div key={loc.id} className="flex items-center gap-2 bg-[#111] border border-white/8 rounded-xl px-3 py-2.5">
            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
              {i + 1}
            </div>
            <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-slate-200 text-sm flex-1 truncate">{loc.name}</span>
            {i === 0 && <Badge className="text-[10px] bg-slate-700 text-slate-400 border-0">Home</Badge>}
            <button onClick={() => removeLocation(loc.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add Location Input */}
        {locations.length < limit && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Add a location (city, park, coordinates…)"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLocation()}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <Button
              size="sm"
              onClick={addLocation}
              disabled={addingLocation || !inputVal.trim()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3"
            >
              {addingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Upsell nudge when free limit hit */}
        {!isSubscribed && locations.length >= FREE_LOCATION_LIMIT && (
          <button
            onClick={() => setShowUpsell(true)}
            className="w-full flex items-center gap-2 border border-dashed border-red-500/40 rounded-xl px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/10 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Add up to 5 locations with Plus — $7.99/mo
          </button>
        )}
      </div>

      {/* Rank Button */}
      {locations.length > 0 && (
        <Button
          onClick={runRankings}
          disabled={ranking}
          className="w-full bg-red-600 hover:bg-red-700 font-bold h-10"
        >
          {ranking
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing locations…</>
            : <><Star className="w-4 h-4 mr-2" /> Rank Best Spots Tonight</>
          }
        </Button>
      )}

      {/* Rankings Output */}
      {rankings && (
        <div className="space-y-3">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
            Ranked for {EVENT_OPTIONS.find(e => e.id === selectedEvent)?.emoji} {EVENT_OPTIONS.find(e => e.id === selectedEvent)?.label}
          </p>
          {rankings.map((loc) => (
            <Card
              key={loc.id}
              className={`border p-4 ${loc.rank === 1 ? 'bg-gradient-to-br from-yellow-900/20 to-[#1a1a1a] border-yellow-500/30' : 'bg-[#1a1a1a] border-white/8'}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                    loc.rank === 1 ? 'bg-yellow-500 text-black' : loc.rank === 2 ? 'bg-slate-300 text-black' : loc.rank === 3 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {loc.rank === 1 ? '🏆' : loc.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{loc.name}</p>
                    {loc.rank === 1 && (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10px] mt-0.5">Best spot tonight</Badge>
                    )}
                  </div>
                </div>
                <div className={`text-right flex-shrink-0 px-3 py-1.5 rounded-lg border ${scoreBg(loc.score)}`}>
                  <p className={`text-lg font-black leading-none ${scoreColor(loc.score)}`}>{loc.score}%</p>
                  <p className={`text-[10px] font-semibold ${scoreColor(loc.score)}`}>{rankLabel(loc.score)}</p>
                </div>
              </div>

              {/* Factors */}
              <div className="flex flex-wrap gap-1.5">
                {loc.factors.map((f, fi) => (
                  <span
                    key={fi}
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      f.good
                        ? 'bg-emerald-900/20 border-emerald-700/40 text-emerald-400'
                        : 'bg-red-900/20 border-red-700/40 text-red-400'
                    }`}
                  >
                    {f.good ? '✓' : '✗'} {f.text}
                  </span>
                ))}
              </div>
            </Card>
          ))}

          {selectedEvent === 'aurora' && kpIndex !== null && (
            <p className="text-slate-600 text-xs text-center">Live KP index: {kpIndex} — via NOAA SWPC</p>
          )}
          <p className="text-slate-600 text-xs text-center">Cloud data via Open-Meteo · Updated now</p>
        </div>
      )}

      {/* Upsell Modal */}
      {showUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="bg-[#1a1a1a] border border-red-500/30 p-6 max-w-sm w-full text-center">
            <Lock className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-black text-lg mb-2">Monitor 5 Locations</h3>
            <p className="text-slate-400 text-sm mb-4">
              Free explorers can track 2 spots. Upgrade to Plus to rank up to 5 locations for any sky event tonight.
            </p>
            <div className="space-y-2 text-left text-sm mb-5">
              {['Up to 5 locations ranked', 'Live cloud & wind data', 'KP index for aurora', 'All 5 event types', 'Sky Planner + Field Mode'].map(f => (
                <div key={f} className="flex items-center gap-2 text-slate-300">
                  <Star className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" /> {f}
                </div>
              ))}
            </div>
            <Link to={createPageUrl('PaymentGate')} onClick={() => setShowUpsell(false)}>
              <Button className="w-full bg-red-600 hover:bg-red-700 font-bold mb-2">
                Unlock Plus — $7.99/mo →
              </Button>
            </Link>
            <button onClick={() => setShowUpsell(false)} className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
              Maybe later
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}