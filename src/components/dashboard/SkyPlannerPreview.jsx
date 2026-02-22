import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Star, MapPin, Eye, Telescope, ChevronRight } from 'lucide-react';

export default function SkyPlannerPreview() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Telescope className="w-6 h-6 text-purple-400" /> Premium Tools Preview
      </h2>
      <p className="text-slate-400 text-sm">Unlock advanced planning features:</p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Sky Map Preview */}
        <Link to={createPageUrl('PaymentGate')}>
          <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-purple-500/30 p-6 cursor-pointer hover:border-purple-400/50 transition-all hover:scale-[1.02] relative overflow-hidden group">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-purple-300">Unlock Now</p>
              </div>
            </div>

            <div className="relative z-0 opacity-70">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-white">Interactive Sky Map</h3>
              </div>

              {/* Mini star field visualization */}
              <div className="bg-slate-900/60 rounded-lg h-40 mb-3 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.8 + 0.2,
                      }}
                    />
                  ))}
                </div>
                <p className="text-slate-500 text-xs text-center relative z-10">
                  🌌 Click sky to identify planets & stars<br/>
                  Constellations • Rising/setting times
                </p>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Find planets & stars by clicking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Constellation boundaries
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">✓</span> Real-time Alt/Az positioning
                </li>
              </ul>
            </div>
          </Card>
        </Link>

        {/* Ephemeris & Tools Preview */}
        <Link to={createPageUrl('PaymentGate')}>
          <Card className="bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-500/30 p-6 cursor-pointer hover:border-blue-400/50 transition-all hover:scale-[1.02] relative overflow-hidden group">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all flex items-center justify-center z-10">
              <div className="text-center">
                <Lock className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-blue-300">Unlock Now</p>
              </div>
            </div>

            <div className="relative z-0 opacity-70">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white">Ephemeris Lookup</h3>
              </div>

              <div className="bg-slate-900/60 rounded-lg p-3 mb-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sirius</span>
                  <span className="text-blue-300 font-mono">45.3° | 120.5°</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Jupiter</span>
                  <span className="text-blue-300 font-mono">32.1° | 215.8°</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">M31 (Andromeda)</span>
                  <span className="text-blue-300 font-mono">51.2° | 85.4°</span>
                </div>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Search any celestial object
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Altitude & azimuth for any time
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">✓</span> Transit & visibility windows
                </li>
              </ul>
            </div>
          </Card>
        </Link>
      </div>

      {/* CTA */}
      <Link to={createPageUrl('PaymentGate')}>
        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-11 text-base font-bold">
          Upgrade to Sky Planner <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </Link>

      <p className="text-slate-600 text-xs text-center">Plus tier includes Galactic Core times, moon impact, Bortle scale, weather, and more.</p>
    </div>
  );
}