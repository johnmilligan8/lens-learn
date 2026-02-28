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
  Zap,
  BookOpen,
  Menu
} from 'lucide-react';
import NightModeToggle from '@/components/ui/NightModeToggle';

const navItems = [
  { icon: Home, label: 'Mission Control', page: 'Dashboard' },
  { icon: Rocket, label: 'Tonight?', page: 'TonightHub' },
  { icon: Smartphone, label: 'Star Pointer', page: 'StarPointer' },
  { icon: Star, label: 'Free Starter Course', page: 'FreeCourse', freeTag: true },
  { icon: Zap, label: 'Field Mode', page: 'FieldMode', paidOnly: true },
  { icon: MapPin, label: 'Sky Planner', page: 'PlannerTool', paidOnly: true },
  { icon: BookOpen, label: 'Journal', page: 'Journal' },
  { icon: Users, label: 'Explorer Gallery', page: 'CommunityGallery' },
  { icon: User, label: 'My Profile', page: 'Profile' },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nightMode, setNightMode] = useState(() => {
    return localStorage.getItem('ug_night_mode') === 'true';
  });

  // Apply night vision: inject a fixed overlay div + body class
  useEffect(() => {
    const existing = document.getElementById('night-vision-overlay');
    if (existing) existing.remove();

    if (nightMode) {
      document.body.classList.add('night-vision-active');
      const overlay = document.createElement('div');
      overlay.id = 'night-vision-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(200, 0, 0, 0.30);
        pointer-events: none;
        z-index: 2147483647;
      `;
      document.body.appendChild(overlay);
    } else {
      document.body.classList.remove('night-vision-active');
    }
  }, [nightMode]);
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
      const freePages = ['PaymentGate', 'Profile', 'Dashboard', 'CommunityGallery', 'FreeCourse', 'Onboarding', 'TonightHub', 'StarPointer'];
      if (!isSubscribed && !freePages.includes(currentPageName)) {
        navigate(createPageUrl('Dashboard'));
      }
    }
  }, [loading, user, isSubscribed, currentPageName]);

  const rootPages = ['Dashboard', 'TonightHub', 'StarPointer', 'PlannerTool', 'CommunityGallery', 'Profile',
    'FreeCourse', 'InstructorDashboard', 'PaymentGate', 'Onboarding', 'FieldMode', 'Journal'];
  const isChildScreen = !rootPages.includes(currentPageName);

  const tabHistory = React.useRef({});
  const tabRoots = ['Dashboard', 'TonightHub', 'PlannerTool', 'FieldMode', 'Profile'];

  useEffect(() => {
    const matchedTab = tabRoots.find(tab => {
      const tabUrl = createPageUrl(tab);
      return location.pathname === tabUrl || location.pathname.startsWith(tabUrl + '?') || location.pathname.startsWith(tabUrl + '/');
    });
    if (matchedTab) {
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

  return (
    <div className="min-h-screen cosmic-bg flex flex-col">
      {/* Top Bar (all devices) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#111111]/98 backdrop-blur-md border-b border-white/5 flex items-center px-4 justify-between select-none"
        style={{ height: 'calc(3.5rem + env(safe-area-inset-top))', paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
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
        <div className="flex items-center gap-2">
          <NightModeToggle nightMode={nightMode} onToggle={toggleNightMode} compact />
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-400" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Bottom Tab Bar (5 icons: Home, Tonight, Planner, Field, Profile) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/98 backdrop-blur-md border-t border-white/5 flex items-start select-none"
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
          { icon: Smartphone, label: 'Pointer', page: 'StarPointer' },
          { icon: MapPin, label: 'Planner', page: 'PlannerTool', paidOnly: true },
          { icon: User, label: 'Profile', page: 'Profile' },
        ].map(item => {
          const locked = item.paidOnly && !isSubscribed;
          const active = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={locked ? createPageUrl('PaymentGate') : (tabHistory.current[item.page] || createPageUrl(item.page))}
              draggable={false}
              onClick={active ? (e) => { e.preventDefault(); navigate(tabHistory.current[item.page] || createPageUrl(item.page)); } : undefined}
              className={`flex-1 flex flex-col items-center justify-center pt-3 pb-2 gap-1 transition-colors relative ${active ? 'text-red-400' : 'text-slate-500 hover:text-slate-400'}`}
              style={{ WebKitTapHighlightColor: 'transparent', minHeight: 56 }}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span className="text-[11px] font-semibold leading-none">{item.label}</span>
              {locked && <Sparkles className="w-2.5 h-2.5 text-yellow-500 absolute top-2 right-2" />}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-red-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ height: 'calc(3.5rem + env(safe-area-inset-top))' }} />
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
        <div style={{ height: 'calc(4rem + env(safe-area-inset-bottom))' }} />
      </main>
    </div>
  );
}