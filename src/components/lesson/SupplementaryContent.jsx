import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Link as LinkIcon, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import QuizComponent from './QuizComponent';

const RESOURCE_ICONS = {
  article: <BookOpen className="w-4 h-4" />,
  video: '🎥',
  course: '📚',
  tool: '⚙️',
  documentation: '📖',
};

export default function SupplementaryContent({ supplement }) {
  const [expandedSummary, setExpandedSummary] = useState(false);

  if (!supplement) return null;

  return (
    <div className="space-y-8">
      {/* Summary */}
      {supplement.summary && (
        <Card className="bg-slate-900/60 border-slate-800 p-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Lesson Summary</h3>
          </div>
          <div className={`selectable-content prose prose-invert prose-purple max-w-none text-slate-300 [&_h3]:text-purple-300 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_li]:mb-1 [&_strong]:text-white [&_p]:mb-3 [&_ul]:ml-6 [&_ul]:list-disc ${
            !expandedSummary ? 'line-clamp-6' : ''
          }`}>
            <ReactMarkdown>{supplement.summary}</ReactMarkdown>
          </div>
          {supplement.summary.length > 500 && (
            <button
              onClick={() => setExpandedSummary(!expandedSummary)}
              className="text-purple-400 hover:text-purple-300 text-sm font-medium mt-3"
            >
              {expandedSummary ? 'Show less' : 'Show more'}
            </button>
          )}
        </Card>
      )}

      {/* Quiz */}
      {supplement.quiz && <QuizComponent quiz={supplement.quiz} />}

      {/* External Resources */}
      {supplement.external_resources && supplement.external_resources.length > 0 && (
        <Card className="bg-slate-900/60 border-slate-800 p-8">
          <div className="flex items-center gap-2 mb-6">
            <LinkIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Recommended Resources</h3>
          </div>
          <div className="space-y-4">
            {supplement.external_resources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-lg border border-slate-700 bg-slate-800/40 hover:bg-slate-800/60 hover:border-emerald-500/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-300 capitalize">
                        {resource.type}
                      </Badge>
                    </div>
                    <h4 className="text-white font-semibold group-hover:text-emerald-300 transition-colors truncate">
                      {resource.title}
                    </h4>
                    {resource.description && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{resource.description}</p>
                    )}
                  </div>
                  <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}