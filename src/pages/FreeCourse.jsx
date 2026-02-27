import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play, BookOpen, CheckSquare, ChevronRight, Lock,
  Star, Camera, MapPin, Telescope, Zap, Check,
  Compass, Eye, Moon, Mountain, Settings, Layers
} from 'lucide-react';

// ── Module & Lesson Definitions ────────────────────────────────────────────

const FREE_MODULES = [
  {
    id: 'mod-1',
    title: 'Pre-Class Preparation',
    subtitle: 'Gear up, find your spot, learn the app',
    icon: Compass,
    color: 'emerald',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Welcome — Your Milky Way Journey Starts Here',
        type: 'article',
        duration: '5 min read',
        description: 'Your first Milky Way shot starts here — with Uncharted Galaxy as your companion. Here\'s what this course covers and how to use the app alongside each lesson.',
        content: `## Welcome, Explorer

Your first Milky Way shot starts here — and **Uncharted Galaxy** is your companion every step of the way.

This free starter course teaches you everything you need to go from total beginner to capturing a jaw-dropping image of the galaxy. We'll use the app's built-in tools at every step so you're learning and doing simultaneously.

### What You'll Learn

**Module 1 (Free): Pre-Class Preparation**
Setting up your gear list, choosing your location, and navigating the app so nothing surprises you in the dark.

**Module 2 (Free): Exposure & Settings Fundamentals**
The exact ISO, aperture, and shutter speed settings that work — and how to use the app's Camera Calculator to dial them in on the fly.

**Plus Modules (Unlock for $7.99/mo):**
- Module 3: Planning the Shot — Sky Planner + Cosmic Events + AR Scout
- Module 4: Composition & Focus — Guided Shoot Plan + foreground alignment
- Module 5: In-Class Execution — Field Mode walkthrough + Blue Hour/LLL
- Module 6: Post-Class Reflection — Journal, outcome tagging, insights

### How to Use This Course
Open the app alongside each lesson. When we say "open Tonight?", open it. When we say "set your home location", do it now. The best way to learn is to do.

Let's begin.
`,
      },
      {
        id: 'm1-l2',
        title: 'Gear Checklist — What You Actually Need',
        type: 'article',
        duration: '8 min read',
        description: 'The essential gear list for your first shoot — tailored to your mode.',
        appLink: { label: 'Open Sky Planner → Gear', page: 'PlannerTool' },
        modeVariant: {
          photographer: `## Gear Checklist — Full Expedition Kit

      You'll be packing serious gear for advanced Milky Way and night sky work.

      ### Camera Body
      Any DSLR or mirrorless with **manual mode** works. Canon Rebel, Sony A6000, Nikon D3500 — all excellent starters. Full-frame preferred for Milky Way depth.

      ### The Lens (Most Important)
      This is where it matters. You want:
      - **Focal length**: 14mm–24mm (full-frame equivalent)
      - **Aperture**: f/1.4–f/2.8 (wider = more light = better)
      - **Budget pick**: Rokinon/Samyang 14mm f/2.8 (~$300)
      - **Premium pick**: Samyang 14mm f/2.4, Tokina 16–35mm f/2.8

      ### Tripod & Stability
      Non-negotiable. You'll need:
      - Sturdy tripod with ball head or fluid head
      - L-bracket for vertical shots
      - Leveling base or wedges

      ### Advanced Gear (Unlock with Plus/Pro)
      - Intervalometer for timelapses and star trackers
      - Dew heater & controller (high-altitude/humid shoots)
      - Remote trigger (wired/wireless)
      - Extra batteries, high-speed memory cards (256GB+)

      ### Use the App's Gear Checklist
      **Open Sky Planner → Gear** and create a kit. Full photographer preset includes every category. Customize and save for each expedition type.

      **Your action:** Open Sky Planner Gear, select Photographer mode, and check off what you own.
      `,
          smartphone: `## Gear Checklist — Phone-Friendly Essentials

      You're traveling light and focused on Night Mode stability.

      ### Phone & Mount
      - Recent flagship: iPhone 14+ Pro, Google Pixel 8+, Samsung S24
      - **Phone tripod/clamp** (non-negotiable for long exposure)
      - Small Bluetooth remote or self-timer (hands-free stability)

      ### Power
      - **Power bank**: 20,000+ mAh (Night Mode is battery-hungry)
      - Charging cable (USB-C preferred)
      - Consider a solar charger for field sessions

      ### Stability & Comfort
      - Mini tripod or gorillapod (low-light hand-holding is difficult)
      - Phone grip or strap (cold hands slip)
      - Warm layers, headlamp (red + white mode)
      - Snacks, water bottle

      ### Optional: Night Mode Apps
      - Native iPhone Night Mode or Google Pixel Astrophotography
      - Adobe Lightroom Mobile (editing in the field)
      - Snapseed (quick touch-ups)

      ### What NOT to Bring
      - Heavy DSLR gear (defeats the purpose)
      - Lens filters (phone fixed lens)
      - Tripod head (clamp works fine)

      ### Use the App's Gear Checklist
      **Open Sky Planner → Gear** and select **Smartphone** mode. The checklist focuses on power, stability, and warmth — skip the heavy camera gear.

      **Your action:** Open Sky Planner Gear, select Smartphone mode, and check off what you have.
      `,
          experience: `## Gear Checklist — Light Viewing Essentials

      You're here for the sky itself. Minimal gear, maximum wonder.

      ### Must-Have
      - **Headlamp** with red light mode (preserves night vision — crucial)
      - Warm layers, hat, blanket or sleeping bag
      - Comfortable chair or blanket to lie on
      - Water, snacks, hot drink (thermos)

      ### Optional Gear
      - **Binoculars** (10x50 or similar) to see more stars
      - **Small telescope** (low magnification like 25–50x, great for star clusters and Moon)
      - Smartphone for star-finding apps (SkySafari, Stellarium)

      ### What You Don't Need
      - Camera
      - Tripod
      - Complex settings
      - Post-processing

      ### Dark Adaptation Tip
      **Wait 20–30 minutes after arriving** before looking up at the sky. Your eyes need time to adapt to darkness. Red headlamp light won't reset this adaptation.

      ### Use the App's Gear Checklist
      **Open Sky Planner → Gear** and select **Sky Experience** mode. Checklist emphasizes comfort and observation tools only.

      **Your action:** Open Sky Planner Gear, select Sky Experience mode, and note what helps you stay comfortable in the dark.
      `,
        },
      },
      {
        id: 'm1-l3',
        title: 'Set Your Home Base — Location Setup',
        type: 'article',
        duration: '6 min read',
        description: 'Set your home location in the app to get accurate tonight forecasts, moon phases, and galactic core timing.',
        appLink: { label: 'Open Profile → Set Location', page: 'Profile' },
        content: `## Set Your Home Base

The app uses your location to calculate everything: when the Milky Way rises, what the moon phase is, Bortle scale (light pollution), and weather forecasts.

### Set It Now
1. Tap **My Profile** in the navigation
2. Find **Home Location** and tap Set Location
3. You can type a city name, use GPS, or pick from the dark sky spots list

### Utah's Best Dark Sky Spots

| Location | Drive from SLC | Bortle |
|----------|---------------|--------|
| Stansbury Island | 45 min | 3 |
| Bonneville Salt Flats | 1.5 hrs | 2 |
| Little Sahara | 2 hrs | 2 |
| Capitol Reef NP | 3.5 hrs | 1 |

**Bortle 1–3** = excellent dark skies. Anything above 5 and the Milky Way starts washing out.

### Understanding Light Pollution
The app shows your location's estimated Bortle scale in the Sky Planner. Aim for a location with Bortle 3 or lower for your first shoot.

**Your action:** Set your home location in Profile now. Then open **Tonight?** and confirm you can see conditions for your area.
`,
      },
      {
        id: 'm1-l4',
        title: 'App Navigation Overview — Your Pre-Shoot Workflow',
        type: 'article',
        duration: '7 min read',
        description: 'A quick tour of every screen you\'ll use before a shoot — and the exact workflow to follow the night before.',
        appLink: { label: 'Open Tonight?', page: 'TonightHub' },
        content: `## App Navigation Overview

Before every shoot, run through this sequence in Uncharted Galaxy:

### 1. Check Tonight? First
Open **Tonight?** from the bottom nav. This is your go-to screen before any shoot. It shows:
- Tonight's aurora, moon phase, and Milky Way conditions at a glance
- Weather summary and cloud cover
- Ranked events — the app tells you what's worth shooting tonight

**Curriculum tip from Tonight?:** Aim for moon phase below 10%. The app shows this prominently — if the moon is bright, pick a different night or wait until it sets.

### 2. Sky Planner for Detailed Planning
For serious sessions, open **Sky Planner**. Enter your location and date to see:
- Galactic core rise/set/peak times
- Moon phase calculator
- Bortle scale for your spot
- Weather forecast with an astrophotography-specific Astro Score

### 3. Cosmic Events for What's Upcoming
Check **Cosmic Events** for upcoming meteor showers, eclipses, and aurora alerts. These are the nights worth planning around.

### 4. Star Pointer for Orientation
In the field, use **Star Pointer** to point your phone at the sky and identify what you're looking at. Great for finding the galactic core direction before dark.

### 5. Field Mode for Execution
When you're on location and ready to shoot, open **Field Mode**. It shows current conditions, a settings calculator, composition tips, and a guided plan if you set one up.

**Your action:** Open **Tonight?** right now and read the conditions for tonight. Note the moon phase percentage.
`,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Exposure & Settings Fundamentals',
    subtitle: 'ISO, aperture, shutter — dialed in with the app',
    icon: Camera,
    color: 'red',
    lessons: [
      {
        id: 'm2-l1',
        title: 'The Three Settings That Matter',
        type: 'article',
        duration: '8 min read',
        description: 'Exposure settings explained — ISO, aperture, shutter speed.',
        modeVariant: {
          photographer: `## The Three Settings That Matter — Camera Edition

      Night sky photography is just three settings, dialed correctly. Master these and you control light.

      ### 1. ISO: Your Light Sensitivity
      **Start at ISO 3200.** If the image looks too dark, try 6400.

      - ISO 1600 = dimmer stars, cleaner image
      - ISO 3200 = good balance for most cameras
      - ISO 6400 = brighter stars, more noise (grain)
      - ISO 12800+ = only if your camera handles it cleanly (full-frame preferred)

      **Rule of thumb:** Use the highest ISO where grain is still acceptable. Full-frame sensors clean up better at high ISO.

      ### 2. Aperture: Open It as Wide as Possible
      **Set your aperture as wide as it goes.** f/1.4, f/1.8, f/2.0, f/2.8 — the lower the number, the more light you collect.

      - f/1.4–f/1.8 = excellent, very bright stars
      - f/2.0–f/2.8 = the sweet spot for most lenses
      - f/3.5–f/4.0 = usable but you'll need higher ISO to compensate
      - f/5.6+ = not suitable for Milky Way

      ### 3. Shutter Speed: Keep Stars as Points
      Stars appear to move (technically Earth rotates). Too long an exposure and stars become streaks instead of points.

      **The quick rule:** 20–25 seconds for most wide-angle lenses. The app's Camera Calculator will give you a precise number based on your focal length and sensor.

      ### Manual Focus: The Most Overlooked Step
      Switch to **manual focus**. Point at a bright star, zoom in on your camera's live view to 10x magnification, and rotate the focus ring until the star is as small/sharp as possible. **Lock it and don't touch it.**

      ### Pro Tip: RAW Only
      Always shoot **RAW** — you'll have infinite control in post (white balance, shadow recovery, highlight recovery). JPEGs are baked-in forever.

      **Your action:** Set your camera to ISO 3200, your widest aperture, and 20 seconds. Take a test shot pointing at a light source to confirm settings are saving correctly.
      `,
          smartphone: `## The Three Settings That Matter — Phone Night Mode Edition

      Phone Night Mode does much of the heavy lifting for you. Here's what you actually control.

      ### Night Mode Activation
      - **iPhone**: Open Camera app, select Night Mode (golden icon, lower half of screen)
      - **Pixel**: Open Camera app, Night Sight mode, or use Magic Eraser for composites
      - **Samsung**: Open Camera, Pro mode, then switch to Night/Astrophotography

      Once activated, **hold very still**. Phone takes multiple exposures automatically (5–10 seconds). A tripod or stabilizer is non-negotiable.

      ### What You Can Adjust
      - **Brightness slider**: Increase for more light; decrease if overexposed
      - **Focus**: Tap the star area on screen to focus there
      - **Time**: Don't move until the counter finishes (usually 10+ seconds)

      ### Realistic Expectations
      Phone Night Mode excels at:
      - **Bright, nearby Milky Way** (if Bortle 1–2)
      - **Moon and bright planets**
      - **Foreground + stars** (blended composite)

      Phone Night Mode struggles with:
      - **Faint Milky Way details** (phone sensors smaller, more noise)
      - **Aurora** (needs brightness and real-time movement capture)
      - **Star color** (phone tends to render cool/blue)

      ### Post-Processing on Phone
      After the shot, edit in:
      - **Snapseed**: Adjust shadows, highlights, warmth
      - **Lightroom Mobile**: White balance, curves, clarity

      This is where phone Milky Way images shine — edit aggressively.

      **Your action:** Open your phone's Night Mode now. Find a star or streetlight. Take a 10-second exposure and check focus. See how much light your phone can gather.
      `,
          experience: `## What to Look For — Sky Observation Basics

      You're here to see the night sky without camera gear. Here's what's visible and when.

      ### The Milky Way Band
      The Milky Way is most visible:
      - **South horizon**, highest in the sky (true galactic center)
      - **Best months**: December–August (summer = brightest core)
      - **Best time**: 2–3 hours after sunset when sky is fully dark
      - **Bortle 1–3 locations**: Visible to the naked eye as a cloudy band
      - **What you'll see**: White/pale cloudy streak with darker dust lanes, bright core toward south

      ### Bright Objects to Find
      - **Mars, Jupiter, Saturn** (planets shine steadier than stars)
      - **Polaris** (North Star, above north horizon — used for orientation)
      - **Pleiades** (open cluster, looks like tiny dipper — visible to naked eye)
      - **Orion Nebula** (faint greenish tint to the eye in dark skies, easily found with binoculars)

      ### Aurora (Green/Red Lights in the Sky)
      If you're in high latitude (45°N+) and KP index is high (5+):
      - **Green light**: Most common, dances in curtains or arcs
      - **Red light**: Upper atmosphere, rarer, softer
      - **Movement**: Appears to sway and shift in real-time (this is Earth's magnetosphere!)

      ### Meteor Streaks
      - **How to see them**: Just watch the sky; don't stare at one spot
      - **Frequency**: During meteor showers (peak nights), 5–20 per hour if Bortle 1–2
      - **What you'll see**: Fast streak across sky, usually lasts < 1 second

      ### How Long to Look?
      **Wait 20–30 minutes** after arriving for dark adaptation. This is crucial — your eyes are 4–6x more light-sensitive after full adaptation.

      **Your action:** On a clear night, find a dark spot, set a red headlamp, and spend 30 minutes just looking. What do you notice about the sky?
      `,
        },
      },
      {
        id: 'm2-l2',
        title: 'The 500/300/NPF Rule & Shutter Speed',
        type: 'article',
        duration: '6 min read',
        description: 'Maximum shutter speed explained.',
        appLink: { label: 'Open Field Mode → Camera Tab', page: 'FieldMode' },
        modeVariant: {
          photographer: `## The 500 / 300 / NPF Rule — Shutter Speed Limits

      Star trails appear when your shutter is open too long. These rules tell you the maximum safe shutter speed.

      ### The 500 Rule (Full-Frame, Simplest)
      **Max shutter = 500 ÷ focal length (in mm)**

      Examples:
      - 14mm lens → 500 ÷ 14 = **35.7 seconds**
      - 20mm lens → 500 ÷ 20 = **25 seconds**
      - 24mm lens → 500 ÷ 24 = **20.8 seconds**

      Works well for full-frame cameras.

      ### The 300 Rule (Crop Sensors / APS-C)
      If your camera has a crop sensor, use 300 instead of 500 (accounts for crop factor):
      - 14mm lens on crop sensor → 300 ÷ 14 = **21.4 seconds**
      - 20mm on crop → 300 ÷ 20 = **15 seconds**

      ### The NPF Rule (Most Accurate for Your Gear)
      The NPF rule factors in your camera's pixel density AND focal length for precision. Formula: **35mm equivalent = (35 ÷ (focal length × crop factor)) × (focal length ÷ desired pixel size)**

      This is complex. Use the app instead.

      ### Use the App's Camera Calculator
      **Open Field Mode → Camera tab** in the app. Enter:
      - Camera body (Canon, Sony, Nikon, etc.)
      - Sensor size (full-frame, APS-C, etc.)
      - Focal length of your lens
      - Desired sharpness level

      The app calculates your precise shutter speed using the NPF rule. This is your **field bible** — write it down or screenshot it before every shoot.

      ### Why This Matters
      Even a few seconds past your maximum shutter speed and stars start trailing. Stay within the rule, and you'll keep stars as perfect points.

      **Your action:** Open Field Mode → Camera tab. Enter your exact camera/lens setup. Screenshot the recommended shutter speed.
      `,
          smartphone: `## Exposure Time on Your Phone — What You Control

      Your phone's Night Mode handles most timing automatically, but you should know what's happening.

      ### Standard Night Mode Duration
      - **iPhone Night Mode**: 3–10 seconds (depends on brightness)
      - **Pixel Night Sight**: 3–15 seconds (adapts to light)
      - **Samsung Night**: 3–10 seconds

      Your phone **takes multiple exposures** and blends them. You see a single final image.

      ### Can You Adjust Duration?
      Most modern phones **don't let you** manually control exposure time — it's automatic. However:
      - **Slower movement**: Hold the phone steadier = brighter final image (phone compensates)
      - **Tripod**: Essential for consistency and preventing camera shake

      ### Real-World Limitations
      - **Milky Way detail**: Limited (phone sensors are small)
      - **Aurora**: Difficult (phone can't capture rapid movement well)
      - **Star color**: Phone tends toward cool/blue tint (fix in post with Snapseed)

      ### Night Mode Limitations at a Glance
      - Faint stars don't show up clearly
      - Colors look washed out (edit in post)
      - Can't match a real camera's depth

      **Don't feel limited!** Phone Night Mode is remarkable for how much light it gathers. Work with it, not against it.

      **Your action:** In Night Mode, compare a 5-second exposure (steadier phone) vs. a 10-second one (more motion blur). See the difference stability makes.
      `,
          experience: `## Watching the Sky — Observation Tips

      You're not taking photos, so exposure time doesn't apply. Instead, focus on **when** to look and **what** to see.

      ### Dark Adaptation Timeline
      - **0–5 minutes**: Eyes still adjusting, very little visible
      - **10–15 minutes**: Rod cells activating, more stars appear
      - **20–30 minutes**: Full adaptation, Milky Way band visible even in Bortle 3
      - **45–60 minutes**: Maximum sensitivity (if you use red light only)

      **Key rule**: Avoid **any white light** for at least 20 minutes. Use your red headlamp only. One white light exposure resets adaptation for 5+ minutes.

      ### Best Viewing Windows
      - **Moon-free nights**: Moon washes out faint stars (aim for < 10% illumination)
      - **After midnight**: Earth rotates, galaxy angles peak around 2–4 AM
      - **Summer months (Dec–Aug)**: Milky Way core highest in southern sky

      ### Visual Phenomena Timing
      - **Meteor showers**: Peak nights listed on Cosmic Events; expect 5–20 per hour
      - **Aurora**: Visible 30 min after sunset on strong KP nights (5–7+)
      - **Planets**: Visible all night once found, brightest after sunset

      **Your action:** Pick a clear night this month. Arrive 30 min before sunset, wait until full dark, and spend an hour just watching. Note what you see and how visibility improves over time.
      `,
        },
      },
      {
        id: 'm2-l2b',
        title: 'White Balance — Shaping the Sky\'s Color',
        type: 'article',
        duration: '5 min read',
        description: 'White balance controls how blue or warm your sky appears — and it\'s one of the most creative choices you\'ll make in post.',
        content: `## White Balance — Shaping the Sky's Color

Most people overlook white balance until they're stuck with an image that looks wrong. Here's how to master it.

### What White Balance Actually Does
The night sky is mostly neutral — it's not inherently blue or black. White balance (WB) determines **how warm or cool the overall image appears**, especially the sky background and foreground colors.

### The Two Classic Milky Way Looks

**Deep Blue Sky (classic):** Set WB to **3500–4000K**. Start at **3800K** as your baseline. This produces the rich, inky blue background you see in most iconic Milky Way shots. The blue is real — it's what the sky actually looks like at that color temperature.

**Neutral/Black Sky (modern look):** Set WB to **4200–5000K**. Try **4500K** as a starting point. The sky renders closer to black or dark gray, the galactic core pops with more warm contrast, and foreground elements look more natural.

### Starting Points by Goal

| Look | WB Setting | Feel |
|------|-----------|------|
| Classic blue sky | 3500–3800K | Deep, moody, cinematic |
| Neutral/dark sky | 4200–4500K | Modern, contrasty |
| Warmer foreground | 4500–5000K | Natural colors, less blue |

### The Golden Rule: Shoot RAW
Always shoot RAW — WB can be **changed freely in post with zero quality loss**. In JPEG, the WB is baked in forever.

**Your action:** In the field, set your camera to 3800K as a starting point. Take a shot. Then try 4500K. Compare both — then decide which matches your creative vision.
`,
      },
      {
        id: 'm2-l3',
        title: 'Reading the Histogram',
        type: 'article',
        duration: '5 min read',
        description: 'The histogram tells you if your exposure is right — and it\'s the most reliable tool in the dark.',
        content: `## Reading the Histogram

In the dark, your eyes can't judge exposure accurately. Your histogram always can.

### What a Histogram Shows
A histogram is a graph of pixel brightness from left (black/dark) to right (bright/white). The height at each point shows how many pixels are at that brightness.

### What You Want for Night Sky
For Milky Way photography, your histogram should be:
- **Pushed left** (mostly dark — this is correct!)
- A small spike on the left for the black sky
- A small bump in the middle-right for the stars and Milky Way
- **No spike touching the far right** — that means overexposure

### Common Mistake: Underexposure
If the entire histogram is smashed against the left wall with nothing in the middle, you're underexposed. Increase ISO or open aperture wider.

### Common Mistake: Overexposure
Any part of the histogram touching the right edge means blown highlights — detail is lost forever. Reduce ISO or shutter speed.

### Practical Workflow
1. Take a test shot
2. Check histogram (not just the screen preview — screens look bright in the dark)
3. Adjust ISO up or down until the histogram has a small mountain in the left-center zone
4. Lock those settings

**Your action:** Take a test shot of a dark room or night sky scene. Pull up the histogram on your camera. Practice reading where the exposure falls.
`,
      },
      {
        id: 'm2-l4',
        title: 'Module 2 Quiz — Are You Ready to Shoot?',
        type: 'quiz',
        duration: '4 questions',
        description: 'Test your exposure knowledge before your first shoot.',
        quiz: [
          { q: 'What is the recommended starting ISO for Milky Way photography?', options: ['ISO 400', 'ISO 800', 'ISO 3200', 'ISO 100'], answer: 2 },
          { q: 'Using the 500 Rule with a 20mm lens, what is the maximum shutter speed?', options: ['10 seconds', '20 seconds', '25 seconds', '30 seconds'], answer: 2 },
          { q: 'Where should the histogram be positioned for a correctly exposed night sky shot?', options: ['Centered', 'Pushed to the right', 'Pushed to the left with a small bump', 'Touching the far right edge'], answer: 2 },
          { q: 'Which app screen has the built-in camera settings calculator?', options: ['Tonight?', 'Sky Planner', 'Field Mode', 'Star Pointer'], answer: 2 },
        ],
      },
    ],
  },
];

