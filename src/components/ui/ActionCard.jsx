import React from 'react';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ActionCard({ 
  icon: Icon,
  title, 
  description, 
  label,
  href,
  color = 'purple',
  disabled = false 
}) {
  const accentText = {
    purple: 'text-red-400',
    emerald: 'text-red-400',
    blue: 'text-red-400',
    yellow: 'text-red-400',
  };

  const content = (
    <Card className={`bg-[#1a1a1a] border border-white/8 hover:border-red-600/40 p-6 hover:scale-[1.02] transition-all duration-200 group h-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="bg-red-600/10 border border-red-700/30 p-3 rounded-xl w-fit mb-4">
        {Icon && <Icon className="w-6 h-6 text-red-400" />}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-4">{description}</p>
      <p className="text-red-400 text-sm font-medium flex items-center gap-1">
        {label} <ChevronRight className="w-4 h-4" />
      </p>
    </Card>
  );

  return href && !disabled ? <Link to={href}>{content}</Link> : content;
}