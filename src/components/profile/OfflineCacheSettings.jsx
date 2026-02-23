import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WifiOff, HardDrive, RefreshCw, Trash2, CheckCircle2, Clock, CloudOff } from 'lucide-react';
import { cacheList, cacheClearAll, cacheTotalBytes, cacheDelete } from '@/functions/offlineCache';

const FRIENDLY_NAMES = {
  aurora_noaa: 'Aurora / NOAA Forecast',
  weather: 'Cloud Cover Forecast',
  ephemeris: 'Ephemeris (Moon/Sun data)',
};

function friendlyName(name) {
  for (const [k, v] of Object.entries(FRIENDLY_NAMES)) {
    if (name.startsWith(k)) return v;
  }
  return name;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function OfflineCacheSettings() {
  const [entries, setEntries] = useState([]);
  const [totalBytes, setTotalBytes] = useState(0);
  const [cleared, setCleared] = useState(false);

  const refresh = useCallback(() => {
     setEntries(cacheList());
     setTotalBytes(cacheTotalBytes());
     setCleared(false);
   }, []);

   useEffect(() => { refresh(); }, [refresh]);

  const handleClearAll = () => {
    cacheClearAll();
    setCleared(true);
    refresh();
  };

  const handleDeleteOne = (entryKey) => {
    // entryKey is the full localStorage key; use raw localStorage
    localStorage.removeItem(entryKey);
    refresh();
  };

  // Group by category
  const grouped = {};
  if (Array.isArray(entries)) {
    entries.forEach(e => {
      const cat = friendlyName(e.name);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(e);
    });
  }

  return (
    <Card className="bg-[#1a1a1a] border-white/8 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <WifiOff className="w-5 h-5 text-blue-400" /> Offline Data Cache
        </h3>
        <Button variant="outline" size="sm" className="border-slate-700 text-slate-400 gap-1" onClick={refresh}>
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>

      <p className="text-slate-400 text-sm mb-4">
        Essential planning data is cached locally so you can access moon phases, sun/moon rise times, and aurora forecasts in the field — even without a signal.
      </p>

      {/* Storage summary */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-xl bg-white/5 border border-white/8">
        <HardDrive className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{entries.length} cached item{entries.length !== 1 ? 's' : ''}</p>
          <p className="text-slate-400 text-xs">{formatBytes(totalBytes)} stored locally</p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-red-800 text-red-400 hover:bg-red-900/30 gap-1 flex-shrink-0"
            onClick={handleClearAll}
          >
            <Trash2 className="w-3 h-3" /> Clear All
          </Button>
        )}
      </div>

      {cleared && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm mb-4">
          <CheckCircle2 className="w-4 h-4" /> Cache cleared successfully.
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <CloudOff className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No cached data yet.</p>
          <p className="text-xs mt-1">Use the planner tools and aurora forecast — data will cache automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{cat}</p>
              <div className="space-y-2">
                {items.map(e => (
                  <div key={e.key} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/8">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{e.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{timeAgo(e.ts)}</span>
                        <span className="text-xs text-slate-600">· {formatBytes(e.bytes)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteOne(e.key)}
                      className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Remove from cache"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600 mt-4">
        Cache is stored in your browser's local storage. It is device-specific and persists across sessions until cleared.
      </p>
    </Card>
  );
}