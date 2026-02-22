import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Telescope, Settings, Eye, MapPin, Palette, Sparkles,
  ChevronRight, Trophy, Clock, TrendingUp, BookOpen,
  Star, Rocket, Camera, Zap
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [mods, prog] = await Promise.all([
        base44.entities.Module.list('order', 50),
        base44.entities.LessonProgress.filter({ user_email: me.email }, '-created_date', 200),
      ]);
      setModules(mods.length > 0 ? mods : FALLBACK_MODULES);
      setProgress(prog);
      setLoading(false);
    };
    load();
  }, []);

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

      {/* Course Modules heading */}
      <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
        <Rocket className="w-6 h-6 text-purple-400" /> Your Expeditions
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {modules.map((mod) => {
          const modColor = mod.color || 'purple';
          const pct = getModuleProgress(mod.id);
          const iconKeys = Object.keys(MODULE_ICONS);
          const IconComp = MODULE_ICONS[iconKeys[modules.indexOf(mod) % iconKeys.length]];
          return (
            <Link key={mod.id} to={createPageUrl('ModuleView') + `?id=${mod.id}`}>
              <Card className={`bg-gradient-to-br ${COLOR_MAP[modColor]} border p-6 card-glow hover:scale-[1.02] transition-all duration-200 relative overflow-hidden h-full`}>
                {mod.is_free_preview && (
                  <Badge className="absolute top-3 right-3 bg-emerald-600 text-white text-xs">FREE</Badge>
                )}
                <div className="flex items-start justify-between mb-4">
                  <IconComp className={`w-10 h-10 ${ICON_COLOR[modColor]}`} />
                  <ChevronRight className="w-4 h-4 text-slate-500" />
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
      <h2 className="text-2xl font-bold text-white mb-5 flex items-center gap-2">
        <Telescope className="w-6 h-6 text-blue-400" /> Quick Actions
      </h2>
      <div className="grid md:grid-cols-2 gap-5">
        <Link to={createPageUrl('PlannerTool')}>
          <Card className="bg-slate-900/60 border-slate-800 p-6 card-glow hover:border-purple-500/40 transition-all group">
            <div className="flex items-center gap-4">
              <div className="bg-purple-600/20 p-4 rounded-xl"><MapPin className="w-7 h-7 text-purple-400" /></div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Milky Way Planner</h3>
                <p className="text-slate-400 text-sm">Check visibility for your next shoot</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to={createPageUrl('CommunityGallery')}>
          <Card className="bg-slate-900/60 border-slate-800 p-6 card-glow hover:border-blue-500/40 transition-all group">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600/20 p-4 rounded-xl"><Sparkles className="w-7 h-7 text-blue-400" /></div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Community Gallery</h3>
                <p className="text-slate-400 text-sm">Share your shots & get feedback</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}