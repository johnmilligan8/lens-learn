import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  MapPin, Moon, Eye, Clock, Star, Loader2,
  Navigation, Lock, ChevronRight, Telescope, Sun,
  AlertTriangle, CheckCircle, TrendingUp
} from 'lucide-react';

// ─── Astronomy Math ─────────────────────────────────────────────────────────

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function getMoonPhase(date) {
  const knownNewMoon = new Date('2000-01-06T00:00:00Z');
  const lunarCycle = 29.53058867;
  const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;
  const illum = Math.round((1 - Math.cos((phase / lunarCycle) * 2 * Math.PI)) / 2 * 100);
  let name = 'New Moon'; let emoji = '🌑';
  if (phase > 1 && phase < 7.4)      { name = 'Waxing Crescent'; emoji = '🌒'; }
  else if (phase >= 7.4 && phase < 8.4)  { name = 'First Quarter';   emoji = '🌓'; }
  else if (phase >= 8.4 && phase < 14.8) { name = 'Waxing Gibbous';  emoji = '🌔'; }
  else if (phase >= 14.8 && phase < 15.8){ name = 'Full Moon';        emoji = '🌕'; }
  else if (phase >= 15.8 && phase < 22.1){ name = 'Waning Gibbous';  emoji = '🌖'; }
  else if (phase >= 22.1 && phase < 23.1){ name = 'Last Quarter';    emoji = '🌗'; }
  else if (phase >= 23.1 && phase < 29.5){ name = 'Waning Crescent'; emoji = '🌘'; }
  return { name, emoji, illumination: illum, phase, lunarCycle };
}

// Galactic core RA=17h45m Dec=-29° (Sgr A*)
const GC_RA = 266.4; // degrees
const GC_DEC = -29.0;

function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function lstDegrees(jd, lonDeg) {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * 0.000387933 - T * T * T / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return ((gmst + lonDeg) % 360 + 360) % 360;
}

function raDecToAltAz(ra, dec, lst, lat) {
  const ha = toRad(((lst - ra) % 360 + 360) % 360);
  const decR = toRad(dec);
  const latR = toRad(lat);
  const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(ha);
  const alt = toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
  const cosAz = (Math.sin(decR) - Math.sin(toRad(alt)) * Math.sin(latR)) / (Math.cos(toRad(alt)) * Math.cos(latR));
  let az = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  if (Math.sin(ha) > 0) az = 360 - az;
  return { alt, az };
}

function getGalacticCoreData(dateStr, lat, lon) {
  const base = new Date(dateStr + 'T12:00:00Z');
  const results = [];
  let riseTime = null, setTime = null, peakTime = null, peakAlt = -90;

  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const t = new Date(base.getTime() + (h * 60 + m) * 60000 - 12 * 3600000);
      const jd = julianDate(t);
      const lst = lstDegrees(jd, lon);
      const { alt, az } = raDecToAltAz(GC_RA, GC_DEC, lst, lat);
      const hour = h + m / 60 - 12;
      results.push({ hour, alt: Math.round(alt * 10) / 10, az: Math.round(az * 10) / 10, t });
      if (alt > peakAlt) { peakAlt = alt; peakTime = t; }
    }
  }

  // Find rise/set
  for (let i = 1; i < results.length; i++) {
    const prev = results[i - 1], cur = results[i];
    if (prev.alt <= 5 && cur.alt > 5 && riseTime === null) riseTime = cur.t;
    if (prev.alt >= 5 && cur.alt < 5 && riseTime !== null && setTime === null) setTime = cur.t;
  }

  return { results, riseTime, setTime, peakTime, peakAlt: Math.round(peakAlt) };
}

function formatHour(date) {
  if (!date) return 'N/A';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
}

