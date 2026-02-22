import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Telescope,
  Home,
  MapPin,
  Calendar,
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Star,
  Sparkles,
  ChevronRight,
  Rocket
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Mission Control', page: 'Dashboard' },
  { icon: Star, label: 'Free Starter Course', page: 'FreeCourse', freeTag: true },
  { icon: MapPin, label: 'Sky Planner', page: 'PlannerTool', paidOnly: true },
  { icon: Calendar, label: 'Cosmic Events', page: 'EventsCalendar' },
  { icon: Users, label: 'Explorer Gallery', page: 'CommunityGallery' },
  { icon: User, label: 'My Profile', page: 'Profile' },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const me = await base44.auth.me();
      setUser(me);

      if (me.role === 'admin') {
        setIsSubscribed(true);
      } else {
        const subs = await base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1);
        setIsSubscribed(subs.length > 0);
      }
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      // Free pages accessible to all authenticated users
      const freePages = ['PaymentGate', 'Profile', 'Dashboard', 'EventsCalendar', 'CommunityGallery', 'FreeCourse'];
      if (!isSubscribed && !freePages.includes(currentPageName)) {
        navigate(createPageUrl('Dashboard'));
      }
    }
  }, [loading, user, isSubscribed, currentPageName]);

  const allNavItems = user?.role === 'admin'
    ? [...navItems, { icon: Settings, label: 'Instructor Hub', page: 'InstructorDashboard' }]
    : navItems;

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Dashboard'));
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Telescope className="w-12 h-12 text-purple-400 star-pulse" />
          <p className="text-slate-400 text-lg tracking-widest uppercase text-sm">Initializing Galaxy...</p>
        </div>
      </div>
    );
  }

  const NavLink = ({ item }) => (
    <Link
      to={createPageUrl(item.page)}
      onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        currentPageName === item.page
          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
      }`}
    >
      <item.icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium">{item.label}</span>
      {currentPageName === item.page && (
        <ChevronRight className="w-4 h-4 ml-auto text-purple-400" />
      )}
    </Link>
  );

  return (
    <div className="min-h-screen cosmic-bg flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 backdrop-blur-md border-r border-slate-800/60 sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/40">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 bg-purple-600/30 rounded-xl blur-md" />
              <div className="relative bg-gradient-to-br from-purple-600 to-blue-700 rounded-xl w-10 h-10 flex items-center justify-center">
                <Telescope className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-black text-white text-base leading-none tracking-tight">
                UNCHARTED<sup className="text-[10px] font-normal align-super">®</sup> <span className="gradient-text">GALAXY</span>
              </p>
              <p className="text-purple-400/70 text-xs tracking-widest">www.uncharted.net</p>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allNavItems.map(item => <NavLink key={item.page} item={item} />)}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-800/60">
          {!isSubscribed && (
            <Link to={createPageUrl('PaymentGate')}>
              <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/40 hover:border-purple-400/60 transition-colors">
                <p className="text-xs text-purple-200 font-semibold">🚀 Begin Your Expedition</p>
                <p className="text-xs text-purple-400/70 mt-0.5">Unlock the full galaxy</p>
              </div>
            </Link>
          )}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.full_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.full_name || 'User'}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-red-400 flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/60 h-16 flex items-center px-4 justify-between">
        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-lg w-7 h-7 flex items-center justify-center">
            <Telescope className="w-4 h-4 text-white" />
          </div>
          <span className="font-black gradient-text text-lg tracking-tight">UnchartedGalaxy</span>
        </Link>
        <Button variant="ghost" size="icon" className="text-slate-300" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md pt-16">
          <nav className="p-4 space-y-1">
            {allNavItems.map(item => <NavLink key={item.page} item={item} />)}
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/60 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:overflow-auto">
        <div className="md:hidden h-16" />
        {children}
      </main>
    </div>
  );
}