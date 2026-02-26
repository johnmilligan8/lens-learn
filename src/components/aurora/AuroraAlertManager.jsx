import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import LeafletLocationPicker from '@/components/ui/LeafletLocationPicker';
import { Plus, Trash2, Bell, MapPin } from 'lucide-react';

export default function AuroraAlertManager({ alertLocations = [], alertsEnabled = true, onUpdate }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleConfirm = ({ lat, lon, name }) => {
    onUpdate({
      locations: [
        ...alertLocations,
        { id: `alert-${Date.now()}`, name, lat, lon },
      ],
    });
    setIsAdding(false);
  };

  const handleRemove = (id) => {
    onUpdate({ locations: alertLocations.filter(l => l.id !== id) });
  };

  const handleToggleAlerts = () => {
    onUpdate({ alertsEnabled: !alertsEnabled });
  };

  return (
    <div className="rounded-xl border border-white/8 p-6" style={{ background: '#1a1a1a' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-300" />
          <h3 className="text-white font-semibold">Aurora Alerts</h3>
        </div>
        <button
          onClick={handleToggleAlerts}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            alertsEnabled
              ? 'bg-indigo-700/30 border-indigo-600/50 text-indigo-300 hover:bg-indigo-700/50'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          {alertsEnabled ? '✓ Enabled' : '○ Disabled'}
        </button>
      </div>

      <p className="text-slate-400 text-sm mb-4">
        Get email alerts when aurora activity is forecast at your saved locations.
      </p>

      {/* Location list */}
      {alertLocations.length > 0 && (
        <div className="space-y-2 mb-4">
          {alertLocations.map(loc => (
            <div
              key={loc.id}
              className="flex items-center justify-between rounded-lg px-3 py-2.5"
              style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-100 font-medium text-sm truncate">{loc.name}</p>
                  <p className="text-slate-500 text-xs font-mono">{loc.lat.toFixed(3)}°, {loc.lon.toFixed(3)}°</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(loc.id)}
                className="ml-2 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {isAdding ? (
        <div className="space-y-3">
          <LeafletLocationPicker
            inline
            onConfirm={handleConfirm}
            onCancel={() => setIsAdding(false)}
            confirmLabel="Save Alert Location"
          />
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
          style={{ border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Plus className="w-4 h-4" /> Add Alert Location
        </button>
      )}
    </div>
  );
}