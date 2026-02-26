import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EventRankCard from '../components/tonight/EventRankCard';
import GuidedPlanModal from '../components/tonight/GuidedPlanModal';
import AuroraTeaserCard from '../components/events/AuroraTeaserCard';
import MilkyWayARCard from '../components/tonight/MilkyWayARCard';
import { Loader2, Lock, MapPin, ChevronRight, Telescope, Zap, Star, Trophy } from 'lucide-react';
import MultiLocationPredictor from '../components/tonight/MultiLocationPredictor';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function julianDate(date) { return date.getTime() / 86400000 + 2440587.5; }

function lstDeg(jd, lon) {
  const T = (jd - 2451545.0) / 36525;
  let g = 280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * 0.000387933;
  g = ((g % 360) + 360) % 360;
  return ((g + lon) % 360 + 360) % 360;
}

function raDecToAlt(ra, dec, lat, lon, date) {
  const jd = julianDate(date);
  const lst = lstDeg(jd, lon);
  const ha = toRad(((lst - ra) % 360 + 360) % 360);
  const sinAlt = Math.sin(toRad(dec)) * Math.sin(toRad(lat)) + Math.cos(toRad(dec)) * Math.cos(toRad(lat)) * Math.cos(ha);
  return toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
}

function getMoonPhase() {
  const knownNew = new Date('2000-01-06T00:00:00Z');
  const cycle = 29.53058867;
  const diff = (Date.now() - knownNew.getTime()) / 86400000;
  const phase = ((diff % cycle) + cycle) % cycle;
  const illum = Math.round((1 - Math.cos((phase / cycle) * 2 * Math.PI)) / 2 * 100);
  return { phase, illum };
}

function getGCPeak(lat, lon, today) {
  let peakAlt = -90, peakHour = null;
  for (let h = 18; h < 30; h++) {
    const d = new Date(today + 'T00:00:00Z');
    d.setTime(d.getTime() + h * 3600000);
    const alt = raDecToAlt(266.4, -29.0, lat, lon, d);
    if (alt > peakAlt) { peakAlt = alt; peakHour = h % 24; }
  }
  return { peakAlt, peakHour };
}

