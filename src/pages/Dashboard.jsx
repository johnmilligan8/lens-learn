import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PullToRefresh from '../components/ui/PullToRefresh';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Telescope, Settings, Eye, MapPin, Palette, Sparkles,
  ChevronRight, Trophy, Clock, TrendingUp, BookOpen,
  Star, Rocket, Camera, Zap, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const MODULE_ICONS = { Telescope, Settings, Eye, MapPin, Palette, Sparkles };
const COLOR_MAP = {
  purple: 'from-purple-600/20 to-purple-900/10 border-purple-500/30 hover:border-purple-400/60',
  blue:   'from-blue-600/20 to-blue-900/10 border-blue-500/30 hover:border-blue-400/60',
  indigo: 'from-indigo-600/20 to-indigo-900/10 border-indigo-500/30 hover:border-indigo-400/60',
  violet: 'from-violet-600/20 to-violet-900/10 border-violet-500/30 hover:border-violet-400/60',
  fuchsia:'from-fuchsia-600/20 to-fuchsia-900/10 border-fuchsia-500/30 hover:border-fuchsia-400/60',
  pink:   'from-pink-600/20 to-pink-900/10 border-pink-500/30 hover:border-pink-400/60',
};
const ICON_COLOR = {
  purple:'text-purple-400', blue:'text-blue-400', indigo:'text-indigo-400',
  violet:'text-violet-400', fuchsia:'text-fuchsia-400', pink:'text-pink-400',
};

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Telescope className="w-10 h-10 text-purple-400 star-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Hero Header */}
      <div className="relative mb-12 overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#0d0520] via-[#060318] to-[#020212] p-8 md:p-12">
        {/* Nebula blobs */}
        <div className="nebula-blob w-96 h-96 bg-purple-700/25 -top-20 -left-20" />
        <div className="nebula-blob w-64 h-64 bg-blue-700/20 top-10 right-0" />
        <div className="nebula-blob w-48 h-48 bg-indigo-600/20 bottom-0 left-1/3" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-500/30 rounded-full px-3 py-1 mb-5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-purple-200 text-xs font-semibold tracking-widest uppercase">Mission Active</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            Chart the <span className="gradient-text">Unknown</span>,<br />
            Master the <span className="gradient-text-gold">Galaxy.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-8">
            Every great astrophotographer started exactly where you are. Your expedition continues, {user?.full_name?.split(' ')[0] || 'Explorer'}.
          </p>
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-white">{overallPct}%</p>
              <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Course Complete</p>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">{completedCount}</p>
              <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Lessons Done</p>
            </div>
            <div className="w-px bg-slate-700" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">{modules.length}</p>
              <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Expeditions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Free tier upsell banner */}
      {!isSubscribed && (
        <div className="mb-8 p-5 rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-900/20 via-orange-900/10 to-purple-900/20 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <p className="text-yellow-300 font-black text-lg leading-snug">🚀 Ready to master the stars?</p>
            <p className="text-slate-400 text-sm mt-1">Upgrade for full courses, pro planning tools, instructor feedback & custom alerts — just <strong className="text-white">$19/month</strong>.</p>
          </div>
          <Link to={createPageUrl('PaymentGate')}>
            <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold whitespace-nowrap">
              Begin Your Expedition →
            </Button>
          </Link>
        </div>
      )}

      {/* Free Course Card for non-subscribers */}
      {!isSubscribed && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
            <Star className="w-6 h-6 text-emerald-400" /> Start Here — Free
          </h2>
          <Link to={createPageUrl('FreeCourse')}>
            <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/10 border border-emerald-500/40 hover:border-emerald-400/70 p-6 card-glow transition-all group">
              <div className="flex items-start gap-5">
                <div className="bg-emerald-600/20 p-4 rounded-xl flex-shrink-0">
                  <Telescope className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-emerald-600 text-white text-xs">FREE</Badge>
                    <span className="text-slate-400 text-xs">5 lessons · No card required</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">Your First Night Sky Adventure</h3>
                  <p className="text-slate-400 text-sm mb-3">Gear basics, magic camera settings, simple composition, and your first shoot checklist — everything to capture the Milky Way tonight.</p>
                  <p className="text-emerald-400 text-sm font-medium flex items-center gap-1">Start free course <ChevronRight className="w-4 h-4" /></p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Course Modules heading */}
      <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
        <Rocket className="w-6 h-6 text-purple-400" /> {isSubscribed ? 'Your Expeditions' : 'Full Course — Unlock to Access'}
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {modules.map((mod) => {
          const modColor = mod.color || 'purple';
          const pct = getModuleProgress(mod.id);
          const iconKeys = Object.keys(MODULE_ICONS);
          const IconComp = MODULE_ICONS[iconKeys[modules.indexOf(mod) % iconKeys.length]];
          return (
            <Link key={mod.id} to={isSubscribed ? createPageUrl('ModuleView') + `?id=${mod.id}` : createPageUrl('PaymentGate')}>
              <Card className={`bg-gradient-to-br ${COLOR_MAP[modColor]} border p-6 card-glow hover:scale-[1.02] transition-all duration-200 relative overflow-hidden h-full ${!isSubscribed ? 'opacity-70' : ''}`}>
                {mod.is_free_preview && (
                  <Badge className="absolute top-3 right-3 bg-emerald-600 text-white text-xs">FREE</Badge>
                )}
                <div className="flex items-start justify-between mb-4">
                  <IconComp className={`w-10 h-10 ${ICON_COLOR[modColor]}`} />
                  {isSubscribed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <Lock className="w-4 h-4 text-slate-500" />}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{mod.title}</h3>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2">{mod.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  {mod.total_lessons && <span>{mod.total_lessons} lessons</span>}
                  {mod.total_duration && <><span>•</span><span>{mod.total_duration}</span></>}
                </div>
                <Progress value={pct} className="h-1.5 mb-1" />
                <p className="text-xs text-slate-500">{pct}% complete</p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2 mt-10">
        <Zap className="w-6 h-6 text-yellow-400" /> Mission Briefings
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to={createPageUrl('TonightHub')}>
          <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/10 border border-emerald-500/40 p-6 card-glow hover:border-emerald-400/70 transition-all group h-full">
            <div className="bg-emerald-600/20 p-4 rounded-xl w-fit mb-4"><Rocket className="w-7 h-7 text-emerald-400" /></div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">Tonight?</h3>
            <p className="text-slate-400 text-sm">Top ranked sky events for tonight with viability scores and a one-tap shoot plan.</p>
            <p className="text-emerald-400 text-sm mt-3 flex items-center gap-1 font-medium">Decide now <ChevronRight className="w-4 h-4" /></p>
          </Card>
        </Link>
        <Link to={createPageUrl('PlannerTool')}>
          <Card className="bg-slate-900/60 border-slate-800 p-6 card-glow hover:border-purple-500/40 transition-all group h-full">
            <div className="bg-purple-600/20 p-4 rounded-xl w-fit mb-4"><MapPin className="w-7 h-7 text-purple-400" /></div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">Sky Planner</h3>
            <p className="text-slate-400 text-sm">Predict Milky Way visibility, moon interference & optimal shoot windows for any location.</p>
            <p className="text-purple-400 text-sm mt-3 flex items-center gap-1 font-medium">Plan a shoot <ChevronRight className="w-4 h-4" /></p>
          </Card>
        </Link>

        <Link to={createPageUrl('EventsCalendar')}>
          <Card className="bg-slate-900/60 border-slate-800 p-6 card-glow hover:border-yellow-500/40 transition-all group h-full">
            <div className="bg-yellow-600/20 p-4 rounded-xl w-fit mb-4"><Star className="w-7 h-7 text-yellow-400" /></div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-yellow-300 transition-colors">Cosmic Events</h3>
            <p className="text-slate-400 text-sm">Meteor showers, eclipses, aurora alerts & more. Never miss a once-in-a-lifetime sky event.</p>
            <p className="text-yellow-400 text-sm mt-3 flex items-center gap-1 font-medium">See events <ChevronRight className="w-4 h-4" /></p>
          </Card>
        </Link>

        <Link to={createPageUrl('CommunityGallery')}>
          <Card className="bg-slate-900/60 border-slate-800 p-6 card-glow hover:border-blue-500/40 transition-all group h-full">
            <div className="bg-blue-600/20 p-4 rounded-xl w-fit mb-4"><Sparkles className="w-7 h-7 text-blue-400" /></div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">Explorer Gallery</h3>
            <p className="text-slate-400 text-sm">Share your shots with fellow explorers. Get real feedback from instructors and the community.</p>
            <p className="text-blue-400 text-sm mt-3 flex items-center gap-1 font-medium">Explore <ChevronRight className="w-4 h-4" /></p>
          </Card>
        </Link>
      </div>
    </div>
  );
}