import React from 'react';

export default function QuickStats({ stats = [] }) {
  if (stats.length === 0) return null;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-[#1a1a1a] border border-white/8 rounded-lg p-4">
          <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">{stat.label}</p>
          <p className="text-2xl font-black text-white mt-2">{stat.value}</p>
          {stat.change && (
            <p className={`text-xs mt-2 ${stat.change.positive ? 'text-emerald-400' : 'text-slate-500'}`}>
              {stat.change.positive ? '↑' : '→'} {stat.change.text}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}