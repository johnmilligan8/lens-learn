import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PullToRefresh from '../components/ui/PullToRefresh';
import ModeSelectorModal from '../components/dashboard/ModeSelectorModal';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Telescope, Settings, Eye, MapPin, Palette, Sparkles,
  ChevronRight, Rocket, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODULE_ICONS = { Telescope, Settings, Eye, MapPin, Palette, Sparkles };
const COLOR_MAP = {};
const ICON_COLOR = {};

const FALLBACK_MODULES = [
  { id:'fallback-1', title:'Gear Essentials', description:'Everything you need to capture the Milky Way', color:'purple', is_free_preview:true, total_lessons:8, total_duration:'2.5 hrs' },
  { id:'fallback-2', title:'Camera Settings', description:'Master exposure, ISO, and focus for night photography', color:'blue', total_lessons:12, total_duration:'3 hrs' },
  { id:'fallback-3', title:'Composition & Foregrounds', description:'Create stunning compositions with the night sky', color:'indigo', total_lessons:10, total_duration:'2 hrs' },
  { id:'fallback-4', title:'Planning & Location Scouting', description:'Find dark skies and plan perfect shoots', color:'violet', total_lessons:6, total_duration:'1.5 hrs' },
  { id:'fallback-5', title:'Post-Processing', description:'Edit your images like a pro in Lightroom/Photoshop', color:'fuchsia', total_lessons:15, total_duration:'4 hrs' },
  { id:'fallback-6', title:'Advanced Techniques', description:'Stacking, panoramas, and time-blending', color:'pink', total_lessons:8, total_duration:'3 hrs' },
];

