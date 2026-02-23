import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PullToRefresh from '../components/ui/PullToRefresh';
import SkyPlannerPreview from '../components/dashboard/SkyPlannerPreview';
import PostProcessingGuide from '../components/postprocessing/PostProcessingGuide';
import ActionCard from '../components/ui/ActionCard';
import PageHeader from '../components/ui/PageHeader';
import QuickStats from '../components/ui/QuickStats';
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
        <Telescope className="w-10 h-10 text-red-400 star-pulse" />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={loadData}>
      <div className="max-w-7xl mx-auto px-4 py-8 relative">
      {/* Hero Header */}
      <PageHeader
        icon={Rocket}
        badge="Mission Active"
        title={<>Chart the <span className="gradient-text">Unknown</span>,<br />Master the <span className="gradient-text-gold">Galaxy</span></>}
        subtitle={`Every great astrophotographer started exactly where you are. Your expedition continues, ${user?.full_name?.split(' ')[0] || 'Explorer'}.`}
      />

      {/* Quick Stats */}
      <QuickStats stats={[
        { label: 'Course Progress', value: `${overallPct}%` },
        { label: 'Lessons Done', value: completedCount },
        { label: 'Total Expeditions', value: modules.length },
        { label: 'Streak', value: '7d', change: { positive: true, text: 'Keep it up!' } },
      ]} />

      {/* Free tier upsell banner */}
      {!isSubscribed && (
        <div className="mb-8 p-5 rounded-2xl border border-red-600/30 bg-[#1a1a1a] flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <p className="text-white font-black text-lg leading-snug">🚀 Ready to master the stars?</p>
            <p className="text-slate-300 text-sm mt-1">Unlock full planning tools, guided shoot plans, gear checklists & aurora alerts — from <strong className="text-white">$7.99/month</strong>. Or go Pro at $14.99/mo for instructor access & journal insights.</p>
          </div>
          <Link to={createPageUrl('PaymentGate')}>
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold whitespace-nowrap">
              Begin Your Expedition →
            </Button>
          </Link>
        </div>
      )}

      {/* Free Course Card for non-subscribers */}
      {!isSubscribed && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
            <Star className="w-6 h-6 text-red-400" /> Start Here — Free
          </h2>
          <Link to={createPageUrl('FreeCourse')}>
            <Card className="bg-[#1a1a1a] border border-white/8 hover:border-red-600/40 p-6 card-glow transition-all group">
              <div className="flex items-start gap-5">
                <div className="bg-red-600/15 p-4 rounded-xl flex-shrink-0">
                  <Telescope className="w-8 h-8 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-emerald-600 text-white text-xs">FREE</Badge>
                    <span className="text-slate-300 text-xs">5 lessons · No card required</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 transition-colors">Your First Night Sky Adventure</h3>
                  <p className="text-slate-300 text-sm mb-3">Gear basics, magic camera settings, simple composition, and your first shoot checklist — everything to capture the Milky Way tonight.</p>
                  <p className="text-red-400 text-sm font-medium flex items-center gap-1">Start free course <ChevronRight className="w-4 h-4" /></p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Mission Briefings */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6 text-red-400" /> What Do You Want To Do?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          <ActionCard
            icon={Rocket}
            title="Tonight?"
            description="Top ranked sky events for tonight with viability scores."
            label="Decide now"
            href={createPageUrl('TonightHub')}
            color="emerald"
          />
          <ActionCard
            icon={MapPin}
            title="Sky Planner"
            description="Predict visibility, moon interference & optimal shoot windows."
            label="Plan a shoot"
            href={createPageUrl('PlannerTool')}
            color="purple"
            disabled={!isSubscribed}
          />
          <ActionCard
            icon={Star}
            title="Cosmic Events"
            description="Meteor showers, eclipses, aurora alerts & more events."
            label="See events"
            href={createPageUrl('EventsCalendar')}
            color="yellow"
          />
          <ActionCard
            icon={Sparkles}
            title="Explorer Gallery"
            description="Share your shots with fellow explorers & get feedback."
            label="Explore"
            href={createPageUrl('CommunityGallery')}
            color="blue"
          />
        </div>
      </div>

      {/* Post-Processing Guide */}
      <div className="mb-12">
        <PostProcessingGuide />
      </div>

      {/* Sky Planner Preview for Free Users */}
      {!isSubscribed && (
        <div className="mb-12">
          <SkyPlannerPreview />
        </div>
      )}

      {/* Milky Way Courses Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
          <Rocket className="w-6 h-6 text-red-400" /> Milky Way Courses
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const pct = getModuleProgress(mod.id);
            const iconKeys = Object.keys(MODULE_ICONS);
            const IconComp = MODULE_ICONS[iconKeys[modules.indexOf(mod) % iconKeys.length]];
            return (
              <Link key={mod.id} to={isSubscribed ? createPageUrl('ModuleView') + `?id=${mod.id}` : createPageUrl('PaymentGate')}>
                <Card className={`bg-[#1a1a1a] border border-white/8 hover:border-red-600/40 p-6 card-glow hover:scale-[1.02] transition-all duration-200 relative overflow-hidden h-full ${!isSubscribed ? 'opacity-70' : ''}`}>
                  {mod.is_free_preview && (
                    <Badge className="absolute top-3 right-3 bg-emerald-600 text-white text-xs">FREE</Badge>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <IconComp className="w-10 h-10 text-red-400" />
                    {isSubscribed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <Lock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{mod.title}</h3>
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{mod.description}</p>
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
      </div>
      </div>
    </PullToRefresh>
  );
}