const PAID_MODULE_TEASERS = [
  {
    id: 'mod-3',
    title: 'Planning the Shot',
    subtitle: 'Sky Planner + Cosmic Events + AR Scout',
    icon: MapPin,
    description: 'Use Sky Planner to find the Milky Way\'s peak time, Cosmic Events for the best nights, and AR Scout to preview the galaxy\'s position during daylight scouting.',
    highlights: ['Galactic core timing', 'AR Scout daytime preview', 'Dark sky GPS spots', 'Best nights of the month'],
  },
  {
    id: 'mod-4',
    title: 'Composition & Focus',
    subtitle: 'Guided Shoot Plan + AR foreground alignment',
    icon: Eye,
    description: 'Set up a Guided Shoot Plan before you go: define your intent, foreground, lighting style, and whether people are in the shot. Use AR Scout to align your foreground in daylight.',
    highlights: ['Guided Shoot Plan setup', 'Foreground % planning', 'People / model release', 'AR foreground alignment'],
  },
  {
    id: 'mod-5',
    title: 'In-Class Execution',
    subtitle: 'Field Mode walkthrough + Blue Hour reminders',
    icon: Zap,
    description: 'A full Field Mode walkthrough for the night of your shoot. Blue Hour timing, Low Light Landscape reminders, execution notes from your Guided Plan, and live conditions.',
    highlights: ['Field Mode live conditions', 'Blue Hour / LLL reminders', 'Guided plan execution', 'Real-time astro score'],
  },
  {
    id: 'mod-6',
    title: 'Post-Class Reflection',
    subtitle: 'Journal + outcome tagging + insights',
    icon: Star,
    description: 'Log your shoot outcome in the app, add field notes, and see insights like "Your best shots happen when moon is <5% and Bortle ≤3." Build your own data over time.',
    highlights: ['Shoot outcome tagging', 'Field journal', 'Personal insights', '"Your best shots when..." patterns'],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

const typeIcon = (type) => {
  if (type === 'video') return <Play className="w-4 h-4 text-red-400" />;
  if (type === 'article') return <BookOpen className="w-4 h-4 text-slate-400" />;
  return <CheckSquare className="w-4 h-4 text-red-400" />;
};

const colorMap = {
  emerald: { badge: 'bg-red-900/40 border-red-500/40 text-red-300', ring: 'ring-red-500/30', dot: 'bg-red-500' },
  red: { badge: 'bg-red-900/40 border-red-500/40 text-red-300', ring: 'ring-red-500/30', dot: 'bg-red-500' },
};

// ── Markdown-ish renderer ────────────────────────────────────────────────────

function ArticleRenderer({ content }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-2 text-sm text-slate-300 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-2">{line.slice(3)}</h2>;
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-slate-100 mt-4 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-300">{line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1')}</li>;
        if (line.startsWith('| ')) {
          const cells = line.split('|').filter(c => c.trim());
          const isHeader = lines[i + 1]?.includes('---');
          const isSep = line.includes('---');
          if (isSep) return null;
          return (
            <div key={i} className={`grid gap-2 py-1 border-b border-white/5 text-xs ${cells.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {cells.map((c, ci) => (
                <span key={ci} className={isHeader ? 'text-slate-400 font-semibold' : 'text-slate-300'}>{c.trim()}</span>
              ))}
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        // Inline bold
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-slate-300">
            {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-white font-semibold">{p}</strong> : p)}
          </p>
        );
      })}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function FreeCourse() {
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [activeModuleId, setActiveModuleId] = useState('mod-1');
  const [activeLessonId, setActiveLessonId] = useState('m1-l1');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shooterMode, setShooterMode] = useState('photographer');
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      if (me.role === 'admin') {
        setIsSubscribed(true);
      } else {
        const subs = await base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1);
        setIsSubscribed(subs.length > 0);
      }
      const [prog, profiles] = await Promise.all([
        base44.entities.LessonProgress.filter({ user_email: me.email, module_id: { $in: FREE_MODULES.map(m => m.id) } }),
        base44.entities.UserProfile.filter({ user_email: me.email }, '-created_date', 1),
      ]);
      setCompletedLessons(prog.filter(p => p.completed).map(p => p.lesson_id));
      if (profiles[0]?.shooter_mode) setShooterMode(profiles[0].shooter_mode);
      setLoading(false);
    };
    init();
  }, []);

  const markComplete = async (lessonId, moduleId) => {
    if (completedLessons.includes(lessonId)) return;
    await base44.entities.LessonProgress.create({
      lesson_id: lessonId,
      module_id: moduleId,
      user_email: user.email,
      completed: true,
    });
    setCompletedLessons(prev => [...prev, lessonId]);
  };

  const allFreeLessons = FREE_MODULES.flatMap(m => m.lessons);
  const totalFree = allFreeLessons.length;
  const completedFreeCount = allFreeLessons.filter(l => completedLessons.includes(l.id)).length;
  const overallPct = Math.round((completedFreeCount / totalFree) * 100);

  const activeModule = FREE_MODULES.find(m => m.id === activeModuleId) || FREE_MODULES[0];
  const activeLesson = activeModule.lessons.find(l => l.id === activeLessonId) || activeModule.lessons[0];

  const modCompleted = (mod) => mod.lessons.filter(l => completedLessons.includes(l.id)).length;
  const modPct = (mod) => Math.round((modCompleted(mod) / mod.lessons.length) * 100);

  const handleNextLesson = () => {
    const currentLessons = activeModule.lessons;
    const idx = currentLessons.findIndex(l => l.id === activeLessonId);
    if (idx < currentLessons.length - 1) {
      markComplete(activeLessonId, activeModuleId);
      setActiveLessonId(currentLessons[idx + 1].id);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } else {
      // Move to next module
      const modIdx = FREE_MODULES.findIndex(m => m.id === activeModuleId);
      if (modIdx < FREE_MODULES.length - 1) {
        markComplete(activeLessonId, activeModuleId);
        const nextMod = FREE_MODULES[modIdx + 1];
        setActiveModuleId(nextMod.id);
        setActiveLessonId(nextMod.lessons[0].id);
        setQuizAnswers({});
        setQuizSubmitted(false);
      }
    }
  };

  const isLastLesson = () => {
    const modIdx = FREE_MODULES.findIndex(m => m.id === activeModuleId);
    const lessonIdx = activeModule.lessons.findIndex(l => l.id === activeLessonId);
    return modIdx === FREE_MODULES.length - 1 && lessonIdx === activeModule.lessons.length - 1;
  };

  const quizData = activeLesson?.quiz || [];
  const quizScore = quizData.filter((q, i) => quizAnswers[i] === q.answer).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Telescope className="w-10 h-10 text-red-400 star-pulse" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-500/30 rounded-full px-3 py-1 mb-4">
          <Star className="w-3 h-3 text-red-400" />
          <span className="text-red-300 text-xs font-semibold uppercase tracking-widest">Free Starter Course</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Milky Way Photography with Uncharted Galaxy</h1>
        <p className="text-slate-400 text-lg mb-5">Your first Milky Way shot starts here — with Uncharted Galaxy as your companion at every step.</p>
        <div className="flex items-center gap-4">
          <Progress value={overallPct} className="flex-1 h-2" />
          <span className="text-white font-bold text-sm w-14 text-right">{overallPct}%</span>
        </div>
        <p className="text-slate-500 text-sm mt-1">{completedFreeCount} of {totalFree} lessons complete</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left Sidebar — Module + Lesson List ── */}
        <div className="lg:col-span-1 space-y-3">

          {/* Free Modules */}
          {FREE_MODULES.map((mod) => {
            const ModIcon = mod.icon;
            const pct = modPct(mod);
            const colors = colorMap[mod.color] || colorMap.red;
            return (
              <div key={mod.id} className="rounded-xl border border-white/8 bg-[#1a1a1a] overflow-hidden">
                {/* Module Header */}
                <button
                  onClick={() => { setActiveModuleId(mod.id); setActiveLessonId(mod.lessons[0].id); setQuizAnswers({}); setQuizSubmitted(false); }}
                  className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/3 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${colors.badge}`}>
                    <ModIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{mod.title}</p>
                    <p className="text-slate-500 text-xs truncate">{mod.subtitle}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>{pct}%</span>
                </button>

                {/* Lessons */}
                {activeModuleId === mod.id && (
                  <div className="border-t border-white/6">
                    {mod.lessons.map((lesson, idx) => {
                      const done = completedLessons.includes(lesson.id);
                      const active = activeLessonId === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => { setActiveLessonId(lesson.id); setQuizAnswers({}); setQuizSubmitted(false); }}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all border-b border-white/4 last:border-0 ${
                            active ? 'bg-red-900/30' : 'hover:bg-white/3'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            done ? 'bg-red-600 text-white' : active ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {done ? <Check className="w-3 h-3" /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${active ? 'text-white' : done ? 'text-slate-500' : 'text-slate-300'}`}>{lesson.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {typeIcon(lesson.type)}
                              <span className="text-xs text-slate-600">{lesson.duration}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Paid Module Teasers */}
          <div className="rounded-xl border border-dashed border-red-500/30 bg-red-900/10 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-xs font-bold uppercase tracking-wide">Unlock with Plus — $7.99/mo</span>
            </div>
            <div className="space-y-2">
              {PAID_MODULE_TEASERS.map((mod, i) => {
                const ModIcon = mod.icon;
                return (
                  <div key={mod.id} className="flex items-center gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-3 h-3 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-400 text-xs font-medium">Module {i + 3}: {mod.title}</p>
                      <p className="text-slate-600 text-xs truncate">{mod.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to={createPageUrl('PaymentGate')}>
              <Button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-xs h-8">
                Unlock Planning, AR Scout + More →
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Mode-aware tip banner */}
          <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            shooterMode === 'photographer' ? 'bg-purple-900/20 border-purple-600/30' :
            shooterMode === 'smartphone' ? 'bg-blue-900/20 border-blue-600/30' :
            'bg-indigo-900/20 border-indigo-600/30'
          }`}>
            <span className="text-lg leading-none mt-0.5">
              {shooterMode === 'photographer' ? '📷' : shooterMode === 'smartphone' ? '📱' : '👁'}
            </span>
            <div className="flex-1">
              <p className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${
                shooterMode === 'photographer' ? 'text-purple-300' : shooterMode === 'smartphone' ? 'text-blue-300' : 'text-indigo-300'
              }`}>
                {shooterMode === 'photographer' ? 'DSLR / Mirrorless Mode' : shooterMode === 'smartphone' ? 'Smartphone Mode' : 'Sky Watching Mode'}
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                {shooterMode === 'photographer' && 'Lessons include full manual settings, RAW workflow, stacking, and advanced composition for camera shooters.'}
                {shooterMode === 'smartphone' && 'Focus on Night Mode, stability, and phone-specific tips — you\'ll skip the heavy gear sections.'}
                {shooterMode === 'experience' && 'You\'re here for the sky itself — lessons cover what to look for, when to go, and how to read conditions. No gear required.'}
              </p>
            </div>
            <Link to={createPageUrl('Profile')} className="text-slate-600 hover:text-slate-400 text-xs underline flex-shrink-0 mt-0.5">Change</Link>
          </div>

          {/* Lesson Card */}
          <Card className="bg-[#1a1a1a] border border-white/8 overflow-hidden">
            {/* Lesson Header */}
            <div className="p-6 border-b border-white/8">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {typeIcon(activeLesson.type)}
                <span className="text-slate-500 text-xs capitalize">{activeLesson.type}</span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500 text-xs">{activeLesson.duration}</span>
                {activeLesson.appLink && (
                  <>
                    <span className="text-slate-700">·</span>
                    <Link to={createPageUrl(activeLesson.appLink.page)}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                      <Zap className="w-3 h-3" />
                      {activeLesson.appLink.label}
                    </Link>
                  </>
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{activeLesson.title}</h2>
              <p className="text-slate-400 text-sm mt-1">{activeLesson.description}</p>
            </div>

            {/* Article Content — Mode-aware */}
            {activeLesson.type === 'article' && (
              <div className="p-6">
                {activeLesson.modeVariant && activeLesson.modeVariant[shooterMode] ? (
                  <ArticleRenderer content={activeLesson.modeVariant[shooterMode]} />
                ) : activeLesson.content ? (
                  <ArticleRenderer content={activeLesson.content} />
                ) : null}
              </div>
            )}

            {/* Video Content */}
            {activeLesson.type === 'video' && activeLesson.video_url && (
              <div className="aspect-video">
                <iframe
                  src={activeLesson.video_url}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Quiz Content */}
            {activeLesson.type === 'quiz' && quizData.length > 0 && (
              <div className="p-6">
                {!quizSubmitted ? (
                  <>
                    <h3 className="text-lg font-bold text-white mb-6">Are You Ready to Shoot?</h3>
                    <div className="space-y-6">
                      {quizData.map((q, qi) => (
                        <div key={qi}>
                          <p className="text-slate-200 font-medium mb-3">{qi + 1}. {q.q}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oi) => (
                              <button
                                key={oi}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [qi]: oi }))}
                                className={`p-3 rounded-lg border text-sm text-left transition-all ${
                                  quizAnswers[qi] === oi
                                    ? 'border-red-600 bg-red-900/30 text-white'
                                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="mt-6 bg-red-600 hover:bg-red-700"
                      disabled={Object.keys(quizAnswers).length < quizData.length}
                      onClick={() => setQuizSubmitted(true)}
                    >
                      Submit Quiz
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className={`text-6xl font-black mb-4 ${quizScore >= 3 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {quizScore}/{quizData.length}
                    </div>
                    <p className="text-white text-xl font-bold mb-2">
                      {quizScore === quizData.length ? '🌟 Perfect! You\'re ready.' : quizScore >= 3 ? '🎉 Good work, Explorer!' : '📚 Review and try again!'}
                    </p>
                    <p className="text-slate-400 text-sm mb-6">
                      {quizScore >= 3
                        ? "You understand the fundamentals. Time to plan your first shoot."
                        : 'Go back through the lessons and retake when ready.'}
                    </p>
                    <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}>
                      Retake Quiz
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Mode-specific action hint */}
            {activeLesson.type === 'article' && (
              <div className="px-6 pb-4 text-xs text-slate-500 italic">
                {shooterMode === 'photographer' && '📷 Tip: Apply these settings in Manual (M) mode tonight.'}
                {shooterMode === 'smartphone' && '📱 Tip: Open your phone\'s Pro/Expert mode and try these concepts.'}
                {shooterMode === 'experience' && '👁 Tip: No gear needed — focus on the visibility and timing takeaways.'}
              </div>
            )}

            {/* Footer Actions */}
            <div className="p-5 border-t border-white/8 flex items-center justify-between gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className={`border-slate-600 ${completedLessons.includes(activeLesson.id) ? 'text-red-400 border-red-600' : 'text-slate-300'}`}
                onClick={() => markComplete(activeLesson.id, activeModuleId)}
                disabled={completedLessons.includes(activeLesson.id)}
              >
                {completedLessons.includes(activeLesson.id) ? '✓ Completed' : 'Mark as Complete'}
              </Button>
              {!isLastLesson() && (
                <Button className="bg-red-600 hover:bg-red-700" size="sm" onClick={handleNextLesson}>
                  Next Lesson <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
              {isLastLesson() && completedFreeCount === totalFree && (
                <div className="text-emerald-400 text-sm font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4" /> Free course complete! Unlock more below.
                </div>
              )}
            </div>
          </Card>

          {/* ── Paid Module Preview Cards ── */}
          <div>
            <h3 className="text-white font-bold text-base mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              Continue Your Expedition — Unlock with Plus
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAID_MODULE_TEASERS.map((mod, i) => {
                const ModIcon = mod.icon;
                return (
                  <Card key={mod.id} className="bg-[#1a1a1a] border border-white/8 p-4 relative overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent pointer-events-none" />
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                        <ModIcon className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-200 text-sm font-semibold">Module {i + 3}: {mod.title}</p>
                        <p className="text-slate-500 text-xs">{mod.subtitle}</p>
                      </div>
                      <Lock className="w-4 h-4 text-red-500 ml-auto flex-shrink-0" />
                    </div>
                    <p className="text-slate-500 text-xs mb-3">{mod.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.highlights.map((h, hi) => (
                        <span key={hi} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">{h}</span>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
            {!isSubscribed && (
              <div className="mt-4 text-center">
                <Link to={createPageUrl('PaymentGate')}>
                  <Button className="bg-red-600 hover:bg-red-700 px-8">
                    Unlock Full Course — $7.99/mo →
                  </Button>
                </Link>
                <p className="text-slate-600 text-xs mt-2">Includes Sky Planner, AR Scout, Field Mode, Guided Shoot Plans, and all 6 modules.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}