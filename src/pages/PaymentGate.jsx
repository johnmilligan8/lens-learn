import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Telescope, Zap, Rocket, Star, ArrowRight, Minus } from 'lucide-react';

const TIERS = [
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'Plan & Execute',
    icon: Zap,
    monthlyPrice: '$7.99',
    annualPrice: '$79',
    annualPerMonth: '$6.58',
    monthlyRaw: 'monthly_plus',
    annualRaw: 'annual_plus',
    color: 'border-red-600/40',
    glow: 'shadow-[0_0_40px_rgba(220,38,38,0.12)]',
    btnClass: 'bg-red-600 hover:bg-red-700',
    badge: 'MOST POPULAR',
    features: [
      'Full viability scores & condition drivers',
      'Guided shoot plans per event (Blue Hour + LLL options)',
      'Field Mode — live on-location guidance',
      'Sky Planner with moon, Blue Hour & aurora windows',
      'Gear checklist with LLL category + custom items',
      'Mode-aware guidance (DSLR, phone, experience)',
      'Model release upload & template',
      'Aurora & meteor alerts for custom locations',
      'Explorer community gallery',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Learn & Master',
    icon: Star,
    monthlyPrice: '$14.99',
    annualPrice: '$149',
    annualPerMonth: '$12.42',
    monthlyRaw: 'monthly_pro',
    annualRaw: 'annual_pro',
    color: 'border-white/10',
    glow: '',
    btnClass: 'bg-slate-700 hover:bg-slate-600',
    features: [
      'Everything in Plus',
      'Journal insights & shoot pattern analysis',
      'Instructor hub & full course access',
      'Client email generator',
      'Premium alerts (custom KP/cloud thresholds)',
      'Saved trip planners (multi-session)',
      'Priority instructor mentorship',
      'First access to new features',
    ],
  },
];

const LIFETIME = {
  id: 'lifetime',
  price: '$99',
  label: 'Lifetime — Plus features, forever',
  features: [
    'All Plus features unlocked permanently',
    'No recurring billing — ever',
    'All future Plus-tier content & updates',
    'Priority support',
  ],
};

export default function PaymentGate() {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState('monthly'); // 'monthly' | 'annual'
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSubscribe = async (tier) => {
    setLoading(tier);
    const today = new Date().toISOString().split('T')[0];
    const endDate = tier === 'lifetime' ? '2099-12-31'
      : tier.includes('annual') ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const tierKey = tier === 'lifetime' ? 'lifetime'
      : tier.includes('plus') ? 'monthly'
      : 'monthly';

    await base44.entities.Subscription.create({
      user_email: user.email,
      tier: tierKey,
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
          <div className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-xl w-9 h-9 flex items-center justify-center">
            <Telescope className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-tight">UnchartedGalaxy</span>
            <span className="text-purple-400/60 text-xs ml-2">by uncharted.net</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 pb-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Rocket className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Join 10,000+ explorers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
              Plan Smarter. <span className="gradient-text">Shoot Better.</span>
            </h1>
            <p className="text-slate-400 text-base max-w-2xl mx-auto">
              Pick the plan that fits how you shoot. Upgrade or cancel anytime.
            </p>
          </div>

          {/* Billing toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-slate-800/60 border border-slate-700 rounded-xl p-1 gap-1">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === 'monthly' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('annual')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Annual <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5">Save 17%</Badge>
              </button>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {TIERS.map(tier => {
              const Icon = tier.icon;
              const tierKey = billing === 'annual' ? tier.annualRaw : tier.monthlyRaw;
              return (
                <Card key={tier.id} className={`bg-slate-900/60 ${tier.color} ${tier.glow} p-7 relative overflow-hidden hover:scale-[1.01] transition-all`}>
                  {tier.badge && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {tier.badge}
                    </div>
                  )}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl pointer-events-none" />

                  <Icon className={`w-9 h-9 mb-3 ${tier.id === 'plus' ? 'text-purple-400' : 'text-blue-400'}`} />
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="text-slate-400 text-xs mb-4 italic">"{tier.tagline}"</p>

                  <div className="flex items-baseline gap-1 mb-1">
                    {billing === 'annual' ? (
                      <>
                        <span className="text-4xl font-bold text-white">{tier.annualPerMonth}</span>
                        <span className="text-slate-400 text-sm">/month</span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-white">{tier.monthlyPrice}</span>
                        <span className="text-slate-400 text-sm">/month</span>
                      </>
                    )}
                  </div>
                  {billing === 'annual' && (
                    <p className="text-emerald-400 text-xs mb-4">{tier.annualPrice}/year billed annually</p>
                  )}

                  <ul className="space-y-2.5 my-6">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${tier.id === 'plus' ? 'text-purple-400' : 'text-blue-400'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${tier.btnClass} h-11 text-sm font-bold`}
                    onClick={() => handleSubscribe(tierKey)}
                    disabled={!!loading}
                  >
                    {loading === tierKey ? 'Processing…' : `Get ${tier.name} — ${billing === 'annual' ? tier.annualPrice + '/yr' : tier.monthlyPrice + '/mo'}`}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Card>
              );
            })}
          </div>

          {/* Lifetime card */}
          <Card className="bg-gradient-to-r from-yellow-900/20 to-amber-900/10 border border-yellow-500/40 p-6 max-w-2xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-300 font-bold">Lifetime Access — $99 one-time</span>
                </div>
                <p className="text-slate-400 text-sm">Plus features forever. No recurring billing. All future Plus updates included.</p>
                <ul className="mt-2 space-y-1">
                  {LIFETIME.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                      <Check className="w-3 h-3 text-yellow-400 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold whitespace-nowrap px-6"
                onClick={() => handleSubscribe('lifetime')}
                disabled={!!loading}
              >
                {loading === 'lifetime' ? 'Processing…' : 'Get Lifetime $99'}
              </Button>
            </div>
          </Card>

          {/* Free tier reminder */}
          <div className="text-center mb-8">
            <p className="text-slate-500 text-sm">
              Not ready? <span className="text-slate-400">Stay on the <strong className="text-white">Free</strong> plan — tonight's basic sky status & major event teasers are always free.</span>
            </p>
          </div>

          <div className="text-center space-y-2">
            <p className="text-slate-600 text-sm">🔒 Secure payment · Cancel anytime · 7-day money-back guarantee</p>
            <p className="text-slate-600 text-sm">📱 Works on all devices</p>
          </div>
        </div>
      </div>
    </div>
  );
}