import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import {
  ChevronDown, ChevronUp, Plus, Save, Loader2, Trash2,
  CheckCircle2, Circle, Search, AlertCircle, Package, FileText,
  Upload, FileCheck, Download, X, Lock, Sparkles, Users, ShieldCheck
} from 'lucide-react';

const GEAR_PRESETS = {
  photographer: [
    {
      name: 'Camera Body',
      items: [
        { name: 'Mirrorless/DSLR body', id: 'cb1' },
        { name: 'Extra battery grip', id: 'cb2' }
      ]
    },
    {
      name: 'Lenses',
      items: [
        { name: 'Wide-angle fast (14-24mm f/1.4-2.8)', id: 'l1' },
        { name: 'Secondary lens (35-50mm)', id: 'l2' },
        { name: 'Lens filters (CPL, ND)', id: 'l3' }
      ]
    },
    {
      name: 'Tripod & Stability',
      items: [
        { name: 'Sturdy tripod', id: 'ts1' },
        { name: 'Ball/fluid head', id: 'ts2' },
        { name: 'L-bracket for vertical', id: 'ts3' }
      ]
    },
    {
      name: 'Power & Storage',
      items: [
        { name: 'Extra batteries (3-5+)', id: 'p1' },
        { name: 'Battery charger (wall + car)', id: 'p2' },
        { name: 'Power bank for devices', id: 'p3' },
        { name: 'High-speed memory cards (128GB+)', id: 'p4' },
        { name: 'Card reader/backup drive', id: 'p5' }
      ]
    },
    {
      name: 'Cleaning & Maintenance',
      items: [
        { name: 'Lens blower', id: 'cm1' },
        { name: 'Microfiber cloths', id: 'cm2' },
        { name: 'Lens cleaning pen/solution', id: 'cm3' },
        { name: 'Rocket blower', id: 'cm4' }
      ]
    },
    {
      name: 'Triggering & Timing',
      items: [
        { name: 'Remote trigger (wired/wireless)', id: 'tt1' },
        { name: 'Intervalometer', id: 'tt2' },
        { name: 'Cable release', id: 'tt3' }
      ]
    },
    {
      name: 'Lighting',
      items: [
        { name: 'Red/white headlamp', id: 'light1' },
        { name: 'Flashlight (backup)', id: 'light2' },
        { name: 'Low-level LED light', id: 'light3' }
      ]
    },
    {
      name: 'Advanced (Optional)',
      items: [
        { name: 'Camera strobes/flash', id: 'adv1' },
        { name: 'Light modifiers/diffusers', id: 'adv2' },
        { name: 'Dew heater & controller', id: 'adv3' },
        { name: 'Star tracker mount', id: 'adv4' }
      ]
    },
    {
      name: 'Bag & Field Gear',
      items: [
        { name: 'Weatherproof backpack/sling', id: 'bag1' },
        { name: 'Protective lens cases', id: 'bag2' },
        { name: 'Ground cloth/tarp', id: 'bag3' }
      ]
    },
    {
      name: 'Comfort & Safety',
      items: [
        { name: 'Warm layers (jacket, gloves)', id: 'safe1' },
        { name: 'Hat/beanie', id: 'safe2' },
        { name: 'Snacks & water', id: 'safe3' },
        { name: 'First aid kit', id: 'safe4' },
        { name: 'Compass/star chart', id: 'safe5' }
      ]
    }
  ],
  smartphone: [
    {
      name: 'Phone & Mount',
      items: [
        { name: 'Smartphone (charged)', id: 'sp1' },
        { name: 'Phone tripod/clamp', id: 'sp2' }
      ]
    },
    {
      name: 'Power',
      items: [
        { name: 'Power bank (20,000+ mAh)', id: 'spp1' },
        { name: 'Charging cable', id: 'spp2' }
      ]
    },
    {
      name: 'Lighting',
      items: [
        { name: 'Red/white headlamp', id: 'spl1' },
        { name: 'Flashlight (backup)', id: 'spl2' }
      ]
    },
    {
      name: 'Field Gear',
      items: [
        { name: 'Backpack', id: 'spf1' },
        { name: 'Warm layers', id: 'spf2' },
        { name: 'Snacks & water', id: 'spf3' }
      ]
    }
  ],
  experience: [
    {
      name: 'Visual Aids',
      items: [
        { name: 'Red/white headlamp', id: 'ex1' },
        { name: 'Star chart or app', id: 'ex2' }
      ]
    },
    {
      name: 'Comfort',
      items: [
        { name: 'Warm layers & hat', id: 'exc1' },
        { name: 'Blanket/sleeping bag', id: 'exc2' },
        { name: 'Snacks & hot drink', id: 'exc3' },
        { name: 'Backpack', id: 'exc4' }
      ]
    },
    {
      name: 'Optional Gear',
      items: [
        { name: 'Smartphone for photos/apps', id: 'exo1' },
        { name: 'Binoculars', id: 'exo2' }
      ]
    }
  ]
};

