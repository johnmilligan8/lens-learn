import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Telescope,
  Home,
  MapPin,
  Users,
  User,
  Settings,
  LogOut,
  X,
  Star,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Smartphone,
  Zap
} from 'lucide-react';
import NightModeToggle from '@/components/ui/NightModeToggle';

const navItems = [
  { icon: Home, label: 'Mission Control', page: 'Dashboard' },
  { icon: Rocket, label: 'Tonight?', page: 'TonightHub' },
  { icon: Smartphone, label: 'Star Pointer', page: 'StarPointer' },
  { icon: Star, label: 'Free Starter Course', page: 'FreeCourse', freeTag: true },
  { icon: Zap, label: 'Field Mode', page: 'FieldMode', paidOnly: true },
  { icon: MapPin, label: 'Sky Planner', page: 'PlannerTool', paidOnly: true },
  { icon: Users, label: 'Explorer Gallery', page: 'CommunityGallery' },
  { icon: User, label: 'My Profile', page: 'Profile' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nightMode, setNightMode] = useState(() => localStorage.getItem('ug_night_mode') === 'true');
  const navigate = useNavigate();
  const location = useLocation();

  const toggleNightMode = () => {
    setNightMode(prev => {
      const next = !prev;
      localStorage.setItem('ug_night_mode', String(next));
      return next;
    });
  };

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
      const freePages = ['PaymentGate', 'Profile', 'Dashboard', 'EventsCalendar', 'CommunityGallery', 'FreeCourse', 'Onboarding', 'TonightHub', 'StarPointer'];
      if (!isSubscribed && !freePages.includes(currentPageName)) {
        navigate(createPageUrl('Dashboard'));
      }
    }
  }, [loading, user, isSubscribed, currentPageName]);

  // Pages that are "root" tabs — all others are child screens
  const rootPages = ['Dashboard', 'TonightHub', 'StarPointer', 'PlannerTool', 'CommunityGallery', 'Profile',
    'EventsCalendar', 'FreeCourse', 'InstructorDashboard', 'PaymentGate', 'Onboarding', 'FieldMode'];
  const isChildScreen = !rootPages.includes(currentPageName);

  // Track last visited path per tab
  const tabHistory = React.useRef({});
  const tabRoots = ['Dashboard', 'TonightHub', 'PlannerTool', 'CommunityGallery', 'Profile'];

  // On every location change, update the tab history for the current root tab
  useEffect(() => {
    const matchedTab = tabRoots.find(tab => {
      const tabUrl = createPageUrl(tab);
      return location.pathname === tabUrl || location.pathname.startsWith(tabUrl + '?') || location.pathname.startsWith(tabUrl + '/');
    });
    // If current page is a child, associate it with the closest tab root
    if (!matchedTab) {
      // find which tab "owns" this child via currentPageName heuristic — skip
    } else {
      tabHistory.current[matchedTab] = location.pathname + location.search;
    }
  }, [location]);

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
          <Telescope className="w-12 h-12 text-red-400 star-pulse" />
          <p className="text-slate-400 text-lg tracking-widest uppercase text-sm">Initializing Galaxy...</p>
        </div>
      </div>
    );
  }

  const NavLink = ({ item }) => {
    const locked = item.paidOnly && !isSubscribed;
    return (
      <Link
        to={locked ? createPageUrl('PaymentGate') : createPageUrl(item.page)}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            currentPageName === item.page
              ? 'bg-red-600/20 text-red-400 border border-red-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium">{item.label}</span>
        {item.freeTag && (
          <span className="ml-auto text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">FREE</span>
        )}
        {locked && (
          <Sparkles className="w-3.5 h-3.5 ml-auto text-yellow-500 flex-shrink-0" />
        )}
        {currentPageName === item.page && !item.freeTag && !locked && (
          <ChevronRight className="w-4 h-4 ml-auto text-red-400" />
        )}
      </Link>
    );
  };

  return (
    <div className={`min-h-screen cosmic-bg flex${nightMode ? ' night-vision-mode' : ''}`}>
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#111111]/95 backdrop-blur-md border-r border-white/5 sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800/40">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
            <img
              src="https://uncharted.net/wp-content/uploads/2022/09/Uncharted-Logo-Horizontal-White-e1664469570536.png"
              alt="UNCHARTED"
              className="h-8 w-auto object-contain"
              style={{ maxWidth: 160 }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
            <div style={{display:'none'}} className="items-center gap-2">
              <div className="bg-red-600 rounded-lg w-7 h-7 flex items-center justify-center">
                <Telescope className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-white text-lg tracking-tight">UNCHARTED</span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {allNavItems.map(item => <NavLink key={item.page} item={item} />)}
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-slate-800/60">
          {/* Night Vision Toggle */}
          <div className="mb-3">
            <NightModeToggle nightMode={nightMode} onToggle={toggleNightMode} />
          </div>
          {!isSubscribed && (
            <Link to={createPageUrl('PaymentGate')}>
                <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-600/40 hover:border-red-500/60 transition-colors">
                  <p className="text-xs text-red-200 font-semibold">🚀 Begin Your Expedition</p>
                  <p className="text-xs text-red-400/70 mt-0.5">Unlock the full galaxy</p>
                </div>
              </Link>
          )}
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
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
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111111]/98 backdrop-blur-md border-b border-white/5 flex items-center px-4 justify-between select-none"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
        {isChildScreen ? (
          <Button variant="ghost" size="sm" className="text-slate-300 -ml-2 gap-1" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Button>
        ) : (
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <img
                src="https://uncharted.net/wp-content/uploads/2022/09/Uncharted-Logo-Horizontal-White-e1664469570536.png"
                alt="UNCHARTED"
                className="h-7 w-auto object-contain"
                style={{ maxWidth: 130 }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <span style={{display:'none'}} className="font-black text-white text-lg tracking-tight">UNCHARTED</span>
            </Link>
        )}
        <div className="flex items-center gap-2">
          <NightModeToggle nightMode={nightMode} onToggle={toggleNightMode} compact />
          <Button variant="ghost" size="icon" className="text-slate-300" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/98 backdrop-blur-md border-t border-white/5 flex items-start select-none"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
      >
        {[
          { icon: Home, label: 'Home', page: 'Dashboard' },
          { icon: Rocket, label: 'Tonight', page: 'TonightHub' },
          { icon: Smartphone, label: 'Sky', page: 'StarPointer' },
          { icon: MapPin, label: 'Planner', page: 'PlannerTool', paidOnly: true },
          { icon: Users, label: 'Gallery', page: 'CommunityGallery' },
        ].map(item => {
          const locked = item.paidOnly && !isSubscribed;
          const active = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={locked ? createPageUrl('PaymentGate') : (tabHistory.current[item.page] || createPageUrl(item.page))}
              draggable={false}
              onClick={active ? (e) => { e.preventDefault(); navigate(tabHistory.current[item.page] || createPageUrl(item.page)); } : undefined}
                  className={`flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-1 transition-colors relative ${active ? 'text-red-400' : 'text-slate-500'}`}
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: 52 }}
                >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {locked && <Sparkles className="w-2 h-2 text-yellow-500 absolute top-1 right-3" />}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-red-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:overflow-auto overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="md:hidden" style={{ height: 'calc(3.5rem + env(safe-area-inset-top))' }} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <div className="md:hidden" style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }} />
      </main>
    </div>
  );
}