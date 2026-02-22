import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Camera, Zap } from 'lucide-react';

const monthlyFeatures = [
  'Full access to all 6 course modules',
  'Video lessons & written guides',
  'Milky Way planning tool',
  'Instructor feedback on photos',
  'Community gallery access',
  'Astronomy events calendar',
];

const lifetimeFeatures = [
  'Everything in Monthly Plan',
  'Lifetime access — pay once, own forever',
  'All future content updates included',
  'Priority instructor support',
  'Exclusive advanced modules',
  'Early access to new features',
];

export default function PaymentGate() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleSubscribe = async (tier) => {
    setLoading(tier);
    const today = new Date().toISOString().split('T')[0];
    const endDate = tier === 'monthly'
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : '2099-12-31';

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
      <div className="p-6 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2 max-w-6xl mx-auto">
          <Camera className="w-8 h-8 text-purple-400" />
          <span className="text-xl font-bold gradient-text">Uncharted.net</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Join thousands of night photographers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your <span className="gradient-text">Learning Plan</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Unlock the complete Milky Way photography curriculum, tools, and community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly */}
            <Card className="bg-slate-900/60 border-slate-700 p-8 relative overflow-hidden hover:border-purple-500/50 transition-all">
              <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <Zap className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-1">Monthly</h3>
                <p className="text-slate-400 text-sm mb-6">Perfect to get started</p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-bold text-white">$19</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {monthlyFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={!!loading}
                >
                  {loading === 'monthly' ? 'Processing...' : 'Start Monthly Plan'}
                </Button>
              </div>
            </Card>

            {/* Lifetime */}
            <Card className="bg-slate-900/60 border-purple-500/60 p-8 relative overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.15)]">
              <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                BEST VALUE
              </div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <Sparkles className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-1">Lifetime</h3>
                <p className="text-slate-400 text-sm mb-6">One payment, forever yours</p>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-bold text-white">$99</span>
                  <span className="text-slate-400">one-time</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {lifetimeFeatures.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-base"
                  onClick={() => handleSubscribe('lifetime')}
                  disabled={!!loading}
                >
                  {loading === 'lifetime' ? 'Processing...' : 'Get Lifetime Access'}
                </Button>
              </div>
            </Card>
          </div>

          <p className="text-center text-slate-600 text-sm mt-8">
            Secure payment powered by Stripe · Cancel monthly plan anytime · 7-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}