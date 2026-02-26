import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import {
  Save, Folder, Trash2, Plus, Loader2, X, ChevronDown,
  MapPin, Calendar, Pencil, Check, Lock, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const FREE_TRIP_LIMIT = 2;
const PAID_TRIP_LIMIT = 10;

export default function TripManager({ userEmail, isPaid, currentState, onLoadTrip, onTripSaved }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showList, setShowList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', notes: '' });
  const [activeTrip, setActiveTrip] = useState(null);

  const tripLimit = isPaid ? PAID_TRIP_LIMIT : FREE_TRIP_LIMIT;

  useEffect(() => {
    if (userEmail) loadTrips();
  }, [userEmail]);

  const loadTrips = async () => {
    const sessions = await base44.entities.ShootSession.filter(
      { user_email: userEmail },
      '-created_date',
      50
    );
    setTrips(sessions);
  };

  const saveTrip = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    const payload = {
      user_email: userEmail,
      date: currentState?.date || new Date().toISOString().split('T')[0],
      location: currentState?.location || '',
      shooter_mode: currentState?.shooterMode || 'photographer',
      pre_shoot_intent: form.name.trim(),
      field_notes: form.notes,
      guided_plan: currentState,
      status: 'planned',
    };

    if (editingId) {
      await base44.entities.ShootSession.update(editingId, payload);
    } else {
      await base44.entities.ShootSession.create(payload);
    }

    setForm({ name: '', notes: '' });
    setShowNew(false);
    setEditingId(null);
    await loadTrips();
    onTripSaved?.();
    setLoading(false);
  };

  const deleteTrip = async (id) => {
    if (!confirm('Delete this expedition?')) return;
    await base44.entities.ShootSession.delete(id);
    if (activeTrip?.id === id) setActiveTrip(null);
    await loadTrips();
  };

  const loadTrip = (trip) => {
    setActiveTrip(trip);
    setShowList(false);
    if (trip.guided_plan) onLoadTrip?.(trip.guided_plan);
  };

  const startEdit = (trip) => {
    setForm({ name: trip.pre_shoot_intent || '', notes: trip.field_notes || '' });
    setEditingId(trip.id);
    setShowNew(true);
  };

  const atLimit = trips.length >= tripLimit;

  return (
    <div className="space-y-3">
      {/* Active trip indicator */}
      {activeTrip && (
        <div className="flex items-center gap-2 bg-red-900/20 border border-red-600/30 rounded-xl px-3 py-2">
          <Folder className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-red-200 text-xs font-semibold truncate">{activeTrip.pre_shoot_intent}</p>
            <p className="text-slate-500 text-xs">{activeTrip.date} · {activeTrip.location || 'No location'}</p>
          </div>
          <button onClick={() => setActiveTrip(null)} className="text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Action row */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => { setShowNew(true); setEditingId(null); setForm({ name: '', notes: '' }); }}
          size="sm"
          disabled={atLimit && !isPaid}
          className="bg-red-600 hover:bg-red-700 text-xs gap-1"
        >
          <Plus className="w-3 h-3" /> New Expedition
        </Button>
        <Button
          onClick={() => setShowList(s => !s)}
          size="sm"
          variant="outline"
          className="border-red-500/40 text-red-300 hover:bg-red-900/20 text-xs gap-1"
        >
          <Folder className="w-3 h-3" /> My Expeditions ({trips.length}/{tripLimit})
          <ChevronDown className={`w-3 h-3 transition-transform ${showList ? 'rotate-180' : ''}`} />
        </Button>
        {activeTrip && currentState && (
          <Button
            onClick={() => startEdit(activeTrip)}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 text-xs gap-1"
          >
            <Save className="w-3 h-3" /> Update
          </Button>
        )}
      </div>

      {/* Free tier limit notice */}
      {!isPaid && atLimit && (
        <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-600/30 rounded-xl px-3 py-2">
          <Lock className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-300 text-xs flex-1">
            Free limit: {FREE_TRIP_LIMIT} expeditions.{' '}
            <Link to={createPageUrl('PaymentGate')} className="underline font-semibold">Unlock 10 with Plus →</Link>
          </p>
        </div>
      )}

      {/* New / Edit form */}
      {showNew && (
        <Card className="bg-[#141414] border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white text-sm font-semibold">{editingId ? 'Edit Expedition' : 'New Expedition'}</h4>
            <button onClick={() => { setShowNew(false); setEditingId(null); }} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Expedition name (e.g. Milky Way Season '26)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-slate-900 border-slate-700 text-white text-sm h-9"
            />
            <Input
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="bg-slate-900 border-slate-700 text-white text-sm h-9"
            />
            <div className="text-xs text-slate-500">
              <MapPin className="inline w-3 h-3 mr-1" />
              {currentState?.location || 'No location set'} ·{' '}
              <Calendar className="inline w-3 h-3 mr-1" />
              {currentState?.date || 'No date set'}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveTrip}
              disabled={!form.name.trim() || loading}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-xs"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              {editingId ? 'Update' : 'Save'}
            </Button>
            <Button size="sm" variant="outline" className="border-slate-600 text-slate-400 text-xs" onClick={() => { setShowNew(false); setEditingId(null); }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Trip list */}
      {showList && (
        <div className="space-y-2">
          {trips.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-4">No expeditions yet — create your first above.</p>
          ) : (
            trips.map(trip => (
              <div
                key={trip.id}
                className={`rounded-xl border p-3 flex items-start gap-3 transition-all ${
                  activeTrip?.id === trip.id
                    ? 'border-red-500/50 bg-red-900/20'
                    : 'border-white/8 bg-[#141414] hover:border-white/15'
                }`}
              >
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadTrip(trip)}>
                  <p className="text-white text-sm font-semibold truncate">{trip.pre_shoot_intent}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {trip.date} · {trip.location || 'No location'} · {trip.shooter_mode}
                  </p>
                  {trip.field_notes && <p className="text-slate-600 text-xs mt-1 line-clamp-1">{trip.field_notes}</p>}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => startEdit(trip)} className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteTrip(trip.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 h-7 text-xs px-2" onClick={() => loadTrip(trip)}>
                    Load
                  </Button>
                </div>
              </div>
            ))
          )}
          {!isPaid && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              <Link to={createPageUrl('PaymentGate')} className="text-yellow-400 underline">
                Unlock 10 expeditions + advanced planning with Plus →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}