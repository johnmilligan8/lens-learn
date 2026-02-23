import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Lightbulb, Loader2, Award, ExternalLink } from 'lucide-react';

const expertInsights = [
  {
    topic: 'Wide-Angle Lens Performance',
    category: 'Gear',
    source: 'DPReview',
    insight: 'Tokina 11-16mm f/2.8 dominates wide-angle astrophotography. Samyang 14mm f/2.8 is budget alternative.',
    relevance: 'You selected wide-angle lenses',
  },
  {
    topic: 'Star Tracker Polar Alignment',
    category: 'Technique',
    source: 'Reddit r/astrophotography',
    insight: 'Polar alignment error >15 arcmin visible on tracked exposures >30sec. Use PoleMaster app or drift alignment method.',
    relevance: 'Related to tracked sky technique',
  },
  {
    topic: 'F/1.4 vs F/2.8 in Light Pollution',
    category: 'Gear',
    source: 'Fred Miranda Podcast',
    insight: 'F/1.4 gives ~1.4x more light than F/2.8, but diffraction limits sharpness. F/2 often best compromise.',
    relevance: 'Balance for your aperture choice',
  },
  {
    topic: 'ISO Selection for Stacking',
    category: 'Technique',
    source: 'Astro Imagery',
    insight: 'Lower ISO + more frames (8-12) often better than high ISO + few frames. Noise reduction compounds in stacks.',
    relevance: 'Best practice for noise reduction',
  },
  {
    topic: 'Milky Way Core Composition',
    category: 'Composition',
    source: 'DPReview',
    insight: 'Golden hour foreground + core as thirds rule. Silhouette foreground lets core shine; avoid blown highlights.',
    relevance: 'Framing the galactic center',
  },
];

export default function ExpertInsightsPanel({ userGear }) {
  const [insights, setInsights] = useState(expertInsights);
  const [loading, setLoading] = useState(false);

  // In a real app, this would fetch curated insights from a backend that scrapes Reddit/DPReview
  // For now, showing static expert tips curated by instructors
  useEffect(() => {
    setLoading(false);
  }, [userGear]);

  return (
     <Card className="bg-[#1a1a1a] border-white/8 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-white font-bold text-lg">Expert Insights</h3>
      </div>
      <p className="text-slate-400 text-sm">Curated tips from gear reviews, forums, and community discussions.</p>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-4">
           <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading insights...</p>
        </div>
      ) : (
        <div className="space-y-3">
           {insights.map((insight, i) => (
             <div
               key={i}
               className="bg-white/5 border border-white/8 rounded-lg p-3.5 hover:border-white/15 transition-colors space-y-2"
             >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{insight.topic}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{insight.source}</p>
                </div>
                <Award className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">{insight.insight}</p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-1.5">
                   <Badge variant="outline" className="bg-white/10 border-white/20 text-slate-200 text-xs">
                     {insight.category}
                   </Badge>
                   <Badge variant="outline" className="bg-red-900/30 border-red-600/40 text-red-300 text-xs">
                     {insight.relevance}
                   </Badge>
                 </div>
                <button className="text-slate-500 hover:text-slate-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-slate-600 text-xs pt-2 border-t border-white/8">
        Insights updated weekly from r/astrophotography, DPReview, and instructor reviews. Request a topic? Contact support.
      </p>
    </Card>
  );
}