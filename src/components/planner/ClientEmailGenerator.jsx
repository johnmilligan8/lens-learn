import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Copy, X, CheckCircle2 } from 'lucide-react';

export default function ClientEmailGenerator({ onSave }) {
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    session_date: '',
    session_time: '',
    location: '',
    session_type: 'shoot',
    custom_notes: ''
  });
  const [generatedEmail, setGeneratedEmail] = useState(null);

  const generateEmail = () => {
    const template = `Hi ${formData.client_name || '[Client Name]'},

Excited for your ${formData.session_type} on ${formData.session_date || '[Date]'}${formData.session_time ? ` at ${formData.session_time}` : ''} at ${formData.location || '[Location]'}.

**What to Expect:**
• Weather-dependent conditions – celestial objects may not be visible due to clouds
• Bring warm layers, hat, gloves – nights get cold fast
• Bring a red/white headlamp or flashlight for field setup
• No guarantees on aurora, Milky Way, or meteor visibility
• Camera equipment is sensitive – we'll handle setup carefully

**Important:**
If your photos will include people or models in the foreground, please sign a model release form before the session. You can use our template or provide your own.

**What to Bring:**
• Valid ID
• Comfortable, warm clothing
• Snacks/water as desired
• Phone or camera for personal photos

${formData.custom_notes ? `\n**Additional Notes:**\n${formData.custom_notes}\n` : ''}
Looking forward to exploring the night sky with you. See you soon!

Best,
[Your Name]`;
    
    setGeneratedEmail(template);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onSave?.(formData);
    setShowForm(false);
  };

  if (generatedEmail) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" /> Client Expectations Email
          </h3>
          <Button
            onClick={() => {
              setGeneratedEmail(null);
              setFormData({ client_name: '', session_date: '', session_time: '', location: '', session_type: 'shoot', custom_notes: '' });
            }}
            size="icon"
            variant="ghost"
            className="w-6 h-6 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-slate-800/60 rounded-lg p-4 mb-4 max-h-72 overflow-y-auto">
          <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-mono">{generatedEmail}</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            size="sm"
            className={`flex-1 h-9 text-xs ${copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {copied ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Copied!</>
            ) : (
              <><Copy className="w-3 h-3 mr-1" /> Copy to Clipboard</>
            )}
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800/50 h-9 text-xs"
          >
            Save to Kit
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Mail className="w-4 h-4 text-blue-400" /> Client Expectations Email
        </h3>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            size="sm"
            variant="outline"
            className="border-blue-500/40 text-blue-300 hover:bg-blue-900/20 text-xs"
          >
            Generate
          </Button>
        )}
      </div>

      {!showForm && (
        <p className="text-slate-500 text-xs">Auto-generate a professional session expectations email for your client or workshop participant.</p>
      )}

      {showForm && (
        <div className="space-y-3">
          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Client Name</Label>
            <Input
              placeholder="Jane Doe"
              value={formData.client_name}
              onChange={e => setFormData({ ...formData, client_name: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white text-sm h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs uppercase mb-1 block">Date</Label>
              <Input
                type="date"
                value={formData.session_date}
                onChange={e => setFormData({ ...formData, session_date: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-sm h-8"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs uppercase mb-1 block">Time</Label>
              <Input
                type="time"
                value={formData.session_time}
                onChange={e => setFormData({ ...formData, session_time: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-sm h-8"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Location</Label>
            <Input
              placeholder="Antelope Island, Antelope Island State Park"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white text-sm h-8"
            />
          </div>

          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Session Type</Label>
            <Select value={formData.session_type} onValueChange={val => setFormData({ ...formData, session_type: val })}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="shoot">Private Shoot</SelectItem>
                <SelectItem value="training">Training Session</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300 text-xs uppercase mb-1 block">Custom Notes (Optional)</Label>
            <Input
              placeholder="e.g., bring binoculars, aurora probability 50%"
              value={formData.custom_notes}
              onChange={e => setFormData({ ...formData, custom_notes: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white text-sm h-8"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateEmail}
              disabled={!formData.client_name || !formData.session_date || !formData.location}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              Generate Email
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              size="sm"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800/50 h-8 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}