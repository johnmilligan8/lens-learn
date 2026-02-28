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

// ── Leaflet Map with canvas aurora overlay ────────────────────────────────
function AuroraLeafletMap({ ovationData, userLat, userLon, locationName }) {
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    if (leafletRef.current) return; // already init

    // Dynamically load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  const initMap = () => {
    if (!mapRef.current || leafletRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [60, -100],
      zoom: 3,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 8,
    }).addTo(map);

    leafletRef.current = map;

    // Draw overlay once map is ready
    drawOverlay(map);

    // User location marker
    if (userLat && userLon) {
      const icon = L.divIcon({
        html: `<div style="width:10px;height:10px;background:#ef4444;border:2px solid white;border-radius:50%;"></div>`,
        className: '',
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });
      L.marker([userLat, userLon], { icon })
        .addTo(map)
        .bindPopup(`<b>${locationName || 'Your location'}</b><br>Saved home base`);
    }
  };

  const drawOverlay = (map) => {
    if (!ovationData || !window.L) return;

    const L = window.L;
    const coords = ovationData.coordinates;
    if (!coords || !Array.isArray(coords)) return;

    // Remove existing overlay layer
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }

    // Build canvas layer
    const CanvasLayer = L.Layer.extend({
      onAdd(map) {
        this._map = map;
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;';
        map.getPanes().overlayPane.appendChild(canvas);
        this._canvas = canvas;
        map.on('moveend zoomend resize', this._redraw, this);
        this._redraw();
      },
      onRemove(map) {
        this._canvas?.parentNode?.removeChild(this._canvas);
        map.off('moveend zoomend resize', this._redraw, this);
      },
      _redraw() {
        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;
        const ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, size.x, size.y);

        coords.forEach(([lon, lat, prob]) => {
          const p = prob ?? 0;
          const color = auroraColor(p);
          if (!color) return;
          try {
            const pt = this._map.latLngToContainerPoint([lat, lon]);
            // Scale opacity and radius with probability for better visibility
            const opacity = Math.min(0.85, 0.3 + (p / 50) * 0.55);
            const radius = Math.max(5, Math.min(10, 4 + (p / 20)));
            ctx.fillStyle = color.hex + Math.round(opacity * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fill();
          } catch (_) {}
        });
      },
    });

    overlayRef.current = new CanvasLayer().addTo(map);
  };

  // Re-draw when data changes
  useEffect(() => {
    if (leafletRef.current && ovationData) {
      drawOverlay(leafletRef.current);
    }
  }, [ovationData]);

  return (
    <div
      ref={mapRef}
      style={{ height: 280, width: '100%', borderRadius: 12, overflow: 'hidden', background: '#111' }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function AuroraForecastMap({ isSubscribed, userLat, userLon, locationName }) {
  const [ovation, setOvation] = useState(null);
  const [kpForecast, setKpForecast] = useState([]);
  const [kpHourly, setKpHourly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, kpData, hourlyData] = await Promise.all([
        fetchOvationData().catch(() => null),
        fetchKpForecast().catch(() => []),
        fetchKpHourly().catch(() => []),
      ]);
      setOvation(ovData);
      // Group kpForecast by day (take max per day)
      const byDay = {};
      kpData.forEach(r => {
        const key = r.time.toISOString().split('T')[0];
        if (!byDay[key] || r.kp > byDay[key].kp) byDay[key] = r;
      });
      setKpForecast(Object.values(byDay).slice(0, 7));
      setKpHourly(hourlyData);
      setLastUpdated(new Date());
    } catch (e) {
      setError('Could not load aurora data. Check NOAA for latest.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Current/latest KP from hourly
  const currentKp = kpHourly.length > 0 ? kpHourly[kpHourly.length - 1].kp : null;

  // Local visibility note
  const getLocalNote = () => {
    const loc = locationName || 'your location';
    if (currentKp === null) return `Set your home base for a local visibility note.`;
    if (currentKp >= 7) return `KP ${currentKp} — visible overhead from ${loc}! Head out now.`;
    if (currentKp >= 5) return `KP ${currentKp} — visible from low to mid horizon from ${loc}. Worth checking north!`;
    if (currentKp >= 3) return `KP ${currentKp} — possible faint display from ${loc} if skies are clear and dark.`;
    return `KP ${currentKp} — quiet conditions from ${loc}. Watch for alerts if KP rises to 5+.`;
  };

  // OVATION observation time
  const obsTime = ovation?.Observation_Time
    ? new Date(ovation.Observation_Time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-xs mt-0.5">
            Aurora forecast – color-coded intensity over US/Canada. Check for clear skies!
          </p>
        </div>
        <button onClick={load} disabled={loading} className="text-slate-400 hover:text-slate-200 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current KP badge */}
      {currentKp !== null && (
        <div className="flex items-center gap-3">
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

      {/* Local visibility note */}
      <div className="flex items-start gap-2 bg-slate-800/40 border border-white/8 rounded-xl px-3 py-2.5">
        <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
        <p className="text-slate-300 text-xs leading-relaxed">{getLocalNote()}</p>
      </div>

      {/* Map */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 bg-black/20 rounded-xl">
          <Loader className="w-5 h-5 animate-spin text-red-400" />
          <span className="text-slate-400 text-sm">Loading NOAA aurora data…</span>
        </div>
      ) : error && !ovation ? (
        <div className="py-10 text-center bg-black/20 rounded-xl border border-white/8">
          <p className="text-slate-400 text-sm">{error}</p>
          <button onClick={load} className="text-red-400 text-xs underline mt-2">Retry</button>
        </div>
      ) : (
        <div>
          <AuroraLeafletMap
            ovationData={ovation}
            userLat={userLat}
            userLon={userLon}
            locationName={locationName}
          />
          {obsTime && (
            <p className="text-slate-600 text-[10px] mt-1.5 text-right">
              NOAA OVATION · Observed {obsTime} UTC · Forecast ~30 min
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Intensity:</span>
        {[
          { color: '#22c55e', label: 'Low' },
          { color: '#eab308', label: 'Moderate' },
          { color: '#f97316', label: 'Strong' },
          { color: '#ef4444', label: 'Very Strong' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div style={{ background: l.color }} className="w-3 h-3 rounded-full" />
            <span className="text-slate-400 text-xs">{l.label}</span>
          </div>
        ))}
      </div>
      <p className="text-slate-600 text-xs">
        Visible overhead from northern US/Canada if KP 5+ and clear skies. Low horizon chance at mid-latitudes with KP 6+.
      </p>

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
      {isSubscribed && kpForecast.length > 0 && (
        <Card className="bg-[#1a1a1a] border-white/8 p-4">
          <p className="text-white text-xs font-semibold mb-3">7-Day KP Outlook</p>
          <div className="flex gap-1 items-end" style={{ height: 80 }}>
            {kpForecast.map((r, i) => <KpBar key={i} entry={r} />)}
          </div>
          <p className="text-slate-600 text-[10px] mt-2">Source: NOAA SWPC · Updates every 3 hours</p>
        </Card>
      )}
    </div>
  );
}