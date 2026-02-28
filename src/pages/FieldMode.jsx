import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Aperture, Zap, Eye, Lightbulb, Crosshair,
  MapPin, RefreshCw,
  Sun, Lock, Telescope, AlertTriangle
} from 'lucide-react';
import CameraSettingsPanel from '../components/fieldmode/CameraSettingsPanel';
import CompositionPanel from '../components/fieldmode/CompositionPanel';
import LightingPanel from '../components/fieldmode/LightingPanel';
import ConditionsBar from '../components/fieldmode/ConditionsBar';
import InteractiveStepper from '../components/fieldmode/InteractiveStepper';

function FreeWalkthroughTeaser() {
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return (
    <div className="mb-5 rounded-2xl border border-slate-700/40 bg-[#0f0a00]/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-slate-300 text-xs font-black uppercase tracking-widest">Guided Walkthrough</p>
        <span className="text-[10px] bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 px-2 py-0.5 rounded-full font-bold">Plus &amp; Pro</span>
      </div>
      <p className="text-slate-500 text-xs mb-3 leading-relaxed">Step-by-step, mode-aware guidance from scouting to post-shoot. Upgrade to unlock all 7 steps.</p>
      <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 mb-3">
        <p className="text-yellow-300 text-[10px] font-bold uppercase tracking-widest mb-1">💡 Reminder</p>
        <p className="text-slate-300 text-xs">Check focus before your first shot — tap a bright star in your viewfinder and fine-tune until it's a pinpoint.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center">
          <p className="text-slate-500 text-[9px] uppercase mb-0.5">Session Timer</p>
          <p className="text-white font-mono text-lg font-bold">{fmt(seconds)}</p>
        </div>
        <button
          onClick={() => setRunning(r => !r)}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${running ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
        >
          {running ? 'Pause' : seconds > 0 ? 'Resume' : 'Start'}
        </button>
      </div>
    </div>
  );
}

export default function FieldMode() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('camera');
  const [event, setEvent] = useState(null);
  const [clockStr, setClockStr] = useState('');
  const navigate = useNavigate();

  // Get event from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const evParam = params.get('event');
    if (evParam) {
      try { setEvent(JSON.parse(decodeURIComponent(evParam))); }
      catch { /* ignore */ }
    }
  }, []);

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClockStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [subs, profiles] = await Promise.all([
        me.role === 'admin'
          ? Promise.resolve([{ status: 'active' }])
          : base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1),
        base44.entities.UserProfile.filter({ user_email: me.email }, '-created_date', 1),
      ]);
      const sub = subs[0];
      setIsSubscribed(!!sub);
      const prof = profiles[0] ?? null;
      setProfile(prof);

      // Auto-locate
      if (prof?.home_lat && prof?.home_lon) {
        setCoords({ lat: prof.home_lat, lon: prof.home_lon, label: prof.home_location || 'Home Location' });
      } else {
        detectLocation();
      }
      setLoading(false);
    };
    init();
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'GPS Location' });
        setGeoLoading(false);
      },
      () => setGeoLoading(false),
      { timeout: 8000 }
    );
  }, []);

  const mode = profile?.shooter_mode || 'photographer';

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen cosmic-bg">
      <Telescope className="w-10 h-10 text-red-400 star-pulse" />
    </div>
  );

  if (!isSubscribed) return (
    <div className="min-h-screen cosmic-bg flex items-center justify-center p-6">
      <Card className="bg-[#1a1a1a] border border-red-600/30 p-8 max-w-md text-center">
        <Lock className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Field Mode — Plus & Pro</h2>
        <p className="text-slate-400 text-sm mb-6">Real-time, location-aware guidance in the field: camera settings, composition tips, and low-light assistance. Requires a Plus or Pro plan.</p>
        <Button className="bg-red-600 hover:bg-red-700 font-bold" onClick={() => navigate(createPageUrl('PaymentGate'))}>
          Unlock Plus — $7.99/mo
        </Button>
      </Card>
    </div>
  );

  const modeColors = {
    photographer: { bg: '#0a0005', accent: 'red', icon: '📷' },
    smartphone: { bg: '#050a0a', accent: 'blue', icon: '📱' },
    experience: { bg: '#0a0a05', accent: 'amber', icon: '👁' },
  };
  const color = modeColors[mode];

  return (
    <div className={`min-h-screen cosmic-bg flex flex-col`} style={{ backgroundColor: color.bg }}>
      {/* ── HERO TOP BAR (sticky, full-width, high contrast) ── */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="px-4 py-4 max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-3 h-3 rounded-full bg-${color.accent}-500 animate-pulse`} />
              <div>
                <p className={`text-${color.accent}-400 text-xs font-black uppercase tracking-widest`}>Field Mode</p>
                {event && <p className={`text-${color.accent}-300 text-[10px] font-bold`}>{event.title}</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-xl font-black font-mono">{clockStr}</p>
                <p className="text-slate-500 text-[10px]">{coords?.label || 'Locating…'}</p>
              </div>
              <button 
                onClick={detectLocation} 
                disabled={geoLoading}
                className={`w-10 h-10 rounded-full ${geoLoading ? 'bg-slate-700 animate-spin' : `bg-${color.accent}-600 hover:bg-${color.accent}-700`} flex items-center justify-center transition-all flex-shrink-0`}
                title="Detect GPS"
              >
                <MapPin className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          {/* Live Conditions Strip */}
          <ConditionsBar coords={coords} mode={mode} />
        </div>
      </div>

      {/* ── FULL-WIDTH TAB NAVIGATION (gesture-friendly) ── */}
      <div className="sticky top-20 z-40 bg-black/85 backdrop-blur-lg border-b border-white/5">
        <div className="flex max-w-2xl mx-auto">
          {(mode === 'experience'
            ? [{ id: 'compose', label: 'What to See', icon: Eye }, { id: 'light', label: 'Conditions', icon: Lightbulb }]
            : [{ id: 'camera', label: 'Camera', icon: Aperture }, { id: 'compose', label: 'Compose', icon: Crosshair }, { id: 'light', label: 'Lighting', icon: Lightbulb }]
          ).map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 transition-all ${
                  active 
                    ? `text-${color.accent}-400 border-b-2 border-${color.accent}-500` 
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT (minimal clutter) ── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-32 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Guided walkthrough or teaser */}
        {isSubscribed ? (
          <InteractiveStepper mode={mode} isSubscribed={isSubscribed} onTabChange={setActiveTab} />
        ) : (
          <FreeWalkthroughTeaser />
        )}

        {/* Mode-specific quick tip (compact, one-liner) */}
         <div className={`mb-6 rounded-2xl border border-${color.accent}-600/30 bg-${color.accent}-900/20 px-4 py-3 flex items-start gap-2`}>
           <span className="text-lg leading-none flex-shrink-0">{color.icon}</span>
           <p className={`text-${color.accent}-200 text-xs leading-relaxed font-medium`}>
             {mode === 'experience' && activeTab === 'compose' && '👀 Dark adapt 20–30 min • Look beside faint objects'}
             {mode === 'experience' && activeTab === 'light' && '🌙 Avoid bright moon • Best 1–2 hrs after sunset'}
             {mode === 'smartphone' && (() => {
               const phoneModel = profile?.phone_model;
               if (activeTab === 'camera') {
                 if (['iphone14', 'iphone15', 'iphone16'].includes(phoneModel)) return '📱 Night Mode: 10–30s exposure • Lock focus on brightest star';
                 if (['pixel8', 'pixel9'].includes(phoneModel)) return '📱 Night Sight: Auto or Expert RAW • Steady hands or tripod';
                 if (['galaxy23', 'galaxy24'].includes(phoneModel)) return '📱 Nightography: 2–8s auto exposure • Lean on object for stability';
                 return '📱 Use tripod + self-timer • Look for Night Mode in camera app';
               }
               if (activeTab === 'compose') return '🎬 Shoot horizontal • Self-timer to reduce shake';
               if (activeTab === 'light') return '🌅 Blue hour for color • Dark sky needs 1.5+ hrs post-sunset';
               return '';
             })()}
             {mode === 'photographer' && activeTab === 'camera' && '⚙️ Use NPF rule for shutter • Start ISO 3200, widest aperture'}
             {mode === 'photographer' && activeTab === 'compose' && '🖼️ Lower-third foreground • Use Star Pointer for galactic core'}
             {mode === 'photographer' && activeTab === 'light' && '⏰ Blue hour ends 30–45 min • Avoid phone screens'}
           </p>
         </div>

        {/* Tab content */}
        {activeTab === 'camera' && mode !== 'experience' && (
          <CameraSettingsPanel mode={mode} event={event} coords={coords} />
        )}
        {activeTab === 'camera' && mode === 'experience' && (
          <div className="rounded-2xl bg-black/40 border border-white/8 p-8 text-center">
            <p className="text-6xl mb-4">👁</p>
            <p className="text-white text-lg font-bold mb-1">No Camera Needed</p>
            <p className="text-slate-400 text-sm">Switch to "What to See" for dark-sky visibility tips.</p>
          </div>
        )}
        {activeTab === 'compose' && (
          <CompositionPanel mode={mode} event={event} coords={coords} />
        )}
        {activeTab === 'light' && (
          <LightingPanel mode={mode} event={event} />
        )}
      </div>
    </div>
  );
}