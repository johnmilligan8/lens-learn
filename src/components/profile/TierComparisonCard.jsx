import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Minus, ArrowRight, Zap, Star, Rocket } from 'lucide-react';

const TIERS = [
  {
    id: 'free',
    label: 'Free',
    icon: Rocket,
    price: '$0',
    period: '',
    color: 'text-slate-400',
    border: 'border-slate-700',
    job: '"Decide" — tonight\'s basic status',
    features: [
      { label: 'Tonight basic sky status', yes: true },
      { label: 'Major event teasers', yes: true },
      { label: 'Location pre-fill', yes: true },
      { label: 'Full viability scores', yes: false },
      { label: 'Guided shoot plans', yes: false },
      { label: 'Gear checklist (custom items)', yes: false },
      { label: 'Sky Planner & alerts', yes: false },
      { label: 'Journal insights & patterns', yes: false },
      { label: 'Instructor hub access', yes: false },
      { label: 'Client email generator', yes: false },
    ],
  },
  {
    id: 'plus',
    label: 'Plus',
    icon: Zap,
    price: '$7.99',
    annual: '$79/yr',
    period: '/month',
    color: 'text-purple-400',
    border: 'border-purple-500/50',
    highlight: true,
    badge: 'MOST POPULAR',
    job: '"Plan & Execute" — full planning suite',
    features: [
      { label: 'Tonight basic sky status', yes: true },
      { label: 'Major event teasers', yes: true },
      { label: 'Location pre-fill', yes: true },
      { label: 'Full viability scores', yes: true },
      { label: 'Guided shoot plans', yes: true },
      { label: 'Gear checklist (custom items)', yes: true },
      { label: 'Sky Planner & alerts', yes: true },
      { label: 'Journal insights & patterns', yes: false },
      { label: 'Instructor hub access', yes: false },
      { label: 'Client email generator', yes: false },
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    icon: Star,
    price: '$14.99',
    annual: '$149/yr',
    period: '/month',
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    job: '"Learn & Master" — instructor-level access',
    features: [
      { label: 'Tonight basic sky status', yes: true },
      { label: 'Major event teasers', yes: true },
      { label: 'Location pre-fill', yes: true },
      { label: 'Full viability scores', yes: true },
      { label: 'Guided shoot plans', yes: true },
      { label: 'Gear checklist (custom items)', yes: true },
      { label: 'Sky Planner & alerts', yes: true },
      { label: 'Journal insights & patterns', yes: true },
      { label: 'Instructor hub access', yes: true },
      { label: 'Client email generator', yes: true },
    ],
  },
];

export default function TierComparisonCard({ currentTier }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="rounded-xl border border-white/8 p-6 mb-6" style={{ background: '#1a1a1a' }}>
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setCollapsed(c => !c)}
      >
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400" /> Plan Comparison
        </h3>
        <span className="text-slate-500 text-xs">{collapsed ? 'Show ▾' : 'Hide ▴'}</span>
      </button>

      {!collapsed && (
        <div className="mt-5 overflow-x-auto">
          <div className="grid grid-cols-3 gap-3 min-w-[480px]">
            {TIERS.map(tier => {
              const Icon = tier.icon;
              const isCurrent = currentTier === tier.id || (!currentTier && tier.id === 'free');
              return (
                <div
                  key={tier.id}
                  className="rounded-xl p-4 relative"
                  style={{
                    background: tier.highlight ? 'rgba(79,70,229,0.08)' : '#111111',
                    border: tier.highlight ? '1px solid rgba(99,88,234,0.4)' : '1px solid rgba(255,255,255,0.07)'
                  }}
                >
                  {tier.badge && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#4f46e5' }}>
                      {tier.badge}
                    </div>
                  )}
                  <Icon className={`w-5 h-5 ${tier.color} mb-2`} />
                  <p className="text-white font-bold text-sm">{tier.label}</p>
                  <p className={`font-bold text-lg ${tier.color}`}>
                    {tier.price}<span className="text-xs text-slate-500 font-normal">{tier.period}</span>
                  </p>
                  {tier.annual && (
                    <p className="text-xs text-slate-500">{tier.annual} — save 17%</p>
                  )}
                  <p className="text-slate-500 text-[10px] mt-1 leading-snug italic">{tier.job}</p>

                  <div className="mt-3 space-y-1.5">
                    {tier.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {f.yes
                          ? <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          : <Minus className="w-3 h-3 text-slate-700 flex-shrink-0" />}
                        <span className={`text-[11px] leading-tight ${f.yes ? 'text-slate-300' : 'text-slate-600'}`}>{f.label}</span>
                      </div>
                    ))}
                  </div>

                  {isCurrent ? (
                    <div className="mt-3 text-center text-xs text-emerald-400 font-semibold">✓ Current plan</div>
                  ) : tier.id !== 'free' ? (
                    <Link to={createPageUrl('PaymentGate')}>
                      <button
                        className="w-full mt-3 h-7 text-xs font-bold rounded-lg text-white flex items-center justify-center gap-1 transition-colors"
                        style={{ background: '#4f46e5' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                        onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
                      >
                        Upgrade <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Lifetime callout */}
          <div className="mt-4 p-3 rounded-lg flex items-center justify-between gap-3" style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#111111' }}>
            <div>
              <p className="text-slate-200 font-semibold text-sm">⭐ Lifetime Access — $99 one-time</p>
              <p className="text-slate-500 text-xs">Unlocks Plus features forever. No recurring charges.</p>
            </div>
            <Link to={createPageUrl('PaymentGate')}>
              <button
                className="text-white font-bold text-xs whitespace-nowrap h-7 px-3 rounded-lg transition-colors"
                style={{ background: '#4f46e5' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
                onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
              >
                Get Lifetime
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}