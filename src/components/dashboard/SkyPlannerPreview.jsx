import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Star, MapPin, Eye, Telescope, ChevronRight, Zap } from 'lucide-react';

// Mini previews showing real astronomy data
const SAMPLE_OBJECTS = [
  { name: 'Sirius', alt: 45, az: 120 },
  { name: 'Jupiter', alt: 32, az: 216 },
  { name: 'M31', alt: 51, az: 85 },
];

function SkyPreviewCanvas() {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-black rounded-lg h-40 mb-3 relative overflow-hidden">
      {/* Starfield */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }}>
        {[...Array(20)].map((_, i) => (
          <circle
            key={i}
            cx={`${Math.random() * 100}%`}
            cy={`${Math.random() * 100}%`}
            r={Math.random() * 1.5}
            fill="white"
            opacity={Math.random() * 0.7 + 0.3}
          />
        ))}
      </svg>
      {/* Labels */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <p className="text-slate-300 text-sm font-mono">~40° Alt | 120° Az</p>
        <p className="text-slate-500 text-xs">Your local sky now</p>
      </div>
    </div>
  );
}

export default function SkyPlannerPreview() {
  const [currentObjects, setCurrentObjects] = useState(SAMPLE_OBJECTS);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Telescope className="w-6 h-6 text-purple-400" /> Premium Tools Preview
      </h2>
      <p className="text-slate-400 text-sm">Try limited previews of Sky Planner tools:</p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Sky Map Preview */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-500/30 p-6 relative overflow-hidden group hover:border-purple-400/50 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Interactive Sky Map</h3>
            <Badge className="ml-auto bg-purple-600 text-xs">Preview</Badge>
          </div>

          <SkyPreviewCanvas />

          <ul className="space-y-1.5 text-xs text-slate-300 mb-4">
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> Find planets & stars by position
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> Constellation boundaries
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400">✓</span> Real-time Alt/Az positioning
            </li>
          </ul>

          <Link to={createPageUrl('PaymentGate')} className="block">
            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
              <Zap className="w-3 h-3 mr-1" /> Upgrade for Full Map
            </Button>
          </Link>
        </Card>

        {/* Ephemeris & Tools Preview */}
        <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-500/30 p-6 relative overflow-hidden group hover:border-blue-400/50 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Object Lookup</h3>
            <Badge className="ml-auto bg-blue-600 text-xs">Preview</Badge>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-3 mb-4 space-y-1.5 max-h-32 overflow-y-auto">
            {currentObjects.map((obj, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-slate-400">{obj.name}</span>
                <span className="text-blue-300 font-mono">{obj.alt}° | {obj.az}°</span>
              </div>
            ))}
          </div>

          <ul className="space-y-1.5 text-xs text-slate-300 mb-4">
            <li className="flex items-center gap-2">
              <span className="text-blue-400">✓</span> Search major objects
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">✓</span> Altitude & azimuth
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-400">✓</span> Visibility windows
            </li>
          </ul>

          <Link to={createPageUrl('PaymentGate')} className="block">
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
              <Zap className="w-3 h-3 mr-1" /> Unlock Full Lookup
            </Button>
          </Link>
        </Card>
      </div>

      {/* Main CTA */}
      <Link to={createPageUrl('PaymentGate')}>
        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11 text-base font-bold">
          Upgrade to Sky Planner <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>

      <p className="text-slate-600 text-xs text-center">Plus tier: Interactive sky maps, 1000+ objects, weather integration, moon impact, and more.</p>
    </div>
  );
}