const MODE_LABELS = {
  photographer: { emoji: '📷', label: 'DSLR / Mirrorless', color: 'text-red-400', badge: 'bg-red-900/30 border-red-600/30' },
  smartphone: { emoji: '📱', label: 'Smartphone', color: 'text-blue-400', badge: 'bg-blue-900/30 border-blue-600/30' },
  experience: { emoji: '👁️', label: 'Sky Experience', color: 'text-emerald-400', badge: 'bg-emerald-900/30 border-emerald-600/30' },
};

export default function GearChecklist({ userEmail, shooterMode, onKitLoaded, isPaid }) {
  const [kits, setKits] = useState([]);
  const [activeKit, setActiveKit] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newKitName, setNewKitName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState(null);
  const [newItemText, setNewItemText] = useState('');
  const [showGeneralNotes, setShowGeneralNotes] = useState(false);
  const [showModelRelease, setShowModelRelease] = useState(false);
  const prevModeRef = useRef(shooterMode);

  // When shooterMode changes, show a prompt to switch kits
  const [modeSwitchNotice, setModeSwitchNotice] = useState(false);
  useEffect(() => {
    if (prevModeRef.current !== shooterMode && activeKit && activeKit.shooter_mode !== shooterMode) {
      setModeSwitchNotice(true);
    }
    prevModeRef.current = shooterMode;
  }, [shooterMode]);

  useEffect(() => {
    loadKits();
  }, [userEmail]);

  const loadKits = async () => {
    if (!userEmail) return;
    const allKits = await base44.entities.GearKit.filter({ user_email: userEmail }, '-created_date', 50);
    setKits(allKits);
    const defaultKit = allKits.find(k => k.is_default);
    if (defaultKit) {
      setActiveKit(defaultKit);
      onKitLoaded?.(defaultKit);
    } else if (allKits.length > 0) {
      setActiveKit(allKits[0]);
      onKitLoaded?.(allKits[0]);
    }
  };

  const createNewKit = async () => {
    if (!newKitName.trim()) return;
    setLoading(true);
    const presetCategories = GEAR_PRESETS[shooterMode] || GEAR_PRESETS.photographer;
    const newKit = await base44.entities.GearKit.create({
      user_email: userEmail,
      kit_name: newKitName,
      shooter_mode: shooterMode,
      categories: presetCategories.map(cat => ({
        name: cat.name,
        items: cat.items.map(item => ({ ...item, packed: false, notes: '' }))
      })),
      is_default: kits.length === 0
    });
    setKits([...kits, newKit]);
    setActiveKit(newKit);
    setNewKitName('');
    setShowForm(false);
    setLoading(false);
    onKitLoaded?.(newKit);
  };

  const updateKit = async (updatedKit, additionalData = {}) => {
   setLoading(true);
   const updateData = {
     categories: updatedKit.categories,
     ...additionalData
   };
   await base44.entities.GearKit.update(activeKit.id, updateData);
   const newKit = { ...updatedKit, ...additionalData };
   setActiveKit(newKit);
   onKitLoaded?.(newKit);
   setLoading(false);
  };

  const toggleItem = (catIdx, itemIdx) => {
    if (!activeKit) return;
    const updated = { ...activeKit };
    updated.categories[catIdx].items[itemIdx].packed = !updated.categories[catIdx].items[itemIdx].packed;
    updateKit(updated);
  };

  const updateItemNote = (catIdx, itemIdx, notes) => {
    if (!activeKit) return;
    const updated = { ...activeKit };
    updated.categories[catIdx].items[itemIdx].notes = notes;
    setActiveKit(updated);
  };

  const addCustomItem = (catIdx) => {
    if (!newItemText.trim() || !activeKit) return;
    const updated = { ...activeKit };
    const newId = `custom-${Date.now()}`;
    updated.categories[catIdx].items.push({
      id: newId,
      name: newItemText,
      packed: false,
      notes: '',
      custom: true
    });
    updateKit(updated);
    setNewItemText('');
    setNewItemCategory(null);
  };

  const deleteCustomItem = (catIdx, itemIdx) => {
    if (!activeKit) return;
    const updated = { ...activeKit };
    updated.categories[catIdx].items.splice(itemIdx, 1);
    updateKit(updated);
  };

  const toggleCategory = (catIdx) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catIdx]: !prev[catIdx]
    }));
  };

  const saveGeneralNotes = (notes) => {
    if (!activeKit) return;
    updateKit(activeKit, {
      general_notes: notes,
      general_notes_timestamp: new Date().toISOString()
    });
    setShowGeneralNotes(false);
  };

  const [uploadingRelease, setUploadingRelease] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState('');
  const releaseFileInputRef = useRef(null);

  // Sync releaseNotes with activeKit
  useEffect(() => {
    setReleaseNotes(activeKit?.model_release_notes || '');
  }, [activeKit?.id]);

  const saveModelRelease = async (enabled, notes, pdfUrl) => {
    if (!activeKit) return;
    const updateData = {
      model_release_enabled: enabled,
      model_release_notes: notes,
    };
    if (pdfUrl !== undefined) updateData.model_release_pdf_url = pdfUrl;
    await updateKit(activeKit, updateData);
    setShowModelRelease(false);
  };

  const handleReleaseFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRelease(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadingRelease(false);
    // Save immediately with updated URL
    await updateKit(activeKit, {
      model_release_pdf_url: file_url,
      model_release_enabled: true,
    });
    setActiveKit(prev => ({ ...prev, model_release_pdf_url: file_url, model_release_enabled: true }));
  };

  const downloadSampleTemplate = () => {
    const templateText = `MODEL RELEASE FORM
====================

I, _________________________ (Model Name), hereby grant permission to 
_________________________ (Photographer Name) to photograph me at 
_________________________ (Location) on _________________________ (Date).

These photographs may be used for commercial, educational, or promotional 
purposes including but not limited to print, digital media, and online content.

I understand that no monetary compensation is guaranteed unless separately agreed.

Model Signature: _______________________   Date: _______________

Photographer Signature: ________________   Date: _______________

Notes / Additional Terms:
_________________________________________________________________
_________________________________________________________________

© Uncharted Galaxy – Always get a signed release before including people in your work.
`;
    const blob = new Blob([templateText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Model_Release_Template_Uncharted.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeKit && !showForm) {
     return (
       <Card className="bg-[#1a1a1a] border-white/8 p-5 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-400" /> Expedition Kit
            </h3>
            <p className="text-slate-500 text-xs mt-1">Create a gear checklist for this adventure.</p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            variant="outline"
            className="border-amber-500/40 text-amber-300 hover:bg-amber-900/20 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> New Kit
          </Button>
        </div>
      </Card>
    );
  }

  const filteredItems = activeKit
    ? activeKit.categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }))
    : [];

  const packedCount = activeKit
    ? activeKit.categories.reduce((sum, cat) => sum + cat.items.filter(i => i.packed).length, 0)
    : 0;

  const totalCount = activeKit
    ? activeKit.categories.reduce((sum, cat) => sum + cat.items.length, 0)
    : 0;

  return (
     <Card className="bg-[#1a1a1a] border-white/8 p-5 mb-5">
      {showForm ? (
        <div className="space-y-3 mb-4">
          <h3 className="text-white font-semibold text-sm">New Expedition Kit</h3>
          <Input
            placeholder="e.g., Milky Way Kit, Aurora Trip"
            value={newKitName}
            onChange={e => setNewKitName(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={createNewKit}
              disabled={!newKitName.trim() || loading}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 h-8 text-xs"
            >
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
              Create
            </Button>
            <Button onClick={() => setShowForm(false)} size="sm" variant="outline" className="border-slate-600 text-slate-300 h-8 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {activeKit && (
        <>
          {/* Header */}
          <div className="mb-4 pb-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" /> {activeKit.kit_name}
              </h3>
              <Button
                onClick={() => setShowForm(true)}
                size="sm"
                variant="outline"
                className="border-amber-500/40 text-amber-300 hover:bg-amber-900/20 text-xs"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-800 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-amber-400 text-xs font-semibold">{packedCount}/{totalCount}</span>
            </div>
          </div>

          {/* Mode-specific intro */}
          <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
            <p className="text-slate-300 text-xs leading-relaxed">
              {shooterMode === 'photographer' && '📷 Full camera expedition gear – pack for advanced shoots.'}
              {shooterMode === 'smartphone' && '📱 Phone-friendly kit – focus on stability and power.'}
              {shooterMode === 'experience' && '👁️ Light viewing essentials – enjoy the sky without gear.'}
            </p>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white text-xs pl-9"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredItems.map((category, catIdx) => (
              <div key={catIdx}>
                <button
                  onClick={() => toggleCategory(catIdx)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                >
                  <span className="text-slate-300 font-medium text-sm">{category.name}</span>
                  {expandedCategories[catIdx] ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {expandedCategories[catIdx] && (
                  <div className="pl-2 space-y-1.5 mt-1.5 border-l border-slate-700">
                    {category.items.map((item, itemIdx) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleItem(catIdx, itemIdx)}
                            className="flex-shrink-0 text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            {item.packed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span
                            className={`text-sm flex-1 ${
                              item.packed ? 'text-slate-500 line-through' : 'text-slate-300'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.custom && (
                            <button
                              onClick={() => deleteCustomItem(catIdx, itemIdx)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-500 ml-6">{item.notes}</p>
                        )}
                      </div>
                    ))}

                    {/* Add custom item for this category */}
                    {newItemCategory === catIdx ? (
                      <div className="flex gap-1 mt-2 ml-6">
                        <Input
                          placeholder="Add item..."
                          value={newItemText}
                          onChange={e => setNewItemText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') addCustomItem(catIdx);
                          }}
                          className="bg-slate-800 border-slate-700 text-white text-xs h-7"
                        />
                        <Button
                          onClick={() => addCustomItem(catIdx)}
                          disabled={!newItemText.trim()}
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 h-7 px-2 text-xs"
                        >
                          Add
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewItemCategory(catIdx)}
                        className="text-amber-400 hover:text-amber-300 text-xs font-medium ml-6 mt-1 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Custom item
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Affiliate nudge — contextual */}
          <div className="mt-3 p-3 rounded-lg border border-white/8 bg-white/5 flex items-center justify-between gap-2">
            <p className="text-slate-400 text-xs">🔦 Need a red headlamp for the field?</p>
            <a
              href="https://www.amazon.com/s?k=red+headlamp+astronomy&tag=uncharted-20"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 text-xs font-semibold whitespace-nowrap underline"
            >
              Shop via Amazon ↗
            </a>
          </div>

          {/* Reminders */}
          {packedCount < totalCount && (
            <div className="mt-4 p-3 rounded-lg bg-blue-900/20 border border-blue-500/30 flex gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-300">
                Pack smart – <strong>{totalCount - packedCount}</strong> items still to go. You've got this!
              </p>
            </div>
          )}

          {packedCount === totalCount && totalCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
              <p className="text-xs text-emerald-300 font-semibold">✅ Ready for the night sky. Adventure awaits!</p>
            </div>
          )}

          {/* General Notes Section */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            {!showGeneralNotes ? (
              <button
                onClick={() => setShowGeneralNotes(true)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-300 font-medium text-sm flex items-center gap-2">
                   <FileText className="w-4 h-4 text-red-400" /> Overall Prep Notes
                </span>
                {activeKit?.general_notes && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{activeKit.general_notes}</p>
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <label className="text-slate-300 text-xs uppercase mb-1 block font-semibold">Prep Notes</label>
                <Textarea
                  placeholder="e.g., Test batteries night before, Bring warm layers for Antelope Island"
                  defaultValue={activeKit?.general_notes || ''}
                  className="bg-slate-800 border-slate-700 text-white text-sm min-h-20 p-2"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={(e) => {
                      const textarea = e.target.parentElement.parentElement.querySelector('textarea');
                      saveGeneralNotes(textarea.value);
                    }}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 h-8 text-xs flex-1"
                  >
                    <Save className="w-3 h-3 mr-1" /> Save Notes
                  </Button>
                  <Button
                    onClick={() => setShowGeneralNotes(false)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Model Release Section */}
          <div className="mt-4 pt-4 border-t border-slate-700">
            {!isPaid ? (
              /* Free-tier teaser */
              <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-900/40 to-slate-800/60 border border-indigo-500/30 flex items-start gap-3">
                <Lock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-indigo-200 font-semibold text-sm">Model Release Tools</p>
                  <p className="text-slate-400 text-xs mt-0.5">Protect your work and models — handle releases easily.</p>
                  <p className="text-indigo-300 text-xs mt-1 font-medium">Unlock with Plus – $7.99/mo</p>
                </div>
                <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              </div>
            ) : !showModelRelease ? (
              /* Collapsed summary */
              <button
                onClick={() => setShowModelRelease(true)}
                className="w-full text-left p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors"
              >
                <span className="text-slate-300 font-medium text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" /> Model Release
                </span>
                <div className="flex items-center gap-2 mt-1">
                  {activeKit?.model_release_enabled ? (
                    <>
                      <Badge className="bg-emerald-700/60 text-emerald-300 border-emerald-600/40 text-[10px] px-1.5 py-0">
                        ✓ Models included
                      </Badge>
                      {activeKit?.model_release_pdf_url ? (
                        <Badge className="bg-emerald-700/60 text-emerald-300 border-emerald-600/40 text-[10px] px-1.5 py-0">
                          Release uploaded
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-700/60 text-amber-300 border-amber-600/40 text-[10px] px-1.5 py-0">
                          Pending upload
                        </Badge>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">Not set up yet – tap to configure</p>
                  )}
                </div>
              </button>
            ) : (
              /* Expanded form */
              <div className="space-y-4 bg-slate-800/40 rounded-xl p-4 border border-slate-700/60">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" /> Model Release
                  </span>
                  <button onClick={() => setShowModelRelease(false)} className="text-slate-500 hover:text-slate-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Reminder banner */}
                <div className="flex items-start gap-2 bg-indigo-900/20 border border-indigo-500/25 rounded-lg p-2.5">
                  <Users className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-200 leading-relaxed">
                    <strong>Protect your work and models</strong> — always get signed releases before including people in shots. Use the template below or upload your own legal form.
                  </p>
                </div>

                {/* Checkbox */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeKit?.model_release_enabled || false}
                    onChange={e => {
                      setActiveKit(prev => ({ ...prev, model_release_enabled: e.target.checked }));
                    }}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className="text-slate-200 text-sm">Will include people/models in foreground?</span>
                </label>

                {activeKit?.model_release_enabled && (
                  <>
                    {/* Upload */}
                    <div>
                      <label className="text-slate-300 text-xs uppercase mb-1.5 block font-semibold tracking-wide">
                        Upload Signed Release (PDF or image)
                      </label>
                      <input
                        ref={releaseFileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={handleReleaseFileUpload}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => releaseFileInputRef.current?.click()}
                          disabled={uploadingRelease}
                          size="sm"
                          variant="outline"
                          className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/20 h-8 text-xs"
                        >
                          {uploadingRelease ? (
                            <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Uploading…</>
                          ) : (
                            <><Upload className="w-3 h-3 mr-1" /> Upload File</>
                          )}
                        </Button>
                        {activeKit?.model_release_pdf_url && (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-emerald-700/60 text-emerald-300 border-emerald-600/40 text-[10px]">
                              <FileCheck className="w-3 h-3 mr-1" /> Release uploaded
                            </Badge>
                            <a
                              href={activeKit.model_release_pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-400 underline hover:text-indigo-300"
                            >
                              View
                            </a>
                            <button
                              onClick={() => {
                                setActiveKit(prev => ({ ...prev, model_release_pdf_url: null }));
                                updateKit(activeKit, { model_release_pdf_url: null });
                              }}
                              className="text-slate-500 hover:text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        {!activeKit?.model_release_pdf_url && !uploadingRelease && (
                          <Badge className="bg-amber-700/60 text-amber-300 border-amber-600/40 text-[10px]">
                            Pending upload
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-slate-300 text-xs uppercase mb-1.5 block font-semibold tracking-wide">
                        Model Names / IDs or Notes
                      </label>
                      <Input
                        placeholder='e.g., Jane Doe – signed 2/23/26, John Smith – pending'
                        value={releaseNotes}
                        onChange={e => setReleaseNotes(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white text-xs h-8"
                      />
                    </div>

                    {/* Template download */}
                    <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-3">
                      <p className="text-xs text-slate-300 font-semibold mb-1">📋 Sample Model Release Template</p>
                      <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                        "I, [Name], grant permission to [Photographer] to photograph me at [Location/Date] for commercial/educational use. Signed: ________ Date: ________"
                      </p>
                      <Button
                        onClick={downloadSampleTemplate}
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700/40 h-7 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" /> Download Sample Template
                      </Button>
                    </div>
                  </>
                )}

                {/* Save */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => saveModelRelease(
                      activeKit?.model_release_enabled || false,
                      releaseNotes
                    )}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs flex-1"
                  >
                    <Save className="w-3 h-3 mr-1" /> Save Release Info
                  </Button>
                  <Button
                    onClick={() => setShowModelRelease(false)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}