function getMoonImpact(illumination) {
  if (illumination <= 10) return { level: 'Minimal', color: 'text-emerald-400', desc: 'Ideal conditions — nearly dark moon.' };
  if (illumination <= 30) return { level: 'Low', color: 'text-blue-400', desc: 'Good — moon sets early or has minimal glow.' };
  if (illumination <= 60) return { level: 'Moderate', color: 'text-yellow-400', desc: 'Shoot when moon is below horizon.' };
  return { level: 'High', color: 'text-red-400', desc: 'Challenging — moon significantly brightens sky.' };
}

// Bortle scale lookup by latitude zone (simplified)
function estimateBortle(lat, lon, locationName) {
  // Very rough estimation based on location name keywords
  const name = locationName.toLowerCase();
  if (/joshua tree|death valley|big bend|bryce|arches|canyonlands|grand canyon|dark sky|observatory|rural|wilderness|national park/.test(name)) return 2;
  if (/suburb|residential|town|village/.test(name)) return 6;
  if (/new york|los angeles|chicago|london|tokyo|paris|beijing|shanghai|mumbai|delhi|houston|phoenix/.test(name)) return 8;
  if (/city|urban|downtown|metro/.test(name)) return 7;
  if (/mountain|peak|summit|valley|canyon|desert|forest|lake|creek|river/.test(name)) return 3;
  // Default based on lat (rough — far from equator tends to be less populated)
  if (Math.abs(lat) > 55 || Math.abs(lon) < -100 || Math.abs(lon) > 120) return 3;
  return 5;
}

const BORTLE_DATA = {
  1: { label: 'Class 1 — Pristine', color: 'emerald', desc: 'Milky Way casts visible shadows. Zodiacal band visible.', quality: 'Exceptional' },
  2: { label: 'Class 2 — Truly Dark', color: 'emerald', desc: 'Airglow faintly visible. M33 easily seen. Excellent.', quality: 'Excellent' },
  3: { label: 'Class 3 — Rural', color: 'blue', desc: 'Some light pollution on horizon. M33 visible with effort.', quality: 'Very Good' },
  4: { label: 'Class 4 — Rural/Suburban', color: 'blue', desc: 'Light domes on horizon. Milky Way impressive.', quality: 'Good' },
  5: { label: 'Class 5 — Suburban', color: 'yellow', desc: 'Milky Way washed near horizon. M33 hard to see.', quality: 'Fair' },
  6: { label: 'Class 6 — Bright Suburban', color: 'yellow', desc: 'Milky Way visible overhead only. Many stars washed.', quality: 'Poor' },
  7: { label: 'Class 7 — Suburban/Urban', color: 'orange', desc: 'Milky Way barely visible. Only bright stars visible.', quality: 'Very Poor' },
  8: { label: 'Class 8 — City', color: 'red', desc: 'Sky glows white/gray. Milky Way invisible.', quality: 'Extremely Poor' },
  9: { label: 'Class 9 — Inner City', color: 'red', desc: 'Entire sky glows. Only moon, planets, brightest stars.', quality: 'Unusable' },
};

const BORTLE_COLORS = {
  emerald: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
  blue: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  yellow: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  orange: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
  red: 'bg-red-500/20 border-red-500/50 text-red-300',
};

// ─── Sky Canvas ──────────────────────────────────────────────────────────────

