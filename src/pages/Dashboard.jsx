import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PullToRefresh from '../components/ui/PullToRefresh';
import ModeSelectorModal from '../components/dashboard/ModeSelectorModal';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Telescope, Settings, Eye, MapPin, Palette, Sparkles,
  ChevronRight, Rocket, Lock, Zap, ChevronDown, Smartphone, AlertCircle
} from 'lucide-react';

const MODULE_ICONS = { Telescope, Settings, Eye, MapPin, Palette, Sparkles };

const FALLBACK_MODULES = [
  { id:'fallback-1', title:'Gear Essentials', description:'Everything you need to capture the Milky Way', color:'purple', is_free_preview:true, total_lessons:8, total_duration:'2.5 hrs' },
  { id:'fallback-2', title:'Camera Settings', description:'Master exposure, ISO, and focus for night photography', color:'blue', total_lessons:12, total_duration:'3 hrs' },
  { id:'fallback-3', title:'Composition & Foregrounds', description:'Create stunning compositions with the night sky', color:'indigo', total_lessons:10, total_duration:'2 hrs' },
  { id:'fallback-4', title:'Planning & Location Scouting', description:'Find dark skies and plan perfect shoots', color:'violet', total_lessons:6, total_duration:'1.5 hrs' },
  { id:'fallback-5', title:'Post-Processing', description:'Edit your images like a pro in Lightroom/Photoshop', color:'fuchsia', total_lessons:15, total_duration:'4 hrs' },
  { id:'fallback-6', title:'Advanced Techniques', description:'Stacking, panoramas, and time-blending', color:'pink', total_lessons:8, total_duration:'3 hrs' },
];

const MODE_INFO = {
  photographer: { emoji: '📷', label: 'DSLR / Mirrorless Mode' },
  smartphone: { emoji: '📱', label: 'Smartphone Night Mode' },
  experience: { emoji: '👁️', label: 'Sky Experience Mode' },
};

