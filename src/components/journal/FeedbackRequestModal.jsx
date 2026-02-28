import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { X, Send, Loader2 } from 'lucide-react';

export default function FeedbackRequestModal({ session, userEmail, onClose, onSent }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      // Create feedback request record linked to session
      await base44.entities.PhotoFeedback.create({
        gallery_post_id: session.id || 'session-' + session.date,
        commenter_email: 'instructor-request',
        commenter_name: 'You',
        feedback_type: 'general',
        comment: `[Feedback Request on ${session.date}]\n\nQuestion: ${question}\n\nSession details: ${session.location || 'Unknown location'}, ${session.event_type || 'General'} | Outcome: ${session.outcome || 'Not set'}`,
        is_expert: false,
      });
      setSuccess(true);
      setTimeout(() => {
        onSent?.();
        onClose?.();
      }, 1500);
    } catch (e) {
      console.error('Error submitting feedback request:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#1a1a1a] border border-slate-700/40 rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/40">
          <div>
            <p className="text-red-400 text-xs font-black uppercase tracking-widest">Request Feedback</p>
            <p className="text-slate-400 text-xs mt-1">{session.location || 'Your Session'} — {session.date}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!success ? (
          <div className="p-4 space-y-4">
            <p className="text-slate-300 text-xs leading-relaxed">
              Ask an instructor a specific question about your session. They'll review your notes and provide personalized advice.
            </p>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g., 'Why is the Milky Way so dim in my test shot? Did I miss the best time?'"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-700 min-h-24 resize-none"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="w-full border-slate-700 text-slate-400 hover:bg-white/5 text-xs"
                >
                  Cancel
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={loading || !question.trim()}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs gap-1.5 font-bold"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-3xl mb-2">✓</p>
            <p className="text-white font-semibold text-sm mb-1">Request Sent!</p>
            <p className="text-slate-400 text-xs">An instructor will review your session and respond within 24–48 hours.</p>
          </div>
        )}
      </div>
    </div>
  );
}