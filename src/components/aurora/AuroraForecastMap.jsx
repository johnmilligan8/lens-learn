import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, RefreshCw, Lock, MapPin, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// ── Color scale helpers ────────────────────────────────────────────────────
// Lower thresholds — NOAA OVATION values are often 1–30 even during active events
function auroraColor(probability) {
  if (probability >= 50) return { hex: '#ef4444', label: 'Very Strong', level: 4 };
  if (probability >= 25) return { hex: '#f97316', label: 'Strong', level: 3 };
  if (probability >= 10) return { hex: '#eab308', label: 'Moderate', level: 2 };
  if (probability >= 1)  return { hex: '#22c55e', label: 'Low', level: 1 };
  return null;
}

function kpColor(kp) {
  if (kp >= 7) return '#ef4444';
  if (kp >= 5) return '#f97316';
  if (kp >= 3) return '#eab308';
  return '#22c55e';
}

function kpLabel(kp) {
  if (kp >= 7) return 'Very Strong';
  if (kp >= 5) return 'Strong';
  if (kp >= 3) return 'Moderate';
  return 'Low';
}

// ── Fetch NOAA data directly (CORS-enabled public endpoints) ─────────────
async function fetchOvationData() {
  const res = await fetch('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json');
  if (!res.ok) throw new Error('OVATION fetch failed');
  return res.json();
}

// Fetches 3-hourly KP forecast blocks (for 24-48hr trend)
async function fetchKpForecast() {
  const res = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json');
  if (!res.ok) throw new Error('KP forecast fetch failed');
  const raw = await res.json();
  const rows = raw.slice(1);
  return rows.map(([time_tag, kp]) => ({
    time: new Date(time_tag.replace(' ', 'T') + 'Z'),
    kp: Math.round((parseFloat(kp) || 0) * 10) / 10,
    label: new Date(time_tag.replace(' ', 'T') + 'Z').toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric', hour12: true }),
  })).filter(r => !isNaN(r.time.getTime()));
}

async function fetchKpHourly() {
  const res = await fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json');
  if (!res.ok) throw new Error('KP hourly fetch failed');
  const data = await res.json();
  return data.slice(-12).map(([time_tag, kp]) => ({
    time: new Date(time_tag + 'Z'),
    kp: parseFloat(kp) || 0,
  }));
}

// ── Mini bar chart for KP forecast ───────────────────────────────────────
function KpBar({ entry }) {
  const height = Math.max(8, Math.min(60, (entry.kp / 9) * 60));
  const color = kpColor(entry.kp);
  const d = entry.time;
  const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-white text-xs font-bold">{entry.kp.toFixed(1)}</span>
      <div className="w-full flex items-end justify-center" style={{ height: 60 }}>
        <div
          style={{ height, backgroundColor: color, opacity: 0.85 }}
          className="w-full rounded-sm transition-all"
        />
      </div>
      <span className="text-slate-500 text-[9px] text-center leading-tight truncate w-full">{label}</span>
    </div>
  );
}

// ── Leaflet Map with NOAA OVATION image overlay ──────────────────────────
const OVATION_IMG_URL = 'https://services.swpc.noaa.gov/images/aurora-forecast-north.png';
// The north polar image covers roughly the northern hemisphere
// We use a square bounds centered on the north pole region visible for N. America
const OVATION_BOUNDS = [[20, -170], [90, -50]]; // SW, NE covering N. America + Canada

function AuroraLeafletMap({ userLat, userLon, locationName }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);

  useEffect(() => {
    if (leafletRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!mapRef.current || leafletRef.current) return;
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [58, -100],
        zoom: 3,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        maxZoom: 8,
      }).addTo(map);

      // NOAA OVATION 30-min forecast image overlay
      const cacheBust = Math.floor(Date.now() / (1000 * 60 * 10)); // refresh every 10 min
      L.imageOverlay(
        `${OVATION_IMG_URL}?t=${cacheBust}`,
        OVATION_BOUNDS,
        { opacity: 0.72, interactive: false }
      ).addTo(map);

      // User location marker
      if (userLat && userLon) {
        const icon = L.divIcon({
          html: `<div style="width:12px;height:12px;background:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 0 6px rgba(239,68,68,0.8);"></div>`,
          className: '',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        });
        L.marker([userLat, userLon], { icon })
          .addTo(map)
          .bindPopup(`<b>${locationName || 'Your location'}</b><br>Home base`);
      }

      leafletRef.current = map;
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, [userLat, userLon, locationName]);

  return (
    <div
      ref={mapRef}
      style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', background: '#111' }}
    />
  );
}