function SkyCanvas({ gcData, lat, lon, dateStr }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gcData) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 16;

    ctx.clearRect(0, 0, W, H);

    // Sky background
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    bg.addColorStop(0, '#0a0520');
    bg.addColorStop(0.7, '#060318');
    bg.addColorStop(1, '#020212');
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = '#4c1d95';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Horizon circles
    [0.33, 0.66, 1].forEach(f => {
      ctx.beginPath();
      ctx.arc(cx, cy, R * f, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(100,80,160,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Cardinal directions
    const dirs = [['N', 0], ['E', 90], ['S', 180], ['W', 270]];
    dirs.forEach(([label, az]) => {
      const rad = toRad(az - 90);
      const x = cx + (R + 10) * Math.cos(rad);
      const y = cy + (R + 10) * Math.sin(rad);
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y);
    });

    // Alt labels
    ['90°', '60°', '30°'].forEach((lbl, i) => {
      const f = [0, 0.33, 0.66][i];
      ctx.fillStyle = 'rgba(100,80,160,0.4)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(lbl, cx + R * f + 4, cy);
    });

    // Plot Milky Way core arc
    const visiblePoints = gcData.results.filter(p => p.alt > 0);
    if (visiblePoints.length > 1) {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, 'rgba(168,85,247,0.8)');
      grad.addColorStop(0.5, 'rgba(251,191,36,0.9)');
      grad.addColorStop(1, 'rgba(59,130,246,0.8)');

      ctx.beginPath();
      let started = false;
      visiblePoints.forEach(p => {
        const elev = 1 - (p.alt / 90);
        const rad = toRad(p.az - 90);
        const r = R * elev;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
      });
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Glow
      ctx.beginPath();
      started = false;
      visiblePoints.forEach(p => {
        const elev = 1 - (p.alt / 90);
        const rad = toRad(p.az - 90);
        const r = R * elev;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
      });
      ctx.strokeStyle = 'rgba(168,85,247,0.2)';
      ctx.lineWidth = 10;
      ctx.stroke();
    }

    // Peak point
    const peak = gcData.results.reduce((a, b) => b.alt > a.alt ? b : a, gcData.results[0]);
    if (peak && peak.alt > 0) {
      const elev = 1 - (peak.alt / 90);
      const rad = toRad(peak.az - 90);
      const px = cx + R * elev * Math.cos(rad);
      const py = cy + R * elev * Math.sin(rad);
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#fbbf24';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PEAK', px, py - 10);
    }

    // Zenith dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#94a3b8';
    ctx.fill();

  }, [gcData, lat, lon, dateStr]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="w-full max-w-[320px] mx-auto rounded-full"
    />
  );
}

// ─── Hourly Chart ────────────────────────────────────────────────────────────

