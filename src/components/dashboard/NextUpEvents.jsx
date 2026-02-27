import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ChevronRight, Lock, Moon, Zap, Star, Sun, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Upcoming events data — sorted by date
const UPCOMING_EVENTS = [
  {
    id: 'lunar-eclipse-2026',
    type: 'lunar_eclipse',
    icon: Moon,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-900/30',
    badgeColor: 'bg-orange-600/30 text-orange-300 border-orange-600/30',
    dotColor: 'bg-orange-400',
    title: 'Total Lunar Eclipse (Blood Moon)',
    date: '2026-03-03',
    dateLabel: 'March 3, 2026',
    peakTime: '11:30 PM UTC',
    shortDesc: 'The Moon turns deep red-orange as it passes through Earth\'s full shadow. One of the most dramatic sky events of the year.',
    details: {
      visibility: 'Visible from North & South America, Western Europe, and Africa. Best view from the US East Coast and Atlantic regions.',
      locationNote: (loc) => loc ? `From ${loc}: Look southeast after sunset as the Moon rises into totality.` : 'Look southeast after sunset.',
      tips: 'Use 200–400mm to fill the frame. Bracket exposures: try f/5.6, ISO 400, 1/250s for partial phases, then f/5.6, ISO 1600, 2–4s during totality. Shoot in RAW.',
      duration: 'Totality lasts ~1 hour 16 minutes',
      plannerTab: 'events',
    },
  },
  {
    id: 'aurora-april-2026',
    type: 'aurora',
    icon: Zap,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-900/30',
    badgeColor: 'bg-green-600/30 text-green-300 border-green-600/30',
    dotColor: 'bg-green-400',
    title: 'Aurora Borealis Alert Window',
    date: '2026-04-15',
    dateLabel: 'April 15–17, 2026',
    peakTime: '10 PM – 2 AM local',
    shortDesc: 'Elevated solar activity during the current solar cycle peak gives high probability of visible aurora at mid-latitudes.',
    details: {
      visibility: 'Northern US (Utah, Colorado, Wyoming, Montana), UK, Scandinavia, Canada, and central Europe all have strong chances.',
      locationNote: (loc) => loc ? `From ${loc}: Face north and look for green/pink bands 30° above the horizon.` : 'Face north, look 30° above the horizon.',
      tips: 'Wide-angle lens (14–24mm), f/2.8, ISO 1600–3200, 10–20s exposures. Use a bright star to focus. Dress warmly — long waits are normal.',
      duration: 'Active window: April 15–17. Best nights determined by KP index ≥ 5.',
      plannerTab: 'events',
    },
  },
  {
    id: 'perseid-2026',
    type: 'meteor_shower',
    icon: Star,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-900/30',
    badgeColor: 'bg-yellow-600/30 text-yellow-300 border-yellow-600/30',
    dotColor: 'bg-yellow-400',
    title: 'Perseid Meteor Shower',
    date: '2026-08-11',
    dateLabel: 'August 11–13, 2026',
    peakTime: '2 AM local time (Aug 12)',
    shortDesc: 'One of the most prolific meteor showers of the year — up to 100 meteors per hour at peak, from Comet Swift-Tuttle debris.',
    details: {
      visibility: 'Visible worldwide. Best from Northern Hemisphere dark sky sites. The radiant is in Perseus, northeast.',
      locationNote: (loc) => loc ? `From ${loc}: Find a dark field with a wide-open northeast horizon for best views.` : 'Dark sky site with open northeast horizon.',
      tips: 'No telescope needed — naked eye is best. Lie flat on your back. Use wide-angle for streak shots: f/2.8, ISO 3200, 20–25s. Let eyes dark-adapt 20+ minutes.',
      duration: 'Active Aug 11–13. Peak: Aug 12 ~2 AM. New moon = excellent dark skies.',
      plannerTab: 'events',
    },
  },
  {
    id: 'annular-solar-eclipse-2026',
    type: 'solar_eclipse',
    icon: Sun,
    iconColor: 'text-yellow-300',
    iconBg: 'bg-yellow-900/20',
    badgeColor: 'bg-yellow-600/30 text-yellow-200 border-yellow-600/30',
    dotColor: 'bg-yellow-300',
    title: 'Annular Solar Eclipse',
    date: '2026-08-12',
    dateLabel: 'August 12, 2026',
    peakTime: '17:45 UTC',
    shortDesc: 'The Moon covers the center of the Sun, leaving a brilliant "ring of fire" — visible along a path from the Arctic to Greenland.',
    details: {
      visibility: 'Path of annularity crosses Arctic Russia and Greenland. Partial eclipse visible across Europe and parts of North America.',
      locationNote: (loc) => loc ? `From ${loc}: Partial eclipse visible — Moon covers ~40% of the Sun. Use certified solar filters.` : 'Use certified solar filters at all times.',
      tips: 'NEVER look at the Sun without ISO 12312-2 certified solar filters. Use a solar filter on your lens. 100–400mm ideal. During annularity, ring lasts 1–3 minutes.',
      duration: 'Annularity: ~2 minutes. Partial phases last 2+ hours.',
      plannerTab: 'events',
    },
  },
];

