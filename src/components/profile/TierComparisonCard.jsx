import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Check, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROWS = [
  { label: 'Tonight? basic status',            free: true,  plus: true,  pro: true },
  { label: 'Full viability scores & drivers',  free: false, plus: true,  pro: true },
  { label: 'Guided Shoot Plans',               free: false, plus: true,  pro: true },
  { label: 'Gear checklist (custom items)',     free: false, plus: true,  pro: true },
  { label: 'AI Sky Planner & forecasts',        free: false, plus: true,  pro: true },
  { label: 'Aurora & cosmic alerts',            free: false, plus: true,  pro: true },
  { label: 'Journal insights & patterns',       free: false, plus: false, pro: true },
  { label: 'Client email generator',            free: false, plus: false, pro: true },
  { label: 'Premium custom alert thresholds',   free: false, plus: false, pro: true },
  { label: 'Instructor hub & course access',    free: false, plus: false, pro: true },
];

export default function TierComparisonCard({ currentTier }) {
  const isPlus = currentTier && currentTier !== 'free';
  const isPro = currentTier === 'pro_monthly' || currentTier === 'pro_annual';

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-400" /> Plan Features
        </h3>
        {!isPlus && (
          <Link to={createPageUrl('PaymentGate')}>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold">
              Upgrade →
            </Button>
          </Link>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-500 pb-3 pr-4 font-medium w-1/2">Feature</th>
              <th className="text-center text-slate-500 pb-3 px-2 font-medium">Free</th>
              <th className={`text-center pb-3 px-2 font-bold ${isPlus ? 'text-red-400' : 'text-slate-500'}`}>Plus<br/><span className="text-[10px] font-normal text-slate-600">$7.99/mo</span></th>
              <th className={`text-center pb-3 px-2 font-bold ${isPro ? 'text-yellow-400' : 'text-slate-500'}`}>Pro<br/><span className="text-[10px] font-normal text-slate-600">$14.99/mo</span></th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.label} className="border-b border-slate-800/50">
                <td className="py-2.5 pr-4 text-slate-300">{row.label}</td>
                <td className="py-2.5 px-2 text-center">{row.free ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <X className="w-3 h-3 text-slate-700 mx-auto" />}</td>
                <td className="py-2.5 px-2 text-center">{row.plus ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <X className="w-3 h-3 text-slate-700 mx-auto" />}</td>
                <td className="py-2.5 px-2 text-center">{row.pro ? <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" /> : <X className="w-3 h-3 text-slate-700 mx-auto" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isPlus && (
        <div className="mt-5 p-4 rounded-xl bg-red-900/10 border border-red-600/20 text-center">
          <p className="text-white text-sm font-bold mb-1">Ready to plan smarter?</p>
          <p className="text-slate-400 text-xs mb-3">Unlock Plus for guided shoot plans, full scores, gear tools & alerts.</p>
          <Link to={createPageUrl('PaymentGate')}>
            <Button className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-6">
              Unlock Plus — $7.99/mo
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}