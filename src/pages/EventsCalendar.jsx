import React, { useState, useEffect, useCallback } from 'react';
import PullToRefresh from '../components/ui/PullToRefresh';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, parseISO, isPast, isThisMonth, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import AuroraView from '../components/aurora/AuroraView';
import {
  Calendar, Star, Sparkles, Moon, Zap, Eye,
  AlertCircle, ChevronDown, ChevronUp, Filter, X
} from 'lucide-react';

const EVENT_ICONS = {
  meteor_shower: Star,
  eclipse: Moon,
  supermoon: Moon,
  aurora: Zap,
  comet: Sparkles,
  conjunction: Eye,
  other: Calendar,
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

const SAMPLE_EVENTS = [
  { id:'e1', title:'Perseid Meteor Shower', type:'meteor_shower', date:'2026-08-11', end_date:'2026-08-13', description:'One of the most prolific meteor showers of the year. Expect up to 100 meteors per hour at peak.', visibility_info:'Visible worldwide. Best in Northern Hemisphere.', tips:'Lie flat on your back, let your eyes adjust 20 minutes. No telescope needed!', peak_time:'Aug 12 at 2 AM local time' },
  { id:'e2', title:'Total Lunar Eclipse', type:'eclipse', date:'2026-03-03', end_date:'2026-03-03', description:'The Moon passes through Earth\'s full shadow, turning it a deep red/orange color — a "Blood Moon".', visibility_info:'Visible from North & South America, Western Europe, Africa.', tips:'Use longer focal length (200-400mm) to fill the frame. Bracket your exposures.', peak_time:'Mar 3 at 11:30 PM UTC' },
  { id:'e3', title:'Supermoon', type:'supermoon', date:'2026-09-07', description:'Moon at perigee — appears up to 14% larger and 30% brighter than usual.', visibility_info:'Visible worldwide.', tips:'Photograph near the horizon during moonrise for dramatic landscape shots with the Moon.' },
  { id:'e4', title:'Geminid Meteor Shower', type:'meteor_shower', date:'2026-12-13', end_date:'2026-12-14', description:'The Geminids produce up to 120 multicolored meteors per hour at peak.', visibility_info:'Visible worldwide, best in Northern Hemisphere.', tips:'Unlike most showers, Geminids begin around 9–10 PM local time. Set up early!', peak_time:'Dec 13-14 overnight' },
  { id:'e5', title:'Aurora Borealis Alert', type:'aurora', date:'2026-04-15', description:'Elevated solar activity predicted. High chance of visible aurora at mid-latitudes.', visibility_info:'Northern US, Canada, UK, Scandinavia.', tips:'Face north, get away from city lights. Wide-angle lens, ISO 1600-3200, 10-20s exposure.' },
  { id:'e6', title:'Leonid Meteor Shower', type:'meteor_shower', date:'2026-11-17', description:'Swift, bright meteors. Some years produce storms of thousands per hour.', visibility_info:'Visible worldwide.', tips:'Best after midnight. The shower\'s radiant rises higher as the night progresses.', peak_time:'Nov 17 after midnight' },
];

export default function EventsCalendar() {
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('events');
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [astrEvents, subs] = await Promise.all([
      base44.entities.AstronomyEvent.list('date', 100),
      me.role === 'admin' ? Promise.resolve([{ status: 'active' }]) : base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1),
    ]);
    setEvents(astrEvents.length > 0 ? astrEvents : SAMPLE_EVENTS);
    setIsSubscribed(subs.length > 0);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, []);

  const types = ['all', 'meteor_shower', 'eclipse', 'supermoon', 'aurora', 'comet', 'conjunction'];
  
  // Apply filters
  const filtered = events.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    if (dateRangeStart || dateRangeEnd) {
      const eventDate = new Date(e.date);
      if (dateRangeStart && eventDate < new Date(dateRangeStart)) return false;
      if (dateRangeEnd && eventDate > new Date(dateRangeEnd)) return false;
    }
    return true;
  });

  const upcoming = filtered.filter(e => !isPast(new Date(e.date + 'T23:59:59'))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = filtered.filter(e => isPast(new Date(e.date + 'T23:59:59'))).sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const hasActiveFilters = typeFilter !== 'all' || dateRangeStart || dateRangeEnd;
  
  const clearFilters = () => {
    setTypeFilter('all');
    setDateRangeStart('');
    setDateRangeEnd('');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Calendar className="w-10 h-10 text-purple-400 star-pulse" />
    </div>
  );

  const EventCard = ({ event }) => {
    const Icon = EVENT_ICONS[event.type] || Calendar;
    const isOpen = expanded === event.id;
    const past = isPast(new Date(event.date + 'T23:59:59'));

    return (
      <Card className={`border p-6 transition-all ${past ? 'opacity-60' : ''} ${EVENT_COLORS[event.type]}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl ${BADGE_COLORS[event.type]} flex-shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-white font-bold text-lg">{event.title}</h3>
                {isThisMonth(new Date(event.date)) && !past && (
                  <Badge className="bg-purple-600 text-white text-xs">This Month</Badge>
                )}
              </div>
              <p className="text-slate-400 text-sm mb-2">
                {format(parseISO(event.date), 'MMMM d, yyyy')}
                {event.end_date && event.end_date !== event.date && ` – ${format(parseISO(event.end_date), 'MMMM d')}`}
                {event.peak_time && <span className="ml-2 text-purple-300">· Peak: {event.peak_time}</span>}
              </p>
              <p className="text-slate-400 text-sm line-clamp-2">{event.description}</p>
            </div>
          </div>
          <button onClick={() => setExpanded(isOpen ? null : event.id)} className="text-slate-400 hover:text-white flex-shrink-0 mt-1">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
            {event.visibility_info && (
              <div className="flex items-start gap-3">
                <Eye className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium mb-0.5">Visibility</p>
                  <p className="text-slate-300 text-sm">{event.visibility_info}</p>
                </div>
              </div>
            )}
            {event.tips && (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium mb-0.5">Photography Tips</p>
                  <p className="text-slate-300 text-sm">{event.tips}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Calendar className="w-9 h-9 text-blue-400" /> Cosmic Events
        </h1>
        <p className="text-slate-400 text-lg">Meteor showers, eclipses, auroras, and more — never miss a shoot.</p>
      </div>

      {/* Aurora View */}
      {tab === 'aurora' && <AuroraView isSubscribed={isSubscribed} userLocation={user?.email ? 'Utah' : 'Your Location'} />}

      {/* Events View */}
      {tab === 'events' && (
      <div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-800 pb-0">
        <button
          onClick={() => setTab('events')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            tab === 'events'
              ? 'border-purple-600 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          Astronomy Events
        </button>
        <button
          onClick={() => setTab('aurora')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
            tab === 'aurora'
              ? 'border-purple-600 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Zap className="w-4 h-4" /> Aurora / Northern Lights
        </button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" /> Upcoming Events
          </h2>
          <div className="space-y-4">
            {upcoming.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-500 mb-4">Past Events</h2>
          <div className="space-y-4">
            {past.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="bg-slate-900/60 border-slate-800 p-16 text-center">
          <Calendar className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-500">No events found for this filter.</p>
        </Card>
      )}
      </div>
      )}
    </div>
    </PullToRefresh>
  );
}