function HourlyChart({ gcData }) {
  if (!gcData) return null;
  const hours = gcData.results.filter((_, i) => i % 2 === 0); // every 30min
  const maxAlt = 90;

  return (
    <div className="w-full">
      <div className="flex items-end gap-0.5 h-28">
        {hours.map((pt, i) => {
          const pct = Math.max(0, pt.alt) / maxAlt * 100;
          const isNight = pt.hour < -6 || pt.hour > 6; // rough night window
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-t transition-all ${pt.alt > 0 ? 'bg-purple-500/70' : 'bg-slate-700/30'}`}
                style={{ height: `${pct}%`, minHeight: pt.alt > 0 ? '2px' : '0' }}
                title={`Alt: ${pt.alt}°`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-slate-600 text-[9px] px-0.5">
        <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
      </div>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-500/70" /><span className="text-xs text-slate-400">Core above horizon</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-700/30" /><span className="text-xs text-slate-400">Below horizon</span></div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlannerTool() {
  const [isSubscribed, setIsSubscribed] = useState(null);
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [aiTips, setAiTips] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { setIsSubscribed(false); return; }
      const me = await base44.auth.me();
      if (me.role === 'admin') { setIsSubscribed(true); return; }
      const subs = await base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1);
      setIsSubscribed(subs.length > 0);
    };
    check();
  }, []);

  const geocode = async () => {
    if (!location.trim()) return;
    setGeoLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Give me the latitude and longitude of: "${location}". Return ONLY a JSON object with "lat" (number) and "lon" (number) and "display_name" (string, clean city/region name). No explanation.`,
      response_json_schema: {
        type: 'object',
        properties: {
          lat: { type: 'number' },
          lon: { type: 'number' },
          display_name: { type: 'string' }
        }
      }
    });
    setCoords({ lat: res.lat, lon: res.lon, name: res.display_name || location });
    setGeoLoading(false);
    return { lat: res.lat, lon: res.lon, name: res.display_name || location };
  };

  const calculate = async () => {
    setCalcLoading(true);
    let c = coords;
    if (!c) c = await geocode();
    if (!c) { setCalcLoading(false); return; }

    const d = new Date(date + 'T12:00:00Z');
    const moon = getMoonPhase(d);
    const moonImpact = getMoonImpact(moon.illumination);
    const gcData = getGalacticCoreData(date, c.lat, c.lon);
    const bortle = estimateBortle(c.lat, c.lon, c.name || location);
    const bortleInfo = BORTLE_DATA[bortle];

    // Best hours: core > 15° alt
    const bestHours = gcData.results.filter(p => p.alt > 15);
    let bestWindow = 'Core too low this date';
    if (bestHours.length > 0) {
      const first = bestHours[0].t;
      const last = bestHours[bestHours.length - 1].t;
      bestWindow = `${formatHour(first)} – ${formatHour(last)}`;
    }

    // Month-based season check
    const month = d.getUTCMonth();
    const inSeason = month >= 2 && month <= 9; // Mar–Oct
    const isPeak = month >= 5 && month <= 7;   // Jun–Aug

    let overallScore = 'poor';
    if (inSeason && moon.illumination <= 20 && bortle <= 4) overallScore = 'excellent';
    else if (inSeason && moon.illumination <= 40 && bortle <= 5) overallScore = 'good';
    else if (inSeason) overallScore = 'moderate';

    setResults({ moon, moonImpact, gcData, bortle, bortleInfo, bestWindow, inSeason, isPeak, overallScore, coords: c });
    setAiTips('');
    setCalcLoading(false);
  };

  const getAITips = async () => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `I'm planning to photograph the Milky Way at "${results.coords?.name || location}" on ${date}. The Bortle scale is approximately ${results.bortle}. Give me 3 specific, practical location tips. Format as numbered list. Be concise.`,
      add_context_from_internet: true,
    });
    setAiTips(res);
    setAiLoading(false);
  };

  const visConfig = {
    excellent: { color: 'from-emerald-900/40 to-emerald-950/20 border-emerald-500/40', badge: 'bg-emerald-600', text: 'Excellent', icon: '🌟' },
    good:      { color: 'from-blue-900/40 to-blue-950/20 border-blue-500/40', badge: 'bg-blue-600', text: 'Good', icon: '✅' },
    moderate:  { color: 'from-yellow-900/30 to-yellow-950/20 border-yellow-500/40', badge: 'bg-yellow-600', text: 'Moderate', icon: '⚠️' },
    poor:      { color: 'from-red-900/30 to-red-950/20 border-red-500/40', badge: 'bg-red-700', text: 'Poor', icon: '❌' },
  };

  // ── Paywall ──────────────────────────────────────────────────────────────
  if (isSubscribed === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Telescope className="w-10 h-10 text-purple-400 star-pulse" />
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 flex flex-col items-center text-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-2xl" />
          <div className="relative bg-gradient-to-br from-purple-700/30 to-blue-800/20 border border-purple-500/30 rounded-2xl p-8">
            <Lock className="w-14 h-14 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-3">Sky Planner</h2>
            <p className="text-slate-400 text-lg mb-1">Milky Way rise/set times, interactive sky map,</p>
            <p className="text-slate-400 text-lg">moon impact analysis & Bortle scale lookup.</p>
          </div>
        </div>
        <div className="space-y-3 text-left w-full max-w-sm">
          {['Galactic core rise, peak & set times', 'Interactive polar sky map', 'Moon phase & illumination impact', 'Bortle scale for any location', 'Best shooting hours chart', 'AI-powered location tips'].map(f => (
            <div key={f} className="flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span className="text-slate-300 text-sm">{f}</span>
            </div>
          ))}
        </div>
        <Link to={createPageUrl('PaymentGate')}>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 px-8 text-base font-bold">
            Unlock Sky Planner <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </Link>
        <p className="text-slate-600 text-sm">From $19/month · Cancel anytime</p>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
          <MapPin className="w-9 h-9 text-purple-400" />
          <span>Sky <span className="gradient-text">Planner</span></span>
        </h1>
        <p className="text-slate-400 text-lg">Plan the perfect Milky Way shoot with precision astronomy data.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left: Inputs ── */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="bg-slate-900/60 border-slate-800 p-6">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-purple-400" /> Shoot Details
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2 block text-sm">Location</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Moab, Utah"
                    value={location}
                    onChange={e => { setLocation(e.target.value); setCoords(null); }}
                    className="bg-slate-800 border-slate-700 text-white flex-1"
                    onKeyDown={e => e.key === 'Enter' && calculate()}
                  />
                </div>
                {coords && <p className="text-xs text-emerald-400 mt-1">📍 {coords.lat.toFixed(3)}°, {coords.lon.toFixed(3)}°</p>}
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block text-sm">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Button
                onClick={calculate}
                disabled={!location.trim() || calcLoading || geoLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 h-11 font-bold"
              >
                {calcLoading || geoLoading
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating...</>
                  : <><Star className="w-4 h-4 mr-2" /> Calculate Visibility</>}
              </Button>
            </div>
          </Card>

          {/* Bortle Guide */}
          <Card className="bg-slate-900/60 border-slate-800 p-5">
            <h3 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" /> Bortle Scale Reference
            </h3>
            <div className="space-y-2.5">
              {[
                { range: '1–2', label: 'Pristine Dark', color: 'text-emerald-400', bar: 'bg-emerald-500' },
                { range: '3–4', label: 'Rural Dark', color: 'text-blue-400', bar: 'bg-blue-500' },
                { range: '5–6', label: 'Suburban', color: 'text-yellow-400', bar: 'bg-yellow-500' },
                { range: '7–9', label: 'Urban', color: 'text-red-400', bar: 'bg-red-500' },
              ].map(b => (
                <div key={b.range} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-8 flex-shrink-0 ${b.color}`}>{b.range}</span>
                  <div className={`h-2 rounded flex-1 ${b.bar} opacity-60`} />
                  <span className="text-slate-400 text-xs w-24 text-right">{b.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-3 space-y-5">
          {results ? (
            <>
              {/* Overall Score */}
              <Card className={`bg-gradient-to-br ${visConfig[results.overallScore].color} border p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Overall Conditions</p>
                    <h3 className="text-3xl font-black text-white flex items-center gap-2">
                      {visConfig[results.overallScore].icon} {visConfig[results.overallScore].text}
                    </h3>
                    <p className="text-slate-300 text-sm mt-1">{results.coords?.name || location} · {date}</p>
                  </div>
                  <div className="text-right">
                    {results.isPeak && <Badge className="bg-yellow-500 text-black font-bold mb-2 block">🌟 Peak Season</Badge>}
                    {!results.inSeason && <Badge className="bg-slate-700 text-slate-300 block">Off Season</Badge>}
                  </div>
                </div>
              </Card>

              {/* Core Times */}
              <Card className="bg-slate-900/60 border-slate-800 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Telescope className="w-4 h-4 text-purple-400" /> Galactic Core (Sgr A*) — {date}
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Rises', time: formatHour(results.gcData.riseTime), icon: '↑', color: 'text-emerald-400' },
                    { label: 'Peaks', time: formatHour(results.gcData.peakTime), icon: '⭐', color: 'text-yellow-400', sub: `${results.gcData.peakAlt}° altitude` },
                    { label: 'Sets', time: formatHour(results.gcData.setTime), icon: '↓', color: 'text-slate-400' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                      <p className={`text-xl mb-0.5 ${item.color}`}>{item.icon}</p>
                      <p className="text-slate-400 text-xs uppercase tracking-wide">{item.label}</p>
                      <p className="text-white font-bold text-sm mt-0.5">{item.time}</p>
                      {item.sub && <p className="text-slate-500 text-xs">{item.sub}</p>}
                    </div>
                  ))}
                </div>
                <div className="bg-slate-800/40 rounded-lg p-3">
                  <p className="text-slate-400 text-xs mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Best Shooting Window (core {'>'}15° alt)</p>
                  <p className="text-white font-bold">{results.bestWindow}</p>
                </div>
              </Card>

              {/* Sky Map + Moon side by side */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* Sky Map */}
                <Card className="bg-slate-900/60 border-slate-800 p-5">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-purple-400" /> Sky Map (Polar View)
                  </h3>
                  <SkyCanvas gcData={results.gcData} lat={results.coords?.lat} lon={results.coords?.lon} dateStr={date} />
                  <p className="text-xs text-slate-500 text-center mt-2">Milky Way core arc path for {date}</p>
                </Card>

                {/* Moon */}
                <Card className="bg-slate-900/60 border-slate-800 p-5 flex flex-col gap-4">
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    <Moon className="w-4 h-4 text-blue-300" /> Moon Phase
                  </h3>
                  <div className="text-center flex-1 flex flex-col items-center justify-center gap-2">
                    <span className="text-6xl">{results.moon.emoji}</span>
                    <p className="text-white font-bold text-lg">{results.moon.name}</p>
                    <p className="text-slate-400 text-sm">{results.moon.illumination}% illuminated</p>
                    <div className="w-full bg-slate-800 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full transition-all ${results.moon.illumination > 60 ? 'bg-red-500' : results.moon.illumination > 30 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                        style={{ width: `${results.moon.illumination}%` }}
                      />
                    </div>
                  </div>
                  <div className={`rounded-lg p-3 border ${results.moon.illumination > 60 ? 'bg-red-900/20 border-red-500/30' : results.moon.illumination > 30 ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-emerald-900/20 border-emerald-500/30'}`}>
                    <p className={`text-sm font-semibold ${results.moonImpact.color}`}>{results.moonImpact.level} Impact</p>
                    <p className="text-slate-400 text-xs mt-0.5">{results.moonImpact.desc}</p>
                  </div>
                </Card>
              </div>

              {/* Hourly Altitude Chart */}
              <Card className="bg-slate-900/60 border-slate-800 p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> Core Altitude Throughout the Day
                </h3>
                <HourlyChart gcData={results.gcData} />
              </Card>

              {/* Bortle Scale */}
              <Card className={`border p-5 ${BORTLE_COLORS[results.bortleInfo.color]}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Light Pollution Estimate</p>
                    <h3 className="text-lg font-bold text-white">{results.bortleInfo.label}</h3>
                    <p className="text-sm opacity-80 mt-0.5">{results.bortleInfo.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-white">{results.bortle}</p>
                    <p className="text-xs opacity-70">{results.bortleInfo.quality}</p>
                  </div>
                </div>
                <p className="text-xs opacity-50 mt-3">* Estimate based on location name. For precise data, check lightpollutionmap.info</p>
              </Card>

              {/* AI Tips */}
              <Card className="bg-slate-900/60 border-slate-800 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    ✨ AI Location Tips
                  </h3>
                  {!aiTips && (
                    <Button
                      onClick={getAITips}
                      disabled={aiLoading}
                      size="sm"
                      variant="outline"
                      className="border-purple-500/40 text-purple-300 hover:bg-purple-900/20 text-xs"
                    >
                      {aiLoading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading...</> : 'Get Tips'}
                    </Button>
                  )}
                </div>
                {aiTips
                  ? <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{aiTips}</p>
                  : <p className="text-slate-500 text-sm">Get AI-generated tips specific to {results.coords?.name || location}.</p>
                }
              </Card>
            </>
          ) : (
            <Card className="bg-slate-900/60 border-slate-800 p-16 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-purple-600/20 rounded-full blur-xl" />
                <div className="relative bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center">
                  <MapPin className="w-10 h-10 text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-400 mb-2">Enter your shoot location</h3>
              <p className="text-slate-600 max-w-sm mx-auto">We'll calculate moon phase, galactic core visibility times, a sky map, and optimal shooting windows.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}