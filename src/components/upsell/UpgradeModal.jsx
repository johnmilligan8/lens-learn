import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Zap, Check } from 'lucide-react';

/**
 * Reusable upsell modal.
 * Props:
 *   open, onClose
 *   title      — headline
 *   body       — supporting copy
 *   features   — string[] of bullet points
 *   ctaLabel   — button text (default: "Unlock Plus for $7.99/mo")
 *   ctaTier    — 'plus' | 'pro' (used to pre-select tier on PaymentGate)
 *   notNowLabel — dismiss text (default: "Not now")
 */
export default function UpgradeModal({
  open,
  onClose,
  title = 'Ready to plan smarter?',
  body = 'Unlock full viability scores, guided shoot plans, gear checklists, alerts, and more.',
  features = [],
  ctaLabel = 'Unlock Plus for $7.99/mo',
  ctaTier = 'plus',
  notNowLabel = 'Not now',
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-slate-700 max-w-sm p-0 overflow-hidden">
        {/* Gradient top strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />

        <div className="p-6">
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Upgrade</span>
          </div>

          <h3 className="text-white font-black text-xl mb-2 leading-snug">{title}</h3>
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">{body}</p>

          {features.length > 0 && (
            <ul className="space-y-2 mb-5">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  <Check className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <Link to={`${createPageUrl('PaymentGate')}?tier=${ctaTier}`} onClick={onClose}>
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-11 text-sm mb-3">
              {ctaLabel}
            </Button>
          </Link>
          <button
            onClick={onClose}
            className="w-full text-center text-slate-500 hover:text-slate-300 text-sm py-1 transition-colors"
          >
            {notNowLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}