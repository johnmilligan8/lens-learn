import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isPast, isThisMonth, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, getDaysInMonth } from 'date-fns';
import AuroraView from '@/components/aurora/AuroraView';
import AuroraPredictionCard from '@/components/events/AuroraPredictionCard';
import {
  Calendar, Star, Sparkles, Moon, Zap, Eye,
  AlertCircle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const EVENT_ICONS = {
  meteor_shower: Star, eclipse: Moon, supermoon: Moon,
  aurora: Zap, comet: Sparkles, conjunction: Eye, other: Calendar,
};
const EVENT_COLORS = {
  meteor_shower: 'bg-yellow-900/20 border-yellow-500/40 text-yellow-300',
  eclipse:       'bg-orange-900/20 border-orange-500/40 text-orange-300',
  supermoon:     'bg-blue-900/20 border-blue-500/40 text-blue-300',
  aurora:        'bg-green-900/20 border-green-500/40 text-green-300',
  comet:         'bg-purple-900/20 border-purple-500/40 text-purple-300',
  conjunction:   'bg-pink-900/20 border-pink-500/40 text-pink-300',
  other:         'bg-slate-900/20 border-slate-500/40 text-slate-300',
};
const BADGE_COLORS = {
  meteor_shower: 'bg-yellow-600/30 text-yellow-300',
  eclipse:       'bg-orange-600/30 text-orange-300',
  supermoon:     'bg-blue-600/30 text-blue-300',
  aurora:        'bg-green-600/30 text-green-300',
  comet:         'bg-purple-600/30 text-purple-300',
  conjunction:   'bg-pink-600/30 text-pink-300',
  other:         'bg-slate-600/30 text-slate-300',
};
const DOT_COLORS = {
  meteor_shower: 'bg-yellow-400',
  eclipse:       'bg-orange-400',
  supermoon:     'bg-blue-400',
  aurora:        'bg-green-400',
  comet:         'bg-purple-400',
  conjunction:   'bg-pink-400',
  other:         'bg-slate-400',
};

// Moon phase for any date
function getMoonIllumination(date) {
  const knownNew = new Date('2000-01-06T00:00:00Z');
  const cycle = 29.53058867;
  const diff = (date - knownNew) / (1000 * 60 * 60 * 24);
  const phase = ((diff % cycle) + cycle) % cycle;
  return Math.round((1 - Math.cos((phase / cycle) * 2 * Math.PI)) / 2 * 100);
}
function moonEmoji(illum) {
  if (illum <= 5) return '🌑';
  if (illum <= 30) return '🌒';
  if (illum <= 48) return '🌓';
  if (illum <= 65) return '🌔';
  if (illum <= 80) return '🌕';
  if (illum <= 92) return '🌖';
  if (illum <= 98) return '🌗';
  return '🌘';
}

const SAMPLE_EVENTS = [
  { id:'e1', title:'Perseid Meteor Shower', type:'meteor_shower', date:'2026-08-11', end_date:'2026-08-13', description:'One of the most prolific meteor showers of the year. Expect up to 100 meteors per hour at peak.', visibility_info:'Visible worldwide. Best in Northern Hemisphere.', tips:'Lie flat on your back, let your eyes adjust 20 minutes. No telescope needed!', peak_time:'Aug 12 at 2 AM local time' },
  { id:'e2', title:'Total Lunar Eclipse', type:'eclipse', date:'2026-03-03', end_date:'2026-03-03', description:"The Moon passes through Earth's full shadow, turning it a deep red/orange color — a Blood Moon.", visibility_info:'Visible from North & South America, Western Europe, Africa.', tips:'Use longer focal length (200-400mm) to fill the frame. Bracket your exposures.', peak_time:'Mar 3 at 11:30 PM UTC' },
  { id:'e3', title:'Supermoon', type:'supermoon', date:'2026-09-07', description:'Moon at perigee — appears up to 14% larger and 30% brighter than usual.', visibility_info:'Visible worldwide.', tips:'Photograph near the horizon during moonrise for dramatic landscape shots with the Moon.' },
  { id:'e4', title:'Geminid Meteor Shower', type:'meteor_shower', date:'2026-12-13', end_date:'2026-12-14', description:'The Geminids produce up to 120 multicolored meteors per hour at peak.', visibility_info:'Visible worldwide, best in Northern Hemisphere.', tips:'Unlike most showers, Geminids begin around 9–10 PM local time. Set up early!', peak_time:'Dec 13-14 overnight' },
  { id:'e5', title:'Aurora Borealis Alert', type:'aurora', date:'2026-04-15', description:'Elevated solar activity predicted. High chance of visible aurora at mid-latitudes.', visibility_info:'Northern US, Canada, UK, Scandinavia.', tips:'Face north, get away from city lights. Wide-angle lens, ISO 1600-3200, 10-20s exposure.' },
  { id:'e6', title:'Leonid Meteor Shower', type:'meteor_shower', date:'2026-11-17', description:"Swift, bright meteors. Some years produce storms of thousands per hour.", visibility_info:'Visible worldwide.', tips:"Best after midnight. The shower's radiant rises higher as the night progresses.", peak_time:'Nov 17 after midnight' },
];

const EVENT_TYPES = [
  { id: 'all', label: 'All' },
  { id: 'meteor_shower', label: '⭐ Meteors' },
  { id: 'eclipse', label: '🌑 Eclipses' },
  { id: 'aurora', label: '🌠 Aurora' },
  { id: 'comet', label: '☄️ Comets' },
  { id: 'supermoon', label: '🌕 Moon' },
  { id: 'conjunction', label: '🪐 Planets' },
];

function CalendarGrid({ events, typeFilter, onSelectDate, selectedDate }) {
  const [viewMonth, setViewMonth] = useState(new Date());

  const daysInMonth = getDaysInMonth(viewMonth);
  const firstDay = getDay(startOfMonth(viewMonth)); // 0=Sun
  const today = new Date();

  // Build a map of date -> [events]
  const eventMap = {};
  events.forEach(ev => {
    const start = new Date(ev.date + 'T12:00:00Z');
    const end = ev.end_date ? new Date(ev.end_date + 'T12:00:00Z') : start;
    let cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split('T')[0];
      if (!eventMap[key]) eventMap[key] = [];
      eventMap[key].push(ev);
      cur = new Date(cur.getTime() + 86400000);
    }
  });

  const monthStr = format(viewMonth, 'MMMM yyyy');

  return (
    <div className="bg-[#111] rounded-2xl border border-white/8 p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setViewMonth(v => subMonths(v, 1))} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-white font-bold text-sm">{monthStr}</span>
        <button onClick={() => setViewMonth(v => addMonths(v, 1))} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-center text-slate-600 text-[10px] font-semibold py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateStr = `${format(viewMonth, 'yyyy-MM')}-${String(day).padStart(2, '0')}`;
          const dayEvents = eventMap[dateStr] || [];
          const isToday = isSameDay(new Date(dateStr + 'T12:00:00Z'), today);
          const isSelected = selectedDate === dateStr;
          const moonIllum = getMoonIllumination(new Date(dateStr + 'T12:00:00Z'));
          const isDarkMoon = moonIllum <= 10;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative flex flex-col items-center py-1 rounded-lg transition-all min-h-[2.5rem] ${
                isSelected ? 'bg-red-600/30 border border-red-500' :
                isToday ? 'bg-white/5 border border-white/10' :
                dayEvents.length > 0 ? 'hover:bg-white/5' : 'hover:bg-white/3'
              }`}
            >
              <span className={`text-xs font-semibold leading-none mt-1 ${
                isToday ? 'text-red-400' : isSelected ? 'text-white' : 'text-slate-300'
              }`}>{day}</span>
              {/* Moon dark window indicator */}
              {isDarkMoon && (
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-0.5 opacity-60" title={`Moon ${moonIllum}%`} />
              )}
              {/* Event dots */}
              <div className="flex flex-wrap justify-center gap-px mt-0.5 max-w-[28px]">
                {dayEvents.slice(0, 3).map((ev, ei) => (
                  <div key={ei} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[ev.type] || 'bg-slate-400'}`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Dark Moon window</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Meteor shower</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Aurora</span>
        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-400" /> Eclipse</span>
      </div>
    </div>
  );
}

