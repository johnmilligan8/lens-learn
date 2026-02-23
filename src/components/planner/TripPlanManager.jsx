import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import {
  Save, Folder, Trash2, RotateCcw, Plus, Loader2, X,
  MapPin, Calendar, Camera, ChevronRight, Star, Edit2, Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = {
  planned: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
  active: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30',
  complete: 'bg-slate-800 text-slate-400 border-slate-700',
};

export default function TripPlanManager({ userEmail, currentState, onLoadTrip }) {
  const [trips, setTrips] = useState([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [tripName, setTripName] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'planned' | 'complete'

  const loadTrips = async () => {
    if (!userEmail) return;
    setListLoading(true);
    const sessions = await base44.entities.ShootSession.filter(
      { user_email: userEmail },
      '-created_date',
      100
    );
    setTrips(sessions);
    setListLoading(false);
  };

  useEffect(() => {
    if (userEmail && showBrowser) loadTrips();
  }, [userEmail, showBrowser]);

  const saveTrip = async () => {
    if (!tripName.trim()) return;
    setLoading(true);
    await base44.entities.ShootSession.create({
      user_email: userEmail,
      date: currentState?.date || new Date().toISOString().split('T')[0],
      location: currentState?.location || '',
      shooter_mode: currentState?.shooterMode || 'photographer',
      pre_shoot_intent: tripName,
      field_notes: currentState?.notes || '',
      guided_plan: currentState || {},
      status: 'planned',
    });
    setTripName('');
    setShowSaveForm(false);
    setLoading(false);
    loadTrips();
  };

  const deleteTrip = async (id) => {
    if (!confirm('Delete this trip plan?')) return;
    await base44.entities.ShootSession.delete(id);
    loadTrips();
  };

  const updateStatus = async (trip, newStatus) => {
    await base44.entities.ShootSession.update(trip.id, { status: newStatus });
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, status: newStatus } : t));
  };

  const saveEditName = async (id) => {
    if (!editingName.trim()) return;
    await base44.entities.ShootSession.update(id, { pre_shoot_intent: editingName });
    setTrips(prev => prev.map(t => t.id === id ? { ...t, pre_shoot_intent: editingName } : t));
    setEditingId(null);
  };

  const loadTrip = (trip) => {
    if (trip.guided_plan && Object.keys(trip.guided_plan).length > 0) {
      onLoadTrip?.(trip.guided_plan);
    }
    setShowBrowser(false);
  };

  const filteredTrips = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  return (
    <>
      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setShowSaveForm(true)}
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-xs gap-1"
        >
          <Save className="w-3 h-3" /> Save Trip Plan
        </Button>
        <Button
          onClick={() => setShowBrowser(true)}
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs gap-1"
        >
          <Folder className="w-3 h-3" /> My Trips
          {trips.length > 0 && (
            <span className="ml-1 bg-slate-700 text-slate-300 text-[10px] rounded-full px-1.5">{trips.length}</span>
          )}
        </Button>
      </div>

      {/* Save Modal */}
      <Dialog open={showSaveForm} onOpenChange={v => !v && setShowSaveForm(false)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-sm">
              <Save className="w-4 h-4 text-red-400" /> Save Trip Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {currentState?.location && (
              <div className="flex items-center gap-2 p-2.5 bg-slate-800/60 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{currentState.location}</span>
                {currentState.date && (
                  <span className="text-slate-500 text-xs ml-auto">{currentState.date}</span>
                )}
              </div>
            )}
            <Input
              placeholder="Trip name (e.g. Milky Way Season, Aurora Hunt)"
              value={tripName}
              onChange={e => setTripName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveTrip()}
              className="bg-slate-800 border-slate-700 text-white text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                onClick={saveTrip}
                disabled={!tripName.trim() || loading}
                className="flex-1 bg-red-600 hover:bg-red-700 h-9 text-sm"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                Save
              </Button>
              <Button onClick={() => setShowSaveForm(false)} variant="outline" className="border-slate-600 text-slate-300 h-9">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Browser Modal */}
      <Dialog open={showBrowser} onOpenChange={v => !v && setShowBrowser(false)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-sm">
              <Folder className="w-4 h-4 text-slate-400" /> My Trip Plans
            </DialogTitle>
          </DialogHeader>

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-slate-800 pb-3">
            {['all', 'planned', 'complete'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                  filter === f ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
            <Button
              onClick={() => { setShowBrowser(false); setShowSaveForm(true); }}
              size="sm"
              className="ml-auto bg-red-600 hover:bg-red-700 h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" /> New
            </Button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 py-1">
            {listLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : filteredTrips.length === 0 ? (
              <div className="text-center py-10">
                <Star className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No trip plans yet</p>
                <p className="text-slate-600 text-xs mt-1">Save your current plan to start a library</p>
              </div>
            ) : (
              filteredTrips.map(trip => (
                <div key={trip.id} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 hover:border-slate-600 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {editingId === trip.id ? (
                        <div className="flex items-center gap-2 mb-1">
                          <Input
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEditName(trip.id); }}
                            className="bg-slate-700 border-slate-600 text-white text-sm h-7 flex-1"
                            autoFocus
                          />
                          <button onClick={() => saveEditName(trip.id)} className="text-emerald-400 hover:text-emerald-300">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium text-sm truncate">{trip.pre_shoot_intent || 'Untitled'}</p>
                          <button
                            onClick={() => { setEditingId(trip.id); setEditingName(trip.pre_shoot_intent || ''); }}
                            className="text-slate-600 hover:text-slate-400 flex-shrink-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        {trip.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{trip.date}</span>}
                        {trip.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trip.location}</span>}
                        {trip.shooter_mode && <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{trip.shooter_mode}</span>}
                      </div>

                      {/* Status row */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[trip.status] || STATUS_COLORS.planned}`}>
                          {trip.status || 'planned'}
                        </span>
                        {trip.status !== 'complete' && (
                          <button
                            onClick={() => updateStatus(trip, 'complete')}
                            className="text-[10px] text-slate-500 hover:text-emerald-400 transition-colors"
                          >
                            Mark complete
                          </button>
                        )}
                        {trip.status === 'complete' && (
                          <button
                            onClick={() => updateStatus(trip, 'planned')}
                            className="text-[10px] text-slate-500 hover:text-blue-400 transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        onClick={() => loadTrip(trip)}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 h-7 text-xs gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Load
                      </Button>
                      <Button
                        onClick={() => deleteTrip(trip.id)}
                        size="sm"
                        variant="ghost"
                        className="text-slate-600 hover:text-red-400 h-7"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}