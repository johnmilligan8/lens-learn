import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import {
  ChevronLeft, ChevronRight, CheckCircle2, PlayCircle,
  FileText, Download, Camera
} from 'lucide-react';

export default function LessonView() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const lessonId = params.get('id');
  const moduleId = params.get('moduleId');

  const [lesson, setLesson] = useState(null);
  const [allLessons, setAllLessons] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lessonId) { navigate(createPageUrl('Dashboard')); return; }
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [les, modLessons, prog] = await Promise.all([
        base44.entities.Lesson.filter({ id: lessonId }, 'order', 1).catch(() => []),
        moduleId ? base44.entities.Lesson.filter({ module_id: moduleId }, 'order', 100) : Promise.resolve([]),
        base44.entities.LessonProgress.filter({ user_email: me.email, lesson_id: lessonId }, '-created_date', 1),
      ]);

      if (les.length > 0) {
        setLesson(les[0]);
      } else {
        // Fallback demo lesson
        setLesson({
          id: lessonId,
          module_id: moduleId,
          title: 'Introduction to Night Photography Gear',
          type: 'video',
          video_url: 'https://www.youtube.com/embed/G0YnmWU5HhE',
          content: `## Overview\n\nNight photography requires specific gear to handle low-light conditions and long exposures. In this lesson, we'll cover the fundamentals.\n\n## Camera Body\n\nYou need a camera capable of:\n- Manual mode control\n- High ISO performance (3200+ without too much noise)\n- RAW file format support\n\nFull-frame sensors perform significantly better in low light compared to crop sensors.\n\n## Lenses\n\nFor Milky Way photography you want:\n- **Wide angle**: 14mm–24mm focal length\n- **Fast aperture**: f/2.8 or wider (f/1.8, f/1.4)\n- Manual focus ring\n\n## Tripod & Support\n\nA sturdy tripod is absolutely essential. You'll be shooting exposures of 15–30 seconds, so any movement ruins the shot. Look for:\n- Carbon fiber or aluminum legs\n- Ball head for easy adjustment\n- Leg locks that hold firmly\n\n## Essential Accessories\n\n- **Extra batteries** — cold nights drain them fast\n- **Remote shutter release** — avoids camera shake\n- **Red flashlight** — preserves your night vision\n- **Extra memory cards** — RAW files are large\n\n## Action Items\n\n- Review your current camera's high-ISO performance\n- Research wide-angle lens options for your camera mount\n- Check your tripod for stability on uneven ground`,
          duration: '12:30',
          order: 1,
        });
      }
      setAllLessons(modLessons);
      setCompleted(prog.length > 0 && prog[0].completed);
      setLoading(false);
    };
    load();
  }, [lessonId, moduleId]);

  const handleMarkComplete = async () => {
    const existing = await base44.entities.LessonProgress.filter({
      user_email: user.email, lesson_id: lessonId
    }, '-created_date', 1);

    if (existing.length > 0) {
      await base44.entities.LessonProgress.update(existing[0].id, { completed: !completed });
    } else {
      await base44.entities.LessonProgress.create({
        lesson_id: lessonId,
        module_id: lesson?.module_id || moduleId,
        user_email: user.email,
        completed: true,
      });
    }
    setCompleted(!completed);
  };

  const currentIdx = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Camera className="w-10 h-10 text-purple-400 star-pulse" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" className="text-slate-400 mb-6 hover:text-white" onClick={() => navigate(createPageUrl('ModuleView') + `?id=${moduleId || lesson?.module_id}`)}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Module
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="border-purple-500/50 text-purple-300 capitalize">{lesson?.type}</Badge>
          {lesson?.duration && <span className="text-slate-500 text-sm">{lesson.duration}</span>}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">{lesson?.title}</h1>
      </div>

      {/* Video */}
      {lesson?.video_url && (
        <Card className="bg-black border-slate-800 overflow-hidden mb-8 aspect-video">
          <iframe
            src={lesson.video_url}
            title={lesson.title}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Card>
      )}

      {/* Content */}
      {lesson?.content && (
        <Card className="bg-slate-900/60 border-slate-800 p-8 mb-8">
          <div className="prose prose-invert prose-purple max-w-none text-slate-300 [&_h2]:text-white [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-purple-300 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_li]:mb-1 [&_strong]:text-white [&_p]:mb-4 [&_ul]:ml-6 [&_ul]:list-disc">
            <ReactMarkdown>{lesson.content}</ReactMarkdown>
          </div>
        </Card>
      )}

      {/* Mark Complete & Nav */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Button
          onClick={handleMarkComplete}
          className={completed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-600'}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          {completed ? 'Completed ✓' : 'Mark as Complete'}
        </Button>

        <div className="flex gap-3">
          {prevLesson && (
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => navigate(createPageUrl('LessonView') + `?id=${prevLesson.id}&moduleId=${moduleId}`)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
          )}
          {nextLesson && (
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate(createPageUrl('LessonView') + `?id=${nextLesson.id}&moduleId=${moduleId}`)}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {!nextLesson && (
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => navigate(createPageUrl('ModuleView') + `?id=${moduleId || lesson?.module_id}`)}>
              Finish Module <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}