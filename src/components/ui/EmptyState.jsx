import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) {
  return (
    <Card className="bg-slate-900/40 border-slate-800 p-12 text-center">
      {Icon && <Icon className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-60" />}
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      {action && action}
    </Card>
  );
}