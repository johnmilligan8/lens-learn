import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Save, Folder, Trash2, RotateCcw, Plus, Loader2, X } from 'lucide-react';

export default function ExpeditionManager({ userEmail, currentState, onLoadExpedition, onSaved }) {
  const [expeditions, setExpeditions] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);
  const [expeditionName, setExpeditionName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userEmail && (showBrowser || showSaveForm)) {
      loadExpeditions();
    }
  }, [userEmail, showBrowser, showSaveForm]);

  const loadExpeditions = async () => {
    if (!userEmail) return;
    const sessions = await base44.entities.ShootSession.filter(
      { user_email: userEmail },
      '-created_date',
      50
    );
    setExpeditions(sessions);
  };

  const saveExpedition = async () => {
    if (!expeditionName.trim() || !currentState) return;
    setLoading(true);
    try {
      await base44.entities.ShootSession.create({
        user_email: userEmail,
        date: currentState.date || new Date().toISOString().split('T')[0],
        location: currentState.location || '',
        shooter_mode: currentState.shooterMode || 'photographer',
        event_type: currentState.eventType || 'night_sky',
        pre_shoot_intent: expeditionName,
        field_notes: currentState.notes || '',
        guided_plan: currentState,
        status: 'planned',
      });
      setExpeditionName('');
      setShowSaveForm(false);
      await loadExpeditions();
      onSaved?.();
    } finally {
      setLoading(false);
    }
  };

  const deleteExpedition = async (id) => {
    if (!confirm('Delete this expedition?')) return;
    await base44.entities.ShootSession.delete(id);
    await loadExpeditions();
  };

  const loadExpedition = (expedition) => {
    if (expedition.guided_plan) {
      onLoadExpedition?.(expedition.guided_plan);
      setShowBrowser(false);
    }
  };

  return (
    <>
      {/* Quick Save Button */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowSaveForm(true)}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-xs gap-1"
        >
          <Save className="w-3 h-3" /> Save Expedition
        </Button>
        <Button
          onClick={() => setShowBrowser(true)}
          size="sm"
          variant="outline"
          className="border-purple-500/40 text-purple-300 hover:bg-purple-900/20 text-xs gap-1"
        >
          <Folder className="w-3 h-3" /> Expeditions ({expeditions.length})
        </Button>
      </div>

      {/* Save Form Modal */}
      {showSaveForm && (
        <Card className="bg-slate-900/95 border-slate-700 p-4 fixed inset-4 max-w-md mx-auto my-auto z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Save Expedition</h3>
            <button onClick={() => setShowSaveForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 text-xs uppercase block mb-1">Expedition Name</label>
              <Input
                placeholder="e.g., Milky Way Season, Aurora Hunt"
                value={expeditionName}
                onChange={e => setExpeditionName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={saveExpedition}
                disabled={!expeditionName.trim() || loading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 h-9 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
              <Button
                onClick={() => setShowSaveForm(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 h-9"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Browser Modal */}
      {showBrowser && (
        <Card className="bg-slate-900/95 border-slate-700 p-4 fixed inset-4 max-w-2xl mx-auto my-auto z-50 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-slate-900/95">
            <h3 className="text-white font-semibold text-sm">Saved Expeditions</h3>
            <button onClick={() => setShowBrowser(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {expeditions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No expeditions saved yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expeditions.map(exp => (
                <div
                  key={exp.id}
                  className="bg-slate-800/60 rounded-lg p-3 flex items-start justify-between hover:bg-slate-800 transition-colors"
                >
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadExpedition(exp)}>
                    <p className="text-white font-medium text-sm truncate">{exp.pre_shoot_intent}</p>
                    <p className="text-slate-500 text-xs">
                      {exp.date} · {exp.location || 'No location'} · {exp.shooter_mode}
                    </p>
                    {exp.field_notes && <p className="text-slate-600 text-xs mt-1 line-clamp-1">{exp.field_notes}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <Button
                      onClick={() => loadExpedition(exp)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 h-7 text-xs gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Load
                    </Button>
                    <Button
                      onClick={() => deleteExpedition(exp.id)}
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-red-400 h-7"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </>
  );
}