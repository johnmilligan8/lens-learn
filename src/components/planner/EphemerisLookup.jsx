import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Calendar, Clock, Compass, ArrowUp, ChevronDown, X } from 'lucide-react';

// ─── Math helpers ────────────────────────────────────────────────────────────
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

// ─── Planetary positions ─────────────────────────────────────────────────────
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

function planetRaDec(jd, planet) {
  const d = jd - 2451545.0;
  const elems = {
    Mercury: { L0: 252.251, L1: 4.09233, M0: 174.7948, M1: 4.09234, e: 0.206, a: 0.387, inc: 7.0 },
    Venus:   { L0: 181.979, L1: 1.60213, M0: 50.4161,  M1: 1.60214, e: 0.007, a: 0.723, inc: 3.4 },
    Mars:    { L0: 355.433, L1: 0.52403, M0: 19.3730,  M1: 0.52402, e: 0.093, a: 1.524, inc: 1.9 },
    Jupiter: { L0: 34.351,  L1: 0.08309, M0: 20.9161,  M1: 0.08310, e: 0.049, a: 5.203, inc: 1.3 },
    Saturn:  { L0: 50.077,  L1: 0.03346, M0: 317.020,  M1: 0.03344, e: 0.056, a: 9.537, inc: 2.5 },
    Uranus:  { L0: 314.055, L1: 0.01172, M0: 142.955,  M1: 0.01172, e: 0.047, a: 19.19, inc: 0.8 },
    Neptune: { L0: 304.349, L1: 0.00598, M0: 259.883,  M1: 0.00598, e: 0.009, a: 30.07, inc: 1.8 },
  };
  const el = elems[planet];
  if (!el) return null;
  const M = toRad(((el.M0 + el.M1 * d) % 360 + 360) % 360);
  const E = M + el.e * Math.sin(M) * (1 + el.e * Math.cos(M));
  const xv = el.a * (Math.cos(E) - el.e);
  const yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const v = Math.atan2(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lp = v + toRad(((el.L0 + el.L1 * d) % 360 + 360) % 360 - ((el.M0 + el.M1 * d) % 360 + 360) % 360);
  const eps = toRad(23.439);
  const x = r * Math.cos(lp);
  const y = r * Math.sin(lp) * Math.cos(toRad(el.inc));
  const z = r * Math.sin(lp) * Math.sin(toRad(el.inc));
  const ra = toDeg(Math.atan2(y * Math.cos(eps) - z * Math.sin(eps), x));
  const dec = toDeg(Math.asin((y * Math.sin(eps) + z * Math.cos(eps)) / Math.sqrt(x*x+y*y+z*z)));
  return { ra: (ra + 360) % 360, dec };
}

// ─── Full catalog ─────────────────────────────────────────────────────────────
const CATALOG = [
  // Solar system (dynamic — ra/dec computed at query time)
  { name: 'Sun',     category: 'planet',   type: 'dynamic', key: 'Sun',     emoji: '☀️' },
  { name: 'Moon',    category: 'planet',   type: 'dynamic', key: 'Moon',    emoji: '🌙' },
  { name: 'Mercury', category: 'planet',   type: 'dynamic', key: 'Mercury', emoji: '☿' },
  { name: 'Venus',   category: 'planet',   type: 'dynamic', key: 'Venus',   emoji: '♀' },
  { name: 'Mars',    category: 'planet',   type: 'dynamic', key: 'Mars',    emoji: '♂' },
  { name: 'Jupiter', category: 'planet',   type: 'dynamic', key: 'Jupiter', emoji: '♃' },
  { name: 'Saturn',  category: 'planet',   type: 'dynamic', key: 'Saturn',  emoji: '♄' },
  { name: 'Uranus',  category: 'planet',   type: 'dynamic', key: 'Uranus',  emoji: '⛢' },
  { name: 'Neptune', category: 'planet',   type: 'dynamic', key: 'Neptune', emoji: '♆' },
  // Named stars
  { name: 'Sirius (α CMa)',          category: 'star', ra: 101.29, dec: -16.72, mag: -1.46, constellation: 'Canis Major' },
  { name: 'Canopus (α Car)',          category: 'star', ra: 95.99,  dec: -52.70, mag: -0.72, constellation: 'Carina' },
  { name: 'Arcturus (α Boo)',         category: 'star', ra: 213.92, dec: 19.18,  mag: -0.05, constellation: 'Boötes' },
  { name: 'Vega (α Lyr)',             category: 'star', ra: 279.23, dec: 38.78,  mag: 0.03,  constellation: 'Lyra' },
  { name: 'Capella (α Aur)',          category: 'star', ra: 79.17,  dec: 45.99,  mag: 0.08,  constellation: 'Auriga' },
  { name: 'Rigel (β Ori)',            category: 'star', ra: 78.63,  dec: -8.20,  mag: 0.13,  constellation: 'Orion' },
  { name: 'Procyon (α CMi)',          category: 'star', ra: 114.83, dec: 5.23,   mag: 0.34,  constellation: 'Canis Minor' },
  { name: 'Achernar (α Eri)',         category: 'star', ra: 24.43,  dec: -57.24, mag: 0.46,  constellation: 'Eridanus' },
  { name: 'Betelgeuse (α Ori)',       category: 'star', ra: 88.79,  dec: 7.41,   mag: 0.50,  constellation: 'Orion' },
  { name: 'Hadar (β Cen)',            category: 'star', ra: 210.96, dec: -60.37, mag: 0.61,  constellation: 'Centaurus' },
  { name: 'Altair (α Aql)',           category: 'star', ra: 297.70, dec: 8.87,   mag: 0.77,  constellation: 'Aquila' },
  { name: 'Aldebaran (α Tau)',        category: 'star', ra: 68.98,  dec: 16.51,  mag: 0.85,  constellation: 'Taurus' },
  { name: 'Antares (α Sco)',          category: 'star', ra: 247.35, dec: -26.43, mag: 1.09,  constellation: 'Scorpius' },
  { name: 'Spica (α Vir)',            category: 'star', ra: 201.30, dec: -11.16, mag: 1.04,  constellation: 'Virgo' },
  { name: 'Pollux (β Gem)',           category: 'star', ra: 116.33, dec: 28.03,  mag: 1.14,  constellation: 'Gemini' },
  { name: 'Fomalhaut (α PsA)',        category: 'star', ra: 344.41, dec: -29.62, mag: 1.16,  constellation: 'Piscis Austrinus' },
  { name: 'Deneb (α Cyg)',            category: 'star', ra: 310.36, dec: 45.28,  mag: 1.25,  constellation: 'Cygnus' },
  { name: 'Regulus (α Leo)',          category: 'star', ra: 152.09, dec: 11.97,  mag: 1.36,  constellation: 'Leo' },
  { name: 'Castor (α Gem)',           category: 'star', ra: 113.65, dec: 31.89,  mag: 1.58,  constellation: 'Gemini' },
  { name: 'Shaula (λ Sco)',           category: 'star', ra: 263.40, dec: -37.10, mag: 1.62,  constellation: 'Scorpius' },
  { name: 'Kaus Australis (ε Sgr)',   category: 'star', ra: 276.04, dec: -34.38, mag: 1.85,  constellation: 'Sagittarius' },
  { name: 'Rasalhague (α Oph)',       category: 'star', ra: 263.73, dec: 12.56,  mag: 2.08,  constellation: 'Ophiuchus' },
  { name: 'Mizar (ζ UMa)',            category: 'star', ra: 200.98, dec: 54.93,  mag: 2.04,  constellation: 'Ursa Major' },
  { name: 'Dubhe (α UMa)',            category: 'star', ra: 165.93, dec: 61.75,  mag: 1.79,  constellation: 'Ursa Major' },
  { name: 'Polaris (α UMi)',          category: 'star', ra: 37.95,  dec: 89.26,  mag: 1.97,  constellation: 'Ursa Minor' },
  // Deep sky
  { name: 'Andromeda Galaxy (M31)',   category: 'deep_sky', ra: 10.68,  dec: 41.27,  type_tag: 'Galaxy',      const: 'Andromeda', mag: 3.44 },
  { name: 'Orion Nebula (M42)',       category: 'deep_sky', ra: 83.82,  dec: -5.39,  type_tag: 'Nebula',      const: 'Orion',     mag: 4.0 },
  { name: 'Pleiades (M45)',           category: 'deep_sky', ra: 56.75,  dec: 24.12,  type_tag: 'Open Cluster', const: 'Taurus',   mag: 1.6 },
  { name: 'Beehive Cluster (M44)',    category: 'deep_sky', ra: 130.10, dec: 19.67,  type_tag: 'Open Cluster', const: 'Cancer',   mag: 3.7 },
  { name: 'Lagoon Nebula (M8)',       category: 'deep_sky', ra: 271.05, dec: -24.38, type_tag: 'Nebula',      const: 'Sagittarius', mag: 6.0 },
  { name: 'Trifid Nebula (M20)',      category: 'deep_sky', ra: 270.62, dec: -23.02, type_tag: 'Nebula',      const: 'Sagittarius', mag: 6.3 },
  { name: 'Eagle Nebula (M16)',       category: 'deep_sky', ra: 274.70, dec: -13.79, type_tag: 'Nebula',      const: 'Serpens',   mag: 6.4 },
  { name: 'Omega Nebula (M17)',       category: 'deep_sky', ra: 275.20, dec: -16.17, type_tag: 'Nebula',      const: 'Sagittarius', mag: 6.0 },
  { name: 'Ring Nebula (M57)',        category: 'deep_sky', ra: 283.40, dec: 33.03,  type_tag: 'Nebula',      const: 'Lyra',      mag: 8.8 },
  { name: 'Dumbbell Nebula (M27)',    category: 'deep_sky', ra: 299.90, dec: 22.72,  type_tag: 'Nebula',      const: 'Vulpecula', mag: 7.5 },
  { name: 'Triangulum Galaxy (M33)',  category: 'deep_sky', ra: 23.46,  dec: 30.66,  type_tag: 'Galaxy',      const: 'Triangulum', mag: 5.72 },
  { name: 'Whirlpool Galaxy (M51)',   category: 'deep_sky', ra: 202.47, dec: 47.20,  type_tag: 'Galaxy',      const: 'Canes Venatici', mag: 8.4 },
  { name: 'Omega Centauri (NGC 5139)', category: 'deep_sky', ra: 201.70, dec: -47.48, type_tag: 'Globular', const: 'Centaurus', mag: 3.9 },
  { name: 'Hercules Cluster (M13)',   category: 'deep_sky', ra: 250.42, dec: 36.46,  type_tag: 'Globular',    const: 'Hercules',  mag: 5.8 },
  { name: 'Crab Nebula (M1)',         category: 'deep_sky', ra: 83.63,  dec: 22.01,  type_tag: 'Supernova Remnant', const: 'Taurus', mag: 8.4 },
  { name: 'Pinwheel Galaxy (M101)',   category: 'deep_sky', ra: 210.80, dec: 54.35,  type_tag: 'Galaxy',      const: 'Ursa Major', mag: 7.9 },
  { name: 'Sombrero Galaxy (M104)',   category: 'deep_sky', ra: 189.99, dec: -11.62, type_tag: 'Galaxy',      const: 'Virgo',     mag: 8.0 },
  { name: 'Sculptor Galaxy (NGC 253)',category: 'deep_sky', ra: 11.89,  dec: -25.29, type_tag: 'Galaxy',      const: 'Sculptor',  mag: 7.1 },
  { name: 'Sgr A* (Galactic Core)',   category: 'deep_sky', ra: 266.4,  dec: -29.0,  type_tag: 'Galactic Center', const: 'Sagittarius', mag: null },
  { name: 'Large Magellanic Cloud',   category: 'deep_sky', ra: 80.89,  dec: -69.76, type_tag: 'Galaxy',      const: 'Dorado',    mag: 0.9 },
  { name: 'Small Magellanic Cloud',   category: 'deep_sky', ra: 13.16,  dec: -72.80, type_tag: 'Galaxy',      const: 'Tucana',    mag: 2.7 },
];

function getRaDec(obj, jd) {
  if (obj.type !== 'dynamic') return { ra: obj.ra, dec: obj.dec };
  if (obj.key === 'Sun')  return sunRaDec(jd);
  if (obj.key === 'Moon') return moonRaDec(jd);
  return planetRaDec(jd, obj.key) ?? { ra: 0, dec: 0 };
}

function azToCardinal(az) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(az / 22.5) % 16];
}

