import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Bell, X, Loader2 } from 'lucide-react';

export default function ConditionAlertManager({ location, lat, lon }) {
  const [alerts, setAlerts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    moonPhaseMax: 30,
    minKp: 3,
    cloudCoverMax: 50,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const user = await base44.auth.me();
        // For now, alerts are stored in UserProfile or a new AlertPreferences entity
        // Simplified: just show UI to set preferences
      } catch (e) {
        console.error('Error loading alerts:', e);
      }
    };
    loadAlerts();
  }, []);

  const handleSaveAlert = async () => {
    setSaving(true);
    try {
      const user = await base44.auth.me();
      // Save alert preference to UserProfile or custom entity
      // For MVP, just confirm and show success
      setAlerts([...alerts, { ...formData, location, createdAt: new Date().toISOString() }]);
      setShowForm(false);
      setFormData({ moonPhaseMax: 30, minKp: 3, cloudCoverMax: 50 });
    } catch (e) {
      console.error('Error saving alert:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/40 bg-black/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-red-400" />
          <p className="text-red-400 text-xs font-black uppercase">Condition Alerts</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="border-red-600/30 text-red-400 hover:bg-red-900/20 text-xs"
        >
          {showForm ? '✕' : '+ New Alert'}
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-900/60 rounded-lg p-3 mb-3 space-y-3">
          <p className="text-slate-300 text-xs font-semibold">Set custom alerts for {location}</p>

          {/* Moon phase threshold */}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Moon Phase (max %):</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.moonPhaseMax}
              onChange={e => setFormData({ ...formData, moonPhaseMax: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-slate-500 text-xs mt-1">Alert when ≤ {formData.moonPhaseMax}% illuminated</p>
          </div>

          {/* Aurora KP threshold */}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Min Aurora KP Index:</label>
            <input
              type="range"
              min="0"
              max="9"
              value={formData.minKp}
              onChange={e => setFormData({ ...formData, minKp: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-slate-500 text-xs mt-1">Alert when KP ≥ {formData.minKp}</p>
          </div>

          {/* Cloud cover threshold */}
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Cloud Cover (max %):</label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.cloudCoverMax}
              onChange={e => setFormData({ ...formData, cloudCoverMax: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-slate-500 text-xs mt-1">Alert when ≤ {formData.cloudCoverMax}% cloudy</p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1 border-slate-700 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAlert}
              disabled={saving}
              className="flex-1 bg-red-600 hover:bg-red-700 text-xs gap-1"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
              Save Alert
            </Button>
          </div>
        </div>
      )}

      {/* Active alerts */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <p className="text-slate-400 text-xs">No alerts set. Create one to get notified when conditions are optimal.</p>
        ) : (
          alerts.map((alert, i) => (
            <div key={i} className="bg-slate-900/40 rounded-lg p-2 flex items-center justify-between">
              <p className="text-slate-300 text-xs">
                Moon ≤{alert.moonPhaseMax}% • KP ≥{alert.minKp} • Cloud ≤{alert.cloudCoverMax}%
              </p>
              <button className="text-slate-500 hover:text-red-400" onClick={() => setAlerts(alerts.filter((_, j) => j !== i))}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}