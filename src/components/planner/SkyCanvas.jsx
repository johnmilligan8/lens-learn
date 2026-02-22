import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Search, Tag, X } from 'lucide-react';

// ─── Math helpers (local copies) ────────────────────────────────────────────
function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function julianDate(date) { return date.getTime() / 86400000 + 2440587.5; }

function lstDegrees(jd, lonDeg) {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * 0.000387933 - T * T * T / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return ((gmst + lonDeg) % 360 + 360) % 360;
}

function raDecToAltAz(ra, dec, lst, lat) {
  const ha = toRad(((lst - ra) % 360 + 360) % 360);
  const decR = toRad(dec), latR = toRad(lat);
  const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(ha);
  const alt = toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
  const cosAz = (Math.sin(decR) - Math.sin(toRad(alt)) * Math.sin(latR)) / (Math.cos(toRad(alt)) * Math.cos(latR));
  let az = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  if (Math.sin(ha) > 0) az = 360 - az;
  return { alt, az };
}

function computePos(ra, dec, lat, lon, dateStr, hourOffset) {
  const base = new Date(dateStr + 'T00:00:00Z');
  const t = new Date(base.getTime() + hourOffset * 3600000);
  const jd = julianDate(t);
  const lst = lstDegrees(jd, lon);
  return raDecToAltAz(ra, dec, lst, lat);
}

function altAzToCanvas(alt, az, cx, cy, R) {
  if (alt <= -2) return null;
  const clampedAlt = Math.max(0, alt);
  const elev = 1 - (clampedAlt / 90);
  const rad = toRad(az - 90);
  return { x: cx + R * elev * Math.cos(rad), y: cy + R * elev * Math.sin(rad), visible: alt > 0 };
}

// ─── Planetary positions (low-precision VSOP-lite, good to ~1°) ─────────────
// Returns RA/Dec in degrees for a given Julian Date
function sunRaDec(jd) {
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = toRad((357.528 + 0.9856003 * n) % 360);
  const lambda = toRad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const epsilon = toRad(23.439 - 0.0000004 * n);
  const ra = toDeg(Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)));
  const dec = toDeg(Math.asin(Math.sin(epsilon) * Math.sin(lambda)));
  return { ra: (ra + 360) % 360, dec };
}

function moonRaDec(jd) {
  const T = (jd - 2451545.0) / 36525;
  let L = 218.316 + 13.176396 * (jd - 2451545);
  let M = 134.963 + 13.064993 * (jd - 2451545);
  let F = 93.272 + 13.229350 * (jd - 2451545);
  L = L % 360; M = M % 360; F = F % 360;
  const lambda = L + 6.289 * Math.sin(toRad(M));
  const beta = 5.128 * Math.sin(toRad(F));
  const epsilon = 23.439 - 0.0000004 * (jd - 2451545);
  const ra = toDeg(Math.atan2(
    Math.cos(toRad(epsilon)) * Math.sin(toRad(lambda)) - Math.tan(toRad(beta)) * Math.sin(toRad(epsilon)),
    Math.cos(toRad(lambda))
  ));
  const dec = toDeg(Math.asin(
    Math.sin(toRad(beta)) * Math.cos(toRad(epsilon)) +
    Math.cos(toRad(beta)) * Math.sin(toRad(epsilon)) * Math.sin(toRad(lambda))
  ));
  return { ra: (ra + 360) % 360, dec };
}