function raToHMS(ra) {
  const h = ra / 15;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.round(((h - hh) * 60 - mm) * 60);
  return `${hh}h ${mm}m ${ss}s`;
}

function decToDMS(dec) {
  const sign = dec < 0 ? '-' : '+';
  const abs = Math.abs(dec);
  const dd = Math.floor(abs);
  const mm = Math.floor((abs - dd) * 60);
  const ss = Math.round(((abs - dd) * 60 - mm) * 60);
  return `${sign}${dd}° ${mm}' ${ss}"`;
}

const CATEGORY_LABEL = { planet: 'Solar System', star: 'Star', deep_sky: 'Deep Sky' };
const CATEGORY_COLOR = { planet: 'text-amber-300 border-amber-500/40 bg-amber-900/20', star: 'text-slate-200 border-slate-500/40 bg-slate-800/40', deep_sky: 'text-indigo-300 border-indigo-500/40 bg-indigo-900/20' };

export default function EphemerisLookup({ lat, lon, dateStr, initialTarget }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const [queryTime, setQueryTime] = useState('22:00');
  const [queryDate, setQueryDate] = useState(dateStr);
  const inputRef = useRef(null);

  // Sync date when parent date changes
  useEffect(() => { setQueryDate(dateStr); }, [dateStr]);

  // When Sky Canvas sends a target, pre-populate the search
  useEffect(() => {
    if (!initialTarget) return;
    const found = CATALOG.find(o => o.name === initialTarget || o.name.toLowerCase().includes(initialTarget.toLowerCase()));
    if (found) {
      setSelected(found);
      setQuery(found.name);
    }
  }, [initialTarget]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return CATALOG.filter(o => o.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const result = useMemo(() => {
    if (!selected || !lat || !lon) return null;
    const [hh, mm] = queryTime.split(':').map(Number);
    const hourOffset = hh + mm / 60;
    const base = new Date(queryDate + 'T00:00:00Z');
    const t = new Date(base.getTime() + hourOffset * 3600000);
    const jd = julianDate(t);
    const { ra, dec } = getRaDec(selected, jd);
    const lst = lstDegrees(jd, lon);
    const { alt, az } = raDecToAltAz(ra, dec, lst, lat);
    return {
      alt: Math.round(alt * 10) / 10,
      az: Math.round(az * 10) / 10,
      ra: Math.round(ra * 100) / 100,
      dec: Math.round(dec * 100) / 100,
      cardinal: azToCardinal(az),
      visible: alt > 0,
      raHMS: raToHMS(ra),
      decDMS: decToDMS(dec),
    };
  }, [selected, queryDate, queryTime, lat, lon]);

  // Transit time — find when object peaks (max alt) over the day
  const transitTime = useMemo(() => {
    if (!selected || !lat || !lon) return null;
    let peak = -90, peakH = null;
    for (let h = 0; h <= 23.75; h += 0.25) {
      const base = new Date(queryDate + 'T00:00:00Z');
      const t = new Date(base.getTime() + h * 3600000);
      const jd = julianDate(t);
      const { ra, dec } = getRaDec(selected, jd);
      const lst = lstDegrees(jd, lon);
      const { alt } = raDecToAltAz(ra, dec, lst, lat);
      if (alt > peak) { peak = alt; peakH = h; }
    }
    if (peakH === null) return null;
    const hh = Math.floor(peakH), mm = Math.round((peakH - hh) * 60);
    return { time: `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')} UTC`, alt: Math.round(peak * 10) / 10 };
  }, [selected, queryDate, lat, lon]);

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search any object — star, planet, nebula, galaxy…"
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        {query && (
          <button onClick={() => { setQuery(''); setSelected(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Dropdown */}
        {showDropdown && filtered.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 overflow-hidden">
            {filtered.map(obj => (
              <button
                key={obj.name}
                onMouseDown={() => {
                  setSelected(obj);
                  setQuery(obj.name);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 transition-colors text-left border-b border-slate-800/60 last:border-0"
              >
                <span className="text-lg w-6 text-center">{obj.emoji ?? (obj.category === 'star' ? '⭐' : obj.category === 'deep_sky' ? '🌌' : '🪐')}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{obj.name}</p>
                  <p className="text-slate-500 text-xs">{CATEGORY_LABEL[obj.category]} {obj.constellation || obj.const ? `· ${obj.constellation || obj.const}` : ''} {obj.type_tag ? `· ${obj.type_tag}` : ''}</p>
                </div>
                {obj.mag != null && <span className="text-slate-500 text-xs flex-shrink-0">mag {obj.mag}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date/Time pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-slate-400 text-xs block mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date</label>
          <input
            type="date"
            value={queryDate}
            onChange={e => setQueryDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> Time (UTC)</label>
          <input
            type="time"
            value={queryTime}
            onChange={e => setQueryTime(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Results */}
      {selected && result && (
        <div className={`rounded-xl border p-4 space-y-3 ${CATEGORY_COLOR[selected.category]}`}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selected.emoji ?? (selected.category === 'star' ? '⭐' : selected.category === 'deep_sky' ? '🌌' : '🪐')}</span>
                <h4 className="text-white font-bold text-base">{selected.name}</h4>
              </div>
              <p className="text-xs opacity-70 mt-0.5">
                {CATEGORY_LABEL[selected.category]}
                {(selected.constellation || selected.const) ? ` · ${selected.constellation || selected.const}` : ''}
                {selected.type_tag ? ` · ${selected.type_tag}` : ''}
                {selected.mag != null ? ` · mag ${selected.mag}` : ''}
              </p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${result.visible ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300' : 'bg-slate-800/60 border-slate-600 text-slate-400'}`}>
              {result.visible ? '● Visible' : '○ Below horizon'}
            </span>
          </div>

          {/* Position grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <ArrowUp className="w-4 h-4 mx-auto mb-1 opacity-70" />
              <p className="text-xs opacity-60 mb-0.5">Altitude</p>
              <p className="text-white font-bold text-lg">{result.alt}°</p>
              <p className="text-xs opacity-60">{result.alt > 60 ? 'Excellent' : result.alt > 30 ? 'Good' : result.alt > 10 ? 'Low' : result.alt > 0 ? 'Near horizon' : 'Below'}</p>
            </div>
            <div className="bg-black/20 rounded-lg p-3 text-center">
              <Compass className="w-4 h-4 mx-auto mb-1 opacity-70" />
              <p className="text-xs opacity-60 mb-0.5">Azimuth</p>
              <p className="text-white font-bold text-lg">{result.az}°</p>
              <p className="text-xs opacity-60">{result.cardinal}</p>
            </div>
          </div>

          {/* RA / Dec */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-black/20 rounded-lg px-3 py-2">
              <p className="opacity-60 mb-0.5">Right Ascension</p>
              <p className="text-white font-mono font-semibold">{result.raHMS}</p>
              <p className="opacity-50">{result.ra}°</p>
            </div>
            <div className="bg-black/20 rounded-lg px-3 py-2">
              <p className="opacity-60 mb-0.5">Declination</p>
              <p className="text-white font-mono font-semibold">{result.decDMS}</p>
              <p className="opacity-50">{result.dec}°</p>
            </div>
          </div>

          {/* Transit */}
          {transitTime && (
            <div className="bg-black/20 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
              <span className="opacity-60">Transit (highest point) on {queryDate}</span>
              <span className="text-white font-semibold">{transitTime.time} · {transitTime.alt}° alt</span>
            </div>
          )}

          <p className="text-xs opacity-40 text-center">Coordinates at {queryTime} UTC · {queryDate}</p>
        </div>
      )}

      {!selected && (
        <p className="text-slate-600 text-xs text-center py-2">Search for any star, planet, or deep-sky object to get its position.</p>
      )}
    </div>
  );
}