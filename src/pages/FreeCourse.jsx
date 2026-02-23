import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play, BookOpen, CheckSquare, ChevronRight, Lock,
  Star, Rocket, Camera, MapPin, Telescope, Zap, Check
} from 'lucide-react';

const FREE_LESSONS = [
  {
    id: 'free-1',
    title: 'Welcome to the Galaxy',
    type: 'video',
    duration: '8 min',
    description: "What astrophotography is, why Utah's dark skies are world-class, and your first steps.",
    video_url: 'https://www.youtube.com/embed/7gD9OFJCYCc',
    completed: false,
  },
  {
    id: 'free-2',
    title: 'Gear Essentials for Beginners',
    type: 'article',
    duration: '10 min read',
    description: 'Camera body, lenses (fast wide-angle f/1.8–f/2.8), tripods, and what NOT to buy yet.',
    completed: false,
  },
  {
    id: 'free-3',
    title: 'The Magic Camera Settings',
    type: 'video',
    duration: '12 min',
    description: 'The "500 Rule", ISO 3200–6400, f/2.8, 20–25 second exposures explained simply.',
    video_url: 'https://www.youtube.com/embed/6E5dpxiW6DU',
    completed: false,
  },
  {
    id: 'free-4',
    title: 'Simple Composition Tips',
    type: 'article',
    duration: '8 min read',
    description: 'Rule of thirds, leading lines, using foreground interest to frame the Milky Way.',
    completed: false,
  },
  {
    id: 'free-5',
    title: 'Your First Shoot Checklist',
    type: 'quiz',
    duration: '5 min',
    description: 'Gear checklist, location prep, and a quick quiz to confirm you\'re ready to go out tonight.',
    completed: false,
  },
];

const DARK_SKY_SPOTS = [
  { name: 'Bonneville Salt Flats', distance: '1.5 hrs from SLC', bortle: 2, tip: 'Perfect flat foreground, Milky Way core reflects in wet season.' },
  { name: 'Stansbury Island', distance: '45 min from SLC', bortle: 3, tip: 'Easy access, great mountain silhouette foreground.' },
  { name: 'Little Sahara Recreation Area', distance: '2 hrs from SLC', bortle: 2, tip: 'Sand dunes create stunning foreground textures.' },
  { name: 'Capitol Reef National Park', distance: '3.5 hrs from SLC', bortle: 1, tip: 'Gold Tier dark sky. Plan an overnight trip.' },
];

const ARTICLE_CONTENT = {
  'free-2': `## Essential Gear for Your First Night Sky Shoot

### The Camera
Any modern DSLR or mirrorless camera with **manual mode** will work. You don't need the latest model — a Canon Rebel, Sony A6000, or Nikon D3500 are all excellent starting points.

### The Most Important Piece: Your Lens
This is where budget matters. You want a **fast wide-angle lens**:
- **Focal length**: 14mm – 24mm (full-frame equivalent)
- **Aperture**: f/1.8 – f/2.8 (wider = more light = better)
- **Recommended**: Rokinon/Samyang 14mm f/2.8 (~$300) — the go-to beginner lens

### Tripod
**Non-negotiable.** Any sturdy tripod works. Ball heads make framing easier. Budget: $50–$150.

### What NOT to Buy Yet
- Tracking mounts (learn fixed tripod first)
- Filters (not needed for basic Milky Way)
- New camera body (your existing one is fine)

### The "500 Rule" Settings to Start
| Setting | Value |
|---------|-------|
| ISO | 3200–6400 |
| Aperture | f/2.8 (or widest) |
| Shutter | 20–25 seconds |
| Focus | Manual, set to ∞ then back slightly |
`,
  'free-4': `## Simple Composition for Night Sky Photography

### Rule of Thirds
Imagine your frame divided into a 3×3 grid. Place the **horizon on the lower third** and the Milky Way's galactic core on one of the vertical third lines. Never center everything — it looks static.

### Use a Foreground Subject
The Milky Way alone looks flat. Add:
- A lone tree or Joshua tree
- Rocky formations or boulders
- A road or path leading into the frame
- A person (use a headlamp for a "light painting" silhouette)

### Leading Lines
Roads, rivers, fence lines, and canyon walls all naturally draw the eye toward the sky. Find them during daylight scouting.

### Silhouettes Work Best
Keep foreground elements as **dark silhouettes** against the starry sky. Bright foregrounds distract from the stars.

### Golden Tip: Scout in Daylight
Visit your location during the day. Check composition, note hazards, and confirm your exact setup position so you're not fumbling in the dark at 2am.
`,
};