// Simplified planet positions via mean orbital elements
function planetRaDec(jd, planet) {
  const d = jd - 2451545.0;
  // Mean longitude and anomaly constants [L0, L1, M0, M1] per planet
  const elems = {
    Mercury: { L0: 252.251, L1: 4.09233, M0: 174.7948, M1: 4.09234, e: 0.206, a: 0.387, inc: 7.0 },
    Venus:   { L0: 181.979, L1: 1.60213, M0: 50.4161,  M1: 1.60214, e: 0.007, a: 0.723, inc: 3.4 },
    Mars:    { L0: 355.433, L1: 0.52403, M0: 19.3730,  M1: 0.52402, e: 0.093, a: 1.524, inc: 1.9 },
    Jupiter: { L0: 34.351,  L1: 0.08309, M0: 20.9161,  M1: 0.08310, e: 0.049, a: 5.203, inc: 1.3 },
    Saturn:  { L0: 50.077,  L1: 0.03346, M0: 317.020,  M1: 0.03344, e: 0.056, a: 9.537, inc: 2.5 },
  };
  const el = elems[planet];
  if (!el) return null;
  const M = toRad(((el.M0 + el.M1 * d) % 360 + 360) % 360);
  const E = M + el.e * Math.sin(M) * (1 + el.e * Math.cos(M)); // approx Kepler
  const xv = el.a * (Math.cos(E) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lp = v + toRad(((el.L0 + el.L1 * d) % 360 + 360) % 360 - ((el.M0 + el.M1 * d) % 360 + 360) % 360);
  // Ecliptic to equatorial (simplified, inc≈0 assumption gives rough RA/Dec)
  const eps = toRad(23.439);
  const x = r * Math.cos(lp);
  const y = r * Math.sin(lp) * Math.cos(toRad(el.inc));
  const z = r * Math.sin(lp) * Math.sin(toRad(el.inc));
  const ra = toDeg(Math.atan2(y * Math.cos(eps) - z * Math.sin(eps), x));
  const dec = toDeg(Math.asin((y * Math.sin(eps) + z * Math.cos(eps)) / Math.sqrt(x*x+y*y+z*z)));
  return { ra: (ra + 360) % 360, dec };
}

// ─── Catalog ─────────────────────────────────────────────────────────────────

const STARS = [
  { name: 'Sgr A* (GC)',        ra: 266.4,  dec: -29.0,  color: '#fbbf24', size: 6, category: 'deep_sky', isPrimary: true, label: 'GC' },
  { name: 'Antares (α Sco)',     ra: 247.35, dec: -26.43, color: '#f87171', size: 5, category: 'star' },
  { name: 'Kaus Australis (ε Sgr)', ra: 276.04, dec: -34.38, color: '#c4b5fd', size: 4, category: 'star' },
  { name: 'Spica (α Vir)',       ra: 201.30, dec: -11.16, color: '#bfdbfe', size: 5, category: 'star' },
  { name: 'Arcturus (α Boo)',    ra: 213.92, dec: 19.18,  color: '#fed7aa', size: 5, category: 'star' },
  { name: 'Vega (α Lyr)',        ra: 279.23, dec: 38.78,  color: '#e0f2fe', size: 5, category: 'star' },
  { name: 'Deneb (α Cyg)',       ra: 310.36, dec: 45.28,  color: '#e0f2fe', size: 4, category: 'star' },
  { name: 'Altair (α Aql)',      ra: 297.70, dec: 8.87,   color: '#e0f2fe', size: 4, category: 'star' },
  { name: 'Fomalhaut (α PsA)',   ra: 344.41, dec: -29.62, color: '#bfdbfe', size: 4, category: 'star' },
  { name: 'Sirius (α CMa)',      ra: 101.29, dec: -16.72, color: '#dbeafe', size: 6, category: 'star' },
  { name: 'Canopus (α Car)',     ra: 95.99,  dec: -52.70, color: '#fef9c3', size: 5, category: 'star' },
  { name: 'Rigel (β Ori)',       ra: 78.63,  dec: -8.20,  color: '#bfdbfe', size: 5, category: 'star' },
  { name: 'Betelgeuse (α Ori)',  ra: 88.79,  dec: 7.41,   color: '#fca5a5', size: 5, category: 'star' },
  { name: 'Aldebaran (α Tau)',   ra: 68.98,  dec: 16.51,  color: '#fdba74', size: 4, category: 'star' },
  { name: 'Pollux (β Gem)',      ra: 116.33, dec: 28.03,  color: '#fde68a', size: 4, category: 'star' },
  { name: 'Regulus (α Leo)',     ra: 152.09, dec: 11.97,  color: '#bfdbfe', size: 4, category: 'star' },
  { name: 'Achernar (α Eri)',    ra: 24.43,  dec: -57.24, color: '#bfdbfe', size: 4, category: 'star' },
  { name: 'Capella (α Aur)',     ra: 79.17,  dec: 45.99,  color: '#fef08a', size: 5, category: 'star' },
  { name: 'Rasalhague (α Oph)',  ra: 263.73, dec: 12.56,  color: '#d9f99d', size: 3, category: 'star' },
  { name: 'Shaula (λ Sco)',      ra: 263.40, dec: -37.10, color: '#bfdbfe', size: 3, category: 'star' },
  // Deep sky
  { name: 'Andromeda Galaxy (M31)', ra: 10.68, dec: 41.27, color: '#a5b4fc', size: 5, category: 'deep_sky', symbol: 'galaxy' },
  { name: 'Orion Nebula (M42)',  ra: 83.82,  dec: -5.39,  color: '#67e8f9', size: 4, category: 'deep_sky', symbol: 'nebula' },
  { name: 'Pleiades (M45)',      ra: 56.75,  dec: 24.12,  color: '#bfdbfe', size: 4, category: 'deep_sky', symbol: 'cluster' },
  { name: 'Lagoon Nebula (M8)', ra: 271.05, dec: -24.38, color: '#f0abfc', size: 3, category: 'deep_sky', symbol: 'nebula' },
  { name: 'Omega Centauri',     ra: 201.70, dec: -47.48, color: '#fef08a', size: 4, category: 'deep_sky', symbol: 'cluster' },
  { name: 'Triangulum Galaxy (M33)', ra: 23.46, dec: 30.66, color: '#a5b4fc', size: 3, category: 'deep_sky', symbol: 'galaxy' },
];

const PLANETS = [
  { name: 'Mercury', color: '#d1d5db', size: 5, category: 'planet', symbol: '☿' },
  { name: 'Venus',   color: '#fef9c3', size: 6, category: 'planet', symbol: '♀' },
  { name: 'Mars',    color: '#fb923c', size: 5, category: 'planet', symbol: '♂' },
  { name: 'Jupiter', color: '#fdba74', size: 7, category: 'planet', symbol: '♃' },
  { name: 'Saturn',  color: '#fde68a', size: 6, category: 'planet', symbol: '♄' },
];

// Constellation stick figures: pairs of [star_name, star_name] by index
const CONSTELLATION_LINES = {
  Orion: [
    ['Betelgeuse (α Ori)', 'Rigel (β Ori)'],
    ['Betelgeuse (α Ori)', 'Aldebaran (α Tau)'],
  ],
  Scorpius: [
    ['Antares (α Sco)', 'Shaula (λ Sco)'],
  ],
  'Summer Triangle': [
    ['Vega (α Lyr)', 'Deneb (α Cyg)'],
    ['Deneb (α Cyg)', 'Altair (α Aql)'],
    ['Altair (α Aql)', 'Vega (α Lyr)'],
  ],
};

const CATEGORY_COLORS = {
  planet: '#fdba74',
  star: '#e2e8f0',
  deep_sky: '#a5b4fc',
};

const SIZE = 340;
const CX = SIZE / 2, CY = SIZE / 2;
const R = SIZE / 2 - 22;

// ─── Component ───────────────────────────────────────────────────────────────

export default function SkyCanvas({ gcData, lat, lon, dateStr }) {
  const canvasRef = useRef(null);
  const [scrubHour, setScrubHour] = useState(22);
  const [clickInfo, setClickInfo] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlighted, setHighlighted] = useState(null); // name of searched/highlighted object

  // Build planet RA/Dec dynamically for the current time
  const currentJD = useMemo(() => {
    const base = new Date(dateStr + 'T00:00:00Z');
    const t = new Date(base.getTime() + scrubHour * 3600000);
    return julianDate(t);
  }, [dateStr, scrubHour]);

  const allObjects = useMemo(() => {
    // Static stars + deep sky
    const fixed = STARS.map(obj => {
      const { alt, az } = computePos(obj.ra, obj.dec, lat, lon, dateStr, scrubHour);
      const pos = altAzToCanvas(alt, az, CX, CY, R);
      return { ...obj, alt: Math.round(alt * 10) / 10, az: Math.round(az * 10) / 10, pos };
    });

    // Sun
    const { ra: sunRa, dec: sunDec } = sunRaDec(currentJD);
    const { alt: sunAlt, az: sunAz } = raDecToAltAz(sunRa, sunDec, lstDegrees(currentJD, lon), lat);
    const sunPos = altAzToCanvas(sunAlt, sunAz, CX, CY, R);
    fixed.push({
      name: 'Sun', ra: sunRa, dec: sunDec, color: '#fbbf24', size: 8,
      category: 'planet', symbol: '☀', isSun: true,
      alt: Math.round(sunAlt * 10) / 10, az: Math.round(sunAz * 10) / 10, pos: sunPos
    });

    // Moon
    const { ra: moonRa, dec: moonDec } = moonRaDec(currentJD);
    const { alt: moonAlt, az: moonAz } = raDecToAltAz(moonRa, moonDec, lstDegrees(currentJD, lon), lat);
    const moonPos = altAzToCanvas(moonAlt, moonAz, CX, CY, R);
    fixed.push({
      name: 'Moon', ra: moonRa, dec: moonDec, color: '#e2e8f0', size: 6,
      category: 'planet', symbol: '☽', isMoon: true,
      alt: Math.round(moonAlt * 10) / 10, az: Math.round(moonAz * 10) / 10, pos: moonPos
    });

    // Planets
    PLANETS.forEach(p => {
      const rd = planetRaDec(currentJD, p.name);
      if (!rd) return;
      const { alt, az } = raDecToAltAz(rd.ra, rd.dec, lstDegrees(currentJD, lon), lat);
      const pos = altAzToCanvas(alt, az, CX, CY, R);
      fixed.push({ ...p, ra: rd.ra, dec: rd.dec, alt: Math.round(alt * 10) / 10, az: Math.round(az * 10) / 10, pos });
    });

    return fixed;
  }, [lat, lon, dateStr, scrubHour, currentJD]);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const q = searchQuery.toLowerCase();
    setSearchResults(allObjects.filter(o => o.name.toLowerCase().includes(q)).slice(0, 6));
  }, [searchQuery, allObjects]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background
    const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    bg.addColorStop(0, '#0d0628');
    bg.addColorStop(0.7, '#07031a');
    bg.addColorStop(1, '#020212');
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 2 * Math.PI);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 2; ctx.stroke();

    // Altitude rings
    [[0.333, '30°'], [0.667, '60°']].forEach(([f, lbl]) => {
      ctx.beginPath(); ctx.arc(CX, CY, R * f, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(100,80,160,0.15)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(120,100,180,0.3)'; ctx.font = '8px sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, CX + R * f + 3, CY - 4);
    });

    // Spokes
    [0, 45, 90, 135, 180, 225, 270, 315].forEach(az => {
      const rad = toRad(az - 90);
      ctx.beginPath(); ctx.moveTo(CX, CY);
      ctx.lineTo(CX + R * Math.cos(rad), CY + R * Math.sin(rad));
      ctx.strokeStyle = 'rgba(100,80,160,0.06)'; ctx.lineWidth = 1; ctx.stroke();
    });

    // Cardinal labels
    [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]].forEach(([lbl, az]) => {
      const isCard = lbl.length === 1;
      const rad = toRad(az - 90);
      const dist = R + (isCard ? 12 : 9);
      ctx.fillStyle = isCard ? '#94a3b8' : 'rgba(100,116,139,0.45)';
      ctx.font = isCard ? 'bold 11px sans-serif' : '8px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, CX + dist * Math.cos(rad), CY + dist * Math.sin(rad));
    });

    // GC full-day arc
    const gcVisible = (gcData?.results ?? []).filter(p => p.alt > 0);
    if (gcVisible.length > 1) {
      ctx.beginPath();
      let started = false;
      gcVisible.forEach(p => {
        const pos = altAzToCanvas(p.alt, p.az, CX, CY, R);
        if (!pos) return;
        if (!started) { ctx.moveTo(pos.x, pos.y); started = true; } else ctx.lineTo(pos.x, pos.y);
      });
      ctx.strokeStyle = 'rgba(168,85,247,0.14)'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.stroke();
      const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      grad.addColorStop(0, 'rgba(168,85,247,0.8)');
      grad.addColorStop(0.5, 'rgba(251,191,36,0.9)');
      grad.addColorStop(1, 'rgba(59,130,246,0.8)');
      ctx.beginPath(); started = false;
      gcVisible.forEach(p => {
        const pos = altAzToCanvas(p.alt, p.az, CX, CY, R);
        if (!pos) return;
        if (!started) { ctx.moveTo(pos.x, pos.y); started = true; } else ctx.lineTo(pos.x, pos.y);
      });
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.stroke();
    }

    // Constellation lines
    if (showConstellations) {
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1;
      Object.values(CONSTELLATION_LINES).forEach(pairs => {
        pairs.forEach(([a, b]) => {
          const objA = allObjects.find(o => o.name === a);
          const objB = allObjects.find(o => o.name === b);
          if (!objA?.pos?.visible || !objB?.pos?.visible) return;
          ctx.beginPath();
          ctx.moveTo(objA.pos.x, objA.pos.y);
          ctx.lineTo(objB.pos.x, objB.pos.y);
          ctx.stroke();
        });
      });
      ctx.setLineDash([]);
    }

    // Decorative background stars
    const seeds = [[0.15,0.25],[0.8,0.1],[0.4,0.7],[0.6,0.3],[0.2,0.6],[0.75,0.65],[0.5,0.15],[0.3,0.45],[0.65,0.5],[0.1,0.8],[0.9,0.4],[0.55,0.75],[0.35,0.2],[0.7,0.48]];
    seeds.forEach(([fx, fy]) => {
      const x = CX + (fx - 0.5) * 2 * R * 0.9;
      const y = CY + (fy - 0.5) * 2 * R * 0.9;
      if (Math.hypot(x - CX, y - CY) > R * 0.96) return;
      ctx.beginPath(); ctx.arc(x, y, 0.7, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
    });

    // Draw all objects
    allObjects.forEach(obj => {
      if (!obj.pos?.visible) return;
      const { x, y } = obj.pos;
      const isHL = highlighted === obj.name;

      // Glow
      const grd = ctx.createRadialGradient(x, y, 0, x, y, obj.size * 3);
      grd.addColorStop(0, obj.color + (isHL ? 'cc' : '66'));
      grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(x, y, obj.size * 3, 0, 2 * Math.PI);
      ctx.fillStyle = grd; ctx.fill();

      // Body
      ctx.beginPath();
      if (obj.isSun) {
        // Sun: yellow disc with rays
        ctx.arc(x, y, obj.size * 0.8, 0, 2 * Math.PI);
        ctx.fillStyle = '#fbbf24'; ctx.fill();
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (obj.symbol === 'galaxy') {
        // Galaxy: ellipse
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.5);
        ctx.scale(1.6, 0.7);
        ctx.beginPath(); ctx.arc(0, 0, obj.size * 0.6, 0, 2 * Math.PI);
        ctx.fillStyle = obj.color; ctx.fill(); ctx.restore();
      } else if (obj.symbol === 'cluster') {
        // Cluster: ring of dots
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath(); ctx.arc(x + Math.cos(a) * obj.size * 0.6, y + Math.sin(a) * obj.size * 0.6, 1, 0, 2 * Math.PI);
          ctx.fillStyle = obj.color; ctx.fill();
        }
      } else if (obj.symbol === 'nebula') {
        // Nebula: blurred smear
        ctx.arc(x, y, obj.size * 0.8, 0, 2 * Math.PI);
        const ng = ctx.createRadialGradient(x, y, 0, x, y, obj.size * 1.5);
        ng.addColorStop(0, obj.color + 'aa'); ng.addColorStop(1, 'transparent');
        ctx.fillStyle = ng; ctx.fill();
      } else {
        ctx.arc(x, y, obj.size * 0.65, 0, 2 * Math.PI);
        ctx.fillStyle = obj.color; ctx.fill();
      }

      // Planet symbol
      if (obj.category === 'planet' && obj.symbol && !obj.isSun) {
        ctx.fillStyle = obj.color;
        ctx.font = `${obj.size * 1.1}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.symbol, x, y - obj.size - 2);
      }

      // Primary label
      if (obj.isPrimary) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('GC', x, y - 12);
      }

      // Highlight ring
      if (isHL) {
        ctx.beginPath(); ctx.arc(x, y, obj.size * 1.4 + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      }

      // Labels
      if (showLabels) {
        const short = obj.label ?? obj.name.split(' ')[0].replace('(', '').replace(')', '');
        ctx.fillStyle = isHL ? '#38bdf8' : 'rgba(203,213,225,0.6)';
        ctx.font = isHL ? 'bold 9px sans-serif' : '8px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(short, x, y + obj.size * 0.8 + 2);
      }
    });

    // GC current-time cursor
    const { alt: gcAlt, az: gcAz } = computePos(266.4, -29.0, lat, lon, dateStr, scrubHour);
    if (gcAlt > 0) {
      const pos = altAzToCanvas(gcAlt, gcAz, CX, CY, R);
      if (pos) {
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(251,191,36,0.2)'; ctx.fill();
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#fbbf24'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    // Zenith
    ctx.beginPath(); ctx.arc(CX, CY, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#475569'; ctx.fill();

    // Click crosshair
    if (clickInfo?.canvasPos) {
      const { x, y } = clickInfo.canvasPos;
      ctx.strokeStyle = 'rgba(56,189,248,0.8)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 9); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }, [allObjects, gcData, scrubHour, clickInfo, showLabels, showConstellations, highlighted, lat, lon, dateStr]);

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width, sy = SIZE / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;
    const dist = Math.hypot(mx - CX, my - CY);
    if (dist > R) return;

    let closest = null, closestD = Infinity;
    allObjects.forEach(obj => {
      if (!obj.pos?.visible) return;
      const d = Math.hypot(mx - obj.pos.x, my - obj.pos.y);
      if (d < 16 && d < closestD) { closest = obj; closestD = d; }
    });

    if (closest) {
      setClickInfo({ name: closest.name, alt: closest.alt, az: closest.az, canvasPos: closest.pos, category: closest.category, isObject: true });
      setHighlighted(closest.name);
      return;
    }

    const altFrac = dist / R;
    const alt = Math.round((1 - altFrac) * 90 * 10) / 10;
    const az = Math.round((toDeg(Math.atan2(my - CY, mx - CX)) + 90 + 360) % 360 * 10) / 10;
    setClickInfo({ name: 'Sky Point', alt, az, canvasPos: { x: mx, y: my }, isObject: false });
    setHighlighted(null);
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width, sy = SIZE / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;
    let found = null;
    allObjects.forEach(obj => {
      if (!obj.pos?.visible) return;
      if (Math.hypot(mx - obj.pos.x, my - obj.pos.y) < 14) found = obj.name;
    });
    setHovered(found);
    canvas.style.cursor = found ? 'pointer' : 'crosshair';
  }

  const timeLabel = (() => {
    const h = Math.floor(scrubHour), m = Math.round((scrubHour - h) * 60);
    return `${(h % 12 || 12).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'} UTC`;
  })();

  const gcNow = useMemo(() => {
    const { alt, az } = computePos(266.4, -29.0, lat, lon, dateStr, scrubHour);
    return { alt: Math.round(alt * 10) / 10, az: Math.round(az * 10) / 10, visible: alt > 0 };
  }, [lat, lon, dateStr, scrubHour]);

  const categoryBadge = { planet: 'text-amber-300', star: 'text-slate-300', deep_sky: 'text-indigo-300' };

  return (
    <div className="flex flex-col gap-3">
      {/* Controls bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowLabels(v => !v)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${showLabels ? 'border-purple-500/50 bg-purple-900/30 text-purple-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
        >
          <Tag className="w-3 h-3" /> Labels
        </button>
        <button
          onClick={() => setShowConstellations(v => !v)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${showConstellations ? 'border-blue-500/50 bg-blue-900/30 text-blue-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
        >
          ✦ Lines
        </button>

        {/* Search */}
        <div className="flex-1 relative min-w-[120px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Find object…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setHighlighted(null); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
          {/* Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
              {searchResults.map(obj => (
                <button
                  key={obj.name}
                  onClick={() => {
                    setHighlighted(obj.name);
                    setClickInfo({ name: obj.name, alt: obj.alt, az: obj.az, canvasPos: obj.pos, category: obj.category, isObject: true });
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800 transition-colors text-left"
                >
                  <div>
                    <p className="text-white text-xs font-medium">{obj.name}</p>
                    <p className={`text-[10px] capitalize ${categoryBadge[obj.category] ?? 'text-slate-400'}`}>{obj.category.replace('_',' ')}</p>
                  </div>
                  <span className={`text-xs ${obj.pos?.visible ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {obj.pos?.visible ? `Alt ${obj.alt}°` : 'Below horizon'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className="w-full max-w-[340px] mx-auto rounded-full block"
          style={{ cursor: 'crosshair' }}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        />
        {hovered && (
          <div className="absolute top-2 left-2 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 pointer-events-none max-w-[180px] truncate">
            {hovered}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Planets</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />Stars</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Deep Sky</span>
        <span className="flex items-center gap-1"><span className="w-4 border-t border-dashed border-slate-500 inline-block" />Constellations</span>
      </div>

      {/* Time scrubber */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Time (UTC)</span>
          <span className="text-white font-mono font-bold">{timeLabel}</span>
        </div>
        <input
          type="range" min={0} max={23.75} step={0.25} value={scrubHour}
          onChange={e => { setScrubHour(parseFloat(e.target.value)); setClickInfo(null); }}
          className="w-full accent-purple-500 h-1.5 rounded cursor-pointer"
        />
        <div className="flex justify-between text-slate-600 text-[9px]">
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
        </div>
      </div>

      {/* GC readout */}
      <div className={`rounded-lg px-3 py-2 text-xs border ${gcNow.visible ? 'bg-purple-900/20 border-purple-500/30' : 'bg-slate-800/40 border-slate-700/40'}`}>
        <span className="text-slate-400">Galactic Core @ {timeLabel}: </span>
        {gcNow.visible
          ? <span className="text-purple-300 font-semibold">Alt {gcNow.alt}° · Az {gcNow.az}° <span className="text-emerald-400 ml-1">● Visible</span></span>
          : <span className="text-slate-500">Below horizon</span>}
      </div>

      {/* Click info */}
      {clickInfo && (
        <div className="rounded-lg px-3 py-2 text-xs border bg-cyan-900/20 border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-semibold">{clickInfo.name}</span>
            <button onClick={() => { setClickInfo(null); setHighlighted(null); }} className="text-slate-500 hover:text-slate-300">✕</button>
          </div>
          <div className="flex gap-4 mt-1 text-slate-300 flex-wrap">
            <span>Alt: <strong className="text-white">{clickInfo.alt}°</strong></span>
            <span>Az: <strong className="text-white">{clickInfo.az}°</strong></span>
            {clickInfo.category && <span className={`capitalize ${categoryBadge[clickInfo.category] ?? ''}`}>{clickInfo.category.replace('_',' ')}</span>}
            {clickInfo.isObject && <span className={clickInfo.alt > 0 ? 'text-emerald-400' : 'text-slate-500'}>{clickInfo.alt > 0 ? '● Visible' : '○ Below horizon'}</span>}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-600 text-center">Click any object or sky point · {allObjects.filter(o => o.pos?.visible).length} objects visible</p>
    </div>
  );
}