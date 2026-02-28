import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Search, Filter, Lock, Telescope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SessionCard from '../components/journal/SessionCard';
import JournalInsights from '../components/journal/JournalInsights';
import ExportJournal from '../components/journal/ExportJournal';
import NewSessionForm from '../components/journal/NewSessionForm';

const FREE_SESSION_LIMIT = 3;

const EVENT_TYPES = ['All', 'Milky Way', 'Aurora', 'Meteor Shower', 'Eclipse', 'Planets', 'Star Trails', 'Other'];

export default function Journal() {
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('All');
  const navigate = useNavigate();

  const load = async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [subs, profiles, allSessions] = await Promise.all([
      me.role === 'admin'
        ? Promise.resolve([{ status: 'active' }])
        : base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1),
      base44.entities.UserProfile.filter({ user_email: me.email }, '-created_date', 1),
      base44.entities.ShootSession.filter({ user_email: me.email }, '-date', 100),
    ]);
    setIsSubscribed(subs.length > 0);
    setUserProfile(profiles[0] || null);
    setSessions(allSessions);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = sessions.filter(s => {
    const matchSearch =
      !search ||
      (s.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.event_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.field_notes || '').toLowerCase().includes(search.toLowerCase());
    const matchEvent = filterEvent === 'All' || (s.event_type || '').toLowerCase().includes(filterEvent.toLowerCase());
    return matchSearch && matchEvent;
  });

  // Free users see only first 3 sessions
  const visibleSessions = isSubscribed ? filtered : filtered.slice(0, FREE_SESSION_LIMIT);
  const lockedCount = isSubscribed ? 0 : Math.max(0, filtered.length - FREE_SESSION_LIMIT);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen cosmic-bg">
      <Telescope className="w-10 h-10 text-red-400 star-pulse" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-red-400" />
          <h1 className="text-2xl font-black text-white tracking-tight">Expedition Journal</h1>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(f => !f)}
          className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Log Session
        </Button>
      </div>
      <p className="text-slate-500 text-xs mb-6 ml-9">Reflect on your expeditions – learn and improve.</p>

      {/* New session form */}
      {showForm && (
        <div className="mb-5">
          <NewSessionForm
            userEmail={user?.email}
            shooterMode={userProfile?.shooter_mode}
            onSaved={() => { setShowForm(false); load(); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Insights (paid only, 2+ sessions) */}
      {isSubscribed && sessions.length >= 2 && (
        <JournalInsights sessions={sessions} />
      )}

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by location, event, notes..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-700"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
          <select
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-white text-xs focus:outline-none focus:border-red-700 appearance-none"
          >
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Timeline */}
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🌙</p>
          <p className="text-white font-semibold mb-1">No expeditions logged yet</p>
          <p className="text-slate-500 text-sm">Tap "Log Session" to record your first night out.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleSessions.map(s => (
            <SessionCard key={s.id} session={s} isSubscribed={isSubscribed} />
          ))}

          {/* Locked sessions upsell */}
          {lockedCount > 0 && (
            <div className="rounded-2xl border border-yellow-700/30 bg-yellow-900/10 p-5 text-center">
              <Lock className="w-7 h-7 text-yellow-500 mx-auto mb-2" />
              <p className="text-white font-semibold text-sm mb-1">
                {lockedCount} more session{lockedCount > 1 ? 's' : ''} in your history
              </p>
              <p className="text-slate-400 text-xs mb-4 leading-relaxed">
                Upgrade to Plus or Pro to unlock your full journal, detailed notes, outcome tagging, insights, and export.
              </p>
              <Button
                size="sm"
                onClick={() => navigate(createPageUrl('PaymentGate'))}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Unlock Full Journal — $7.99/mo
              </Button>
            </div>
          )}

          {/* Free upsell if no locked items but not subscribed */}
          {!isSubscribed && lockedCount === 0 && sessions.length >= FREE_SESSION_LIMIT && (
            <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 text-center">
              <p className="text-slate-400 text-xs mb-3">
                Unlock full journal + insights for patterns, unlimited history, and session export.
              </p>
              <Button
                size="sm"
                onClick={() => navigate(createPageUrl('PaymentGate'))}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Unlock Full Journal + Insights — $7.99/mo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}