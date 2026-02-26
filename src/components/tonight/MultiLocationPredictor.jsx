import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import LeafletLocationPicker from '@/components/ui/LeafletLocationPicker';
import {
  MapPin, Plus, X, Loader2, Star, Lock, Trophy, Map
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

// In-memory Bortle cache: key = "lat,lon" rounded to 2 decimal places
const bortleCache = {};

async function fetchBortleForLocation(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (bortleCache[key]) return bortleCache[key];
  try {
    const res = await base44.functions.invoke('fetchBortle', { lat, lon });
    const data = res.data;
    if (data?.bortle) {
      bortleCache[key] = { bortle: data.bortle, sqm: data.sqm, description: data.description, source: data.source };
      return bortleCache[key];
    }
  } catch (_) {}
  // Fallback estimate
  return { bortle: estimateBortleByCoords(lat, lon), sqm: null, description: null, source: 'estimate' };
}

function estimateBortleByCoords(lat, lon) {
  const cities = [
    [40.71, -74.01, 9], [34.05, -118.24, 9], [41.85, -87.65, 9],
    [29.76, -95.37, 8], [33.45, -112.07, 8], [32.78, -96.80, 8],
    [47.61, -122.33, 8], [37.77, -122.42, 8], [39.74, -104.98, 7],
    [40.76, -111.89, 7], [36.17, -115.14, 8], [39.95, -75.17, 8],
    [42.36, -71.06, 8], [45.52, -122.68, 7], [35.23, -80.84, 7],
  ];
  let nearestBortle = 4, nearestDist = Infinity;
  for (const [clat, clon, b] of cities) {
    const dist = Math.sqrt((lat - clat) ** 2 + (lon - clon) ** 2);
    if (dist < nearestDist) { nearestDist = dist; nearestBortle = b; }
  }
  if (nearestDist < 0.25) return nearestBortle;
  if (nearestDist < 0.5) return Math.min(nearestBortle, 6);
  if (nearestDist < 1.0) return Math.min(nearestBortle, 5);
  return 4;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

function scoreLocation(locData, eventType, kpIndex) {
  const { cloud, wind, lat, lon, bortleData } = locData;
  const { illum: moonIllum } = getMoonPhase();
  const bortle = bortleData?.bortle ?? 4;
  const bortleDesc = bortleData?.description ?? 'rural sky';
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
  const bortleLabel = bortleDesc || (bortle <= 3 ? 'dark sky' : bortle <= 5 ? 'rural' : bortle <= 6 ? 'suburban' : 'light polluted');
  factors.push({ good: bortle <= 4, text: `Bortle ${bortle} — ${bortleLabel}` });

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

// LocationMapPicker is now handled by the shared LeafletLocationPicker component

// ── Leaflet loader ────────────────────────────────────────────────────────────
async function ensureLeaflet() {
  if (window.L) return window.L;
  if (!document.querySelector('#leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  if (!document.querySelector('#leaflet-js')) {
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.id = 'leaflet-js';
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }
  return window.L;
}

// ── Nominatim geocoder ────────────────────────────────────────────────────────
async function nominatimGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=0`;
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'UnchartedSkyApp/1.0' },
  });
  const data = await res.json();
  if (!data.length) return null;
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display_name: data[0].display_name.split(',').slice(0, 2).join(', '),
  };
}

// ── All Locations Map View ────────────────────────────────────────────────────

function AllLocationsMap({ locations, onUpdateLocation, onClose }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const L = await ensureLeaflet();
      if (!mapRef.current || leafletMapRef.current) return;

      const COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7'];

      // Fit bounds to all locations
      const latlngs = locations.map(l => [l.lat, l.lon]);
      const map = L.map(mapRef.current, { zoomControl: true });
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      if (latlngs.length === 1) {
        map.setView(latlngs[0], 10);
      } else {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      }

      locations.forEach((loc, i) => {
        const color = COLORS[i % COLORS.length];
        const icon = L.divIcon({
          html: `<div style="position:relative">
            <div style="width:36px;height:36px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.6)"></div>
            <div style="position:absolute;top:6px;left:6px;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;transform:rotate(45deg)">${i + 1}</div>
          </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          className: ''
        });

        const marker = L.marker([loc.lat, loc.lon], { draggable: true, icon }).addTo(map);
        marker.bindPopup(`<b style="font-size:13px">${loc.name}</b><br><span style="font-size:11px;color:#888">${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}</span>`);
        markersRef.current[loc.id] = marker;

        marker.on('dragend', () => {
          const ll = marker.getLatLng();
          onUpdateLocation(loc.id, parseFloat(ll.lat.toFixed(5)), parseFloat(ll.lng.toFixed(5)));
        });
      });

      setMapReady(true);
    };
    init();
    return () => {
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 relative" style={{ height: '320px' }}>
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-[999] bg-slate-900/90 border border-slate-600 rounded-lg px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors"
      >
        List View
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MultiLocationPredictor({ isSubscribed, homeLocation, homeCoords }) {
  const [locations, setLocations] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [addingLocation, setAddingLocation] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null); // { lat, lon, name } waiting for map confirm
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState('milky_way');
  const [rankings, setRankings] = useState(null);
  const [ranking, setRanking] = useState(false);
  const [kpIndex, setKpIndex] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [showAllMap, setShowAllMap] = useState(false);

  // Auto-populate home location when coords become available
  React.useEffect(() => {
    if (homeLocation && homeCoords) {
      setLocations(prev => {
        // Only add if home isn't already in the list
        const alreadyHasHome = prev.some(l => l.id === 'home');
        if (alreadyHasHome) return prev;
        return [{ id: 'home', name: homeLocation, lat: homeCoords.lat, lon: homeCoords.lon }, ...prev];
      });
    }
  }, [homeLocation, homeCoords]);

  const limit = isSubscribed ? PAID_LOCATION_LIMIT : FREE_LOCATION_LIMIT;

  // Step 1: geocode the typed name using Nominatim, then open map picker
  const openMapPicker = async () => {
    if (!inputVal.trim()) return;
    if (locations.length >= limit) {
      if (!isSubscribed) { setShowUpsell(true); return; }
      return;
    }
    setAddingLocation(true);
    let initial = null;
    const geo = await nominatimGeocode(inputVal.trim()).catch(() => null);
    if (geo?.lat && geo?.lon) {
      initial = { lat: geo.lat, lon: geo.lon, name: geo.display_name || inputVal.trim() };
    } else {
      // Fallback: open picker centered on US with user's typed name
      initial = { lat: 39.5, lon: -98.35, name: inputVal.trim() };
    }
    setAddingLocation(false);
    setPendingLocation(initial);
    setShowMapPicker(true);
  };

  // Step 2: user confirms location from map
  const confirmLocation = ({ lat, lon, name }) => {
    setLocations(prev => [...prev, {
      id: Date.now().toString(),
      name,
      lat,
      lon,
    }]);
    setInputVal('');
    setShowMapPicker(false);
    setPendingLocation(null);
    setRankings(null);
  };

  const cancelMapPicker = () => {
    setShowMapPicker(false);
    setPendingLocation(null);
    setAddingLocation(false);
  };

  const removeLocation = (id) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    setRankings(null);
  };

  const updateLocationCoords = (id, lat, lon) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, lat, lon } : l));
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

    // Fetch weather and Bortle data for all locations in parallel
    const [weatherResults, bortleResults] = await Promise.all([
      Promise.all(locations.map(loc => fetchWeather(loc.lat, loc.lon).catch(() => ({ cloud: 50, wind: 15 })))),
      Promise.all(locations.map(loc => fetchBortleForLocation(loc.lat, loc.lon).catch(() => ({ bortle: 4 })))),
    ]);

    // Score each
    const scored = locations.map((loc, i) => {
      const w = weatherResults[i];
      const bortleData = bortleResults[i];
      const result = scoreLocation({ ...loc, ...w, bortleData }, selectedEvent, kp);
      return { ...loc, ...w, bortleData, ...result };
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
        {!showAllMap && locations.map((loc, i) => (
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

        {/* Add Location Input (hide in map view) */}
        {!showAllMap && locations.length < limit && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search a location (city, park, coordinates…)"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && openMapPicker()}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
            <Button
              size="sm"
              onClick={openMapPicker}
              disabled={addingLocation || !inputVal.trim()}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3"
              title="Search & pin on map"
            >
              {addingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        )}

        {/* Upsell nudge when free limit hit */}
        {!showAllMap && !isSubscribed && locations.length >= FREE_LOCATION_LIMIT && (
          <button
            onClick={() => setShowUpsell(true)}
            className="w-full flex items-center gap-2 border border-dashed border-red-500/40 rounded-xl px-3 py-2.5 text-xs text-red-400 hover:bg-red-900/10 transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            Add up to 5 locations with Plus — $7.99/mo
          </button>
        )}
      </div>

      {/* Map View toggle */}
      {locations.length > 0 && (
        <button
          onClick={() => setShowAllMap(v => !v)}
          className={`w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
            showAllMap
              ? 'bg-red-600/20 border-red-500 text-red-300'
              : 'bg-slate-800 border-slate-600 text-slate-300 hover:text-white hover:border-slate-400'
          }`}
        >
          <Map className="w-4 h-4" />
          {showAllMap ? 'Hide Map' : 'View All on Map'}
        </button>
      )}

      {/* All-locations map */}
      {showAllMap && locations.length > 0 && (
        <AllLocationsMap
          locations={locations}
          onUpdateLocation={updateLocationCoords}
          onClose={() => setShowAllMap(false)}
        />
      )}

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

      {/* Map Picker Modal */}
      {showMapPicker && (
        <LocationMapPicker
          initial={pendingLocation}
          onConfirm={confirmLocation}
          onCancel={cancelMapPicker}
        />
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