// Simulated streak (would normally come from a dedicated streak entity/logic)
const STREAK_DAYS = 0; // 0 = brand new, change to show real streak

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [modeModalOpen, setModeModalOpen] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [phoneModelExpanded, setPhoneModelExpanded] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    const me = await base44.auth.me();
    setUser(me);
    const [mods, prog, subs, profiles] = await Promise.all([
      base44.entities.Module.list('order', 50),
      base44.entities.LessonProgress.filter({ user_email: me.email }, '-created_date', 200),
      me.role === 'admin' ? Promise.resolve([{ status: 'active' }]) : base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1),
      base44.entities.UserProfile.filter({ user_email: me.email }, '-created_date', 1),
    ]);
    setIsSubscribed(subs.length > 0);
    setModules(mods.length > 0 ? mods : FALLBACK_MODULES);
    setProgress(prog);
    const prof = profiles[0] ?? null;
    setProfile(prof);
    setLoading(false);
    if (!prof || !prof.onboarding_complete) {
      navigate(createPageUrl('Onboarding'));
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const completedCount = progress.filter(p => p.completed).length;
  const totalLessons = modules.reduce((s, m) => s + (m.total_lessons || 0), 0);
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isZeroState = completedCount === 0;

  const getModuleProgress = (moduleId) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod || !mod.total_lessons) return 0;
    const done = progress.filter(p => p.module_id === moduleId && p.completed).length;
    return Math.round((done / mod.total_lessons) * 100);
  };

  const handleSaveMode = async (selectedMode) => {
    setSavingMode(true);
    const data = { user_email: user.email, shooter_mode: selectedMode };
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, data);
      setProfile({ ...profile, ...data });
    } else {
      const created = await base44.entities.UserProfile.create({ ...data, onboarding_complete: true });
      setProfile(created);
    }
    setSavingMode(false);
  };

  const handleSavePhoneModel = async (phoneModelId) => {
    setSavingPhone(true);
    const data = { user_email: user.email, phone_model: phoneModelId };
    if (profile) {
      await base44.entities.UserProfile.update(profile.id, data);
      setProfile({ ...profile, ...data });
    } else {
      const created = await base44.entities.UserProfile.create({ ...data, onboarding_complete: true });
      setProfile(created);
    }
    setSavingPhone(false);
    setPhoneModelExpanded(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Telescope className="w-10 h-10 text-red-400 star-pulse" />
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'Explorer';
  const modeInfo = MODE_INFO[profile?.shooter_mode] || MODE_INFO.photographer;

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-8 pb-10 space-y-6">

          {/* ── GREETING ── */}
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Welcome back</p>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-1">{firstName}</h1>
            <div className="flex items-center gap-3 mt-3">
              <p className="text-slate-400 text-sm">{modeInfo.emoji} {modeInfo.label}</p>
              <button
                onClick={() => setModeModalOpen(true)}
                className="px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/40 hover:border-red-500/60 hover:bg-red-600/30 transition-all text-sm text-red-300 font-semibold"
              >
                {modeInfo.emoji} Change
              </button>
            </div>
            </div>

            {/* Phone Model Selector — Smartphone mode only */}
            {profile?.shooter_mode === 'smartphone' && (
             <Card className="bg-blue-900/20 border border-blue-500/30 p-4">
               <button
                 onClick={() => setPhoneModelExpanded(!phoneModelExpanded)}
                 className="w-full flex items-center justify-between text-left"
               >
                 <div className="flex items-center gap-2">
                   <Smartphone className="w-4 h-4 text-blue-400" />
                   <span className="text-white text-sm font-semibold">Select your phone model</span>
                 </div>
                 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${phoneModelExpanded ? 'rotate-180' : ''}`} />
               </button>

               {profile?.phone_model && !phoneModelExpanded && (
                 <p className="text-xs text-blue-300 mt-1">
                   ✓ {['iphone14', 'iphone15', 'iphone16', 'pixel8', 'pixel9', 'galaxy23', 'galaxy24', 'ipad', 'unsure'].includes(profile.phone_model) ? 'Configured' : 'Not set'}
                 </p>
               )}

               {phoneModelExpanded && (
                 <div className="mt-3 space-y-2">
                   <p className="text-xs text-blue-200 mb-2">Better guidance for your device.</p>
                   {[
                     { id: 'iphone14', label: 'iPhone 14 Pro/Max' },
                     { id: 'iphone15', label: 'iPhone 15 Pro/Max' },
                     { id: 'iphone16', label: 'iPhone 16 Pro/Max' },
                     { id: 'pixel8', label: 'Pixel 8/8 Pro' },
                     { id: 'pixel9', label: 'Pixel 9/9 Pro' },
                     { id: 'galaxy23', label: 'Galaxy S23 Ultra' },
                     { id: 'galaxy24', label: 'Galaxy S24 Ultra' },
                     { id: 'ipad', label: 'iPad (Air/Pro)' },
                     { id: 'unsure', label: 'Not sure / Other' },
                   ].map(phone => (
                     <button
                       key={phone.id}
                       onClick={() => handleSavePhoneModel(phone.id)}
                       disabled={savingPhone}
                       className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                         profile?.phone_model === phone.id
                           ? 'bg-blue-600/40 text-blue-200 border border-blue-500/40'
                           : 'bg-slate-800/30 text-slate-300 hover:bg-slate-800/50'
                       }`}
                     >
                       {phone.label} {profile?.phone_model === phone.id && '✓'}
                     </button>
                   ))}
                 </div>
               )}
             </Card>
            )}

            {/* ── 6 LARGE TILES (PhotoPills-like) ── */}
          <div className="grid grid-cols-1 gap-4">
            {/* Tonight? — top priority */}
            <Link to={createPageUrl('TonightHub')} className="group">
              <div className="min-h-24 p-6 rounded-2xl border border-red-600/40 bg-gradient-to-br from-red-950/40 to-[#111111]/80 hover:border-red-500/60 transition-all flex items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="relative z-10 flex-1">
                  <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">Decide Now</p>
                  <h2 className="text-2xl font-black text-white">Tonight?</h2>
                  <p className="text-slate-400 text-sm mt-1">Live forecast & ranking</p>
                </div>
                <div className="relative z-10 text-5xl flex-shrink-0">🌙</div>
              </div>
            </Link>

            {/* Sky Planner */}
            <Link to={isSubscribed ? createPageUrl('PlannerTool') : createPageUrl('PaymentGate')} className="group">
              <div className="min-h-24 p-6 rounded-2xl border border-white/10 bg-[#111111]/80 hover:border-white/20 transition-all flex items-center gap-6">
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Plan Ahead</p>
                    {!isSubscribed && <Lock className="w-3 h-3 text-slate-600" />}
                  </div>
                  <h2 className="text-2xl font-black text-white">Sky Planner</h2>
                  <p className="text-slate-400 text-sm mt-1">Forecast & conditions</p>
                </div>
                <div className="text-5xl flex-shrink-0">📍</div>
              </div>
            </Link>

            {/* Field Mode */}
            <Link to={isSubscribed ? createPageUrl('FieldMode') : createPageUrl('PaymentGate')} className="group">
              <div className="min-h-24 p-6 rounded-2xl border border-white/10 bg-[#111111]/80 hover:border-white/20 transition-all flex items-center gap-6">
                <div className="relative z-10 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Live</p>
                    {!isSubscribed && <Lock className="w-3 h-3 text-slate-600" />}
                  </div>
                  <h2 className="text-2xl font-black text-white">Field Mode</h2>
                  <p className="text-slate-400 text-sm mt-1">Step-by-step guidance</p>
                </div>
                <div className="text-5xl flex-shrink-0">⚡</div>
              </div>
            </Link>

            {/* Quick Links: Journal + Events + Gallery */}
            <div className="grid grid-cols-3 gap-4">
              <Link to={createPageUrl('Journal')} className="group">
                <div className="h-full p-5 rounded-xl border border-white/8 bg-[#111111]/60 hover:border-white/15 transition-all flex flex-col items-center text-center gap-3 min-h-24 justify-center">
                  <p className="text-4xl">📔</p>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">Journal</h3>
                    <p className="text-slate-500 text-xs">Reflect</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl('PlannerTool') + '?tab=events'} className="group">
                <div className="h-full p-5 rounded-xl border border-white/8 bg-[#111111]/60 hover:border-white/15 transition-all flex flex-col items-center text-center gap-3 min-h-24 justify-center">
                  <p className="text-4xl">📅</p>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">Events</h3>
                    <p className="text-slate-500 text-xs">Calendar</p>
                  </div>
                </div>
              </Link>
              <Link to={createPageUrl('CommunityGallery')} className="group">
                <div className="h-full p-5 rounded-xl border border-white/8 bg-[#111111]/60 hover:border-white/15 transition-all flex flex-col items-center text-center gap-3 min-h-24 justify-center">
                  <p className="text-4xl">🌌</p>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">Gallery</h3>
                    <p className="text-slate-500 text-xs">Community</p>
                  </div>
                </div>
              </Link>
            </div>

          {/* ── UPSELL (free users only) ── */}
          {!isSubscribed && (
            <Card className="bg-[#111111]/80 border border-white/10 p-6">
              <div className="flex items-start gap-4">
                <p className="text-4xl">🚀</p>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Unlock Full Access</h3>
                  <p className="text-slate-300 text-sm mb-4">Sky Planner, Field Mode, & Aurora Alerts from $7.99/month.</p>
                  <Link to={createPageUrl('PaymentGate')}>
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm px-6 h-10">
                      Begin Expedition →
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

        </div>



        <ModeSelectorModal
          open={modeModalOpen}
          onOpenChange={setModeModalOpen}
          currentMode={profile?.shooter_mode}
          onSave={handleSaveMode}
          saving={savingMode}
        />
        </div>
        </div>
        </PullToRefresh>
        );
        }