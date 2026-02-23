import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Telescope, Zap, Rocket, Star, ArrowRight, Shield } from 'lucide-react';

const TIERS = [
  {
    id: 'free',
    icon: Telescope,
    iconColor: 'text-slate-400',
    name: 'Free',
    tagline: 'Start exploring',
    price: { monthly: 0, annual: 0 },
    annualSavings: null,
    cta: null, // no action, already on free
    highlight: false,
    job: '"Decide" — Am I going out tonight?',
    features: [
      'Tonight? basic sky status',
      'Major event teasers (meteor showers, eclipses)',
      'Home location pre-fill',
      'Starter course (5 lessons, free)',
      'Community gallery (view only)',
    ],
  },
  {
    id: 'plus_monthly',
    icon: Zap,
    iconColor: 'text-red-400',
    name: 'Plus',
    tagline: 'Plan & Execute your shoots',
    price: { monthly: 7.99, annual: 79 },
    annualSavings: '17% off',
    highlight: true,
    badge: 'MOST POPULAR',
    job: '"Plan & Execute" — How do I make this shoot great?',
    features: [
      'Full viability scores & condition drivers',
      'Guided Shoot Plans (step-by-step)',
      'Field Mode — real-time shoot guidance',
      'Gear checklist: custom items, notes & categories',
      'AI Sky Planner + weather forecasts',
      'Aurora & cosmic event alerts',
      'Mode-aware guidance (DSLR, smartphone, experience)',
      'Model release upload & template',
    ],
  },
  {
    id: 'pro_monthly',
    icon: Star,
    iconColor: 'text-yellow-400',
    name: 'Pro',
    tagline: 'Learn, master & grow',
    price: { monthly: 14.99, annual: 149 },
    annualSavings: '17% off',
    highlight: false,
    badge: 'FOR SERIOUS SHOOTERS',
    job: '"Learn & Master" — How do I continuously improve?',
    features: [
      'Everything in Plus',
      'Journal insights & performance patterns',
      'Instructor hub access (admin tools)',
      'Client email generator',
      'Premium alerts (custom KP, cloud, visibility thresholds)',
      'Saved trip planners (multi-night)',
      'Full course & workshop access',
      'Priority instructor feedback on photos',
    ],
  },
  {
    id: 'lifetime',
    icon: Shield,
    iconColor: 'text-emerald-400',
    name: 'Lifetime',
    tagline: 'Plus features — forever',
    price: { monthly: 99, annual: 99 },
    annualSavings: null,
    oneTime: true,
    highlight: false,
    badge: 'BEST VALUE',
    job: 'Pay once, explore forever',
    features: [
      'All Plus features, forever',
      'All future Plus content & updates',
      'Never pay again',
      'Works on all devices',
    ],
  },
];

export default function PaymentGate() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'

  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser);
    const params = new URLSearchParams(window.location.search);
    // no tier pre-selection needed — just highlight
  }, []);

  const handleSubscribe = async (tierId) => {
    setLoading(tierId);
    const today = new Date().toISOString().split('T')[0];
    const isLifetime = tierId === 'lifetime';
    const tier = isLifetime ? 'lifetime' : billing === 'annual' ? (tierId === 'plus_monthly' ? 'plus_annual' : 'pro_annual') : (tierId === 'plus_monthly' ? 'monthly' : 'pro_monthly');
    const endDate = isLifetime
      ? '2099-12-31'
      : billing === 'annual'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await base44.entities.Subscription.create({
      user_email: user.email,
      tier,
      status: 'active',
      start_date: today,
      end_date: endDate,
    });
    navigate(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen cosmic-bg flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/40 bg-[#03020d]/80 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="bg-red-600 rounded-xl w-9 h-9 flex items-center justify-center">
            <Telescope className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight">Uncharted Galaxy</span>
            <span className="text-slate-500 text-xs ml-2">by uncharted.net</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-full px-4 py-2 mb-5">
              <Rocket className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-medium">Join 10,000+ astrophotographers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              Unlock Your <span className="gradient-text">Full Galaxy</span>
            </h1>
            <p className="text-slate-400 text-base max-w-2xl mx-auto mb-8">
              From casual stargazer to serious shooter — choose the plan that matches where you are in your journey.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center bg-slate-900/60 border border-slate-700 rounded-xl p-1 mb-2">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'annual' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Annual
              </button>
            </div>
            {billing === 'annual' && (
              <p className="text-emerald-400 text-xs font-medium">🎉 Save 17% with annual billing</p>
            )}
          </div>

          {/* Tier cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {TIERS.map(tier => {
              const Icon = tier.icon;
              const price = tier.oneTime
                ? { display: '$99', sub: 'one-time' }
                : billing === 'annual' && tier.price.annual > 0
                  ? { display: `$${(tier.price.annual / 12).toFixed(2)}`, sub: '/mo · billed annually', total: `$${tier.price.annual}/yr` }
                  : tier.price.monthly === 0
                    ? { display: 'Free', sub: 'forever' }
                    : { display: `$${tier.price.monthly}`, sub: '/month' };

              return (
                <Card
                  key={tier.id}
                  className={`relative flex flex-col p-6 border transition-all duration-200 ${
                    tier.highlight
                      ? 'bg-gradient-to-b from-red-900/30 to-red-950/20 border-red-500/60 shadow-[0_0_40px_rgba(220,38,38,0.15)]'
                      : 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  {tier.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap ${
                      tier.highlight ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {tier.badge}
                    </div>
                  )}

                  <Icon className={`w-8 h-8 ${tier.iconColor} mb-4 mt-2`} />
                  <h3 className="text-xl font-black text-white mb-0.5">{tier.name}</h3>
                  <p className="text-slate-400 text-xs mb-4 leading-snug">{tier.tagline}</p>

                  <div className="mb-5">
                    <span className="text-4xl font-black text-white">{price.display}</span>
                    <span className="text-slate-400 text-xs ml-1">{price.sub}</span>
                    {price.total && <p className="text-slate-500 text-[11px] mt-0.5">{price.total}</p>}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-snug">
                        <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-red-400' : 'text-slate-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {tier.id === 'free' ? (
                    <div className="text-center text-slate-500 text-xs py-2">Your current plan</div>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={!!loading}
                      className={`w-full h-10 text-sm font-bold ${
                        tier.highlight
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {loading === tier.id
                        ? 'Processing…'
                        : tier.oneTime
                          ? 'Get Lifetime Access'
                          : `Get ${tier.name}`}
                      {loading !== tier.id && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>

          {/* JTBD strip */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 mb-8">
            <h4 className="text-white font-bold text-center mb-5 text-sm uppercase tracking-widest">What job does each plan do for you?</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { emoji: '🔭', label: 'Free — Decide', desc: '"Should I even go out tonight?" Quick status, major event teasers, location pre-fill.' },
                { emoji: '📋', label: 'Plus — Plan & Execute', desc: '"How do I make this shoot the best it can be?" Scores, guided plans, gear, alerts.' },
                { emoji: '🎓', label: 'Pro — Learn & Master', desc: '"How do I keep getting better?" Patterns, instructor access, courses, premium alerts.' },
              ].map(j => (
                <div key={j.label} className="text-center p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                  <p className="text-2xl mb-2">{j.emoji}</p>
                  <p className="text-white text-sm font-bold mb-1">{j.label}</p>
                  <p className="text-slate-400 text-xs leading-relaxed">{j.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-slate-600 text-sm">🔒 Secure payment · 7-day money-back guarantee · Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  );
}