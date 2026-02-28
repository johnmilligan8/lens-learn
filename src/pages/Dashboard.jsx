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
  ChevronRight, Rocket, Lock, Zap, ChevronDown
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
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-6 pb-10 space-y-5">

          {/* ── GREETING ── */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Welcome back</p>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-0.5">{firstName}</h1>
            </div>
            <Link to={createPageUrl('Profile')}>
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.full_name?.[0] || 'U'}
              </div>
            </Link>
          </div>

          {/* ── MODE HERO BANNER — biggest thing on screen ── */}
          <button
            onClick={() => setModeModalOpen(true)}
            className="w-full text-left p-5 rounded-2xl border border-red-600/50 bg-gradient-to-br from-red-950/50 to-[#111111]/90 hover:border-red-500/70 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">Active Mode</p>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  {modeInfo.emoji} {modeInfo.label}
                </h2>
                <p className="text-slate-400 text-sm mt-1">All tools, tips & settings are tuned to this mode.</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1.5 text-sm font-bold text-red-400 group-hover:text-red-300 transition-colors">
                Change <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </button>

          {/* ── TODAY'S RECOMMENDATION PILL ── */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 w-fit max-w-full">
            <span className="text-base">🌌</span>
            <p className="text-sm text-slate-300 leading-snug">
              <span className="text-white font-semibold">Tonight:</span> Check conditions for your best sky event →{' '}
              <Link to={createPageUrl('TonightHub')} className="text-red-400 font-bold hover:underline">See forecast</Link>
            </p>
          </div>

          {/* ── HERO STREAK CARD ── */}
          {isZeroState ? (
            /* Zero state — motivational */
            <Card className="bg-gradient-to-br from-[#1a0a0a] to-[#111111] border border-red-900/40 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
                <div className="text-5xl">🔭</div>
                <div className="flex-1">
                  <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">You're Just Getting Started</p>
                  <h3 className="text-xl font-black text-white mb-1">No expeditions yet — let's change that tonight.</h3>
                  <p className="text-slate-400 text-sm mb-3">Head to <strong className="text-white">Tonight?</strong> to get a live sky forecast and earn your first streak day.</p>
                  <Link to={createPageUrl('TonightHub')}>
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
                      🌙 Start Tonight →
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ) : (
            /* Active streak hero */
            <Card className="bg-gradient-to-br from-[#1a0a0a] to-[#111111] border border-red-600/40 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/8 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
              <div className="relative z-10 flex items-center gap-5">
                <div className="text-6xl animate-pulse">🔥</div>
                <div className="flex-1">
                  <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">{STREAK_DAYS}-Day Streak</p>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-1">You're on fire. Don't break the chain.</h3>
                  <p className="text-slate-400 text-sm">{overallPct}% course progress · {completedCount} lessons complete</p>
                </div>
              </div>
            </Card>
          )}

          {/* ── 3 HERO CTAs ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Decide Tonight */}
            <Link to={createPageUrl('TonightHub')} className="group">
              <div className="h-full p-6 rounded-2xl border border-red-600/40 bg-gradient-to-br from-red-950/40 to-[#111111]/80 hover:border-red-500/60 transition-all relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <div className="relative z-10 flex-1 flex flex-col">
                  <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-3">Decide Now</p>
                  <div className="text-3xl mb-3">🌙</div>
                  <h2 className="text-lg font-black text-white mb-1.5">Tonight?</h2>
                  <p className="text-slate-400 text-sm flex-1">Live conditions, Go/No-Go, top ranked sky events.</p>
                  <p className="text-red-400 font-bold text-sm flex items-center gap-1 mt-4 group-hover:gap-2 transition-all">
                    Open <ChevronRight className="w-4 h-4" />
                  </p>
                </div>
              </div>
            </Link>

            {/* Plan Next Shoot */}
            <Link to={isSubscribed ? createPageUrl('PlannerTool') : createPageUrl('PaymentGate')} className="group">
              <div className="h-full p-6 rounded-2xl border border-white/10 bg-[#111111]/80 hover:border-white/20 transition-all flex flex-col">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Plan Ahead</p>
                    {!isSubscribed && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                  <div className="text-3xl mb-3">📍</div>
                  <h2 className="text-lg font-black text-white mb-1.5">Plan Next Shoot</h2>
                  <p className="text-slate-400 text-sm flex-1">Calendar, events, gear checklist, multi-trip saving.</p>
                  <p className={`font-bold text-sm flex items-center gap-1 mt-4 group-hover:gap-2 transition-all ${isSubscribed ? 'text-red-400' : 'text-slate-600'}`}>
                    {isSubscribed ? 'Sky Planner' : 'Unlock Plus'} <ChevronRight className="w-4 h-4" />
                  </p>
                </div>
              </div>
            </Link>

            {/* Go Live in Field */}
            <Link to={isSubscribed ? createPageUrl('FieldMode') : createPageUrl('PaymentGate')} className="group">
              <div className="h-full p-6 rounded-2xl border border-white/10 bg-[#111111]/80 hover:border-white/20 transition-all flex flex-col">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Live Execution</p>
                    {!isSubscribed && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                  </div>
                  <div className="text-3xl mb-3">⚡</div>
                  <h2 className="text-lg font-black text-white mb-1.5">Go Live in Field</h2>
                  <p className="text-slate-400 text-sm flex-1">Step-by-step guidance at location, adapted to your mode.</p>
                  <p className={`font-bold text-sm flex items-center gap-1 mt-4 group-hover:gap-2 transition-all ${isSubscribed ? 'text-red-400' : 'text-slate-600'}`}>
                    {isSubscribed ? 'Field Mode' : 'Unlock Plus'} <ChevronRight className="w-4 h-4" />
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* ── SECONDARY QUICK LINKS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: '📅', label: 'Events', sub: 'Showers & eclipses', page: 'PlannerTool', params: '?tab=events' },
              { emoji: '📔', label: 'Journal', sub: 'Reflect & improve', page: 'Journal' },
              { emoji: '🌌', label: 'Gallery', sub: 'Community shots', page: 'CommunityGallery' },
              { emoji: '⭐', label: 'Free Course', sub: 'Start learning', page: 'FreeCourse' },
            ].map(item => (
              <Link key={item.label} to={createPageUrl(item.page) + (item.params || '')} className="group">
                <div className="p-4 rounded-xl border border-white/8 bg-[#111111]/60 hover:border-white/15 hover:bg-[#111111]/90 transition-all h-full flex flex-col">
                  <p className="text-2xl mb-2">{item.emoji}</p>
                  <h3 className="text-sm font-bold text-white mb-0.5">{item.label}</h3>
                  <p className="text-slate-500 text-xs flex-1">{item.sub}</p>
                  <p className="text-xs font-semibold text-red-400 flex items-center gap-0.5 mt-2 group-hover:gap-1 transition-all">
                    Open <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── UPSELL (free users only) ── */}
          {!isSubscribed && (
            <Card className="bg-[#111111]/80 border border-white/10 p-6">
              <div className="flex items-start gap-4">
                <p className="text-3xl">🚀</p>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">Ready to master the stars?</h3>
                  <p className="text-slate-300 text-sm mb-4">Unlock full planning tools, guided shoots, gear checklists & aurora alerts from $7.99/month.</p>
                  <Link to={createPageUrl('PaymentGate')}>
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold">
                      Begin Your Expedition →
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* ── COURSES SECTION ── */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-red-400" /> Continue Learning
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => {
                const pct = getModuleProgress(mod.id);
                const iconKeys = Object.keys(MODULE_ICONS);
                const IconComp = MODULE_ICONS[iconKeys[modules.indexOf(mod) % iconKeys.length]];
                return (
                  <Link key={mod.id} to={isSubscribed ? createPageUrl('ModuleView') + `?id=${mod.id}` : createPageUrl('PaymentGate')}>
                    <Card className={`bg-[#111111]/80 border border-white/10 hover:border-white/20 p-5 transition-all h-full ${!isSubscribed && !mod.is_free_preview ? 'opacity-50' : ''}`}>
                      {mod.is_free_preview && (
                        <Badge className="inline-block bg-red-600 text-white text-xs mb-3">FREE</Badge>
                      )}
                      <div className="flex items-start gap-2 mb-3">
                        <IconComp className="w-8 h-8 text-red-400 flex-shrink-0" />
                        {!isSubscribed && !mod.is_free_preview && <Lock className="w-4 h-4 text-slate-600 flex-shrink-0 ml-auto" />}
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">{mod.title}</h3>
                      <p className="text-slate-400 text-xs mb-3 line-clamp-2">{mod.description}</p>
                      <div className="text-xs text-slate-500 mb-2">
                        {mod.total_lessons && <span>{mod.total_lessons} lessons</span>}
                        {mod.total_duration && <span> · {mod.total_duration}</span>}
                      </div>
                      <Progress value={pct} className="h-1 mb-1" />
                      <p className="text-xs text-slate-600">{pct}% done</p>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="border-t border-slate-800/40 bg-slate-900/30 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <ModeSelectorModal
              open={modeModalOpen}
              onOpenChange={setModeModalOpen}
              currentMode={profile?.shooter_mode}
              onSave={handleSaveMode}
              saving={savingMode}
            />
            <div className="text-xs text-slate-500">
              {profile?.home_location && <span>📍 {profile.home_location}</span>}
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}