import React from 'react';

export default function PageHeader({ 
  icon: Icon, 
  title, 
  subtitle, 
  action,
  badge 
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className="w-6 h-6 text-red-400" />}
        {badge && (
          <span className="inline-flex items-center gap-2 bg-red-900/30 border border-red-600/30 rounded-full px-3 py-1 text-xs font-semibold text-red-300 uppercase tracking-widest">
            {badge}
          </span>
        )}
      </div>
      <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{title}</h1>
      {subtitle && <p className="text-slate-400 text-sm md:text-base max-w-2xl">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}