function localizeTime(peakTime, locationName) {
  // Simple display — real timezone math would require a geo lookup
  // For now, append location hint if available
  if (!locationName) return peakTime;
  return `${peakTime} (check local time from ${locationName})`;
}

function EventRow({ event, isSubscribed, locationName, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const Icon = event.icon;

  return (
    <Card className="bg-[#1a1a1a] border-white/8 overflow-hidden transition-all">
      {/* Header row — always visible */}
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`p-2 rounded-xl ${event.iconBg} flex-shrink-0 mt-0.5`}>
          <Icon className={`w-4 h-4 ${event.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-white font-semibold text-sm leading-tight">{event.title}</span>
            <Badge className={`text-[10px] px-1.5 py-0 border ${event.badgeColor}`}>
              {event.type === 'lunar_eclipse' ? 'Eclipse' :
               event.type === 'aurora' ? 'Aurora' :
               event.type === 'solar_eclipse' ? 'Solar' : 'Meteor'}
            </Badge>
          </div>
          <p className="text-slate-400 text-xs">{event.dateLabel} · Peak: {event.peakTime}</p>
          <p className="text-slate-400 text-xs mt-1 line-clamp-2">{event.shortDesc}</p>
        </div>
        <div className="flex-shrink-0 text-slate-500 ml-2 mt-1">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-3">
          {isSubscribed ? (
            <>
              <div className="mt-3 space-y-2.5">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Visibility</p>
                  <p className="text-slate-300 text-xs">{event.details.visibility}</p>
                </div>
                {locationName && (
                  <div className="flex items-start gap-2 bg-red-900/10 border border-red-600/20 rounded-lg px-3 py-2">
                    <span className="text-red-400 text-xs">📍</span>
                    <p className="text-red-200 text-xs">{event.details.locationNote(locationName)}</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Photography Tips</p>
                  <p className="text-slate-300 text-xs">{event.details.tips}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold mb-0.5">Duration</p>
                  <p className="text-slate-300 text-xs">{event.details.duration}</p>
                </div>
              </div>
              <Link
                to={`${createPageUrl('PlannerTool')}?tab=events`}
                className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-semibold mt-1"
              >
                Open in Sky Planner <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          ) : (
            <div className="mt-3 flex items-center gap-3 bg-slate-800/60 border border-white/8 rounded-xl p-3">
              <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs font-semibold">Full details for subscribers</p>
                <p className="text-slate-500 text-xs">Location-aware visibility, photography tips & Sky Planner integration.</p>
              </div>
              <Link to={createPageUrl('PaymentGate')}>
                <span className="text-red-400 text-xs font-bold whitespace-nowrap">Unlock →</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function NextUpEvents({ isSubscribed, locationName }) {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-400" /> Next Up
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Events worth planning for — sorted by proximity</p>
        </div>
        <Link to={`${createPageUrl('PlannerTool')}?tab=events`} className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 flex-shrink-0">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {UPCOMING_EVENTS.map((event, i) => (
          <EventRow
            key={event.id}
            event={event}
            isSubscribed={isSubscribed}
            locationName={locationName}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </div>
  );
}