import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { X, Zap } from 'lucide-react';

/**
 * Non-intrusive inline upsell banner.
 * Props:
 *   headline  - bold line
 *   body      - smaller description
 *   cta       - button label
 *   tier      - 'plus' | 'pro' (sets color)
 *   onDismiss - optional dismiss handler
 */
export default function UpgradeNudge({ headline, body, cta = 'Upgrade Now', tier = 'plus', onDismiss }) {
  const colors = 'border-red-600/30 bg-[#1a1a1a]';
  const btnColors = 'bg-red-600 hover:bg-red-700';

  return (
    <div className={`rounded-xl border p-4 flex items-start gap-3 ${colors}`}>
      <Zap className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">{headline}</p>
        {body && <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{body}</p>}
        <Link to={createPageUrl('PaymentGate')}>
          <Button size="sm" className={`${btnColors} text-xs font-bold mt-2 h-7 px-3`}>
            {cta}
          </Button>
        </Link>
        {onDismiss && (
          <button onClick={onDismiss} className="text-xs text-slate-500 hover:text-slate-300 ml-3 mt-2">
            Not now
          </button>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-slate-600 hover:text-slate-400 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}