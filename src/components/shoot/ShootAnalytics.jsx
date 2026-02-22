import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

export default function ShootAnalytics({ userEmail }) {
  const [shoots, setShoots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.ShootSession.filter({ user_email: userEmail, status: 'complete' }, '-created_date', 50);
        setShoots(data);

        // Calculate stats
        const successRate = data.filter(s => s.outcome === 'nailed').length / Math.max(1, data.length);
        const limiters = {};
        data.forEach(s => {
          if (s.limiting_factor) {
            limiters[s.limiting_factor] = (limiters[s.limiting_factor] || 0) + 1;
          }
        });
        const topLimiter = Object.entries(limiters).sort((a, b) => b[1] - a[1])[0];

        setStats({
          total: data.length,
          successRate: Math.round(successRate * 100),
          nailedCount: data.filter(s => s.outcome === 'nailed').length,
          topLimiter: topLimiter?.[0],
          topLimiterCount: topLimiter?.[1],
        });
      } catch (err) {
        console.error('Failed to load shoots:', err);
      }
      setLoading(false);
    };

    if (userEmail) load();
  }, [userEmail]);

  if (loading) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading your analytics...</p>
        </div>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-6 text-center">
        <p className="text-slate-400 text-sm">Log post-shoot results to see your analytics.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-purple-400" /> Your Shooting Profile
      </h3>

      {/* Key stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-widest">Success Rate</p>
          <p className="text-2xl font-black text-white mt-1">{stats.successRate}%</p>
          <p className="text-slate-500 text-xs mt-1">{stats.nailedCount} nailed</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-widest">Total Shoots</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          <p className="text-slate-500 text-xs mt-1">logged</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-xs uppercase tracking-widest">Top Limiter</p>
          <p className="text-white font-semibold text-xs mt-1">{stats.topLimiter}</p>
          <p className="text-slate-500 text-xs mt-1">{stats.topLimiterCount}x</p>
        </div>
      </div>

      {/* Recent shoots */}
      {shoots.length > 0 && (
        <div className="pt-4 border-t border-slate-700">
          <p className="text-slate-300 font-semibold text-sm mb-2">Recent Shoots</p>
          <div className="space-y-2">
            {shoots.slice(0, 5).map((shoot, i) => (
              <div key={i} className="bg-slate-800/40 rounded p-2.5 flex items-center justify-between text-xs">
                <div className="flex-1">
                  <p className="text-white font-semibold">{shoot.location}</p>
                  <p className="text-slate-500">{new Date(shoot.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs font-bold ${
                      shoot.outcome === 'nailed'
                        ? 'bg-emerald-600 text-white'
                        : shoot.outcome === 'okay'
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {shoot.outcome}
                  </Badge>
                  {shoot.limiting_factor && (
                    <span className="text-slate-400 text-[10px] max-w-20 truncate">{shoot.limiting_factor}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-slate-600 text-xs pt-2">Your data is private and used to personalize recommendations.</p>
    </Card>
  );
}