import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen, Plus, Image, Users, CheckCircle2, Clock,
  MessageSquare, Eye, Trash2, Edit2, Loader2, Camera
} from 'lucide-react';
import { format } from 'date-fns';

export default function InstructorDashboard() {
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order: 1, color: 'purple', is_free_preview: false });
  const [lessonForm, setLessonForm] = useState({ module_id: '', title: '', description: '', type: 'video', video_url: '', content: '', duration: '', order: 1 });

  useEffect(() => {
    const load = async () => {
      const [mods, les, subs, subsc] = await Promise.all([
        base44.entities.Module.list('order', 50),
        base44.entities.Lesson.list('order', 200),
        base44.entities.PhotoSubmission.list('-created_date', 50),
        base44.entities.Subscription.filter({ status: 'active' }, '-created_date', 100),
      ]);
      setModules(mods);
      setLessons(les);
      setSubmissions(subs);
      setSubscribers(subsc);
      setLoading(false);
    };
    load();
  }, []);

  const createModule = async () => {
    const mod = await base44.entities.Module.create(moduleForm);
    setModules([...modules, mod]);
    setModuleForm({ title: '', description: '', order: modules.length + 1, color: 'purple', is_free_preview: false });
    setShowModuleForm(false);
  };

  const createLesson = async () => {
    const les = await base44.entities.Lesson.create(lessonForm);
    setLessons([...lessons, les]);
    setLessonForm({ module_id: '', title: '', description: '', type: 'video', video_url: '', content: '', duration: '', order: 1 });
    setShowLessonForm(false);
  };

  const deleteModule = async (id) => {
    await base44.entities.Module.delete(id);
    setModules(modules.filter(m => m.id !== id));
  };

  const submitFeedback = async () => {
    setSavingFeedback(true);
    const me = await base44.auth.me();
    await base44.entities.PhotoSubmission.update(selectedSubmission.id, {
      status: 'reviewed',
      instructor_feedback: feedback,
      reviewed_by: me.email,
    });
    setSubmissions(submissions.map(s => s.id === selectedSubmission.id
      ? { ...s, status: 'reviewed', instructor_feedback: feedback }
      : s
    ));
    setSelectedSubmission(null);
    setFeedback('');
    setSavingFeedback(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Camera className="w-10 h-10 text-purple-400 star-pulse" />
    </div>
  );

  const pendingSubs = submissions.filter(s => s.status === 'pending');
  const reviewedSubs = submissions.filter(s => s.status === 'reviewed');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Instructor Dashboard</h1>
        <p className="text-slate-400">Manage course content and student submissions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Modules', value: modules.length, icon: BookOpen, color: 'text-purple-400' },
          { label: 'Lessons', value: lessons.length, icon: Eye, color: 'text-blue-400' },
          { label: 'Active Students', value: subscribers.length, icon: Users, color: 'text-emerald-400' },
          { label: 'Pending Reviews', value: pendingSubs.length, icon: Clock, color: 'text-yellow-400' },
        ].map(s => (
          <Card key={s.label} className="bg-slate-900/60 border-slate-800 p-5">
            <s.icon className={`w-7 h-7 ${s.color} mb-2`} />
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="content">
        <TabsList className="bg-slate-900 border-slate-700 mb-6">
          <TabsTrigger value="content" className="data-[state=active]:bg-purple-600">Course Content</TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-purple-600">
            Submissions
            {pendingSubs.length > 0 && <Badge className="ml-2 bg-yellow-600 text-white text-xs">{pendingSubs.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content">
          <div className="flex gap-4 mb-6">
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowModuleForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Module
            </Button>
            <Button variant="outline" className="border-slate-700 text-slate-300" onClick={() => setShowLessonForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Lesson
            </Button>
          </div>

          <div className="space-y-4">
            {modules.map(mod => {
              const modLessons = lessons.filter(l => l.module_id === mod.id);
              return (
                <Card key={mod.id} className="bg-slate-900/60 border-slate-800 p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold text-lg">{mod.title}</h3>
                        {mod.is_free_preview && <Badge className="bg-emerald-600 text-white text-xs">FREE</Badge>}
                      </div>
                      {mod.description && <p className="text-slate-400 text-sm">{mod.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => deleteModule(mod.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-slate-500">
                    {modLessons.length} lessons
                    {modLessons.length > 0 && (
                      <div className="mt-2 ml-4 space-y-1">
                        {modLessons.map(l => (
                          <p key={l.id} className="text-slate-400">• {l.title} <span className="text-slate-600">({l.type}, {l.duration})</span></p>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <div className="space-y-4">
            {pendingSubs.length === 0 && reviewedSubs.length === 0 && (
              <Card className="bg-slate-900/60 border-slate-800 p-12 text-center">
                <Image className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500">No student submissions yet.</p>
              </Card>
            )}

            {pendingSubs.length > 0 && (
              <>
                <h3 className="text-yellow-400 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pending Review ({pendingSubs.length})
                </h3>
                {pendingSubs.map(sub => (
                  <Card key={sub.id} className="bg-yellow-900/10 border-yellow-500/30 p-5">
                    <div className="flex items-center gap-4">
                      {sub.photo_url && <img src={sub.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-white font-medium">{sub.user_name || sub.user_email}</p>
                        {sub.lesson_title && <p className="text-slate-400 text-sm">Lesson: {sub.lesson_title}</p>}
                        {sub.caption && <p className="text-slate-400 text-sm mt-1">{sub.caption}</p>}
                        <p className="text-slate-500 text-xs mt-1">{format(new Date(sub.created_date), 'MMM d, yyyy')}</p>
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700 flex-shrink-0" onClick={() => { setSelectedSubmission(sub); setFeedback(''); }}>
                        <MessageSquare className="w-4 h-4 mr-2" /> Review
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}

            {reviewedSubs.length > 0 && (
              <>
                <h3 className="text-emerald-400 font-semibold flex items-center gap-2 mt-6">
                  <CheckCircle2 className="w-4 h-4" /> Reviewed ({reviewedSubs.length})
                </h3>
                {reviewedSubs.map(sub => (
                  <Card key={sub.id} className="bg-emerald-900/10 border-emerald-500/20 p-5 opacity-80">
                    <div className="flex items-center gap-4">
                      {sub.photo_url && <img src={sub.photo_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="text-white font-medium">{sub.user_name || sub.user_email}</p>
                        <p className="text-slate-400 text-sm italic mt-1">"{sub.instructor_feedback}"</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Module Dialog */}
      <Dialog open={showModuleForm} onOpenChange={setShowModuleForm}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader><DialogTitle className="text-white">Add Module</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-slate-300 mb-2 block">Title *</Label>
              <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div><Label className="text-slate-300 mb-2 block">Description</Label>
              <Textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-300 mb-2 block">Order</Label>
                <Input type="number" value={moduleForm.order} onChange={e => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div><Label className="text-slate-300 mb-2 block">Color</Label>
                <Select value={moduleForm.color} onValueChange={v => setModuleForm({ ...moduleForm, color: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {['purple','blue','indigo','violet','fuchsia','pink'].map(c => <SelectItem key={c} value={c} className="text-white capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={createModule} disabled={!moduleForm.title}>Create Module</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lesson Dialog */}
      <Dialog open={showLessonForm} onOpenChange={setShowLessonForm}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader><DialogTitle className="text-white">Add Lesson</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-slate-300 mb-2 block">Module *</Label>
              <Select value={lessonForm.module_id} onValueChange={v => setLessonForm({ ...lessonForm, module_id: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {modules.map(m => <SelectItem key={m.id} value={m.id} className="text-white">{m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-slate-300 mb-2 block">Title *</Label>
              <Input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-slate-300 mb-2 block">Type</Label>
                <Select value={lessonForm.type} onValueChange={v => setLessonForm({ ...lessonForm, type: v })}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {['video','article','quiz'].map(t => <SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-300 mb-2 block">Duration</Label>
                <Input placeholder="e.g. 15:30" value={lessonForm.duration} onChange={e => setLessonForm({ ...lessonForm, duration: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div><Label className="text-slate-300 mb-2 block">Order</Label>
                <Input type="number" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            </div>
            {lessonForm.type === 'video' && (
              <div><Label className="text-slate-300 mb-2 block">Video URL (YouTube embed)</Label>
                <Input placeholder="https://www.youtube.com/embed/..." value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} className="bg-slate-800 border-slate-700 text-white" />
              </div>
            )}
            <div><Label className="text-slate-300 mb-2 block">Content (Markdown)</Label>
              <Textarea value={lessonForm.content} onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })} className="bg-slate-800 border-slate-700 text-white" rows={5} placeholder="## Overview..." />
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={createLesson} disabled={!lessonForm.title || !lessonForm.module_id}>Create Lesson</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-lg">
          <DialogHeader><DialogTitle className="text-white">Review Submission</DialogTitle></DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4 mt-2">
              {selectedSubmission.photo_url && (
                <img src={selectedSubmission.photo_url} alt="" className="w-full rounded-lg max-h-60 object-cover" />
              )}
              <div className="bg-slate-800/60 rounded-lg p-4">
                <p className="text-white font-medium">{selectedSubmission.user_name}</p>
                {selectedSubmission.caption && <p className="text-slate-400 text-sm mt-1">{selectedSubmission.caption}</p>}
                {selectedSubmission.camera_settings && <p className="text-slate-500 text-xs mt-1">📷 {selectedSubmission.camera_settings}</p>}
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Your Feedback</Label>
                <Textarea
                  placeholder="Share specific, encouraging feedback about their composition, settings, technique..."
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  rows={4}
                />
              </div>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={submitFeedback}
                disabled={!feedback || savingFeedback}
              >
                {savingFeedback ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Submit Feedback'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}