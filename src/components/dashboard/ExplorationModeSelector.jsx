import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Smartphone, Eye } from 'lucide-react';

const MODES = [
  {
    id: 'photographer',
    title: 'DSLR / Mirrorless Photographer',
    icon: Camera,
    description: 'Deep guidance on exposure, stacking, composition, and advanced field techniques.',
    color: 'purple'
  },
  {
    id: 'smartphone',
    title: 'Smartphone Night Mode Shooter',
    icon: Smartphone,
    description: 'Night Mode tips, stability tricks, and realistic expectations for phone cameras.',
    color: 'blue'
  },
  {
    id: 'experience',
    title: 'No Camera Sky Experience',
    icon: Eye,
    description: 'Pure visibility forecasts — what to expect, where to look, and when to go.',
    color: 'indigo'
  }
];

export default function ExplorationModeSelector({ isOpen, onClose, currentMode, onSave, loading }) {
  const [selectedMode, setSelectedMode] = useState(currentMode);

  const handleSave = async () => {
    await onSave(selectedMode);
    onClose();
  };

  const getModeColor = (mode) => {
    const modeObj = MODES.find(m => m.id === mode);
    if (!modeObj) return 'purple';
    return modeObj.color === 'purple' ? 'border-purple-600/50 bg-purple-900/20' :
           modeObj.color === 'blue' ? 'border-blue-600/50 bg-blue-900/20' :
           'border-indigo-600/50 bg-indigo-900/20';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border border-white/8 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Exploration Mode</DialogTitle>
          <p className="text-slate-400 text-sm mt-2">Tailor your experience — choose how you explore the night sky.</p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? getModeColor(mode.id) + ' border-opacity-100'
                    : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <Icon className={`w-6 h-6 flex-shrink-0 ${
                    isSelected ? (mode.color === 'purple' ? 'text-purple-400' : mode.color === 'blue' ? 'text-blue-400' : 'text-indigo-400') : 'text-slate-400'
                  }`} />
                  {isSelected && (
                    <div className="ml-auto flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className={`font-bold text-sm mb-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {mode.title}
                </p>
                <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-900"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            disabled={loading || selectedMode === currentMode}
          >
            {loading ? 'Saving...' : 'Save Mode'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}