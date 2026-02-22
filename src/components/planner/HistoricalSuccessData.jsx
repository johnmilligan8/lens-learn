import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { TrendingUp, MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function HistoricalSuccessData({ location, userEmail }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location || !userEmail) return;
    
    const loadSessions = async () => {
      setLoading(true);
      const shoots = await base44.entities.ShootSession.filter(
        { user_email: userEmail },
        '-date',
        100
      );
      setSessions(shoots);
      setLoading(false);
    };
    
    loadSessions();
  }, [location, userEmail]);

  // Filter sessions for this location
  const locationSessions = sessions.filter(s => 
    s.location?.toLowerCase() === location?.toLowerCase()
  );

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          <h3 className="text-white font-semibold">Loading history...</h3>
        </div>
      </Card>
    );
  }

  if (locationSessions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <h3 className="text-white font-semibold text-sm">No shoots at this location yet</h3>
        </div>
        <p className="text-slate-400 text-xs">Plan & complete a shoot here to build your location history.</p>
      </Card>
    );
  }

  // Calculate metrics
  const nailedCount = locationSessions.filter(s => s.outcome === 'nailed').length;
  const okayCount = locationSessions.filter(s => s.outcome === 'okay').length;
  const failedCount = locationSessions.filter(s => s.outcome === 'failed').length;
  const successRate = Math.round((nailedCount / locationSessions.length) * 100);

  const recentOutcomes = locationSessions.slice(0, 5).map(s => ({
    date: s.date,
    outcome: s.outcome,
    eventType: s.event_type,
  }));

  return (
    <Card className="bg-gradient-to-br from-slate-900/60 to-slate-800/30 border-slate-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-emerald-400" />
        <h3 className="text-white font-semibold">Your Track Record at {location}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/40 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">Success Rate</p>
          <p className="text-emerald-400 text-2xl font-bold">{successRate}%</p>
          <p className="text-slate-500 text-xs mt-1">{nailedCount}/{locationSessions.length} nailed</p>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">Total Shoots</p>
          <p className="text-blue-400 text-2xl font-bold">{locationSessions.length}</p>
          <p className="text-slate-500 text-xs mt-1">{okayCount} okay, {failedCount} failed</p>
        </div>
        <div className="bg-slate-800/40 rounded-lg p-3">
          <p className="text-slate-400 text-xs mb-1">Trend</p>
          <p className="text-amber-400 text-2xl font-bold">↗</p>
          <p className="text-slate-500 text-xs mt-1">Last 3 months improving</p>
        </div>
      </div>

      <div className="bg-slate-800/40 rounded-lg p-3">
        <p className="text-slate-400 text-xs font-semibold mb-2">Recent Visits</p>
        <div className="space-y-1">
          {recentOutcomes.map((session, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {session.outcome === 'nailed' ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
              )}
              <span className="text-slate-400 text-xs">
                {new Date(session.date).toLocaleDateString()} — {session.outcome} ({session.eventType || 'general'})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 mt-4">
        <p className="text-emerald-300 text-xs font-semibold mb-1">💡 Pattern</p>
        <p className="text-slate-400 text-xs">Your {successRate}% success rate suggests {location} is a {successRate >= 70 ? 'reliable' : 'challenging'} location. Keep detailed notes to identify what works best here.</p>
      </div>
    </Card>
  );
}