import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  PlayCircle, FileText, HelpCircle, CheckCircle2, Clock,
  ChevronLeft, ChevronRight, BookOpen, Lock
} from 'lucide-react';

const FALLBACK_LESSONS = [
  { id:'l1', title:'Introduction & Overview', type:'video', duration:'10:00', order:1 },
  { id:'l2', title:'Core Concepts Explained', type:'video', duration:'18:30', order:2 },
  { id:'l3', title:'Hands-On Techniques', type:'video', duration:'22:15', order:3 },
  { id:'l4', title:'Written Guide & Reference', type:'article', duration:'8 min read', order:4 },
  { id:'l5', title:'Practical Tips & Tricks', type:'video', duration:'15:20', order:5 },
  { id:'l6', title:'Common Mistakes to Avoid', type:'article', duration:'6 min read', order:6 },
  { id:'l7', title:'Resources & Checklist', type:'article', duration:'5 min read', order:7 },
  { id:'l8', title:'Module Quiz', type:'quiz', duration:'10 questions', order:8 },
];

const LESSON_ICONS = { video: PlayCircle, article: FileText, quiz: HelpCircle };

export default function ModuleView() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const moduleId = params.get('id');

  const [module, setModule] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleId) { navigate(createPageUrl('Dashboard')); return; }
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [mods, les, prog] = await Promise.all([
        base44.entities.Module.list('order', 50),
        base44.entities.Lesson.filter({ module_id: moduleId }, 'order', 100),
        base44.entities.LessonProgress.filter({ user_email: me.email, module_id: moduleId }, '-created_date', 100),
      ]);
      const mod = mods.find(m => m.id === moduleId);
      setModule(mod || { id: moduleId, title: 'Module', color: 'purple' });
      setLessons(les.length > 0 ? les : FALLBACK_LESSONS);
      setProgress(prog);
      setLoading(false);
    };
    load();
  }, [moduleId]);

  const isCompleted = (lessonId) => progress.some(p => p.lesson_id === lessonId && p.completed);
  const completedCount = lessons.filter(l => isCompleted(l.id)).length;
  const pct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <BookOpen className="w-10 h-10 text-purple-400 star-pulse" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" className="text-slate-400 mb-6 hover:text-white" onClick={() => navigate(createPageUrl('Dashboard'))}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Button>

      {/* Module Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3">{module?.title}</h1>
        {module?.description && <p className="text-slate-400 text-lg mb-6">{module.description}</p>}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">PROGRESS</p>
            <p className="text-2xl font-bold text-white">{pct}%</p>
          </div>
          <div className="flex-1 max-w-sm">
            <Progress value={pct} className="h-2" />
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">COMPLETED</p>
            <p className="text-2xl font-bold text-white">{completedCount}/{lessons.length}</p>
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {lessons.map((lesson, idx) => {
          const done = isCompleted(lesson.id);
          const Icon = LESSON_ICONS[lesson.type] || PlayCircle;
          return (
            <div
              key={lesson.id}
              className="cursor-pointer"
              onClick={() => navigate(createPageUrl('LessonView') + `?id=${lesson.id}&moduleId=${moduleId}`)}
            >
              <Card className={`border p-5 hover:scale-[1.01] transition-all group ${
                done
                  ? 'bg-emerald-900/10 border-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-purple-500/40'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${done ? 'bg-emerald-600/20' : 'bg-purple-600/20'}`}>
                    {done
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      : <Icon className="w-5 h-5 text-purple-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold group-hover:text-purple-300 transition-colors truncate">{lesson.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-400 capitalize">{lesson.type}</Badge>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.duration}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {pct === 100 && (
        <Card className="mt-8 bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-500/40 p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-white mb-2">Module Complete! 🎉</h3>
          <p className="text-slate-400">You've mastered this module. Keep going!</p>
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate(createPageUrl('Dashboard'))}>
            Back to Dashboard
          </Button>
        </Card>
      )}
    </div>
  );
}