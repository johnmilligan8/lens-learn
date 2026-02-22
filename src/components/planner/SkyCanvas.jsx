import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Search, Tag, X, Telescope, ExternalLink, ArrowUp, Compass, Info, ZoomIn, ZoomOut, Layers } from 'lucide-react';

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

function raToHMS(ra) {
  const h = ra / 15;
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  const ss = Math.round(((h - hh) * 60 - mm) * 60);
  return `${hh}h ${mm.toString().padStart(2,'0')}m ${ss.toString().padStart(2,'0')}s`;
}

function decToDMS(dec) {
  const sign = dec < 0 ? '−' : '+';
  const abs = Math.abs(dec);
  const dd = Math.floor(abs);
  const mm = Math.floor((abs - dd) * 60);
  const ss = Math.round(((abs - dd) * 60 - mm) * 60);
  return `${sign}${dd}° ${mm.toString().padStart(2,'0')}′ ${ss.toString().padStart(2,'0')}″`;
}

function azToCardinal(az) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(az / 22.5) % 16];
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

// ─── Catalog — enriched with mag, distance, spectral type, description ───────
const STARS = [
  { name: 'Sgr A* (GC)', ra: 266.4, dec: -29.0, color: '#fbbf24', size: 6, category: 'deep_sky', isPrimary: true, label: 'GC',
    mag: null, distance: '26,000 ly', spectral: '—', type_tag: 'Galactic Center', constellation: 'Sagittarius',
    description: 'Supermassive black hole at the center of the Milky Way. Mass ~4 million solar masses.' },
  { name: 'Sirius (α CMa)', ra: 101.29, dec: -16.72, color: '#dbeafe', size: 6, category: 'star',
    mag: -1.46, distance: '8.6 ly', spectral: 'A1V', constellation: 'Canis Major',
    description: 'Brightest star in the night sky. A binary system with a white dwarf companion (Sirius B).' },
  { name: 'Canopus (α Car)', ra: 95.99, dec: -52.70, color: '#fef9c3', size: 5, category: 'star',
    mag: -0.72, distance: '310 ly', spectral: 'F0Ib', constellation: 'Carina',
    description: 'Second-brightest star. Used as a navigational star by spacecraft.' },
  { name: 'Arcturus (α Boo)', ra: 213.92, dec: 19.18, color: '#fed7aa', size: 5, category: 'star',
    mag: -0.05, distance: '37 ly', spectral: 'K1.5III', constellation: 'Boötes',
    description: 'Brightest star in the northern celestial hemisphere. An orange giant nearing the end of its life.' },
  { name: 'Vega (α Lyr)', ra: 279.23, dec: 38.78, color: '#e0f2fe', size: 5, category: 'star',
    mag: 0.03, distance: '25 ly', spectral: 'A0Va', constellation: 'Lyra',
    description: 'Pole star of the northern hemisphere in ~13,000 AD due to precession. Part of the Summer Triangle.' },
  { name: 'Capella (α Aur)', ra: 79.17, dec: 45.99, color: '#fef08a', size: 5, category: 'star',
    mag: 0.08, distance: '43 ly', spectral: 'G5III+G0III', constellation: 'Auriga',
    description: 'A close binary of two giant G-type stars, the sixth-brightest star in the sky.' },
  { name: 'Rigel (β Ori)', ra: 78.63, dec: -8.20, color: '#bfdbfe', size: 5, category: 'star',
    mag: 0.13, distance: '863 ly', spectral: 'B8Ia', constellation: 'Orion',
    description: 'A blue supergiant ~120,000× more luminous than the Sun. Marks Orion\'s left foot.' },
  { name: 'Betelgeuse (α Ori)', ra: 88.79, dec: 7.41, color: '#fca5a5', size: 5, category: 'star',
    mag: 0.50, distance: '700 ly', spectral: 'M2Iab', constellation: 'Orion',
    description: 'Red supergiant and future supernova candidate. One of the largest known stars by radius.' },
  { name: 'Antares (α Sco)', ra: 247.35, dec: -26.43, color: '#f87171', size: 5, category: 'star',
    mag: 1.09, distance: '550 ly', spectral: 'M1.5Iab', constellation: 'Scorpius',
    description: 'Red supergiant heart of Scorpius. Its name means "rival of Ares (Mars)" due to its red color.' },
  { name: 'Spica (α Vir)', ra: 201.30, dec: -11.16, color: '#bfdbfe', size: 5, category: 'star',
    mag: 1.04, distance: '250 ly', spectral: 'B1V', constellation: 'Virgo',
    description: 'Brightest star in Virgo. A binary where both components are so close they are egg-shaped.' },
  { name: 'Deneb (α Cyg)', ra: 310.36, dec: 45.28, color: '#e0f2fe', size: 4, category: 'star',
    mag: 1.25, distance: '2,600 ly', spectral: 'A2Ia', constellation: 'Cygnus',
    description: 'One of the most intrinsically luminous stars in the Milky Way. Top of the Northern Cross.' },
  { name: 'Altair (α Aql)', ra: 297.70, dec: 8.87, color: '#e0f2fe', size: 4, category: 'star',
    mag: 0.77, distance: '16.7 ly', spectral: 'A7V', constellation: 'Aquila',
    description: 'Rotates so fast its equatorial diameter is 20% larger than its polar diameter. Summer Triangle.' },
  { name: 'Aldebaran (α Tau)', ra: 68.98, dec: 16.51, color: '#fdba74', size: 4, category: 'star',
    mag: 0.85, distance: '65 ly', spectral: 'K5III', constellation: 'Taurus',
    description: 'The fiery "eye" of Taurus the Bull. An orange giant about 44× the Sun\'s diameter.' },
  { name: 'Fomalhaut (α PsA)', ra: 344.41, dec: -29.62, color: '#bfdbfe', size: 4, category: 'star',
    mag: 1.16, distance: '25 ly', spectral: 'A3V', constellation: 'Piscis Austrinus',
    description: 'Known as the "Autumn Star." Has a prominent debris disk imaged by Hubble.' },
  { name: 'Pollux (β Gem)', ra: 116.33, dec: 28.03, color: '#fde68a', size: 4, category: 'star',
    mag: 1.14, distance: '34 ly', spectral: 'K0IIIb', constellation: 'Gemini',
    description: 'The brighter of the Gemini twins despite its Beta designation. Has a confirmed exoplanet.' },
  { name: 'Regulus (α Leo)', ra: 152.09, dec: 11.97, color: '#bfdbfe', size: 4, category: 'star',
    mag: 1.36, distance: '79 ly', spectral: 'B8IVn', constellation: 'Leo',
    description: 'The "Little King." Spins so fast it would fly apart if rotating ~16% faster.' },
  { name: 'Achernar (α Eri)', ra: 24.43, dec: -57.24, color: '#bfdbfe', size: 4, category: 'star',
    mag: 0.46, distance: '139 ly', spectral: 'B6Vep', constellation: 'Eridanus',
    description: 'The most oblate star known — its equatorial diameter is ~56% larger than its polar diameter.' },
  { name: 'Kaus Australis (ε Sgr)', ra: 276.04, dec: -34.38, color: '#c4b5fd', size: 4, category: 'star',
    mag: 1.85, distance: '143 ly', spectral: 'B9.5III', constellation: 'Sagittarius',
    description: 'Brightest star in Sagittarius. Marks the bottom of the Teapot asterism.' },
  { name: 'Rasalhague (α Oph)', ra: 263.73, dec: 12.56, color: '#d9f99d', size: 3, category: 'star',
    mag: 2.08, distance: '47 ly', spectral: 'A5III', constellation: 'Ophiuchus',
    description: 'Brightest star in Ophiuchus, the Serpent Bearer. A binary system.' },
  { name: 'Shaula (λ Sco)', ra: 263.40, dec: -37.10, color: '#bfdbfe', size: 3, category: 'star',
    mag: 1.62, distance: '700 ly', spectral: 'B2IV', constellation: 'Scorpius',
    description: 'The stinger of Scorpius. A triple star system of hot blue-white stars.' },
  // Deep sky
  { name: 'Andromeda Galaxy (M31)', ra: 10.68, dec: 41.27, color: '#a5b4fc', size: 5, category: 'deep_sky', symbol: 'galaxy',
    mag: 3.44, distance: '2.537 Mly', type_tag: 'Spiral Galaxy', constellation: 'Andromeda',
    description: 'Nearest major galaxy to the Milky Way. Contains ~1 trillion stars. Visible to the naked eye.' },
  { name: 'Orion Nebula (M42)', ra: 83.82, dec: -5.39, color: '#67e8f9', size: 4, category: 'deep_sky', symbol: 'nebula',
    mag: 4.0, distance: '1,344 ly', type_tag: 'Emission Nebula', constellation: 'Orion',
    description: 'One of the most photographed objects in the sky. An active stellar nursery 24 ly across.' },
  { name: 'Pleiades (M45)', ra: 56.75, dec: 24.12, color: '#bfdbfe', size: 4, category: 'deep_sky', symbol: 'cluster',
    mag: 1.6, distance: '444 ly', type_tag: 'Open Cluster', constellation: 'Taurus',
    description: 'The Seven Sisters. About 1,000 stars total, surrounded by reflection nebulosity.' },
  { name: 'Lagoon Nebula (M8)', ra: 271.05, dec: -24.38, color: '#f0abfc', size: 3, category: 'deep_sky', symbol: 'nebula',
    mag: 6.0, distance: '4,100 ly', type_tag: 'Emission Nebula', constellation: 'Sagittarius',
    description: 'Large emission nebula with active star formation. Named for the dark lane crossing its center.' },
  { name: 'Omega Centauri', ra: 201.70, dec: -47.48, color: '#fef08a', size: 4, category: 'deep_sky', symbol: 'cluster',
    mag: 3.9, distance: '17,090 ly', type_tag: 'Globular Cluster', constellation: 'Centaurus',
    description: 'Largest globular cluster in the Milky Way, containing ~10 million stars. May be a dwarf galaxy core.' },
  { name: 'Triangulum Galaxy (M33)', ra: 23.46, dec: 30.66, color: '#a5b4fc', size: 3, category: 'deep_sky', symbol: 'galaxy',
    mag: 5.72, distance: '2.73 Mly', type_tag: 'Spiral Galaxy', constellation: 'Triangulum',
    description: 'Third-largest galaxy in the Local Group. Most distant object visible to the naked eye under perfect skies.' },
];

