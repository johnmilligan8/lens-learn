import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

const MODES = [
  {
    id: 'photographer',
    emoji: '📷',
    title: 'DSLR / Mirrorless Photographer',
    description: 'Deep guidance on exposure, stacking, composition, and advanced field techniques.',
    color: 'purple'
  },
  {
    id: 'smartphone',
    emoji: '📱',
    title: 'Smartphone Night Mode Shooter',
    description: 'Night Mode tips, stability tricks, and realistic expectations for phone cameras.',
    color: 'blue'
  },
  {
    id: 'experience',
    emoji: '👁️',
    title: 'No Camera Sky Experience',
    description: 'Pure visibility forecasts — what to expect, where to look, and when to go.',
    color: 'indigo'
  }
];

export default function ModeSelectorModal({ open, onOpenChange, currentMode, onSave, saving }) {
  const [selectedMode, setSelectedMode] = useState(currentMode || 'photographer');

  const handleSave = async () => {
    await onSave(selectedMode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-white/8 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Tailor Your Experience</DialogTitle>
          <p className="text-slate-400 text-sm mt-2">Choose how you explore the night sky.</p>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          {MODES.map(mode => (
            <Card
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`cursor-pointer border-2 p-5 transition-all ${
                selectedMode === mode.id
                  ? mode.color === 'purple'
                    ? 'bg-purple-900/30 border-purple-600 shadow-lg shadow-purple-600/20'
                    : mode.color === 'blue'
                    ? 'bg-blue-900/30 border-blue-600 shadow-lg shadow-blue-600/20'
                    : 'bg-indigo-900/30 border-indigo-600 shadow-lg shadow-indigo-600/20'
                  : 'bg-[#0a0a0a] border-white/8 hover:border-white/15'
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl leading-none">{mode.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-bold text-lg">{mode.title}</h3>
                    {selectedMode === mode.id && (
                      <div className="bg-red-600 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm">{mode.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-400"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Mode'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}