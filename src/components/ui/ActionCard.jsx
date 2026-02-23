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
  const colorMap = {
    purple: 'from-purple-900/30 to-purple-800/10 border-purple-500/40 hover:border-purple-400/70',
    emerald: 'from-emerald-900/30 to-teal-900/10 border-emerald-500/40 hover:border-emerald-400/70',
    blue: 'from-blue-900/30 to-blue-800/10 border-blue-500/40 hover:border-blue-400/70',
    yellow: 'from-yellow-900/30 to-yellow-800/10 border-yellow-500/40 hover:border-yellow-400/70',
  };
  
  const colorText = {
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
  };

  const iconColor = {
    purple: 'bg-purple-600/20 text-purple-400',
    emerald: 'bg-emerald-600/20 text-emerald-400',
    blue: 'bg-blue-600/20 text-blue-400',
    yellow: 'bg-yellow-600/20 text-yellow-400',
  };

  const content = (
    <Card className={`bg-gradient-to-br ${colorMap[color]} border p-6 card-glow hover:scale-[1.02] transition-all duration-200 group h-full ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className={`${iconColor[color]} p-4 rounded-xl w-fit mb-4`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-opacity-80 transition-colors">{title}</h3>
      <p className="text-slate-400 text-sm mb-4">{description}</p>
      <p className={`${colorText[color]} text-sm font-medium flex items-center gap-1`}>
        {label} <ChevronRight className="w-4 h-4" />
      </p>
    </Card>
  );

  return href && !disabled ? <Link to={href}>{content}</Link> : content;
}