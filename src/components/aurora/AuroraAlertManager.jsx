import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, Trash2, MapPin, Bell } from 'lucide-react';

export default function AuroraAlertManager({ alertLocations = [], alertsEnabled = true, onUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState('');
  const [newLon, setNewLon] = useState('');
  const [error, setError] = useState('');

  const handleAdd = () => {
    setError('');
    if (!newName.trim() || !newLat || !newLon) {
      setError('All fields required');
      return;
    }
    const lat = parseFloat(newLat);
    const lon = parseFloat(newLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Invalid coordinates');
      return;
    }
    const newLoc = {
      id: `alert-${Date.now()}`,
      name: newName.trim(),
      lat,
      lon,
    };
    onUpdate({ locations: [...alertLocations, newLoc] });
    setNewName('');
    setNewLat('');
    setNewLon('');
    setIsAdding(false);
  };

  const handleRemove = (id) => {
    onUpdate({ locations: alertLocations.filter(l => l.id !== id) });
  };

  const handleToggleAlerts = () => {
    onUpdate({ alertsEnabled: !alertsEnabled });
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-400" />
          <h3 className="text-white font-semibold">Aurora Alerts</h3>
        </div>
        <Button
          size="sm"
          variant={alertsEnabled ? 'default' : 'outline'}
          className={alertsEnabled ? 'bg-red-600 hover:bg-red-700' : 'border-slate-700'}
          onClick={handleToggleAlerts}
        >
          {alertsEnabled ? '✓ Enabled' : '✗ Disabled'}
        </Button>
      </div>

      <p className="text-slate-400 text-sm mb-4">
        Get email alerts when aurora activity reaches 'Good' or 'Possible' at your saved locations.
      </p>

      {/* Alert Locations List */}
      {alertLocations.length > 0 && (
        <div className="space-y-2 mb-5">
          {alertLocations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between bg-slate-800/60 rounded-lg p-3">
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{loc.name}</p>
                <p className="text-slate-500 text-xs font-mono">{loc.lat.toFixed(2)}°, {loc.lon.toFixed(2)}°</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => handleRemove(loc.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Location Form */}
      {isAdding ? (
        <div className="space-y-3 p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <div>
            <label className="text-slate-300 text-xs font-medium block mb-1">Location Name</label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g., Dark Sky Park"
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1">Latitude</label>
              <Input
                type="number"
                value={newLat}
                onChange={e => setNewLat(e.target.value)}
                placeholder="e.g., 40.5"
                step="0.0001"
                min="-90"
                max="90"
                className="bg-slate-800 border-slate-700 text-white text-sm"
              />
            </div>
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1">Longitude</label>
              <Input
                type="number"
                value={newLon}
                onChange={e => setNewLon(e.target.value)}
                placeholder="e.g., -111.5"
                step="0.0001"
                min="-180"
                max="180"
                className="bg-slate-800 border-slate-700 text-white text-sm"
              />
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={handleAdd}
            >
              Add Location
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-slate-700"
              onClick={() => {
                setIsAdding(false);
                setError('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-slate-700 text-slate-400 hover:bg-slate-800/40"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Alert Location
        </Button>
      )}
    </Card>
  );
}