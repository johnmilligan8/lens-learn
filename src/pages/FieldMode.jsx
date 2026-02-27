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
import GuidedWalkthrough from '../components/fieldmode/GuidedWalkthrough';

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
      <Card className="bg-slate-900/80 border border-purple-500/40 p-8 max-w-md text-center">
        <Lock className="w-10 h-10 text-purple-400 mx-auto mb-4" />
        <h2 className="text-white text-xl font-bold mb-2">Field Mode — Plus & Pro</h2>
        <p className="text-slate-400 text-sm mb-6">Real-time, location-aware guidance in the field: camera settings, composition tips, and low-light assistance. Requires a Plus or Pro plan.</p>
        <Button className="bg-purple-600 hover:bg-purple-700 font-bold" onClick={() => navigate(createPageUrl('PaymentGate'))}>
          Unlock Plus — $7.99/mo
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen cosmic-bg flex flex-col">
      {/* Top bar — dark-friendly red tint */}
      <div className="sticky top-0 z-50 bg-[#0a0005]/95 backdrop-blur-md border-b border-red-900/30">
        <div className="flex items-center justify-between px-4 py-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-black uppercase tracking-widest">Field Mode</span>
            {event && <Badge className="bg-red-900/40 text-red-300 border border-red-700/40 text-[10px] ml-1">{event.title}</Badge>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-xs font-mono">{clockStr}</span>
            {geoLoading
              ? <RefreshCw className="w-3.5 h-3.5 text-slate-500 animate-spin" />
              : <button onClick={detectLocation} title="Re-detect GPS">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 hover:text-red-400 transition-colors" />
                </button>
            }
          </div>
        </div>

        {/* Conditions bar */}
        <ConditionsBar coords={coords} mode={mode} />
      </div>

      {/* Location notice if no GPS */}
      {!coords && !geoLoading && (
        <div className="flex items-center gap-2 bg-yellow-900/20 border-b border-yellow-700/30 px-4 py-2 text-yellow-400 text-xs max-w-2xl mx-auto w-full">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>No GPS lock — <button onClick={detectLocation} className="underline font-bold">tap to detect location</button> for live sky conditions.</span>
        </div>
      )}

      {/* Tab strip */}
      <div className="sticky top-[calc(5.5rem)] z-40 bg-[#08000a]/90 backdrop-blur-sm border-b border-slate-800/60">
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
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  active ? 'text-red-400 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-24">
        {/* Guided Walkthrough — paid only, free gets basic nudge */}
        {isSubscribed
          ? <GuidedWalkthrough mode={mode} onTabChange={setActiveTab} />
          : <FreeWalkthroughTeaser />
        }

        {/* Mode-aware execution tip */}
        <div className="mb-4 flex items-start gap-2 bg-[#1a0a00]/60 border border-red-900/30 rounded-xl px-4 py-3">
          <span className="text-red-400 text-sm leading-none mt-0.5 flex-shrink-0">
            {mode === 'photographer' ? '📷' : mode === 'smartphone' ? '📱' : '👁'}
          </span>
          <p className="text-slate-400 text-xs leading-relaxed">
            <span className="text-red-300 font-semibold">
              {mode === 'experience' ? 'Sky Watching tip: ' : mode === 'smartphone' ? 'Phone tip: ' : 'Field tip (Module 5): '}
            </span>
            {mode === 'experience' && activeTab === 'compose' && 'Give your eyes 20–30 min to fully dark-adapt. Avoid all white lights. Look slightly beside faint objects — your peripheral vision is more sensitive.'}
            {mode === 'experience' && activeTab === 'light' && 'Best sky watching is 1–2 hrs after sunset. Check the moon phase — a bright moon washes out faint stars and Milky Way. Head out on new moon nights.'}
            {mode === 'smartphone' && activeTab === 'camera' && 'Use a tripod and self-timer. Enable Pro/Expert mode for manual shutter and ISO. iPhone users: let Night Mode do its thing — just stay perfectly still.'}
            {mode === 'smartphone' && activeTab === 'compose' && 'Shoot horizontally for more sky. Prop your phone against something stable. Self-timer or volume button = less shake than tapping the screen.'}
            {mode === 'smartphone' && activeTab === 'light' && 'Shoot during the blue hour (just after sunset) for color. For Milky Way, wait until the sky is fully dark — 1.5+ hours after sunset.'}
            {mode === 'photographer' && activeTab === 'camera' && 'Use the Camera Calculator below for NPF-precise shutter speed. Start at ISO 3200, widest aperture, then check your histogram after the first shot.'}
            {mode === 'photographer' && activeTab === 'compose' && 'Place your foreground element on the lower-third. Use Star Pointer to locate the galactic core direction before full dark. AR Scout (Sky Planner) previews the exact arc.'}
            {mode === 'photographer' && activeTab === 'light' && 'Blue Hour ends 30–45 min after sunset. LLL (Low Light Landscape) window follows. Avoid using phone screens — they destroy dark adaptation.'}
          </p>
        </div>

        {activeTab === 'camera' && mode !== 'experience' && (
          <CameraSettingsPanel mode={mode} event={event} coords={coords} />
        )}
        {activeTab === 'camera' && mode === 'experience' && (
          <div className="rounded-xl bg-[#1a1a1a] border border-white/8 p-5 text-center">
            <p className="text-4xl mb-3">👁</p>
            <p className="text-white font-semibold mb-1">No Camera Needed</p>
            <p className="text-slate-400 text-sm">You're in Sky Watching mode — switch to "What to See" for visibility tips.</p>
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