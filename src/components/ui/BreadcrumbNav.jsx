import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function BreadcrumbNav({ items = [] }) {
  if (items.length === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {item.href ? (
            <Link to={item.href} className="hover:text-purple-400 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-400">{item.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="w-3 h-3" />}
        </div>
      ))}
    </div>
  );
}