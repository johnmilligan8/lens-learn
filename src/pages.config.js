/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import CommunityGallery from './pages/CommunityGallery';
import EventsCalendar from './pages/EventsCalendar';
import FreeCourse from './pages/FreeCourse';
import InstructorDashboard from './pages/InstructorDashboard';
import LessonView from './pages/LessonView';
import ModuleView from './pages/ModuleView';
import Onboarding from './pages/Onboarding';
import SkyBrowser from './pages/SkyBrowser';
import StarPointer from './pages/StarPointer';
import PlannerTool from './pages/PlannerTool';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import TonightHub from './pages/TonightHub';
import PaymentGate from './pages/PaymentGate';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CommunityGallery": CommunityGallery,
    "EventsCalendar": EventsCalendar,
    "FreeCourse": FreeCourse,
    "InstructorDashboard": InstructorDashboard,
    "LessonView": LessonView,
    "ModuleView": ModuleView,
    "Onboarding": Onboarding,
    "SkyBrowser": SkyBrowser,
    "StarPointer": StarPointer,
    "PlannerTool": PlannerTool,
    "Dashboard": Dashboard,
    "Profile": Profile,
    "TonightHub": TonightHub,
    "PaymentGate": PaymentGate,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};