import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bell, Zap, MapPin, Plus, Trash2 } from 'lucide-react';

const KP_DESCRIPTIONS = {
  3: 'Faint glow (Far North only)',
  4: 'Visible from northern regions',
  5: 'Good chances across Canada/Alaska',
  6: 'Strong activity, visible from north-central USA',
  7: 'Very strong, visible from most northern locations',
  8: 'Extreme, visible across USA',
  9: 'Severe, visible everywhere'
};

export default function AuroraAlertSettings({ 
  profile, 
  onSave, 
  onAddLocation 
}) {
  const [alertsEnabled, setAlertsEnabled] = useState(profile?.alert_prefs?.aurora_alerts_enabled ?? true);
  const [kpThreshold, setKpThreshold] = useState(profile?.alert_prefs?.kp_threshold ?? 5);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      alert_prefs: {
        ...profile.alert_prefs,
        aurora_alerts_enabled: alertsEnabled,
        kp_threshold: kpThreshold
      }
    });
    setSaving(false);
  };

  const locations = profile?.alert_locations || [];

  return (
    <Card className="bg-[#1a1a1a] border border-white/8 p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold text-white">Aurora Alerts</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">Get email notifications when aurora activity reaches your threshold in your saved locations.</p>
      </div>

      {/* Enable/Disable Alerts */}
      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <p className="text-sm font-semibold text-white">Enable Aurora Alerts</p>
          <p className="text-xs text-slate-400 mt-0.5">Receive email notifications</p>
        </div>
        <Switch 
          checked={alertsEnabled}
          onCheckedChange={setAlertsEnabled}
        />
      </div>

      {alertsEnabled && (
        <>
          {/* KP Threshold Slider */}
          <div className="space-y-3 p-4 bg-white/5 rounded-lg">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              KP Index Threshold: <span className="text-red-400">{kpThreshold}</span>
            </label>
            <Slider
              value={[kpThreshold]}
              onValueChange={(val) => setKpThreshold(val[0])}
              min={2}
              max={9}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-slate-400 italic">
              {KP_DESCRIPTIONS[kpThreshold] || 'Custom threshold'}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {[2, 3, 4, 5, 6, 7, 8, 9].map(kp => (
                <button
                  key={kp}
                  onClick={() => setKpThreshold(kp)}
                  className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                    kpThreshold === kp
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {kp}
                </button>
              ))}
            </div>
          </div>

          {/* Alert Locations */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              Monitor Locations
            </label>
            {locations.length === 0 ? (
              <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/50 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-400">
                  No locations added. Add your home base or other locations to receive alerts.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{loc.name}</p>
                      <p className="text-xs text-slate-500">{loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alert Frequency Info */}
          <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-600/30 space-y-1">
            <p className="text-xs font-semibold text-blue-200">📬 Alert Frequency</p>
            <p className="text-xs text-blue-100">
              You'll receive one alert per location per 6 hours if KP remains above {kpThreshold}. Prevents alert fatigue while keeping you informed.
            </p>
          </div>
        </>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
      >
        {saving ? 'Saving...' : 'Save Alert Settings'}
      </Button>
    </Card>
  );
}