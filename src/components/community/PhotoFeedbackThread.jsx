import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Send, ThumbsUp, Loader2, Award } from 'lucide-react';

export default function PhotoFeedbackThread({ galleryPostId, postCreatorEmail }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await base44.entities.PhotoFeedback.filter(
          { gallery_post_id: galleryPostId },
          '-created_date',
          50
        );
        setFeedback(data);
      } catch (err) {
        console.error('Failed to load feedback:', err);
      }
      setLoading(false);
    };
    load();
  }, [galleryPostId]);

  const handleSubmitFeedback = async () => {
    if (!comment.trim() || !user) return;
    setSubmitting(true);
    try {
      const newFeedback = await base44.entities.PhotoFeedback.create({
        gallery_post_id: galleryPostId,
        commenter_email: user.email,
        commenter_name: user.full_name || user.email,
        feedback_type: feedbackType,
        comment,
        is_expert: user.role === 'admin',
      });
      setFeedback([newFeedback, ...feedback]);
      setComment('');
      setFeedbackType('general');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
    setSubmitting(false);
  };

  const handleMarkHelpful = async (feedbackId, currentHelpful, currentHelpfulBy) => {
    if (!user) return;
    const alreadyMarked = currentHelpfulBy?.includes(user.email);
    const newHelpfulBy = alreadyMarked
      ? currentHelpfulBy.filter(e => e !== user.email)
      : [...(currentHelpfulBy || []), user.email];
    const newCount = newHelpfulBy.length;

    try {
      await base44.entities.PhotoFeedback.update(feedbackId, {
        helpful_count: newCount,
        helpful_by: newHelpfulBy,
      });
      setFeedback(feedback.map(f => f.id === feedbackId ? { ...f, helpful_count: newCount, helpful_by: newHelpfulBy } : f));
    } catch (err) {
      console.error('Failed to mark helpful:', err);
    }
  };

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
      <h3 className="text-white font-bold text-lg">Community Feedback</h3>

      {/* Comment Input */}
      {user ? (
        <div className="bg-slate-800/40 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-slate-300 text-xs font-semibold mb-2 block">Feedback Type</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'general', label: 'General' },
                { value: 'technical', label: 'Technical' },
                { value: 'composition', label: 'Composition' },
                { value: 'processing', label: 'Processing' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFeedbackType(opt.value)}
                  className={`py-2 px-2 rounded text-xs font-semibold transition-all ${
                    feedbackType === opt.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your thoughts, tips, or questions about this photo..."
            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-purple-500 h-20 resize-none"
          />
          <Button
            onClick={handleSubmitFeedback}
            disabled={!comment.trim() || submitting}
            className="w-full bg-purple-600 hover:bg-purple-700 h-9 font-semibold"
          >
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...</> : <><Send className="w-4 h-4 mr-2" /> Share Feedback</>}
          </Button>
        </div>
      ) : (
        <div className="bg-slate-800/40 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm">Login to share feedback on this photo.</p>
        </div>
      )}

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center gap-2 justify-center py-4">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading feedback...</p>
        </div>
      ) : feedback.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-500 text-sm">No feedback yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map(fb => (
            <div key={fb.id} className={`rounded-lg border p-3 space-y-2 ${fb.is_expert ? 'bg-amber-900/20 border-amber-500/40' : 'bg-slate-800/30 border-slate-700'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {fb.commenter_name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold flex items-center gap-2">
                      {fb.commenter_name}
                      {fb.is_expert && <Award className="w-3.5 h-3.5 text-amber-400" />}
                    </p>
                    <Badge variant="outline" className="text-xs bg-slate-800/60 border-slate-600 text-slate-300">
                      {fb.feedback_type}
                    </Badge>
                  </div>
                </div>
                <p className="text-slate-500 text-xs">{new Date(fb.created_date).toLocaleDateString()}</p>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{fb.comment}</p>
              <button
                onClick={() => handleMarkHelpful(fb.id, fb.helpful_count, fb.helpful_by)}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                  user && fb.helpful_by?.includes(user.email)
                    ? 'text-blue-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> {fb.helpful_count || 0}
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}