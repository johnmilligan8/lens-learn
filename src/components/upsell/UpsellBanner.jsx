import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Zap, X } from 'lucide-react';

/**
 * Non-intrusive inline upsell banner.
 * Props: title, body, ctaLabel, ctaTier, dismissible (bool)
 */
export default function UpsellBanner({
  title = 'Plan smarter with Plus',
  body,
  ctaLabel = 'Unlock Plus — $7.99/mo',
  ctaTier = 'plus',
  dismissible = true,
  color = 'red',
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const borderColor = color === 'red' ? 'border-red-600/30' : 'border-purple-500/30';
  const bgGrad = color === 'red'
    ? 'from-red-900/20 to-red-800/10'
    : 'from-purple-900/20 to-indigo-900/10';
  const iconColor = color === 'red' ? 'text-red-400' : 'text-purple-400';
  const btnColor = color === 'red'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-purple-600 hover:bg-purple-700 text-white';

  return (
    <div className={`rounded-xl border ${borderColor} bg-gradient-to-r ${bgGrad} p-4 flex items-start gap-3`}>
      <Zap className={`w-4 h-4 ${iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold leading-tight">{title}</p>
        {body && <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{body}</p>}
        <Link
          to={`${createPageUrl('PaymentGate')}?tier=${ctaTier}`}
          className={`inline-block mt-2.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${btnColor}`}
        >
          {ctaLabel}
        </Link>
      </div>
      {dismissible && (
        <button onClick={() => setDismissed(true)} className="text-slate-600 hover:text-slate-400 flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}