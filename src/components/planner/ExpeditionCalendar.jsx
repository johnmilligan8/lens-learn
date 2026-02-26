import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

// ─── Moon Phase Math ────────────────────────────────────────────────────────
function getMoonPhase(date) {
  const knownNewMoon = new Date('2000-01-06T00:00:00Z');
  const lunarCycle = 29.53058867;
  const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;
  const illum = Math.round((1 - Math.cos((phase / lunarCycle) * 2 * Math.PI)) / 2 * 100);
  let emoji = '🌑';
  if (phase > 1 && phase < 7.4)       emoji = '🌒';
  else if (phase >= 7.4 && phase < 8.4)  emoji = '🌓';
  else if (phase >= 8.4 && phase < 14.8) emoji = '🌔';
  else if (phase >= 14.8 && phase < 15.8) emoji = '🌕';
  else if (phase >= 15.8 && phase < 22.1) emoji = '🌖';
  else if (phase >= 22.1 && phase < 23.1) emoji = '🌗';
  else if (phase >= 23.1)               emoji = '🌘';
  return { emoji, illumination: illum, phase };
}

// ─── Event highlight generators ─────────────────────────────────────────────
// Returns array of { date (YYYY-MM-DD), label, color, emoji }
function getEventHighlights(year, month, eventTypes) {
  const highlights = {};
  const addHighlight = (dateStr, label, color, emoji) => {
    if (!highlights[dateStr]) highlights[dateStr] = [];
    highlights[dateStr].push({ label, color, emoji });
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0];
    const moon = getMoonPhase(d);

    // Moon phases for Milky Way
    if (eventTypes.includes('milky_way') || eventTypes.includes('moon_phase')) {
      if (moon.illumination <= 10) {
        addHighlight(dateStr, 'New Moon – Best MW', 'emerald', '🌑');
      } else if (moon.illumination >= 98) {
        addHighlight(dateStr, 'Full Moon', 'yellow', '🌕');
      } else if (Math.abs(moon.phase - 7.4) < 0.8) {
        addHighlight(dateStr, 'First Quarter', 'blue', '🌓');
      } else if (Math.abs(moon.phase - 22.1) < 0.8) {
        addHighlight(dateStr, 'Last Quarter', 'blue', '🌗');
      }
    }

    // Milky Way season (Mar–Oct in N. Hemisphere)
    if (eventTypes.includes('milky_way')) {
      const monthNum = d.getMonth();
      if (monthNum >= 2 && monthNum <= 9 && moon.illumination <= 20) {
        addHighlight(dateStr, 'MW Opportunity', 'purple', '🌌');
      }
    }

    // Meteor showers — major ones by approximate peak dates
    if (eventTypes.includes('meteor_shower')) {
      const md = `${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const showers = {
        '01-03': { name: 'Quadrantids Peak', emoji: '☄️' },
        '04-22': { name: 'Lyrids Peak', emoji: '☄️' },
        '05-06': { name: 'Eta Aquariids Peak', emoji: '☄️' },
        '07-30': { name: 'Delta Aquariids Peak', emoji: '☄️' },
        '08-12': { name: 'Perseids Peak 🔥', emoji: '☄️' },
        '10-08': { name: 'Draconids Peak', emoji: '☄️' },
        '10-21': { name: 'Orionids Peak', emoji: '☄️' },
        '11-17': { name: 'Leonids Peak', emoji: '☄️' },
        '12-14': { name: 'Geminids Peak 🔥', emoji: '☄️' },
        '12-22': { name: 'Ursids Peak', emoji: '☄️' },
      };
      if (showers[md]) addHighlight(dateStr, showers[md].name, 'orange', showers[md].emoji);
    }

    // Aurora — highlight based on KP potential (simplified: equinox seasons)
    if (eventTypes.includes('aurora')) {
      const monthNum = d.getMonth();
      // Equinox windows (Mar, Sep) have elevated geomagnetic activity
      if ((monthNum === 2 || monthNum === 8) && moon.illumination <= 40) {
        addHighlight(dateStr, 'Aurora Season', 'cyan', '🌌');
      }
    }

    // Solar/Lunar eclipses — 2025-2026 known events
    if (eventTypes.includes('eclipse')) {
      const knownEclipses = {
        '2025-03-14': { name: 'Total Lunar Eclipse', emoji: '🌑' },
        '2025-03-29': { name: 'Partial Solar Eclipse', emoji: '☀️' },
        '2025-09-07': { name: 'Total Lunar Eclipse', emoji: '🌑' },
        '2025-09-21': { name: 'Partial Solar Eclipse', emoji: '☀️' },
        '2026-02-17': { name: 'Annular Solar Eclipse', emoji: '🔆' },
        '2026-08-12': { name: 'Total Solar Eclipse', emoji: '🌑' },
        '2026-08-28': { name: 'Partial Lunar Eclipse', emoji: '🌕' },
      };
      if (knownEclipses[dateStr]) {
        addHighlight(dateStr, knownEclipses[dateStr].name, 'red', knownEclipses[dateStr].emoji);
      }
    }

    // Planetary conjunctions / notable events (simplified)
    if (eventTypes.includes('conjunction')) {
      const knownEvents = {
        '2025-03-01': { name: 'Venus-Jupiter Conjunction', emoji: '✨' },
        '2025-06-30': { name: 'Mars-Jupiter Conjunction', emoji: '✨' },
        '2025-08-19': { name: 'Saturn at Opposition', emoji: '🪐' },
        '2026-01-15': { name: 'Venus at Greatest Elongation', emoji: '✨' },
      };
      if (knownEvents[dateStr]) {
        addHighlight(dateStr, knownEvents[dateStr].name, 'violet', knownEvents[dateStr].emoji);
      }
    }
  }

  return highlights;
}

// ─── Color maps ──────────────────────────────────────────────────────────────
const DOT_COLORS = {
  emerald: 'bg-emerald-400',
  purple: 'bg-purple-400',
  orange: 'bg-orange-400',
  cyan: 'bg-cyan-400',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  blue: 'bg-blue-400',
  violet: 'bg-violet-400',
};

const PILL_COLORS = {
  emerald: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/40',
  purple: 'bg-purple-900/60 text-purple-300 border-purple-500/40',
  orange: 'bg-orange-900/60 text-orange-300 border-orange-500/40',
  cyan: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/40',
  red: 'bg-red-900/60 text-red-300 border-red-500/40',
  yellow: 'bg-yellow-900/60 text-yellow-300 border-yellow-500/40',
  blue: 'bg-blue-900/60 text-blue-300 border-blue-500/40',
  violet: 'bg-violet-900/60 text-violet-300 border-violet-500/40',
};

const EVENT_TYPE_OPTIONS = [
  { id: 'milky_way', label: 'Milky Way', emoji: '🌌' },
  { id: 'moon_phase', label: 'Moon Phases', emoji: '🌕' },
  { id: 'meteor_shower', label: 'Meteor Showers', emoji: '☄️' },
  { id: 'aurora', label: 'Aurora / Northern Lights', emoji: '🌌' },
  { id: 'eclipse', label: 'Solar / Lunar Eclipse', emoji: '🌑' },
  { id: 'conjunction', label: 'Planetary Events', emoji: '🪐' },
];

export default function ExpeditionCalendar({ onSelectDate, selectedDate, selectedRange, onSelectRange, tripDateRange }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [eventTypes, setEventTypes] = useState(['milky_way', 'moon_phase', 'meteor_shower']);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeMode, setRangeMode] = useState(false);

  const highlights = useMemo(() =>
    getEventHighlights(viewYear, viewMonth, eventTypes),
    [viewYear, viewMonth, eventTypes]
  );

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const todayStr = today.toISOString().split('T')[0];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleDayClick = (dateStr) => {
    if (rangeMode) {
      if (!rangeStart) {
        setRangeStart(dateStr);
      } else {
        const start = rangeStart < dateStr ? rangeStart : dateStr;
        const end = rangeStart < dateStr ? dateStr : rangeStart;
        onSelectRange?.({ start, end });
        setRangeStart(null);
      }
    } else {
      onSelectDate?.(dateStr);
    }
  };

  const isInRange = (dateStr) => {
    if (!selectedRange) return false;
    return dateStr >= selectedRange.start && dateStr <= selectedRange.end;
  };

  const toggleEventType = (id) => {
    setEventTypes(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="space-y-4">
      {/* Event type filter */}
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Highlight events on calendar</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => toggleEventType(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                eventTypes.includes(opt.id)
                  ? 'bg-red-600/30 border-red-500/60 text-red-200'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:border-slate-500'
              }`}
            >
              <span>{opt.emoji}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <Card className="bg-[#1a1a1a] border-white/8 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-white font-bold">{monthName} {viewYear}</p>
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Range toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-slate-500 text-xs">
            {rangeMode
              ? rangeStart ? `Pick end date (started ${rangeStart})` : 'Pick start date'
              : 'Click a date to plan it'}
          </p>
          <button
            onClick={() => { setRangeMode(r => !r); setRangeStart(null); }}
            className={`text-xs px-2 py-1 rounded border transition-all ${
              rangeMode ? 'bg-red-600/20 border-red-500/40 text-red-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'
            }`}
          >
            {rangeMode ? '✕ Cancel Range' : 'Multi-day range'}
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-center text-slate-600 text-xs py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const inRange = isInRange(dateStr);
            const isRangeStart = selectedRange?.start === dateStr;
            const isRangeEnd = selectedRange?.end === dateStr;
            const dayHighlights = highlights[dateStr] || [];
            const moon = getMoonPhase(new Date(viewYear, viewMonth, day));

            return (
              <button
                key={day}
                onClick={() => handleDayClick(dateStr)}
                className={`relative rounded-lg p-1 min-h-[52px] flex flex-col items-center gap-0.5 text-xs transition-all border ${
                  isSelected || isRangeStart || isRangeEnd
                    ? 'bg-red-600/40 border-red-500/60 text-white'
                    : inRange
                    ? 'bg-red-900/20 border-red-800/30 text-slate-300'
                    : isToday
                    ? 'border-slate-500/60 bg-slate-800/60 text-white'
                    : dayHighlights.length > 0
                    ? 'border-white/10 bg-slate-800/30 text-slate-300 hover:bg-slate-700/50'
                    : 'border-transparent text-slate-500 hover:bg-slate-800/30 hover:text-slate-300'
                }`}
              >
                <span className={`font-bold text-xs leading-none ${isToday && !isSelected ? 'text-red-400' : ''}`}>{day}</span>
                {/* Moon emoji (small) */}
                <span className="text-[9px] leading-none opacity-70">{moon.emoji}</span>
                {/* Event dots */}
                {dayHighlights.length > 0 && (
                  <div className="flex gap-0.5 flex-wrap justify-center">
                    {dayHighlights.slice(0, 3).map((h, hi) => (
                      <div key={hi} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[h.color] || 'bg-slate-500'}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      {eventTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {eventTypes.includes('milky_way') && <span className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-400" /> New Moon (MW)</span>}
          {eventTypes.includes('meteor_shower') && <span className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-orange-400" /> Meteor Showers</span>}
          {eventTypes.includes('aurora') && <span className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-cyan-400" /> Aurora Season</span>}
          {eventTypes.includes('eclipse') && <span className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-red-500" /> Eclipse</span>}
          {eventTypes.includes('conjunction') && <span className="flex items-center gap-1 text-xs text-slate-400"><div className="w-2 h-2 rounded-full bg-violet-400" /> Planetary</span>}
        </div>
      )}

      {/* Highlights for selected date */}
      {selectedDate && highlights[selectedDate] && highlights[selectedDate].length > 0 && (
        <div className="rounded-xl border border-white/8 bg-[#121212] p-3 space-y-1.5">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Events on {selectedDate}</p>
          {highlights[selectedDate].map((h, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border ${PILL_COLORS[h.color] || PILL_COLORS.blue}`}>
              <span>{h.emoji}</span> <span className="font-medium">{h.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}