const PLANETS = [
  { name: 'Mercury', color: '#d1d5db', size: 5, category: 'planet', symbol: '☿',
    type_tag: 'Planet', description: 'Smallest planet, closest to the Sun. No atmosphere; extreme temperature swings.' },
  { name: 'Venus', color: '#fef9c3', size: 6, category: 'planet', symbol: '♀',
    type_tag: 'Planet', description: 'Hottest planet (462°C). Dense CO₂ atmosphere. Often the brightest object after Moon.' },
  { name: 'Mars', color: '#fb923c', size: 5, category: 'planet', symbol: '♂',
    type_tag: 'Planet', description: 'The Red Planet. Has Olympus Mons, the tallest volcano in the solar system.' },
  { name: 'Jupiter', color: '#fdba74', size: 7, category: 'planet', symbol: '♃',
    type_tag: 'Planet', description: 'Largest planet. The Great Red Spot is a storm older than 350 years. 95 known moons.' },
  { name: 'Saturn', color: '#fde68a', size: 6, category: 'planet', symbol: '♄',
    type_tag: 'Planet', description: 'Famous for its stunning ring system made of ice and rock. Least dense planet.' },
];

const CONSTELLATION_LINES = {
  Orion: [['Betelgeuse (α Ori)', 'Rigel (β Ori)'], ['Betelgeuse (α Ori)', 'Aldebaran (α Tau)']],
  Scorpius: [['Antares (α Sco)', 'Shaula (λ Sco)']],
  'Summer Triangle': [['Vega (α Lyr)', 'Deneb (α Cyg)'], ['Deneb (α Cyg)', 'Altair (α Aql)'], ['Altair (α Aql)', 'Vega (α Lyr)']],
};