export default function Dashboard() {
   const [user, setUser] = useState(null);
   const [modules, setModules] = useState([]);
   const [progress, setProgress] = useState([]);
   const [isSubscribed, setIsSubscribed] = useState(false);
   const [loading, setLoading] = useState(true);
   const [profile, setProfile] = useState(null);
   const [modeModalOpen, setModeModalOpen] = useState(false);
   const [savingMode, setSavingMode] = useState(false);
   const [skyInterest, setSkyInterest] = useState('milky_way'); // 'milky_way' | 'aurora' | 'meteor_shower' | 'eclipse'
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

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="min-h-screen flex flex-col">
        {/* ── TOP GREETING ── */}
        <div className="max-w-5xl mx-auto w-full px-4 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold">Welcome back</p>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                {user?.full_name?.split(' ')[0] || 'Explorer'}
              </h1>
              <p className="text-slate-400 text-sm mt-1">Your expedition continues — let's explore tonight.</p>
            </div>
            <Link to={createPageUrl('Profile')} className="text-slate-500 hover:text-slate-300 transition-colors">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.full_name?.[0] || 'U'}
              </div>
            </Link>
          </div>
        </div>

        {/* ── MAIN CONTENT (flex-1 to push bottom content down) ── */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 space-y-6">

          {/* ── MODE HERO BANNER ── */}
          {profile?.shooter_mode && (
            <div className="p-5 rounded-2xl border border-white/10 bg-[#111111]/80 backdrop-blur-sm flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-1">Active Mode</p>
                <h2 className="text-xl md:text-2xl font-black text-white">
                  {profile.shooter_mode === 'photographer' && '📷 DSLR / Mirrorless Mode Active'}
                  {profile.shooter_mode === 'smartphone' && '📱 Smartphone Night Mode Active'}
                  {profile.shooter_mode === 'experience' && '👁️ Sky Experience Mode Active'}
                </h2>
              </div>
              <Button
                onClick={() => setModeModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm whitespace-nowrap flex-shrink-0"
              >
                Change Mode
              </Button>
            </div>
          )}

          {/* ── HERO STREAK CARD (40% width on desktop, full on mobile) ── */}
          <div className="lg:w-2/5">
            <Card className="bg-[#111111]/80 border border-white/10 p-6 shadow-lg hover:shadow-red-600/10 hover:border-white/20 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="text-4xl mb-2">🔥</div>
                <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-1">7 Day Streak</p>
                <h3 className="text-3xl font-black text-white mb-1">Keep it up!</h3>
                <p className="text-slate-300 text-sm">You're in the zone. Don't break the chain.</p>
              </div>
            </Card>
          </div>

          {/* ── STATS ROW (4 smaller glanceable cards) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-[#111111]/80 border border-white/10 p-4 hover:border-white/20 transition-colors">
              <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-1">Progress</p>
              <p className="text-2xl font-black text-white">{overallPct}%</p>
            </Card>
            <Card className="bg-[#111111]/80 border border-white/10 p-4 hover:border-white/20 transition-colors">
              <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-1">Lessons</p>
              <p className="text-2xl font-black text-white">{completedCount}</p>
            </Card>
            <Card className="bg-[#111111]/80 border border-white/10 p-4 hover:border-white/20 transition-colors">
              <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-1">Courses</p>
              <p className="text-2xl font-black text-white">{modules.length}</p>
            </Card>
            <Card className="bg-[#111111]/80 border border-white/10 p-4 hover:border-white/20 transition-colors">
              <p className="text-xs text-red-400 uppercase tracking-widest font-semibold mb-1">On Fire</p>
              <p className="text-2xl font-black text-red-400">7d</p>
            </Card>
          </div>

          {/* ── HERO TONIGHT? CARD ── */}
          <Link to={createPageUrl('TonightHub')} className="group">
            <Card className="bg-gradient-to-r from-red-950/40 via-[#111111]/80 to-[#111111]/80 border border-red-600/40 hover:border-red-500/60 p-8 md:p-10 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-red-400 uppercase tracking-widest font-bold mb-2">Real-Time Decision</p>
                    <h2 className="text-3xl md:text-4xl font-black text-white">Should You Go Tonight?</h2>
                  </div>
                  <p className="text-5xl md:text-6xl">🌙</p>
                </div>
                <p className="text-slate-300 text-base md:text-lg max-w-2xl mb-6">
                  Live conditions, ranked sky events, visibility scores. One answer, right now.
                  {profile?.home_location && <span className="block text-slate-500 text-sm mt-1"><MapPin className="w-3 h-3 inline mr-1" />{profile.home_location}</span>}
                </p>
                <p className="text-red-400 font-bold text-base flex items-center gap-2 group-hover:gap-3 transition-all">
                  Decide now <ChevronRight className="w-5 h-5" />
                </p>
              </div>
            </Card>
          </Link>

          {/* ── QUICK ACTIONS (4 focused cards) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                emoji: isSubscribed ? '⚡' : '🔒',
                label: 'Field Mode',
                sub: 'Live execution',
                page: isSubscribed ? 'FieldMode' : 'PaymentGate',
                locked: !isSubscribed,
              },
              {
                emoji: isSubscribed ? '📍' : '🔒',
                label: 'Sky Planner',
                sub: 'Plan future shoots',
                page: isSubscribed ? 'PlannerTool' : 'PaymentGate',
                locked: !isSubscribed,
              },
              {
                emoji: '📅',
                label: 'Events',
                sub: 'Showers & eclipses',
                page: 'PlannerTool',
                params: '?tab=events',
                locked: false,
              },
              {
                emoji: '📔',
                label: 'Journal',
                sub: 'Reflect & improve',
                page: 'Journal',
                locked: false,
              },
            ].map(item => (
              <Link key={item.label} to={createPageUrl(item.page) + (item.params || '')} className="group">
                <div className={`p-4 rounded-xl border transition-all h-full flex flex-col ${
                  item.locked
                    ? 'border-white/5 bg-[#111111]/50'
                    : 'border-white/10 bg-[#111111]/80 hover:border-red-600/30 hover:bg-[#111111]/95'
                }`}>
                  <p className="text-2xl mb-2">{item.emoji}</p>
                  <h3 className="text-sm font-bold text-white mb-0.5">{item.label}</h3>
                  <p className="text-slate-500 text-xs flex-1">{item.sub}</p>
                  <p className={`text-xs font-semibold flex items-center gap-0.5 mt-2 group-hover:gap-1 transition-all ${item.locked ? 'text-slate-600' : 'text-red-400'}`}>
                    {item.locked ? 'Upgrade' : 'Open'} <ChevronRight className="w-3 h-3" />
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* ── FREE TIER UPSELL (if applicable) ── */}
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

          {/* ── FREE COURSE (if not subscribed) ── */}
          {!isSubscribed && (
            <Link to={createPageUrl('FreeCourse')}>
              <Card className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 p-6 transition-all">
                <div className="flex items-start gap-4">
                  <p className="text-3xl">⭐</p>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-red-600 text-white text-xs">FREE</Badge>
                      <span className="text-slate-500 text-xs">5 lessons</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Your First Night Sky Adventure</h3>
                    <p className="text-slate-400 text-sm">Gear basics, magic camera settings, and your first shoot checklist.</p>
                    <p className="text-red-400 text-sm font-semibold mt-2 flex items-center gap-1">
                      Start free course <ChevronRight className="w-4 h-4" />
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {/* ── POST-PROCESSING GUIDE ── */}
          <PostProcessingGuide />

          {/* ── SKY PLANNER PREVIEW (free only) ── */}
          {!isSubscribed && <SkyPlannerPreview />}

          {/* ── COURSES SECTION ── */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-red-400" /> Continue Learning
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((mod) => {
                const pct = getModuleProgress(mod.id);
                const iconKeys = Object.keys(MODULE_ICONS);
                const IconComp = MODULE_ICONS[iconKeys[modules.indexOf(mod) % iconKeys.length]];
                return (
                  <Link key={mod.id} to={isSubscribed ? createPageUrl('ModuleView') + `?id=${mod.id}` : createPageUrl('PaymentGate')}>
                    <Card className={`bg-[#111111]/80 border border-white/10 hover:border-white/20 p-5 transition-all h-full ${!isSubscribed ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {mod.is_free_preview && (
                        <Badge className="inline-block bg-red-600 text-white text-xs mb-3">FREE</Badge>
                      )}
                      <div className="flex items-start gap-2 mb-3">
                        <IconComp className="w-8 h-8 text-red-400 flex-shrink-0" />
                        {!isSubscribed && <Lock className="w-4 h-4 text-slate-600 flex-shrink-0 ml-auto" />}
                      </div>
                      <h3 className="text-base font-bold text-white mb-1">{mod.title}</h3>
                      <p className="text-slate-400 text-xs mb-3 line-clamp-2">{mod.description}</p>
                      <div className="text-xs text-slate-500 mb-2">
                        {mod.total_lessons && <span>{mod.total_lessons} lessons</span>}
                        {mod.total_duration && <span> • {mod.total_duration}</span>}
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

        {/* ── BOTTOM BAR (sticky) ── */}
        <div className="mt-auto border-t border-slate-800/40 bg-slate-900/30 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            {/* Mode Selector Modal */}
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
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-600">Night Vision</span>
              {/* Night Vision toggle would go here */}
            </div>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}