import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap, Save, X } from 'lucide-react';

export default function GearSetup({ userEmail, onGearUpdate, loading }) {
  const [showForm, setShowForm] = useState(false);
  const [gear, setGear] = useState({
    camera_model: '',
    sensor_size: 'full_frame',
    iso_max: 3200,
    primary_lens_focal_length: 14,
    widest_lens_focal_length: 14,
    f_stop_widest: 2.8,
    max_shutter_speed: 25,
    telescope_type: 'none',
    telescope_aperture_mm: null,
    equipment_notes: '',
  });

  const handleSave = async () => {
    await onGearUpdate(gear);
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> Your Gear
            </h3>
            <p className="text-slate-500 text-xs mt-1">Configure camera specs for tailored shot suggestions.</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            variant="outline"
            className="border-yellow-500/40 text-yellow-300 hover:bg-yellow-900/20 text-xs whitespace-nowrap"
          >
            Set Up Gear
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5 mb-5">
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

      <div className="space-y-4">
        {/* Camera */}
        <div>
          <Label className="text-slate-300 text-xs uppercase mb-1 block">Camera Model</Label>
          <Input
            placeholder="e.g., Canon EOS R5, Sony A7IV"
            value={gear.camera_model}
            onChange={e => setGear({ ...gear, camera_model: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white text-sm"
          />
        </div>

        {/* Sensor Size */}
        <div>
          <Label className="text-slate-300 text-xs uppercase mb-1 block">Sensor Size</Label>
          <Select value={gear.sensor_size} onValueChange={val => setGear({ ...gear, sensor_size: val })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_frame">Full Frame</SelectItem>
              <SelectItem value="crop_sensor">Crop Sensor</SelectItem>
              <SelectItem value="smartphone">Smartphone</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Focal Lengths */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Widest Lens (mm)</Label>
            <Input
              type="number"
              value={gear.widest_lens_focal_length}
              onChange={e => setGear({ ...gear, widest_lens_focal_length: parseFloat(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Primary Lens (mm)</Label>
            <Input
              type="number"
              value={gear.primary_lens_focal_length}
              onChange={e => setGear({ ...gear, primary_lens_focal_length: parseFloat(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
        </div>

        {/* Aperture & ISO */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Widest Aperture (f/)</Label>
            <Input
              type="number"
              step="0.1"
              value={gear.f_stop_widest}
              onChange={e => setGear({ ...gear, f_stop_widest: parseFloat(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Max ISO</Label>
            <Input
              type="number"
              value={gear.iso_max}
              onChange={e => setGear({ ...gear, iso_max: parseInt(e.target.value) })}
              className="bg-slate-800 border-slate-700 text-white text-sm"
            />
          </div>
        </div>

        {/* Shutter Speed */}
        <div>
          <Label className="text-slate-300 text-xs uppercase mb-1 block">Max Shutter (seconds)</Label>
          <Input
            type="number"
            step="1"
            value={gear.max_shutter_speed}
            onChange={e => setGear({ ...gear, max_shutter_speed: parseFloat(e.target.value) })}
            className="bg-slate-800 border-slate-700 text-white text-sm"
          />
          <p className="text-slate-500 text-xs mt-1">For untracked wide-angle shots without star trails</p>
        </div>

        {/* Notes */}
        <div>
          <Label className="text-slate-300 text-xs uppercase mb-1 block">Equipment Notes (Optional)</Label>
          <Input
            placeholder="e.g., Vignetting at 14mm, No ND filter"
            value={gear.equipment_notes}
            onChange={e => setGear({ ...gear, equipment_notes: e.target.value })}
            className="bg-slate-800 border-slate-700 text-white text-sm"
          />
        </div>

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