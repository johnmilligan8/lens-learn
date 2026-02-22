import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Calendar, Star } from 'lucide-react';

const EVENT_ICONS = {
  meteor_shower: '☄️',
  eclipse: '🌑',
  supermoon: '🌕',
  aurora: '🌌',
  comet: '🌠',
  conjunction: '🪐',
  other: '🔭'
};

export default function UpcomingEventsWidget() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split('T')[0];
      const allEvents = await base44.entities.AstronomyEvent.filter({}, 'date', 50);
      
      // Filter upcoming events (from today onwards)
      const upcoming = allEvents
        .filter(e => e.date >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);
      
      setEvents(upcoming);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return null;
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/40 border-slate-800 p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" /> Upcoming Celestial Events
        </h3>
        <Link to={createPageUrl('EventsCalendar')} className="text-xs text-slate-500 hover:text-purple-300 flex items-center gap-1">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {events.map(event => {
          const eventDate = new Date(event.date);
          const today = new Date().toISOString().split('T')[0];
          const isToday = event.date === today;
          
          return (
            <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
              <span className="text-xl flex-shrink-0 mt-0.5">{EVENT_ICONS[event.type] || '🔭'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{event.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={`text-xs ${isToday ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}>
                    {isToday ? '🔴 Tonight' : eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  {event.type && (
                    <span className="text-xs text-slate-500 capitalize">
                      {event.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
              </div>
              {event.visibility_info && (
                <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0 mt-1" />
              )}
            </div>
          );
        })}
      </div>

      <Link to={createPageUrl('EventsCalendar')} className="block mt-3">
        <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 text-xs">
          Browse Full Calendar
        </Button>
      </Link>
    </Card>
  );
}