function computeEvents(lat, lon, today, astronomy_events) {
  const { illum: moonIllum, phase: moonPhase } = getMoonPhase();
  const { peakAlt, peakHour } = getGCPeak(lat, lon, today);
  const month = new Date(today).getMonth(); // 0-indexed
  const inSeason = month >= 2 && month <= 9; // Mar–Oct

  const events = [];

  // 1. Milky Way / Galactic Core
  if (peakAlt > 15 && inSeason) {
    const h = peakHour ?? 0;
    const window = `~${(h % 12 || 12)}:00 ${h >= 12 ? 'PM' : 'AM'}–${((h + 2) % 12 || 12)}:00 ${(h + 2) >= 12 ? 'PM' : 'AM'} UTC`;
    const viab = peakAlt > 35 && moonIllum < 25 ? 'excellent' : peakAlt > 20 && moonIllum < 50 ? 'good' : moonIllum > 70 ? 'poor' : 'marginal';
    events.push({
      id: 'milkyway', emoji: '🌌', title: 'Milky Way / Galactic Core',
      summary: peakAlt > 30 ? `Core peaks at ${Math.round(peakAlt)}° altitude — excellent elevation for a clear view.` : `Core reaches ${Math.round(peakAlt)}° — visible but low; find an unobstructed southern horizon.`,
      window,
      viability: viab,
      drivers: [
        { positive: peakAlt > 25, text: `Core peaks at ${Math.round(peakAlt)}° altitude` },
        { positive: moonIllum < 30, text: `Moon is ${moonIllum}% illuminated (${moonIllum < 30 ? 'minimal interference' : 'adds sky glow'})` },
        { positive: inSeason, text: 'Currently in Milky Way season (Mar–Oct)' },
      ],
      expectation: viab === 'excellent' ? 'Expect a vivid band with visible dust lanes on a clear night.' : viab === 'good' ? 'A clear shot of the core is likely. Avoid moon-rise window.' : 'Marginal — plan to catch the window before moon rises.',
      event_type: 'milky_way',
    });
  } else if (!inSeason) {
    events.push({
      id: 'milkyway_off', emoji: '🌌', title: 'Milky Way',
      summary: 'Off-season: the Galactic Core is not well-positioned for night shooting in winter months.',
      window: 'Best season: March – October',
      viability: 'poor',
      drivers: [{ positive: false, text: 'Off-season — core rises and sets with the sun' }],
      event_type: 'milky_way',
    });
  }

  // 2. Check astronomy DB events matching tonight
  if (astronomy_events) {
    astronomy_events.forEach(ev => {
      if (!ev.date) return;
      const evDate = ev.date.split('T')[0];
      const isTonight = evDate === today || (ev.end_date && ev.date <= today && ev.end_date >= today);
      if (!isTonight) return;

      const typeMap = {
        meteor_shower: { emoji: '☄️', viability: 'good' },
        eclipse: { emoji: '🌑', viability: 'excellent' },
        aurora: { emoji: '🌌', viability: 'good' },
        supermoon: { emoji: '🌕', viability: 'good' },
        comet: { emoji: '🌠', viability: 'marginal' },
        conjunction: { emoji: '🪐', viability: 'good' },
        other: { emoji: '🔭', viability: 'marginal' },
      };
      const tm = typeMap[ev.type] ?? typeMap.other;

      events.push({
        id: ev.id,
        emoji: tm.emoji,
        title: ev.title,
        summary: ev.description || ev.visibility_info || 'A scheduled sky event — check details.',
        window: ev.peak_time || ev.visibility_info || null,
        viability: tm.viability,
        drivers: ev.tips ? [{ positive: true, text: ev.tips }] : [],
        expectation: ev.visibility_info || '',
        event_type: ev.type,
        raw: ev,
      });
    });
  }

  // 3. Moon if notable
  if (moonPhase >= 14 && moonPhase <= 17) {
    events.push({
      id: 'full_moon', emoji: '🌕', title: 'Full Moon Tonight',
      summary: `Moon is ${moonIllum}% illuminated — bright sky but beautiful for moon photography and long-exposure silhouettes.`,
      window: 'All night',
      viability: moonIllum > 80 ? 'good' : 'marginal',
      drivers: [
        { positive: true, text: 'Great for moon-lit landscape shots' },
        { positive: false, text: 'Washes out faint sky objects like the Milky Way' },
      ],
      expectation: 'Shoot toward the moon for dramatic, naturally lit foregrounds.',
      event_type: 'moon',
    });
  }

  return events.slice(0, 3);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TonightHub() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [astroEvents, setAstroEvents] = useState([]);
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [commitEvent, setCommitEvent] = useState(null);
  const [auroraForecast, setAuroraForecast] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [subs, profiles, events] = await Promise.all([
          me.role === 'admin' ? Promise.resolve([{ status: 'active' }]) : base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1).catch(() => []),
          base44.entities.UserProfile.filter({ user_email: me.email }, '-created_date', 1).catch(() => []),
          base44.entities.AstronomyEvent.filter({}, 'date', 50).catch(() => []),
        ]);
        setIsSubscribed(subs.length > 0);
        const prof = profiles[0] ?? null;
        setProfile(prof);
        if (prof?.home_location) setLocation(prof.home_location);
        setAstroEvents(events);
        try {
          const auroras = await base44.entities.AuroraForecast.filter({}, '-date', 7).catch(() => []);
          const todayForecast = auroras.find(f => f.date === today) || auroras[0] || null;
          if (todayForecast) setAuroraForecast(todayForecast);
        } catch (_) {}
      } catch (e) {
        console.warn('TonightHub init error:', e);
      }
      setLoading(false);
    };
    init();
  }, []);

  const geocode = async (loc) => {
    setGeoLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Give me the latitude and longitude of: "${loc}". Return ONLY a JSON object with "lat" (number) and "lon" (number).`,
        response_json_schema: { type: 'object', properties: { lat: { type: 'number' }, lon: { type: 'number' } } }
      });
      if (res?.lat && res?.lon) setCoords({ lat: res.lat, lon: res.lon });
    } catch (e) {
      console.warn('Geocode failed:', e);
    }
    setGeoLoading(false);
  };

  const handleSetLocation = async () => { if (location.trim()) await geocode(location); };

  useEffect(() => {
    if (profile?.home_location && !coords) geocode(profile.home_location);
  }, [profile]);

  const events = useMemo(() => {
    if (!coords) return [];
    return computeEvents(coords.lat, coords.lon, today, astroEvents);
  }, [coords, today, astroEvents]);

  const mode = profile?.shooter_mode || 'photographer';
  const modeLabel = { photographer: 'DSLR/Mirrorless', smartphone: 'Smartphone', experience: 'Sky Experience' }[mode];

  const handleSavePlan = async (plan, answers) => {
    const me = user;
    await base44.entities.ShootSession.create({
      user_email: me.email,
      date: today,
      location: location,
      shooter_mode: mode,
      event_type: commitEvent?.event_type,
      guided_plan: { plan, answers, event: commitEvent?.title },
      status: 'planned',
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Telescope className="w-10 h-10 text-red-400 star-pulse" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header with clear CTA */}
      <div className="mb-8">
         <div className="flex items-center gap-3 mb-3">
           <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
           <span className="text-emerald-400 text-xs font-semibold uppercase tracking-widest">Real-Time Sky Analysis</span>
         </div>
         <h1 className="text-4xl font-black text-white mb-2">
           Should You Go <span className="gradient-text">Tonight?</span>
         </h1>
         <p className="text-slate-400 text-sm">
           Get real-time conditions & a ranked event list. Mode: <span className="text-white font-medium">{modeLabel}</span>
           <Link to={createPageUrl('Profile')} className="text-red-400 hover:text-red-300 ml-2 text-xs underline">(change)</Link>
         </p>
       </div>

      {/* Location input - prominent CTA */}
      <Card className="bg-[#1a1a1a] border border-white/8 p-5 mb-6 sticky top-20 z-40">
        <p className="text-white text-xs font-bold uppercase tracking-widest mb-3">Step 1: Enter Your Location</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="City, coordinates, or saved location…"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSetLocation()}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>
          <Button onClick={handleSetLocation} disabled={geoLoading || !location.trim()} className="bg-red-600 hover:bg-red-700 text-sm px-6 font-bold">
            {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
          </Button>
        </div>
        {coords && <p className="text-xs text-red-400 mt-3 font-medium">✓ Analyzing {coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°W</p>}
      </Card>

      {/* Events */}
      {!coords ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">Enter your location above</p>
          <p className="text-slate-500 text-sm mt-1">Get personalized sky conditions & ranked events for tonight</p>
        </div>
      ) : events.length === 0 ? (
        <Card className="bg-[#1a1a1a] border border-white/8 p-8 text-center">
          <p className="text-slate-300">No notable sky events tonight. Check the <Link to={createPageUrl('EventsCalendar')} className="text-red-400 hover:text-red-300 underline">full calendar</Link> for upcoming events.</p>
        </Card>
      ) : (
        <div className="space-y-4">
           <div className="flex items-center justify-between mb-4">
             <h2 className="text-white font-bold">Top Events Tonight</h2>
             <div className="flex gap-2">
               <Link to={createPageUrl('SkyBrowser')} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 border border-slate-700 rounded px-2.5 py-1 hover:border-white/20 transition-colors">
                 <Star className="w-3 h-3" /> Sky Browser
               </Link>
               <Link to={createPageUrl('EventsCalendar')} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                 Full calendar <ChevronRight className="w-3 h-3" />
               </Link>
             </div>
           </div>

           {/* AR Scout */}
           {coords && (
             <MilkyWayARCard
               lat={coords.lat}
               lon={coords.lon}
               dateStr={new Date().toISOString().split('T')[0]}
               isSubscribed={isSubscribed}
               shooterMode={profile?.shooter_mode || 'photographer'}
             />
           )}

           {/* Aurora Teaser */}
          {auroraForecast && auroraForecast.kp_index > 2 && (
            <Link to={createPageUrl('EventsCalendar')}>
              <AuroraTeaserCard
                kpIndex={auroraForecast.kp_min || auroraForecast.kp_index}
                cloudCover={auroraForecast.cloud_cover_percent || 50}
                visibilityRating={auroraForecast.visibility_rating}
                onClick={() => {}}
              />
            </Link>
          )}

          {events.map((event, i) => (
            <EventRankCard
              key={event.id}
              event={event}
              rank={i + 1}
              isSubscribed={isSubscribed}
              mode={mode}
              onCommit={(ev) => {
                if (!isSubscribed) return;
                setCommitEvent(ev);
              }}
            />
          ))}

          {isSubscribed && coords && events.length > 0 && (
            <Link to={createPageUrl('FieldMode') + '?event=' + encodeURIComponent(JSON.stringify(events[0]))}>
              <div className="flex items-center justify-center gap-2 w-full border border-white/8 bg-[#1a1a1a] hover:bg-black/30 rounded-xl py-3 text-red-400 text-sm font-bold transition-all mt-2">
                <Zap className="w-4 h-4" />
                Enter Field Mode — Live Guidance
              </div>
            </Link>
          )}

          {!isSubscribed && (
            <Card className="border border-red-600/30 bg-gradient-to-r from-red-900/20 to-red-800/10 p-5 mt-4">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-white font-bold text-sm">Ready to plan smarter?</p>
                  <p className="text-slate-400 text-xs mt-1 mb-3">Unlock full viability scores, guided shoot plans, gear checklist, and aurora alerts. Get Plus for $7.99/mo.</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link to={createPageUrl('PaymentGate')}>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs font-bold">
                        Unlock Plus — $7.99/mo →
                      </Button>
                    </Link>
                    <span className="text-slate-500 text-xs">or $79/year</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Multi-Location Predictor ── */}
      <div className="mt-8 pt-6 border-t border-white/8">
        <MultiLocationPredictor
          isSubscribed={isSubscribed}
          homeLocation={profile?.home_location || location || null}
          homeCoords={coords}
        />
      </div>

      {/* Curriculum cross-link tip */}
      {coords && (
        <Card className="bg-[#1a1a1a] border border-emerald-500/20 p-4 mt-4">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 text-base leading-none mt-0.5">📚</span>
            <div>
              <p className="text-emerald-300 text-xs font-bold mb-1">From the Free Course — Module 1</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                {(() => {
                  const { illum } = getMoonPhase();
                  if (illum < 10) return `Moon is ${illum}% — perfect Milky Way conditions. This is a "go" night. Open Sky Planner to find the galactic core peak time.`;
                  if (illum < 30) return `Moon is ${illum}% — still workable. Aim for the window before moonrise. Check galactic core timing in Sky Planner.`;
                  return `Moon is ${illum}% — too bright for Milky Way. Use this time to scout your location in daylight and plan a future shoot.`;
                })()}
              </p>
              <Link to={createPageUrl('FreeCourse')} className="text-emerald-400 text-xs font-semibold hover:text-emerald-300 mt-1 inline-block">
                Continue Free Course →
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Mode-specific tip */}
      {coords && mode === 'smartphone' && (
        <Card className="bg-[#1a1a1a] border border-white/8 p-4 mt-4">
          <p className="text-slate-300 text-xs font-semibold mb-1">📱 Smartphone Tip for Tonight</p>
          <p className="text-slate-400 text-xs leading-relaxed">Set your phone on a stable surface and use Night Mode. Avoid holding the phone — even breathing causes blur. Use a timer or volume button as shutter.</p>
        </Card>
      )}

      {coords && mode === 'experience' && (
        <Card className="bg-[#1a1a1a] border border-white/8 p-4 mt-4">
          <p className="text-slate-300 text-xs font-semibold mb-1">👁 Sky Experience Tip</p>
          <p className="text-slate-400 text-xs leading-relaxed">Allow 20–30 minutes for your eyes to dark-adapt. Avoid all white lights. Look slightly beside your target for faint objects — your peripheral vision sees dimmer light.</p>
        </Card>
      )}

      {/* Guided Plan Modal */}
      {commitEvent && (
        <GuidedPlanModal
          event={commitEvent}
          mode={mode}
          onClose={() => setCommitEvent(null)}
          onSave={handleSavePlan}
        />
      )}
    </div>
  );
}