import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap, Save, X, Plus, Trash2, Star } from 'lucide-react';

export default function GearSetup({ userEmail, onGearUpdate, loading, initialGear }) {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('cameras');
  const [gear, setGear] = useState(initialGear || {
    cameras: [],
    lenses: [],
    telescope_type: 'none',
    telescope_aperture_mm: null,
    equipment_notes: '',
  });

  const [newCamera, setNewCamera] = useState({
    name: '',
    sensor_size: 'full_frame',
    iso_max: 3200,
    max_shutter_speed: 25,
  });

  const [newLens, setNewLens] = useState({
    name: '',
    focal_length: 14,
    f_stop_widest: 2.8,
  });

  const handleAddCamera = () => {
    if (!newCamera.name.trim()) return;
    const camera = {
      id: `cam-${Date.now()}`,
      ...newCamera,
      is_primary: gear.cameras.length === 0,
    };
    setGear({
      ...gear,
      cameras: [...gear.cameras, camera],
    });
    setNewCamera({ name: '', sensor_size: 'full_frame', iso_max: 3200, max_shutter_speed: 25 });
  };

  const handleAddLens = () => {
    if (!newLens.name.trim()) return;
    const lens = {
      id: `lens-${Date.now()}`,
      ...newLens,
      is_primary: gear.lenses.length === 0,
    };
    setGear({
      ...gear,
      lenses: [...gear.lenses, lens],
    });
    setNewLens({ name: '', focal_length: 14, f_stop_widest: 2.8 });
  };

  const handleDeleteCamera = (id) => {
    const updated = gear.cameras.filter(c => c.id !== id);
    if (updated.length > 0 && !updated.some(c => c.is_primary)) {
      updated[0].is_primary = true;
    }
    setGear({ ...gear, cameras: updated });
  };

  const handleDeleteLens = (id) => {
    const updated = gear.lenses.filter(l => l.id !== id);
    if (updated.length > 0 && !updated.some(l => l.is_primary)) {
      updated[0].is_primary = true;
    }
    setGear({ ...gear, lenses: updated });
  };

  const handleSetPrimary = (type, id) => {
    if (type === 'camera') {
      setGear({
        ...gear,
        cameras: gear.cameras.map(c => ({ ...c, is_primary: c.id === id })),
      });
    } else {
      setGear({
        ...gear,
        lenses: gear.lenses.map(l => ({ ...l, is_primary: l.id === id })),
      });
    }
  };

  const handleSave = async () => {
    await onGearUpdate(gear);
    setShowForm(false);
  };

  if (!showForm) {
    const cameraCount = gear.cameras?.length || 0;
    const lensCount = gear.lenses?.length || 0;
    return (
      <Card className="bg-[#1a1a1a] border-white/8 p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> Your Gear
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              {cameraCount > 0 && lensCount > 0 ? `${cameraCount} camera${cameraCount > 1 ? 's' : ''} · ${lensCount} lens${lensCount > 1 ? 'es' : ''}` : 'Configure camera specs for tailored shot suggestions.'}
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            variant="outline"
            className="border-yellow-500/40 text-yellow-300 hover:bg-yellow-900/20 text-xs whitespace-nowrap"
          >
            Manage Gear
          </Button>
        </div>
      </Card>
    );
  }

  return (
     <Card className="bg-[#1a1a1a] border-white/8 p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">Astrophotography Gear</h3>
        <Button
          onClick={() => setShowForm(false)}
          size="icon"
          variant="ghost"
          className="text-slate-400 hover:text-white w-6 h-6"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('cameras')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'cameras'
              ? 'border-yellow-500 text-yellow-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Cameras ({gear.cameras?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('lenses')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'lenses'
              ? 'border-yellow-500 text-yellow-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Lenses ({gear.lenses?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'other'
              ? 'border-yellow-500 text-yellow-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Other
        </button>
      </div>

      <div className="space-y-4">
        {/* CAMERAS TAB */}
        {activeTab === 'cameras' && (
          <>
            {/* List existing cameras */}
            {gear.cameras && gear.cameras.length > 0 && (
              <div className="space-y-2 mb-4">
                {gear.cameras.map(camera => (
                  <div key={camera.id} className="bg-slate-800/40 rounded-lg p-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium text-sm truncate">{camera.name}</p>
                        {camera.is_primary && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {camera.sensor_size.replace('_', ' ')} · ISO {camera.iso_max} · {camera.max_shutter_speed}s shutter
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!camera.is_primary && (
                        <button
                          onClick={() => handleSetPrimary('camera', camera.id)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-yellow-400 transition-colors"
                          title="Set as primary"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCamera(camera.id)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new camera form */}
            <div className="bg-slate-800/30 rounded-lg p-3 space-y-2 border border-slate-700">
              <p className="text-slate-300 text-xs font-semibold">Add Camera</p>
              <Input
                placeholder="e.g., Canon EOS R5, Sony A7IV"
                value={newCamera.name}
                onChange={e => setNewCamera({ ...newCamera, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-sm h-8"
              />
              <Select value={newCamera.sensor_size} onValueChange={val => setNewCamera({ ...newCamera, sensor_size: val })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_frame">Full Frame</SelectItem>
                  <SelectItem value="crop_sensor">Crop Sensor</SelectItem>
                  <SelectItem value="smartphone">Smartphone</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    placeholder="ISO Max"
                    value={newCamera.iso_max}
                    onChange={e => setNewCamera({ ...newCamera, iso_max: parseInt(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Max Shutter (s)"
                    step="1"
                    value={newCamera.max_shutter_speed}
                    onChange={e => setNewCamera({ ...newCamera, max_shutter_speed: parseFloat(e.target.value) })}
                    className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddCamera}
                disabled={!newCamera.name.trim()}
                size="sm"
                className="w-full bg-yellow-600 hover:bg-yellow-700 h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Camera
              </Button>
            </div>
          </>
        )}

        {/* LENSES TAB */}
        {activeTab === 'lenses' && (
          <>
            {/* List existing lenses */}
            {gear.lenses && gear.lenses.length > 0 && (
              <div className="space-y-2 mb-4">
                {gear.lenses.map(lens => (
                  <div key={lens.id} className="bg-slate-800/40 rounded-lg p-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium text-sm truncate">{lens.name}</p>
                        {lens.is_primary && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                      </div>
                      <p className="text-slate-500 text-xs">
                        {lens.focal_length}mm · f/{lens.f_stop_widest}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!lens.is_primary && (
                        <button
                          onClick={() => handleSetPrimary('lens', lens.id)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-yellow-400 transition-colors"
                          title="Set as primary"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteLens(lens.id)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new lens form */}
            <div className="bg-slate-800/30 rounded-lg p-3 space-y-2 border border-slate-700">
              <p className="text-slate-300 text-xs font-semibold">Add Lens</p>
              <Input
                placeholder="e.g., Rokinon 14mm, Sony 24-70mm"
                value={newLens.name}
                onChange={e => setNewLens({ ...newLens, name: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-sm h-8"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Focal Length (mm)"
                  value={newLens.focal_length}
                  onChange={e => setNewLens({ ...newLens, focal_length: parseFloat(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                />
                <Input
                  type="number"
                  placeholder="Widest f/"
                  step="0.1"
                  value={newLens.f_stop_widest}
                  onChange={e => setNewLens({ ...newLens, f_stop_widest: parseFloat(e.target.value) })}
                  className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                />
              </div>
              <Button
                onClick={handleAddLens}
                disabled={!newLens.name.trim()}
                size="sm"
                className="w-full bg-yellow-600 hover:bg-yellow-700 h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Lens
              </Button>
            </div>
          </>
        )}

        {/* OTHER TAB */}
        {activeTab === 'other' && (
          <>
            <div>
              <Label className="text-slate-300 text-xs uppercase mb-1 block">Telescope</Label>
              <Select value={gear.telescope_type || 'none'} onValueChange={val => setGear({ ...gear, telescope_type: val })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="refractor">Refractor</SelectItem>
                  <SelectItem value="reflector">Reflector</SelectItem>
                  <SelectItem value="catadioptric">Catadioptric</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {gear.telescope_type !== 'none' && (
              <div>
                <Label className="text-slate-300 text-xs uppercase mb-1 block">Aperture (mm)</Label>
                <Input
                  type="number"
                  value={gear.telescope_aperture_mm || ''}
                  onChange={e => setGear({ ...gear, telescope_aperture_mm: parseFloat(e.target.value) || null })}
                  className="bg-slate-800 border-slate-700 text-white text-sm"
                />
              </div>
            )}

            <div>
              <Label className="text-slate-300 text-xs uppercase mb-1 block">Notes</Label>
              <Input
                placeholder="e.g., Vignetting at 14mm, No ND filter"
                value={gear.equipment_notes || ''}
                onChange={e => setGear({ ...gear, equipment_notes: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-sm"
              />
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-yellow-600 hover:bg-yellow-700 h-10 font-semibold text-sm"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Gear</> }
        </Button>
      </div>
    </Card>
  );
}