function EventCard({ event, expanded, onToggle }) {
  const Icon = EVENT_ICONS[event.type] || Calendar;
  const isOpen = expanded === event.id;
  const past = isPast(new Date(event.date + 'T23:59:59'));

  return (
    <Card className={`bg-[#1a1a1a] border-white/8 p-4 transition-all ${past ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-xl ${BADGE_COLORS[event.type]} flex-shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-white font-semibold text-sm">{event.title}</h3>
              {isThisMonth(new Date(event.date)) && !past && (
                <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0">This Month</Badge>
              )}
            </div>
            <p className="text-slate-400 text-xs">
              {format(parseISO(event.date), 'MMMM d, yyyy')}
              {event.end_date && event.end_date !== event.date && ` – ${format(parseISO(event.end_date), 'MMM d')}`}
              {event.peak_time && <span className="ml-2 text-purple-300">· Peak: {event.peak_time}</span>}
            </p>
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{event.description}</p>
          </div>
        </div>
        <button onClick={() => onToggle(event.id)} className="text-slate-500 hover:text-white flex-shrink-0">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
          {event.visibility_info && (
            <div className="flex items-start gap-2">
              <Eye className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-xs font-medium mb-0.5">Visibility</p>
                <p className="text-slate-300 text-xs">{event.visibility_info}</p>
              </div>
            </div>
          )}
          {event.tips && (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-xs font-medium mb-0.5">Photography Tips</p>
                <p className="text-slate-300 text-xs">{event.tips}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function EventsCalendarTab({ isSubscribed, userProfile }) {
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const load = async () => {
      const astrEvents = await base44.entities.AstronomyEvent.list('date', 100).catch(() => []);
      setEvents(astrEvents.length > 0 ? astrEvents : SAMPLE_EVENTS);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = events.filter(e => typeFilter === 'all' || e.type === typeFilter);
  const upcoming = filtered.filter(e => !isPast(new Date(e.date + 'T23:59:59'))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = filtered.filter(e => isPast(new Date(e.date + 'T23:59:59'))).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Events for selected date
  const selectedDayEvents = selectedDate ? events.filter(ev => {
    const start = ev.date;
    const end = ev.end_date || ev.date;
    return selectedDate >= start && selectedDate <= end;
  }) : [];

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Calendar className="w-8 h-8 text-red-400 star-pulse" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-red-400" /> Cosmic Events Calendar
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">Meteor showers, eclipses, aurora windows, and dark moon nights — all in one place.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8 pb-0">
        {[
          { id: 'calendar', label: '📅 Calendar' },
          { id: 'list', label: '📋 Event List' },
          { id: 'aurora', label: '🌠 Aurora' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-red-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Event type filters */}
      {tab !== 'aurora' && (
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map(et => (
            <button
              key={et.id}
              onClick={() => setTypeFilter(et.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                typeFilter === et.id
                  ? 'bg-red-600/30 border-red-500 text-white'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      )}

      {/* Calendar tab */}
      {tab === 'calendar' && (
        <>
          <CalendarGrid
            events={filtered}
            typeFilter={typeFilter}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />

          {/* Selected day details */}
          {selectedDate && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-slate-300 text-sm font-semibold">
                  {format(new Date(selectedDate + 'T12:00:00Z'), 'MMMM d, yyyy')}
                  <span className="ml-2 text-slate-500 font-normal">
                    {moonEmoji(getMoonIllumination(new Date(selectedDate + 'T12:00:00Z')))} Moon: {getMoonIllumination(new Date(selectedDate + 'T12:00:00Z'))}%
                  </span>
                </p>
                <button onClick={() => setSelectedDate(null)} className="text-slate-600 hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedDayEvents.map(ev => (
                    <EventCard key={ev.id} event={ev} expanded={expanded} onToggle={id => setExpanded(expanded === id ? null : id)} />
                  ))}
                </div>
              ) : (
                <Card className="bg-[#1a1a1a] border-white/8 p-4 text-center">
                  <p className="text-slate-500 text-sm">No events on this date.</p>
                  {getMoonIllumination(new Date(selectedDate + 'T12:00:00Z')) <= 10 && (
                    <p className="text-indigo-400 text-xs mt-1">✦ Dark moon window — great for Milky Way!</p>
                  )}
                </Card>
              )}
            </div>
          )}

          {!selectedDate && (
            <div className="space-y-2">
              <p className="text-slate-500 text-xs uppercase tracking-wide font-semibold">Next Up</p>
              {upcoming.slice(0, 3).map(e => (
                <EventCard key={e.id} event={e} expanded={expanded} onToggle={id => setExpanded(expanded === id ? null : id)} />
              ))}
            </div>
          )}
        </>
      )}

      {/* List tab */}
      {tab === 'list' && (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-red-400" /> Upcoming
              </p>
              <div className="space-y-2">
                {upcoming.map(e => <EventCard key={e.id} event={e} expanded={expanded} onToggle={id => setExpanded(expanded === id ? null : id)} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div className="opacity-60">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-3">Past Events</p>
              <div className="space-y-2">
                {past.map(e => <EventCard key={e.id} event={e} expanded={expanded} onToggle={id => setExpanded(expanded === id ? null : id)} />)}
              </div>
            </div>
          )}
          {filtered.length === 0 && (
            <Card className="bg-[#1a1a1a] border-white/8 p-12 text-center">
              <Calendar className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No events match this filter.</p>
            </Card>
          )}
        </div>
      )}

      {/* Aurora tab */}
      {tab === 'aurora' && (
        <div className="space-y-4">
          <AuroraPredictionCard
            userLat={userProfile?.home_lat ?? null}
            userLon={userProfile?.home_lon ?? null}
            locationName={userProfile?.home_location ?? null}
          />
          <AuroraView
            isSubscribed={isSubscribed}
            userLocation={userProfile?.home_location || 'Your Location'}
            userLat={userProfile?.home_lat ?? null}
            userLon={userProfile?.home_lon ?? null}
          />
        </div>
      )}
    </div>
  );
}