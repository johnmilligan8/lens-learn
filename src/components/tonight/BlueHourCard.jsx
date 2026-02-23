import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { X, Sunset } from 'lucide-react';

/**
 * Computes civil twilight (Blue Hour) start/end for a given lat/lon and date.
 * Returns { blueStart, blueEnd } as Date objects, or null if not computable.
 */
function civilTwilight(lat, lon, dateStr) {
  // Solar declination
  const date = new Date(dateStr + 'T12:00:00Z');
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const declination = 23.45 * Math.sin(((284 + dayOfYear) / 365) * 2 * Math.PI) * (Math.PI / 180);
  const latRad = lat * (Math.PI / 180);

  // Hour angle for civil twilight: sun at -6°
  const cosH = (Math.cos((96) * Math.PI / 180) - Math.sin(latRad) * Math.sin(declination)) /
    (Math.cos(latRad) * Math.cos(declination));

  if (Math.abs(cosH) > 1) return null; // no twilight (polar regions)

  const H = Math.acos(cosH) * (180 / Math.PI); // degrees
  const eot = 0; // simplified, ignoring equation of time

  // Solar noon in UTC hours
  const solarNoonUTC = 12 - lon / 15 + eot;
  const sunsetUTC = solarNoonUTC + H / 15;
  const sunriseUTC = solarNoonUTC - H / 15;

  // Blue Hour evening: sunset (sun at 0°) to -6° (civil twilight end)
  // Approximate: sunset is ~30–40 min before civil twilight end
  // Simple approach: civil twilight end ≈ sunsetUTC + 30min, Blue Hour = last ~20min before that
  const blueStartH = sunsetUTC + 0.17; // ~10 min after sunset
  const blueEndH = sunsetUTC + 0.5;   // ~30 min after sunset

  const base = new Date(dateStr + 'T00:00:00Z');
  const blueStart = new Date(base.getTime() + blueStartH * 3600000);
  const blueEnd = new Date(base.getTime() + blueEndH * 3600000);

  return { blueStart, blueEnd, sunsetH: sunsetUTC };
}

function fmt(d) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
}

export default function BlueHourCard({ lat, lon, dateStr }) {
  const [showDetail, setShowDetail] = useState(false);
  const result = civilTwilight(lat, lon, dateStr);
  if (!result) return null;
  const { blueStart, blueEnd } = result;
  const durationMin = Math.round((blueEnd - blueStart) / 60000);

  return (
    <>
      <Card
        className="bg-[#1a1a1a] border border-indigo-700/40 hover:border-indigo-500/60 p-4 cursor-pointer transition-all"
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-start gap-3">
          <div className="bg-indigo-900/40 border border-indigo-700/30 p-2.5 rounded-xl flex-shrink-0">
            <Sunset className="w-5 h-5 text-indigo-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Blue Hour Tonight</span>
              <span className="bg-indigo-900/50 border border-indigo-700/40 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded font-semibold">{durationMin}min</span>
            </div>
            <p className="text-white font-semibold text-sm">{fmt(blueStart)} – {fmt(blueEnd)}</p>
            <p className="text-slate-400 text-xs mt-1">Deep twilight glow — ideal for lit foregrounds before full dark.</p>
            <p className="text-indigo-400 text-xs font-medium mt-1.5">Quick tip: ISO 800–1600 · 1–4s · f/2.8–4 — tap for details →</p>
          </div>
        </div>
      </Card>

      {/* Detail popup */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-[#111111] border border-indigo-700/40 rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDetail(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-900/40 p-2.5 rounded-xl border border-indigo-700/30">
                <Sunset className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-white font-bold">Blue Hour Guide</h3>
                <p className="text-indigo-300 text-xs">{fmt(blueStart)} – {fmt(blueEnd)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-3">
                <p className="text-indigo-200 text-xs font-semibold mb-1">What is Blue Hour?</p>
                <p className="text-slate-300 text-xs leading-relaxed">Blue Hour is the deep twilight glow that occurs ~10–30 minutes after sunset. The sky transitions from a rich deep blue to dark — perfect for balancing lit foregrounds with a star-filled sky.</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3">
                <p className="text-white text-xs font-semibold mb-1.5">📷 Recommended Settings</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-800/60 rounded-lg p-2">
                    <p className="text-indigo-300 text-xs font-bold">ISO</p>
                    <p className="text-white text-sm font-semibold">800–1600</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2">
                    <p className="text-indigo-300 text-xs font-bold">Shutter</p>
                    <p className="text-white text-sm font-semibold">1–4s</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-2">
                    <p className="text-indigo-300 text-xs font-bold">Aperture</p>
                    <p className="text-white text-sm font-semibold">f/2.8–4</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3">
                <p className="text-white text-xs font-semibold mb-1">🏔 Utah Spots — Best for Blue Hour</p>
                <ul className="text-slate-400 text-xs space-y-1">
                  <li>• <span className="text-slate-300">Bonneville Salt Flats</span> — Sky reflections in water</li>
                  <li>• <span className="text-slate-300">Goblin Valley</span> — Hoodoos with deep blue sky</li>
                  <li>• <span className="text-slate-300">Dead Horse Point</span> — Canyon depth + blue glow</li>
                </ul>
              </div>
              <div className="bg-amber-950/30 border border-amber-700/30 rounded-xl p-3">
                <p className="text-amber-300 text-xs font-semibold mb-1">✨ Golden Hour Note</p>
                <p className="text-slate-400 text-xs">Before Blue Hour comes Golden Hour — warm orange/red light ideal for dramatic foregrounds. Shoot Golden Hour first, then stay for Blue, then Milky Way.</p>
              </div>
              <div className="bg-[#1a1a1a] border border-white/8 rounded-xl p-3">
                <p className="text-white text-xs font-semibold mb-1">🔄 Transition Strategy</p>
                <p className="text-slate-400 text-xs leading-relaxed">Shoot Blue Hour first (natural ambient light on foreground). As darkness deepens, raise ISO gradually toward 3200–6400 and let the Milky Way fill the frame.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}