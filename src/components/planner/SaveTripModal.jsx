import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import {
  Save, X, Loader2, Folder, Trash2, RotateCcw, Plus, MapPin,
  Star, Moon, Zap, Camera, Smartphone, Eye, CalendarDays
} from 'lucide-react';

const EVENT_FOCUS_OPTIONS = [
  { id: 'milky_way', label: 'Milky Way', icon: '🌌' },
  { id: 'aurora', label: 'Aurora', icon: '🟢' },
  { id: 'meteor_shower', label: 'Meteor Shower', icon: '☄️' },
  { id: 'lunar', label: 'Lunar / Eclipse', icon: '🌕' },
  { id: 'planetary', label: 'Planetary', icon: '🪐' },
  { id: 'landscape', label: 'Landscape + Stars', icon: '⛰️' },
  { id: 'general', label: 'General Stargazing', icon: '✨' },
];

const MODE_ICONS = {
  photographer: <Camera className="w-3 h-3" />,
  smartphone: <Smartphone className="w-3 h-3" />,
  experience: <Eye className="w-3 h-3" />,
};

export default function SaveTripModal({ userEmail, currentState, onLoadTrip, onClose }) {
  const [view, setView] = useState('menu'); // menu | save | browse
  const [trips, setTrips] = useState([]);
  const [tripName, setTripName] = useState('');
  const [dateStart, setDateStart] = useState(currentState?.date || new Date().toISOString().split('T')[0]);
  const [dateEnd, setDateEnd] = useState('');
  const [eventFocus, setEventFocus] = useState('milky_way');
  const [rankedLocations, setRankedLocations] = useState(
    currentState?.location ? [{ name: currentState.location, lat: currentState.coords?.lat, lon: currentState.coords?.lon, notes: '' }] : []
  );
  const [newLocName, setNewLocName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userEmail) loadTrips();
  }, [userEmail]);

  const loadTrips = async () => {
    const sessions = await base44.entities.ShootSession.filter({ user_email: userEmail }, '-created_date', 50);
    setTrips(sessions);
  };

  const addLocation = () => {
    if (!newLocName.trim()) return;
    setRankedLocations(prev => [...prev, { name: newLocName.trim(), notes: '' }]);
    setNewLocName('');
  };

  const removeLocation = (idx) => {
    setRankedLocations(prev => prev.filter((_, i) => i !== idx));
  };

  const moveLocation = (idx, dir) => {
    const arr = [...rankedLocations];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setRankedLocations(arr);
  };

  const saveTrip = async () => {
    if (!tripName.trim()) return;
    setLoading(true);
    await base44.entities.ShootSession.create({
      user_email: userEmail,
      date: dateStart,
      location: rankedLocations[0]?.name || currentState?.location || '',
      shooter_mode: currentState?.shooterMode || 'photographer',
      event_type: eventFocus,
      pre_shoot_intent: tripName,
      field_notes: `Date range: ${dateStart}${dateEnd ? ' – ' + dateEnd : ''} | Locations: ${rankedLocations.map(l => l.name).join(', ')}`,
      guided_plan: {
        ...currentState,
        tripName,
        dateStart,
        dateEnd,
        eventFocus,
        rankedLocations,
      },
      status: 'planned',
    });
    await loadTrips();
    setLoading(false);
    setView('menu');
    setTripName('');
  };

  const deleteTrip = async (id) => {
    if (!confirm('Delete this trip?')) return;
    await base44.entities.ShootSession.delete(id);
    await loadTrips();
  };

  const loadTrip = (trip) => {
    if (trip.guided_plan) onLoadTrip?.(trip.guided_plan);
    onClose?.();
  };

  const eventFocusInfo = (id) => EVENT_FOCUS_OPTIONS.find(e => e.id === id);

  // ── Menu ──────────────────────────────────────────────────────────────────
  if (view === 'menu') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <Card className="bg-[#1a1a1a] border-white/10 p-5 w-full max-w-sm rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Folder className="w-4 h-4 text-red-400" /> Trip Manager
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2">
            <Button onClick={() => setView('save')} className="w-full bg-red-600 hover:bg-red-700 h-10 text-sm gap-2">
              <Plus className="w-4 h-4" /> Save This Plan as a Trip
            </Button>
            <Button onClick={() => setView('browse')} variant="outline" className="w-full border-white/10 text-slate-300 hover:bg-white/5 h-10 text-sm gap-2">
              <Folder className="w-4 h-4" /> Browse Saved Trips ({trips.length})
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Save Form ─────────────────────────────────────────────────────────────
  if (view === 'save') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <Card className="bg-[#1a1a1a] border-white/10 p-5 w-full max-w-md rounded-2xl my-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-sm flex items-center gap-2">
              <Save className="w-4 h-4 text-red-400" /> Save Trip
            </h3>
            <button onClick={() => setView('menu')} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            {/* Trip name */}
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold block mb-1">Trip Name</label>
              <Input
                placeholder="e.g., Milky Way Season 2026"
                value={tripName}
                onChange={e => setTripName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-sm"
              />
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-xs uppercase font-bold block mb-1">Start Date</label>
                <Input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-9" />
              </div>
              <div>
                <label className="text-slate-400 text-xs uppercase font-bold block mb-1">End Date (opt)</label>
                <Input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-slate-800 border-slate-700 text-white text-xs h-9" />
              </div>
            </div>

            {/* Event focus */}
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold block mb-1.5">Event Focus</label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_FOCUS_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setEventFocus(opt.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs transition-all ${
                      eventFocus === opt.id
                        ? 'bg-red-600 border-red-500 text-white font-bold'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500 bg-slate-800/60'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ranked Locations */}
            <div>
              <label className="text-slate-400 text-xs uppercase font-bold block mb-1.5">Ranked Locations</label>
              <div className="space-y-1.5 mb-2">
                {rankedLocations.map((loc, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2">
                    <span className="text-red-400 font-bold text-xs w-5 flex-shrink-0">#{idx + 1}</span>
                    <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                    <span className="text-slate-300 text-xs flex-1 truncate">{loc.name}</span>
                    <div className="flex gap-0.5">
                      <button onClick={() => moveLocation(idx, -1)} className="text-slate-500 hover:text-slate-300 px-1 text-xs">↑</button>
                      <button onClick={() => moveLocation(idx, 1)} className="text-slate-500 hover:text-slate-300 px-1 text-xs">↓</button>
                      <button onClick={() => removeLocation(idx)} className="text-slate-500 hover:text-red-400 px-1"><X className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a location..."
                  value={newLocName}
                  onChange={e => setNewLocName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addLocation(); }}
                  className="bg-slate-800 border-slate-700 text-white text-xs h-8 flex-1"
                />
                <Button onClick={addLocation} size="sm" className="bg-slate-700 hover:bg-slate-600 h-8 px-3 text-xs">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <Button
              onClick={saveTrip}
              disabled={!tripName.trim() || loading}
              className="w-full bg-red-600 hover:bg-red-700 h-10 font-bold text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Trip
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Browse ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="bg-[#1a1a1a] border-white/10 p-5 w-full max-w-lg rounded-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Folder className="w-4 h-4 text-red-400" /> Saved Trips ({trips.length})
          </h3>
          <button onClick={() => setView('menu')} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto flex-1 space-y-2">
          {trips.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No trips saved yet.</p>
          ) : (
            trips.map(trip => {
              const plan = trip.guided_plan || {};
              const focus = eventFocusInfo(trip.event_type || plan.eventFocus);
              return (
                <div key={trip.id} className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadTrip(trip)}>
                    <p className="text-white font-semibold text-sm truncate">{trip.pre_shoot_intent}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> {trip.date}
                      </span>
                      {focus && <span className="text-xs text-slate-400">{focus.icon} {focus.label}</span>}
                      {trip.shooter_mode && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          {MODE_ICONS[trip.shooter_mode]} {trip.shooter_mode}
                        </span>
                      )}
                    </div>
                    {trip.location && (
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5" /> {trip.location}
                      </p>
                    )}
                    {plan.rankedLocations?.length > 1 && (
                      <p className="text-slate-600 text-xs mt-0.5">+{plan.rankedLocations.length - 1} more locations</p>
                    )}
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Button onClick={() => loadTrip(trip)} size="sm" className="bg-red-600 hover:bg-red-700 h-7 text-xs gap-1 px-2">
                      <RotateCcw className="w-3 h-3" /> Load
                    </Button>
                    <Button onClick={() => deleteTrip(trip.id)} size="sm" variant="ghost" className="text-slate-500 hover:text-red-400 h-7 px-2">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}