const QUIZ_QUESTIONS = [
  { q: 'What is the recommended minimum aperture for Milky Way photography?', options: ['f/8', 'f/4', 'f/2.8', 'f/16'], answer: 2 },
  { q: 'What does the "500 Rule" help you determine?', options: ['ISO setting', 'Maximum shutter speed before star trails', 'Aperture size', 'White balance'], answer: 1 },
  { q: 'Which moon phase is best for Milky Way photography?', options: ['Full Moon', 'Quarter Moon', 'New Moon', 'Any phase works'], answer: 2 },
  { q: 'What Bortle scale number represents the darkest possible sky?', options: ['9', '5', '1', '3'], answer: 2 },
];

export default function FreeCourse() {
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me.role === 'admin') {
        setIsSubscribed(true);
      } else {
        const subs = await base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1);
        setIsSubscribed(subs.length > 0);
      }
      const prog = await base44.entities.LessonProgress.filter({ user_email: me.email, module_id: 'free-module' });
      setCompletedLessons(prog.filter(p => p.completed).map(p => p.lesson_id));
      setLoading(false);
    };
    init();
  }, []);

  const markComplete = async (lessonId) => {
    if (completedLessons.includes(lessonId)) return;
    await base44.entities.LessonProgress.create({
      lesson_id: lessonId,
      module_id: 'free-module',
      user_email: user.email,
      completed: true,
    });
    setCompletedLessons(prev => [...prev, lessonId]);
  };

  const completedCount = completedLessons.length;
  const pct = Math.round((completedCount / FREE_LESSONS.length) * 100);

  const typeIcon = (type) => {
    if (type === 'video') return <Play className="w-4 h-4 text-purple-400" />;
    if (type === 'article') return <BookOpen className="w-4 h-4 text-blue-400" />;
    return <CheckSquare className="w-4 h-4 text-green-400" />;
  };

  const quizScore = QUIZ_QUESTIONS.filter((q, i) => quizAnswers[i] === q.answer).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Telescope className="w-10 h-10 text-red-400 star-pulse" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/30 rounded-full px-3 py-1 mb-4">
          <Star className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-300 text-xs font-semibold uppercase tracking-widest">Free Starter Course</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Your First Night Sky Adventure</h1>
        <p className="text-slate-400 text-lg mb-6">5 lessons to get you from zero to your first Milky Way photo. No gear required to start.</p>
        <div className="flex items-center gap-4 mb-3">
          <Progress value={pct} className="flex-1 h-2" />
          <span className="text-white font-bold text-sm w-12">{pct}%</span>
        </div>
        <p className="text-slate-500 text-sm">{completedCount} of {FREE_LESSONS.length} lessons complete</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Lesson List */}
        <div className="lg:col-span-1 space-y-2">
          {FREE_LESSONS.map((lesson, idx) => {
            const done = completedLessons.includes(lesson.id);
            const active = activeLesson?.id === lesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  active
                    ? 'bg-purple-900/40 border-purple-500/50 text-white'
                    : done
                    ? 'bg-slate-900/40 border-slate-700/40 text-slate-400'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-300 hover:border-red-600/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    done ? 'bg-emerald-600 text-white' : active ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {done ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{lesson.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {typeIcon(lesson.type)}
                      <span className="text-xs text-slate-500">{lesson.duration}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {/* Upgrade CTA in sidebar */}
          {!isSubscribed && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-600/40">
              <Lock className="w-5 h-5 text-red-400 mb-2" />
              <p className="text-white text-sm font-bold mb-1">5 More Modules Locked</p>
              <p className="text-purple-200/80 text-xs mb-3">Camera mastery, composition, post-processing, advanced techniques & more.</p>
              <Link to={createPageUrl('PaymentGate')}>
                <Button className="w-full bg-red-600 hover:bg-red-700 text-xs h-8">
                  Unlock Full Course →
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Lesson Content */}
        <div className="lg:col-span-2">
          {!activeLesson ? (
            <Card className="bg-slate-900/60 border-slate-800 p-8 text-center">
              <Telescope className="w-12 h-12 text-purple-400 mx-auto mb-4 star-pulse" />
              <h3 className="text-xl font-bold text-white mb-2">Select a lesson to begin</h3>
              <p className="text-slate-400">Choose any lesson from the list to start your expedition.</p>
              <Button className="mt-6 bg-red-600 hover:bg-red-700" onClick={() => setActiveLesson(FREE_LESSONS[0])}>
                Start Lesson 1 →
              </Button>
            </Card>
          ) : (
            <div>
              <Card className="bg-slate-900/60 border-slate-800 overflow-hidden">
                {/* Lesson Header */}
                <div className="p-6 border-b border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                    {typeIcon(activeLesson.type)}
                    <span className="text-slate-400 text-sm capitalize">{activeLesson.type}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-300 text-sm">{activeLesson.duration}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{activeLesson.title}</h2>
                  <p className="text-slate-300 mt-1">{activeLesson.description}</p>
                </div>

                {/* Video */}
                {activeLesson.type === 'video' && activeLesson.video_url && (
                  <div className="aspect-video">
                    <iframe
                      src={activeLesson.video_url}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Article */}
                {activeLesson.type === 'article' && (
                  <div className="p-6 prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white prose-table:text-slate-300">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: ARTICLE_CONTENT[activeLesson.id]
                          ? ARTICLE_CONTENT[activeLesson.id]
                              .replace(/## (.*)/g, '<h2>$1</h2>')
                              .replace(/### (.*)/g, '<h3>$1</h3>')
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n\n/g, '<br/><br/>')
                              .replace(/- (.*)/g, '<li>$1</li>')
                          : `<p>${activeLesson.description}</p>`
                      }}
                    />
                  </div>
                )}

                {/* Quiz */}
                {activeLesson.type === 'quiz' && (
                  <div className="p-6">
                    {!quizSubmitted ? (
                      <>
                        <h3 className="text-lg font-bold text-white mb-6">Beginner's Night Sky Quiz</h3>
                        <div className="space-y-6">
                          {QUIZ_QUESTIONS.map((q, qi) => (
                            <div key={qi}>
                              <p className="text-slate-200 font-medium mb-3">{qi + 1}. {q.q}</p>
                              <div className="grid grid-cols-2 gap-2">
                                {q.options.map((opt, oi) => (
                                  <button
                                    key={oi}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                    className={`p-3 rounded-lg border text-sm text-left transition-all ${
                                      quizAnswers[qi] === oi
                                        ? 'border-red-600 bg-red-900/30 text-white'
                                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          className="mt-6 bg-red-600 hover:bg-red-700"
                          disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                          onClick={() => setQuizSubmitted(true)}
                        >
                          Submit Quiz
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className={`text-6xl font-black mb-4 ${quizScore >= 3 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                          {quizScore}/{QUIZ_QUESTIONS.length}
                        </div>
                        <p className="text-white text-xl font-bold mb-2">
                          {quizScore === 4 ? '🌟 Perfect Score!' : quizScore >= 3 ? '🎉 Great work, Explorer!' : '📚 Keep studying!'}
                        </p>
                        <p className="text-slate-400 mb-6">
                          {quizScore >= 3
                            ? "You're ready for your first night shoot. Check out the dark sky spots below!"
                            : 'Review the lessons above and try again when ready.'}
                        </p>
                        <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}>
                          Retake Quiz
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Mark Complete */}
                <div className="p-6 border-t border-slate-800 flex items-center justify-between">
                  <Button
                    variant="outline"
                    className={`border-slate-600 ${completedLessons.includes(activeLesson.id) ? 'text-emerald-400 border-emerald-600' : 'text-slate-300'}`}
                    onClick={() => markComplete(activeLesson.id)}
                    disabled={completedLessons.includes(activeLesson.id)}
                  >
                    {completedLessons.includes(activeLesson.id) ? '✓ Completed' : 'Mark as Complete'}
                  </Button>
                  {FREE_LESSONS.findIndex(l => l.id === activeLesson.id) < FREE_LESSONS.length - 1 && (
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        const idx = FREE_LESSONS.findIndex(l => l.id === activeLesson.id);
                        markComplete(activeLesson.id);
                        setActiveLesson(FREE_LESSONS[idx + 1]);
                      }}
                    >
                      Next Lesson <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Dark Sky Spots (always visible) */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" /> Utah Dark Sky Locations
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {DARK_SKY_SPOTS.map((spot, i) => (
                <Card key={i} className="bg-slate-900/60 border-slate-800 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-semibold text-sm">{spot.name}</h4>
                    <Badge className="bg-purple-900/60 text-purple-300 border-purple-700 text-xs">Bortle {spot.bortle}</Badge>
                  </div>
                  <p className="text-slate-500 text-xs mb-2">{spot.distance}</p>
                  <p className="text-slate-400 text-xs">{spot.tip}</p>
                </Card>
              ))}
            </div>
            {!isSubscribed && (
              <div className="mt-4 p-5 rounded-xl border border-dashed border-purple-500/40 bg-purple-900/10 text-center">
                <Lock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-bold mb-1">Full Dark Sky Guide + 50+ Locations</p>
                <p className="text-slate-400 text-sm mb-3">Detailed GPS coordinates, seasonal guides, hazard notes & insider tips — unlocked with any paid plan.</p>
                <Link to={createPageUrl('PaymentGate')}>
                <Button className="bg-red-600 hover:bg-red-700">Upgrade to Explorer — $19/mo</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}