const SIZE = 340;
const CX = SIZE / 2, CY = SIZE / 2;
const R = SIZE / 2 - 22;

const CATEGORY_STYLE = {
  planet:   { badge: 'bg-amber-900/40 border-amber-500/40 text-amber-300',  dot: 'bg-amber-400' },
  star:     { badge: 'bg-slate-800/60 border-slate-600/40 text-slate-200',   dot: 'bg-slate-300' },
  deep_sky: { badge: 'bg-indigo-900/40 border-indigo-500/40 text-indigo-300', dot: 'bg-indigo-400' },
};

// ─── Object Detail Panel ──────────────────────────────────────────────────────
function ObjectDetailPanel({ obj, onClose, onSendToEphemeris }) {
  if (!obj) return null;
  const style = CATEGORY_STYLE[obj.category] ?? CATEGORY_STYLE.star;
  const altQuality = obj.alt > 60 ? 'Excellent' : obj.alt > 30 ? 'Good' : obj.alt > 10 ? 'Low' : obj.alt > 0 ? 'Near horizon' : 'Below horizon';

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/95 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">
            {obj.isSun ? '☀️' : obj.isMoon ? '🌙' : obj.category === 'planet' ? '🪐' : obj.category === 'deep_sky' ? '🌌' : '⭐'}
          </span>
          <div className="min-w-0">
            <h4 className="text-white font-bold text-sm leading-tight truncate">{obj.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${style.badge}`}>
                {obj.type_tag ?? (obj.category === 'star' ? 'Star' : obj.category === 'planet' ? 'Planet' : 'Deep Sky')}
              </span>
              {obj.constellation && <span className="text-[10px] text-slate-500">{obj.constellation}</span>}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-600 hover:text-slate-300 flex-shrink-0 ml-2">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-px bg-slate-800 border-b border-slate-800">
        <div className="bg-slate-900/80 p-2.5 text-center">
          <ArrowUp className="w-3.5 h-3.5 mx-auto mb-0.5 text-slate-500" />
          <p className="text-white font-bold text-base leading-none">{obj.alt}°</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{altQuality}</p>
        </div>
        <div className="bg-slate-900/80 p-2.5 text-center">
          <Compass className="w-3.5 h-3.5 mx-auto mb-0.5 text-slate-500" />
          <p className="text-white font-bold text-base leading-none">{obj.az}°</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{azToCardinal(obj.az)}</p>
        </div>
      </div>

      {/* RA / Dec */}
      <div className="px-3 py-2.5 border-b border-slate-800 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Right Ascension</span>
          <span className="text-white font-mono">{raToHMS(obj.ra)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Declination</span>
          <span className="text-white font-mono">{decToDMS(obj.dec)}</span>
        </div>
        {obj.mag != null && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Magnitude</span>
            <span className="text-white font-mono">{obj.mag}</span>
          </div>
        )}
        {obj.distance && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Distance</span>
            <span className="text-white font-mono">{obj.distance}</span>
          </div>
        )}
        {obj.spectral && (
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Spectral Type</span>
            <span className="text-white font-mono">{obj.spectral}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {obj.description && (
        <div className="px-3 py-2.5 border-b border-slate-800">
          <p className="text-slate-400 text-xs leading-relaxed">{obj.description}</p>
        </div>
      )}

      {/* Visibility badge */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${obj.alt > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        <span className={`text-xs font-medium ${obj.alt > 0 ? 'text-emerald-300' : 'text-slate-500'}`}>
          {obj.alt > 0 ? 'Currently visible above horizon' : 'Currently below horizon'}
        </span>
      </div>

      {/* Send to Ephemeris */}
      {onSendToEphemeris && (
        <div className="px-3 py-2.5">
          <button
            onClick={() => onSendToEphemeris(obj)}
            className="w-full flex items-center justify-center gap-2 bg-purple-700/30 hover:bg-purple-700/50 border border-purple-500/40 text-purple-300 text-xs font-semibold rounded-lg py-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Ephemeris Lookup
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SkyCanvas({ gcData, lat, lon, dateStr, onSetEphemerisTarget }) {
  const canvasRef = useRef(null);
  const [scrubHour, setScrubHour] = useState(22);
  const [selectedObj, setSelectedObj] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showConstellations, setShowConstellations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [highlighted, setHighlighted] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [showLayers, setShowLayers] = useState(false);
  const [showSatellites, setShowSatellites] = useState(false);
  const [showDeepSkyOnly, setShowDeepSkyOnly] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(dateStr);
  const [pickerHour, setPickerHour] = useState(scrubHour);

  const currentJD = useMemo(() => {
    const base = new Date(dateStr + 'T00:00:00Z');
    const t = new Date(base.getTime() + scrubHour * 3600000);
    return julianDate(t);
  }, [dateStr, scrubHour]);

  const allObjects = useMemo(() => {
    const fixed = STARS.map(obj => {
      const { alt, az } = computePos(obj.ra, obj.dec, lat, lon, dateStr, scrubHour);
      const pos = altAzToCanvas(alt, az, CX, CY, R);
      return { ...obj, alt: Math.round(alt * 10) / 10, az: Math.round(az * 10) / 10, pos };
    });

    const { ra: sunRa, dec: sunDec } = sunRaDec(currentJD);
    const { alt: sunAlt, az: sunAz } = raDecToAltAz(sunRa, sunDec, lstDegrees(currentJD, lon), lat);
    fixed.push({ name: 'Sun', ra: sunRa, dec: sunDec, color: '#fbbf24', size: 8, category: 'planet', symbol: '☀', isSun: true,
      type_tag: 'Star (our Sun)', description: 'The Sun — our host star. 109× Earth\'s diameter, 1.3 million km wide.',
      alt: Math.round(sunAlt * 10) / 10, az: Math.round(sunAz * 10) / 10, pos: altAzToCanvas(sunAlt, sunAz, CX, CY, R) });

    const { ra: moonRa, dec: moonDec } = moonRaDec(currentJD);
    const { alt: moonAlt, az: moonAz } = raDecToAltAz(moonRa, moonDec, lstDegrees(currentJD, lon), lat);
    fixed.push({ name: 'Moon', ra: moonRa, dec: moonDec, color: '#e2e8f0', size: 6, category: 'planet', symbol: '☽', isMoon: true,
      type_tag: 'Natural Satellite', distance: '384,400 km (avg)', description: 'Earth\'s only natural satellite. A key factor in astrophotography planning due to its brightness.',
      alt: Math.round(moonAlt * 10) / 10, az: Math.round(moonAz * 10) / 10, pos: altAzToCanvas(moonAlt, moonAz, CX, CY, R) });

    PLANETS.forEach(p => {
      const rd = planetRaDec(currentJD, p.name);
      if (!rd) return;
      const { alt, az } = raDecToAltAz(rd.ra, rd.dec, lstDegrees(currentJD, lon), lat);
      fixed.push({ ...p, ra: rd.ra, dec: rd.dec, alt: Math.round(alt * 10) / 10, az: Math.round(az * 10) / 10, pos: altAzToCanvas(alt, az, CX, CY, R) });
    });

    return fixed;
  }, [lat, lon, dateStr, scrubHour, currentJD]);

  // Keep selectedObj coords fresh as time scrubs
  useEffect(() => {
    if (!selectedObj) return;
    const fresh = allObjects.find(o => o.name === selectedObj.name);
    if (fresh) setSelectedObj(fresh);
  }, [allObjects]);

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

    const bg = ctx.createRadialGradient(CX, CY, 0, CX, CY, R);
    bg.addColorStop(0, '#0d0628'); bg.addColorStop(0.7, '#07031a'); bg.addColorStop(1, '#020212');
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, 2 * Math.PI);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 2; ctx.stroke();

    [[0.333, '30°'], [0.667, '60°']].forEach(([f, lbl]) => {
      ctx.beginPath(); ctx.arc(CX, CY, R * f, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(100,80,160,0.15)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(120,100,180,0.3)'; ctx.font = '8px sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, CX + R * f + 3, CY - 4);
    });

    [0, 45, 90, 135, 180, 225, 270, 315].forEach(az => {
      const rad = toRad(az - 90);
      ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + R * Math.cos(rad), CY + R * Math.sin(rad));
      ctx.strokeStyle = 'rgba(100,80,160,0.06)'; ctx.lineWidth = 1; ctx.stroke();
    });

    [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SW', 225], ['W', 270], ['NW', 315]].forEach(([lbl, az]) => {
      const isCard = lbl.length === 1;
      const rad = toRad(az - 90); const dist = R + (isCard ? 12 : 9);
      ctx.fillStyle = isCard ? '#94a3b8' : 'rgba(100,116,139,0.45)';
      ctx.font = isCard ? 'bold 11px sans-serif' : '8px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lbl, CX + dist * Math.cos(rad), CY + dist * Math.sin(rad));
    });

    const gcVisible = (gcData?.results ?? []).filter(p => p.alt > 0);
    if (gcVisible.length > 1) {
      ctx.beginPath(); let started = false;
      gcVisible.forEach(p => { const pos = altAzToCanvas(p.alt, p.az, CX, CY, R); if (!pos) return; if (!started) { ctx.moveTo(pos.x, pos.y); started = true; } else ctx.lineTo(pos.x, pos.y); });
      ctx.strokeStyle = 'rgba(168,85,247,0.14)'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.stroke();
      const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
      grad.addColorStop(0, 'rgba(168,85,247,0.8)'); grad.addColorStop(0.5, 'rgba(251,191,36,0.9)'); grad.addColorStop(1, 'rgba(59,130,246,0.8)');
      ctx.beginPath(); started = false;
      gcVisible.forEach(p => { const pos = altAzToCanvas(p.alt, p.az, CX, CY, R); if (!pos) return; if (!started) { ctx.moveTo(pos.x, pos.y); started = true; } else ctx.lineTo(pos.x, pos.y); });
      ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.stroke();
    }

    if (showConstellations) {
      ctx.setLineDash([2, 4]); ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1;
      Object.values(CONSTELLATION_LINES).forEach(pairs => {
        pairs.forEach(([a, b]) => {
          const objA = allObjects.find(o => o.name === a), objB = allObjects.find(o => o.name === b);
          if (!objA?.pos?.visible || !objB?.pos?.visible) return;
          ctx.beginPath(); ctx.moveTo(objA.pos.x, objA.pos.y); ctx.lineTo(objB.pos.x, objB.pos.y); ctx.stroke();
        });
      });
      ctx.setLineDash([]);
    }

    const seeds = [[0.15,0.25],[0.8,0.1],[0.4,0.7],[0.6,0.3],[0.2,0.6],[0.75,0.65],[0.5,0.15],[0.3,0.45],[0.65,0.5],[0.1,0.8],[0.9,0.4],[0.55,0.75],[0.35,0.2],[0.7,0.48]];
    seeds.forEach(([fx, fy]) => {
      const x = CX + (fx - 0.5) * 2 * R * 0.9, y = CY + (fy - 0.5) * 2 * R * 0.9;
      if (Math.hypot(x - CX, y - CY) > R * 0.96) return;
      ctx.beginPath(); ctx.arc(x, y, 0.7, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
    });

    allObjects.forEach(obj => {
      if (!obj.pos?.visible) return;
      const { x, y } = obj.pos;
      const isHL = highlighted === obj.name || selectedObj?.name === obj.name;

      const grd = ctx.createRadialGradient(x, y, 0, x, y, obj.size * 3);
      grd.addColorStop(0, obj.color + (isHL ? 'cc' : '66')); grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(x, y, obj.size * 3, 0, 2 * Math.PI); ctx.fillStyle = grd; ctx.fill();

      ctx.beginPath();
      if (obj.isSun) {
        ctx.arc(x, y, obj.size * 0.8, 0, 2 * Math.PI); ctx.fillStyle = '#fbbf24'; ctx.fill();
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.5; ctx.stroke();
      } else if (obj.symbol === 'galaxy') {
        ctx.save(); ctx.translate(x, y); ctx.rotate(0.5); ctx.scale(1.6, 0.7);
        ctx.beginPath(); ctx.arc(0, 0, obj.size * 0.6, 0, 2 * Math.PI); ctx.fillStyle = obj.color; ctx.fill(); ctx.restore();
      } else if (obj.symbol === 'cluster') {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * obj.size * 0.6, y + Math.sin(a) * obj.size * 0.6, 1, 0, 2 * Math.PI); ctx.fillStyle = obj.color; ctx.fill(); }
      } else if (obj.symbol === 'nebula') {
        ctx.arc(x, y, obj.size * 0.8, 0, 2 * Math.PI);
        const ng = ctx.createRadialGradient(x, y, 0, x, y, obj.size * 1.5);
        ng.addColorStop(0, obj.color + 'aa'); ng.addColorStop(1, 'transparent'); ctx.fillStyle = ng; ctx.fill();
      } else {
        ctx.arc(x, y, obj.size * 0.65, 0, 2 * Math.PI); ctx.fillStyle = obj.color; ctx.fill();
      }

      if (obj.category === 'planet' && obj.symbol && !obj.isSun) {
        ctx.fillStyle = obj.color; ctx.font = `${obj.size * 1.1}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(obj.symbol, x, y - obj.size - 2);
      }

      if (obj.isPrimary) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GC', x, y - 12);
      }

      if (isHL) {
        ctx.beginPath(); ctx.arc(x, y, obj.size * 1.4 + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = selectedObj?.name === obj.name ? '#f59e0b' : '#38bdf8'; ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      }

      if (showLabels) {
        const short = obj.label ?? obj.name.split(' ')[0].replace('(', '').replace(')', '');
        ctx.fillStyle = isHL ? (selectedObj?.name === obj.name ? '#fbbf24' : '#38bdf8') : 'rgba(203,213,225,0.6)';
        ctx.font = isHL ? 'bold 9px sans-serif' : '8px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(short, x, y + obj.size * 0.8 + 2);
      }
    });

    const { alt: gcAlt, az: gcAz } = computePos(266.4, -29.0, lat, lon, dateStr, scrubHour);
    if (gcAlt > 0) {
      const pos = altAzToCanvas(gcAlt, gcAz, CX, CY, R);
      if (pos) {
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI); ctx.fillStyle = 'rgba(251,191,36,0.2)'; ctx.fill();
        ctx.beginPath(); ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI); ctx.fillStyle = '#fbbf24'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    ctx.beginPath(); ctx.arc(CX, CY, 3, 0, 2 * Math.PI); ctx.fillStyle = '#475569'; ctx.fill();
  }, [allObjects, gcData, scrubHour, showLabels, showConstellations, highlighted, selectedObj, lat, lon, dateStr]);

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width, sy = SIZE / rect.height;
    const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy;
    if (Math.hypot(mx - CX, my - CY) > R) return;

    let closest = null, closestD = Infinity;
    allObjects.forEach(obj => {
      if (!obj.pos?.visible) return;
      const d = Math.hypot(mx - obj.pos.x, my - obj.pos.y);
      if (d < 18 && d < closestD) { closest = obj; closestD = d; }
    });

    if (closest) {
      setSelectedObj(closest);
      setHighlighted(closest.name);
    } else {
      setSelectedObj(null);
      setHighlighted(null);
    }
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width, sy = SIZE / rect.height;
    const mx = (e.clientX - rect.left) * sx, my = (e.clientY - rect.top) * sy;
    let found = null;
    allObjects.forEach(obj => { if (!obj.pos?.visible) return; if (Math.hypot(mx - obj.pos.x, my - obj.pos.y) < 14) found = obj.name; });
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

  function handleSendToEphemeris(obj) {
    if (onSetEphemerisTarget) onSetEphemerisTarget(obj.name);
  }

  function handleCanvasMouseDown(e) {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, panX, panY });
  }

  function handleCanvasMouseMove(e) {
    if (isDragging && dragStart) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPanX(dragStart.panX + deltaX / zoom);
      setPanY(dragStart.panY + deltaY / zoom);
      return;
    }
    handleMouseMove(e);
  }

  function handleCanvasMouseUp() {
    setIsDragging(false);
    setDragStart(null);
  }

  function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.8, Math.min(4, zoom * factor));
    setZoom(newZoom);
  }

  function resetView() {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }

  function applyDateTimePicker() {
    setScrubHour(pickerHour);
    // Note: date change would require parent component prop update
    // For now, we update the hour only in this component
    setShowDateTimePicker(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setShowLabels(v => !v)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${showLabels ? 'border-purple-500/50 bg-purple-900/30 text-purple-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
          <Tag className="w-3 h-3" /> Labels
        </button>
        <button onClick={() => setShowConstellations(v => !v)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${showConstellations ? 'border-blue-500/50 bg-blue-900/30 text-blue-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
          ✦ Lines
        </button>
        <button onClick={() => setShowLayers(v => !v)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${showLayers ? 'border-indigo-500/50 bg-indigo-900/30 text-indigo-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
          <Layers className="w-3 h-3" /> Layers
        </button>
        <button onClick={() => setShowDateTimePicker(v => !v)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${showDateTimePicker ? 'border-amber-500/50 bg-amber-900/30 text-amber-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
          <Clock className="w-3 h-3" /> Date/Time
        </button>
        <div className="flex-1 relative min-w-[120px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500 pointer-events-none" />
          <input type="text" placeholder="Find object…" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500" />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); setHighlighted(null); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
          {searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
              {searchResults.map(obj => (
                <button key={obj.name} onClick={() => { setSelectedObj(obj); setHighlighted(obj.name); setSearchQuery(''); setSearchResults([]); }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-800 transition-colors text-left">
                  <div>
                    <p className="text-white text-xs font-medium">{obj.name}</p>
                    <p className="text-[10px] text-slate-500 capitalize">{obj.category.replace('_',' ')}</p>
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

      {/* Layer toggles */}
      {showLayers && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-300 mb-2">Overlay Layers</p>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
            <input type="checkbox" checked={showDeepSkyOnly} onChange={e => setShowDeepSkyOnly(e.target.checked)} className="w-3 h-3" />
            Deep-Sky Objects Only
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white">
            <input type="checkbox" checked={showSatellites} onChange={e => setShowSatellites(e.target.checked)} className="w-3 h-3" />
            <span>Satellite Paths (ISS, Major)</span>
          </label>
        </div>
      )}

      {/* Date/Time Picker */}
      {showDateTimePicker && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
            <input type="date" value={pickerDate} onChange={e => setPickerDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Time (UTC): {Math.floor(pickerHour)}:{Math.round((pickerHour % 1) * 60).toString().padStart(2, '0')}</label>
            <input type="range" min={0} max={23.75} step={0.25} value={pickerHour} onChange={e => setPickerHour(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5" />
          </div>
          <button onClick={applyDateTimePicker}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-1.5 rounded transition-colors">
            Apply
          </button>
        </div>
      )}

      {/* Canvas */}
      <div className="relative">
        <canvas ref={canvasRef} width={SIZE} height={SIZE}
          className="w-full max-w-[340px] mx-auto rounded-full block"
          style={{ 
            cursor: isDragging ? 'grabbing' : 'crosshair',
            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={() => { setHovered(null); setIsDragging(false); }}
          onWheel={handleWheel} />
        {hovered && hovered !== selectedObj?.name && (
          <div className="absolute top-2 left-2 bg-slate-900/90 border border-slate-700 rounded-lg px-2 py-1 text-xs text-cyan-300 pointer-events-none max-w-[180px] truncate">
            {hovered}
          </div>
        )}
        {/* Zoom & Pan Controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button onClick={() => setZoom(prev => Math.min(4, prev * 1.2))}
            className="bg-slate-900/80 border border-slate-700 hover:border-slate-600 rounded p-1.5 text-slate-400 hover:text-white transition-colors">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => setZoom(prev => Math.max(0.8, prev / 1.2))}
            className="bg-slate-900/80 border border-slate-700 hover:border-slate-600 rounded p-1.5 text-slate-400 hover:text-white transition-colors">
            <ZoomOut className="w-4 h-4" />
          </button>
          <button onClick={resetView}
            className="bg-slate-900/80 border border-slate-700 hover:border-slate-600 rounded p-1.5 text-slate-400 hover:text-white transition-colors text-[10px] font-bold">
            ↺
          </button>
        </div>
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
        <input type="range" min={0} max={23.75} step={0.25} value={scrubHour}
          onChange={e => { setScrubHour(parseFloat(e.target.value)); }}
          className="w-full accent-purple-500 h-1.5 rounded cursor-pointer" />
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

      {/* Object detail panel */}
      {selectedObj && (
        <ObjectDetailPanel
          obj={selectedObj}
          onClose={() => { setSelectedObj(null); setHighlighted(null); }}
          onSendToEphemeris={onSetEphemerisTarget ? handleSendToEphemeris : null}
        />
      )}

      <p className="text-xs text-slate-600 text-center">
        {selectedObj ? 'Click elsewhere to deselect' : 'Click any object to see details'} · {allObjects.filter(o => o.pos?.visible).length} objects visible
      </p>
    </div>
  );
}