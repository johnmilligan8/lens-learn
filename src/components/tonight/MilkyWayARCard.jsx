import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, Lock, ChevronRight } from 'lucide-react';
import MilkyWayARPreview from '../planner/MilkyWayARPreview';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function MilkyWayARCard({ lat, lon, dateStr, isSubscribed, shooterMode }) {
  const [showAR, setShowAR] = useState(false);

  if (showAR) {
    return (
      <MilkyWayARPreview
        lat={lat}
        lon={lon}
        dateStr={dateStr}
        isSubscribed={isSubscribed}
        shooterMode={shooterMode}
      />
    );
  }

  return (
    <Card className="bg-[#1a1a1a] border border-white/8 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2 mb-1">
            <Compass className="w-4 h-4 text-red-400" /> Milky Way AR Scout
          </h3>
          <p className="text-slate-400 text-xs">See where the Milky Way will appear tonight using your camera.</p>
          {!isSubscribed && (
            <p className="text-yellow-300 text-xs mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Plus tier feature
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        {isSubscribed ? (
          <Button
            onClick={() => setShowAR(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 h-9 text-sm gap-2"
          >
            <Compass className="w-4 h-4" /> Launch AR View
          </Button>
        ) : (
          <Link to={createPageUrl('PaymentGate')} className="block">
            <Button variant="outline" className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-900/20 h-9 text-sm gap-2">
              <Lock className="w-3 h-3" /> Upgrade for AR Scout
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}