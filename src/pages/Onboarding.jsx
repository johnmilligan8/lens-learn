import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import ModeSelector from '../components/onboarding/ModeSelector';
import LocationPicker from '../components/onboarding/LocationPicker';
import { Telescope, Loader2, ChevronRight } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState('photographer');
  const [homeLocation, setHomeLocation] = useState('');
  const [homeLat, setHomeLat] = useState(null);
  const [homeLon, setHomeLon] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const finish = async () => {
    setSaving(true);
    const me = await base44.auth.me();
    const existing = await base44.entities.UserProfile.filter({ user_email: me.email }, '-created_date', 1);
    const data = { user_email: me.email, shooter_mode: mode, home_location: homeLocation, home_lat: homeLat, home_lon: homeLon, onboarding_complete: true };
    if (existing.length > 0) {
      await base44.entities.UserProfile.update(existing[0].id, data);
    } else {
      await base44.entities.UserProfile.create(data);
    }
    setSaving(false);
    navigate(createPageUrl('Dashboard'));
  };

  const steps = [
    {
      title: "Welcome to Uncharted Galaxy",
      subtitle: "Let's set you up for your first expedition.",
      content: (
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-red-600/30 rounded-full blur-2xl" />
            <div className="relative bg-red-700 rounded-2xl w-24 h-24 flex items-center justify-center">
              <Telescope className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Chart the <span className="gradient-text">Unknown</span></h2>
            <p className="text-slate-400 text-lg max-w-sm mx-auto">Your personal guide to the night sky — whether you're shooting or just stargazing.</p>
          </div>
        </div>
      )
    },
    {
      title: "How will you explore?",
      subtitle: "This shapes your tips, plans, and expectations throughout the app.",
      content: <ModeSelector value={mode} onChange={setMode} />
    },
    {
      title: "Your home base",
      subtitle: "Used to pre-fill your local conditions. You can always change it later.",
      content: (
        <LocationPicker
          value={homeLocation}
          lat={homeLat}
          lon={homeLon}
          onChange={({ name, lat, lon }) => {
            setHomeLocation(name);
            setHomeLat(lat ?? null);
            setHomeLon(lon ?? null);
          }}
        />
      )
    }
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-red-500' : i < step ? 'w-4 bg-red-700' : 'w-4 bg-slate-700'}`} />
          ))}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">{current.title}</h2>
            <p className="text-slate-400 text-sm mt-1">{current.subtitle}</p>
          </div>

          <div>{current.content}</div>

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="border-slate-700 text-slate-300">
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} className="flex-1 bg-red-600 hover:bg-red-700 font-bold">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-700 font-bold">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <>Launch My Expedition 🚀</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}