import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, AlertCircle } from 'lucide-react';

export default function HistoricalWeatherAnalysis({ location, results }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeHistoricalWeather = async () => {
    if (!results || !location) return;
    setLoading(true);

    const d = new Date(results.coords?.name ? results.coords.name : location);
    const month = new Date().getMonth() + 1;

    const prompt = `Analyze historical weather patterns for astrophotography planning at ${results.coords?.name || location} during ${new Date().toLocaleString('en-US', { month: 'long' })}.

Based on typical climate data for this location during this season:
1. What are the most common clear nights this month? (frequency and timing)
2. What weather patterns typically affect this region? (monsoons, fog, cloud systems)
3. Best 5-7 day windows historically for clear skies
4. Any seasonal phenomena (fire smoke, dust storms, etc.)?
5. Recommended backup dates this month if current date has marginal forecasts

Provide actionable, specific insights for planning astrophotography shoots. Keep response concise and focused.`;

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
    });

    setAnalysis(res);
    setLoading(false);
  };

  if (!results) return null;

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" /> Historical Weather Patterns
        </h3>
        {!analysis && (
          <Button
            onClick={analyzeHistoricalWeather}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-blue-500/40 text-blue-300 hover:bg-blue-900/20 text-xs"
          >
            {loading ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Analyzing...</> : 'Analyze'}
          </Button>
        )}
      </div>

      {analysis ? (
        <>
          <div className="flex gap-2 mb-3 p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-slate-300 text-xs whitespace-pre-wrap leading-relaxed">{analysis}</p>
          </div>
          <Button
            onClick={() => setAnalysis(null)}
            size="sm"
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-800/50 text-xs"
          >
            Clear Analysis
          </Button>
        </>
      ) : (
        <p className="text-slate-500 text-sm">Learn optimal shooting dates based on historical weather patterns for {results.coords?.name || location}.</p>
      )}
    </Card>
  );
}