// ── 24-48 hr KP trend bar chart ───────────────────────────────────────────
function KpTrendChart({ kpForecast }) {
  // Show next 16 blocks = 48 hours (each block is 3hr)
  const blocks = kpForecast.slice(0, 16);
  if (!blocks.length) return null;
  const maxKp = Math.max(9, ...blocks.map(b => b.kp));

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1" style={{ height: 72 }}>
        {blocks.map((r, i) => {
          const h = Math.max(6, (r.kp / maxKp) * 68);
          const color = kpColor(r.kp);
          const isDay = blocks.length > 8 && i === 8;
          return (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5 relative" style={{ height: 72 }}>
              {isDay && <div className="absolute inset-y-0 left-0 w-px bg-slate-600 opacity-50" />}
              <div
                title={`KP ${r.kp} · ${r.label}`}
                style={{ height: h, background: color }}
                className="w-full rounded-sm opacity-85 transition-all cursor-default"
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-slate-600">
        <span>Now</span>
        <span>+24hr</span>
        <span>+48hr</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {[0,3,5,7].map((threshold, i) => {
          const labels = ['Low (<3)', 'Moderate (3–5)', 'Strong (5–7)', 'Very Strong (7+)'];
          const colors = ['#22c55e','#eab308','#f97316','#ef4444'];
          return (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: colors[i] }} />
              <span className="text-slate-500 text-[9px]">{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AuroraForecastMap({ isSubscribed, userLat, userLon, locationName }) {
  const [kpForecast, setKpForecast] = useState([]);
  const [kpHourly, setKpHourly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpData, hourlyData] = await Promise.all([
        fetchKpForecast().catch(() => []),
        fetchKpHourly().catch(() => []),
      ]);
      // Keep all 3-hr blocks for trend chart (don't collapse to daily)
      setKpForecast(kpData);
      setKpHourly(hourlyData);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Live data unavailable – check NOAA (swpc.noaa.gov)');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Current/latest KP from hourly
  const currentKp = kpHourly.length > 0 ? kpHourly[kpHourly.length - 1].kp : (kpForecast[0]?.kp ?? null);

  // Daily max blocks for 7-day bar chart (grouped)
  const kpByDay = (() => {
    const byDay = {};
    kpForecast.forEach(r => {
      const key = r.time.toISOString().split('T')[0];
      if (!byDay[key] || r.kp > byDay[key].kp) byDay[key] = r;
    });
    return Object.values(byDay).slice(0, 7);
  })();

  // Location-aware visibility note
  const getLocalNote = () => {
    const loc = locationName || 'your location';
    const lat = userLat ?? 42; // fallback mid-latitude
    if (currentKp === null) return `Set your home base to see a personalized visibility note.`;
    
    // Latitude-aware thresholds: higher lat = lower KP needed
    const visibleKp = lat > 60 ? 3 : lat > 50 ? 5 : lat > 45 ? 6 : 7;

    if (currentKp >= 8) return `KP ${currentKp.toFixed(1)} — Major storm! Aurora visible as far south as ${loc}. Go outside now!`;
    if (currentKp >= visibleKp) return `KP ${currentKp.toFixed(1)} — Aurora possible from ${loc}. Look north on the horizon for best chance.`;
    if (currentKp >= visibleKp - 1) return `KP ${currentKp.toFixed(1)} — Marginal. Possible faint glow low on the northern horizon from ${loc} if KP rises slightly.`;
    return `KP ${currentKp.toFixed(1)} — Aurora unlikely from ${loc} tonight. You need KP ${visibleKp}+ for visibility at your latitude. Monitor for alerts.`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs">
          NOAA 30-min aurora forecast overlay · North America focus
        </p>
        <button onClick={load} disabled={loading} className="text-slate-400 hover:text-slate-200 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current KP badge */}
      {currentKp !== null && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
            <Zap className="w-4 h-4" style={{ color: kpColor(currentKp) }} />
            <span className="text-white font-black text-lg">{currentKp.toFixed(1)}</span>
            <span className="text-slate-400 text-xs">KP now</span>
          </div>
          <Badge style={{ backgroundColor: kpColor(currentKp) + '33', color: kpColor(currentKp), borderColor: kpColor(currentKp) + '66' }} className="border text-xs">
            {kpLabel(currentKp)}
          </Badge>
          {lastUpdated && <span className="text-slate-600 text-xs">· {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        </div>
      )}

      {/* Fallback / error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2.5">
          <span className="text-red-400 text-xs">⚠</span>
          <p className="text-red-300 text-xs">{error} · {currentKp !== null ? `Last known KP: ${currentKp.toFixed(1)}` : 'No cached data available.'}</p>
        </div>
      )}

      {/* Location-aware visibility note */}
      <div className="flex items-start gap-2 bg-slate-800/40 border border-white/8 rounded-xl px-3 py-2.5">
        <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-slate-300 text-xs leading-relaxed">{getLocalNote()}</p>
      </div>

      {/* Map with NOAA image overlay */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 bg-black/20 rounded-xl">
          <Loader className="w-5 h-5 animate-spin text-red-400" />
          <span className="text-slate-400 text-sm">Loading NOAA aurora forecast…</span>
        </div>
      ) : (
        <div>
          <AuroraLeafletMap
            userLat={userLat}
            userLon={userLon}
            locationName={locationName}
          />
          <p className="text-slate-600 text-[10px] mt-1.5 text-right">
            Source: NOAA OVATION · 30-min forecast · Updates every 10 min
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap bg-black/20 rounded-xl px-3 py-2 border border-white/5">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Intensity:</span>
        {[
          { color: '#22c55e', label: 'Low' },
          { color: '#eab308', label: 'Moderate' },
          { color: '#f97316', label: 'Strong' },
          { color: '#ef4444', label: 'Very Strong' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div style={{ background: l.color }} className="w-3 h-3 rounded-full flex-shrink-0" />
            <span className="text-slate-400 text-xs">{l.label}</span>
          </div>
        ))}
      </div>

      {/* 24-48hr KP Trend — all users */}
      {kpForecast.length > 0 && (
        <Card className="bg-[#1a1a1a] border-white/8 p-4">
          <p className="text-white text-xs font-semibold mb-3">24–48 Hour KP Trend</p>
          <KpTrendChart kpForecast={kpForecast} />
          <p className="text-slate-600 text-[10px] mt-2">Source: NOAA SWPC · Each bar = 3hr block · Updates every 3 hours</p>
        </Card>
      )}

      {/* Hourly recent KP — paid */}
      {isSubscribed ? (
        kpHourly.length > 0 && (
          <Card className="bg-[#1a1a1a] border-white/8 p-4">
            <p className="text-white text-xs font-semibold mb-3">Recent KP — Last 2 Hours</p>
            <div className="flex gap-1 items-end h-10">
              {kpHourly.map((r, i) => {
                const h = Math.max(4, Math.min(40, (r.kp / 9) * 40));
                return (
                  <div key={i} title={`KP ${r.kp} @ ${r.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    style={{ height: h, background: kpColor(r.kp) }}
                    className="flex-1 rounded-sm opacity-80 cursor-default"
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-slate-600 mt-1">
              <span>{kpHourly[0]?.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>Now</span>
            </div>
          </Card>
        )
      ) : (
        <Card className="bg-[#1a1a1a] border border-white/8 p-4 flex items-center gap-3">
          <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-300 text-xs font-semibold">Hourly & weekly forecast for subscribers</p>
            <p className="text-slate-500 text-xs">Unlock KP trend charts, 7-day outlook & location alerts.</p>
          </div>
          <Link to={createPageUrl('PaymentGate')}>
            <span className="text-red-400 text-xs font-bold whitespace-nowrap">Unlock →</span>
          </Link>
        </Card>
      )}

      {/* 7-day outlook — paid */}
      {isSubscribed && kpByDay.length > 0 && (
        <Card className="bg-[#1a1a1a] border-white/8 p-4">
          <p className="text-white text-xs font-semibold mb-3">7-Day KP Outlook</p>
          <div className="flex gap-1 items-end" style={{ height: 80 }}>
            {kpByDay.map((r, i) => <KpBar key={i} entry={r} />)}
          </div>
          <p className="text-slate-600 text-[10px] mt-2">Source: NOAA SWPC · Updates every 3 hours</p>
        </Card>
      )}
    </div>
  );
}