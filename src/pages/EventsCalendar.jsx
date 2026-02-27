// Cosmic Events has been merged into Sky Planner.
// This redirect ensures old links still work.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EventsCalendar() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(createPageUrl('PlannerTool') + '?tab=events', { replace: true });
  }, []);
  return null;
}