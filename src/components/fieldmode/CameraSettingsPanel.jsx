import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Aperture, Timer, Zap, ChevronDown, ChevronUp, Info } from 'lucide-react';

// Smart setting suggestions based on event type & mode
function getSettings(mode, event) {
  const type = event?.event_type || 'milky_way';

  const basePhotographer = {
    milky_way: {
      aperture: 'f/1.8 – f/2.8',
      shutter: '15–25s (500 rule)',
      iso: '1600 – 6400',
      focus: 'Manual: focus on a bright star at ∞, fine-tune',
      wb: '3200–4000K (tungsten-ish)',
      tips: [
        'Use the 500 rule: 500 ÷ focal length = max shutter in seconds before star trails',
        'Take a test shot at ISO 6400 to nail focus first, then drop ISO',
        'Shoot RAW — shadows & noise are recoverable in post',
        'Stack 10–20 identical exposures to reduce noise without a tracker',
      ],
    },
    meteor_shower: {
      aperture: 'f/2.8 or wider',
      shutter: '20–30s',
      iso: '3200 – 6400',
      focus: 'Manual: infinity, locked with tape',
      wb: '4000K',
      tips: [
        'Point 45–60° from the radiant to capture full streaks',
        'Use intervalometer — shoot continuously for 1–3 hours',
        'Wide lens (14–24mm) captures more sky area',
        'Stack lucky shots in post (Starry Landscape Stacker / Sequator)',
      ],
    },
    eclipse: {
      aperture: 'f/8',
      shutter: 'Bracket: 1/1000s → 1s',
      iso: '100 – 400',
      focus: 'Auto or manual on the lunar limb',
      wb: 'Daylight 5500K',
      tips: [
        'Bracket exposures heavily — dynamic range changes every minute',
        'During totality: f/5.6, ISO 400, 1/30s–1s',
        'Teleconverter doubles focal length — aim for 400mm+',
        'Use a remote shutter to avoid camera shake',
      ],
    },
    aurora: {
      aperture: 'f/1.8 – f/2.8',
      shutter: '3–10s (short to freeze curtains)',
      iso: '800 – 3200',
      focus: 'Manual ∞, check on stars',
      wb: '3500K',
      tips: [
        'Short exposures (3–5s) freeze aurora movement — avoid green blobs',
        'Burst mode during active displays to catch peak moments',
        'Wide angle (14–24mm) fits curtains; 35–50mm isolates pillars',
        'Include a dark foreground for scale and composition',
      ],
    },
    moon: {
      aperture: 'f/8 – f/11',
      shutter: '1/250s – 1/1000s',
      iso: '100 – 400',
      focus: 'Manual: focus on lunar craters, check loupe',
      wb: 'Daylight',
      tips: [
        'Looney 11 rule: f/11, ISO 100, shutter = 1/ISO',
        'For earthshine (lit dark side): f/4, 1s, ISO 400',
        'Composite both exposures in Lightroom if you want earthshine + detail',
        'Long telephoto (400mm+) fills frame; 85mm for landscape context',
      ],
    },
  };

  const baseSmartphone = {
    milky_way: {
      aperture: 'Widest (auto)',
      shutter: 'Pro/Manual: 15–30s',
      iso: '3200 – 6400 (max)',
      focus: 'Manual focus: tap sky, disable auto-focus',
      wb: 'Manual: 3800K or "incandescent"',
      tips: [
        'Use a tripod and self-timer — phone must be completely still',
        'Enable "Pro" or "Expert" mode to control shutter & ISO manually',
        'iPhone: Night Mode will auto-handle settings; just be very still',
        'Android: use Camera FV-5 or Gcam for more manual control',
        'Dark Mode / red filter on screen to preserve night vision',
      ],
    },
    aurora: {
      aperture: 'Widest (auto)',
      shutter: '3–8s in Pro mode',
      iso: '1600 – 3200',
      focus: 'Manual: tap distant point, lock',
      wb: 'Manual: 4000K',
      tips: [
        'iPhone 14+: Night Mode auto-enables — just keep still',
        'Shorter exposures capture movement — try 3s first',
        'Pixel phones: Astrophotography mode works great here',
        'Clean lens with microfiber before shooting — huge impact',
      ],
    },
    meteor_shower: {
      aperture: 'Widest (auto)',
      shutter: '20–30s in Pro mode',
      iso: '3200 – 6400',
      focus: 'Manual ∞',
      wb: '4000K',
      tips: [
        'Prop phone facing the radiant, leave shooting for 30–60 min',
        'Use an intervalometer app (Lapse It, etc.) to shoot continuously',
        'Accept that most frames will have no meteor — it\'s a numbers game',
      ],
    },
  };

  const lookup = mode === 'smartphone' ? baseSmartphone : basePhotographer;
  return lookup[type] || lookup['milky_way'] || Object.values(lookup)[0];
}

export default function CameraSettingsPanel({ mode, event, coords }) {
  const settings = getSettings(mode, event);
  const [expanded, setExpanded] = useState(true);
  const [tipExpanded, setTipExpanded] = useState(false);
  const eventType = event?.event_type || 'milky_way';

  const fields = [
    { icon: '⏱', label: 'Shutter', value: settings.shutter },
    { icon: '⬡', label: 'Aperture', value: settings.aperture },
    { icon: '🔆', label: 'ISO', value: settings.iso },
    { icon: '🎯', label: 'Focus', value: settings.focus },
    { icon: '🌡️', label: 'White Balance', value: settings.wb },
  ];

  return (
    <div className="space-y-4">
      {/* Quick reference — always visible */}
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f, i) => (
          <div key={i} className={`rounded-xl border border-white/8 bg-[#1a1a1a] px-4 py-3 ${i === 4 ? 'col-span-2' : ''}`}>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">
              {f.icon} {f.label}
            </p>
            <p className="text-white text-sm font-bold leading-tight">{f.value}</p>
          </div>
        ))}
      </div>

      {/* ISO Strategy Card */}
      <ISOStrategyCard mode={mode} eventType={eventType} />

      {/* Tips */}
      <Card className="bg-[#1a1a1a] border border-white/8">
        <button
          onClick={() => setTipExpanded(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-white text-sm font-bold flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            Field Tips
          </span>
          {tipExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        {tipExpanded && (
          <ul className="px-4 pb-4 space-y-2.5">
            {settings.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm leading-snug">
                <span className="text-red-400 flex-shrink-0 mt-0.5 font-bold text-xs">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* White Balance Tip Card */}
      <WhiteBalanceTipCard mode={mode} />

      {/* 500 rule calculator */}
      {mode !== 'smartphone' && (
        <FiveHundredRuleCard />
      )}

      {/* Exposure calculator */}
      <ExposureStopCalc />
    </div>
  );
}

function WhiteBalanceTipCard({ mode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="bg-[#1a1a1a] border border-white/8">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="text-white text-sm font-bold flex items-center gap-2">
          <span>🌡️</span> White Balance Guide
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {mode === 'smartphone' ? (
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
              <p className="text-blue-300 text-xs font-bold mb-1">📱 Phone Tip</p>
              <p className="text-slate-300 text-xs leading-relaxed">Most phones lock WB automatically in Night Mode. Adjust the feel in Lightroom Mobile or Snapseed after your shoot — slide the Temp slider toward blue (3800K) or neutral (4500K) to taste.</p>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-xs leading-relaxed">WB shapes how blue or black the sky appears and how natural your foreground looks. The sky itself is neutral — your chosen Kelvin value creates the mood.</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 bg-blue-900/20 border border-blue-700/20 rounded-lg p-3">
                  <span className="text-blue-300 text-lg leading-none flex-shrink-0">🔵</span>
                  <div>
                    <p className="text-blue-200 text-xs font-bold mb-0.5">Deep Blue Sky — Classic Look</p>
                    <p className="text-slate-400 text-xs">3500–4000K · Start at <span className="text-white font-semibold">3800K</span></p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Rich inky blue background, moody & cinematic</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-orange-900/20 border border-orange-700/20 rounded-lg p-3">
                  <span className="text-orange-300 text-lg leading-none flex-shrink-0">🟠</span>
                  <div>
                    <p className="text-orange-200 text-xs font-bold mb-0.5">Neutral/Black Sky — Modern Look</p>
                    <p className="text-slate-400 text-xs">4200–5000K · Start at <span className="text-white font-semibold">4500K</span></p>
                    <p className="text-slate-500 text-[10px] mt-0.5">Dark/black sky, warmer foreground, high contrast core</p>
                  </div>
                </div>
              </div>
              <p className="text-emerald-400 text-[10px] font-semibold">✦ Shoot RAW — adjust WB freely in post with zero quality loss.</p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function FiveHundredRuleCard() {
  const [focal, setFocal] = useState(24);
  const [ruleType, setRuleType] = useState('500');
  const [sensorType, setSensorType] = useState('full_frame');
  const [customCropFactor, setCustomCropFactor] = useState(1.0);

  const cropFactors = {
    full_frame: 1.0,
    aps_c: 1.6,
    m4_3: 2.0,
    custom: customCropFactor,
  };

  const cropFactor = cropFactors[sensorType] || 1.0;

  // Calculate max shutter based on rule type
  const calculateMaxShutter = () => {
    if (ruleType === 'npf') {
      // NPF Rule approximation: (35 × f-stop + 30 × pixel_pitch) / focal_length
      // Using default f/2.8 and pixel pitch ~5.6µm
      const fStop = 2.8;
      const pixelPitch = 5.6;
      const result = (35 * fStop + 30 * pixelPitch) / (focal * cropFactor);
      return Math.round(result * 10) / 10;
    } else {
      const ruleNum = parseInt(ruleType);
      return Math.round((ruleNum / (focal * cropFactor)) * 10) / 10;
    }
  };

  const maxShutter = calculateMaxShutter();

  return (
    <div className="space-y-4">
      <Card className="bg-[#1a1a1a] border border-white/8 p-4">
        <p className="text-red-300 text-xs font-bold uppercase tracking-widest mb-4">⚡ Star Trailing Calculator</p>

        {/* Rule Type & Sensor Type Selectors */}
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-slate-500 text-[10px] block mb-1 font-semibold">Rule Type</label>
            <select
              value={ruleType}
              onChange={e => setRuleType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400"
            >
              <option value="500">500 Rule (classic)</option>
              <option value="300">300 Rule (conservative)</option>
              <option value="npf">NPF Rule (precise)</option>
            </select>
            <p className="text-slate-500 text-[9px] mt-1">500: northern sky · 300: southern/crop · NPF: most accurate</p>
          </div>

          <div>
            <label className="text-slate-500 text-[10px] block mb-1 font-semibold">Sensor Type</label>
            <select
              value={sensorType}
              onChange={e => setSensorType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-400"
            >
              <option value="full_frame">Full Frame (1.0×)</option>
              <option value="aps_c">APS-C (1.6×)</option>
              <option value="m4_3">Micro Four Thirds (2.0×)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Custom Crop Factor Input */}
        {sensorType === 'custom' && (
          <div className="mb-4">
            <label className="text-slate-500 text-[10px] block mb-1 font-semibold">Crop Factor</label>
            <input
              type="number"
              value={customCropFactor}
              onChange={e => setCustomCropFactor(Math.max(0.5, Number(e.target.value) || 1))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-red-400"
              step={0.1}
              min={0.5}
              max={5}
            />
          </div>
        )}

        {/* Focal Length Input */}
        <div className="mb-4">
          <label className="text-slate-500 text-[10px] block mb-1 font-semibold">Focal Length (mm)</label>
          <input
            type="number"
            value={focal}
            onChange={e => setFocal(Number(e.target.value) || 1)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-red-400"
            min={8}
            max={600}
          />
        </div>

        {/* Result Display */}
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 text-center">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">Max Shutter Time</p>
          <p className="text-white text-3xl font-black">{maxShutter}s</p>
          <p className="text-slate-500 text-[9px] mt-1">before star trails</p>
        </div>

        {/* Helpful Note */}
        <div className="mt-4 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-[10px] text-slate-300 leading-relaxed">
          <p className="font-semibold text-slate-200 mb-1">💡 Why multiple rules?</p>
          <p>Southern sky stars move faster. Crop sensors magnify trails. Stricter rules (300/NPF) prevent artifacts. NPF factors aperture &amp; pixel density—most accurate for pinpoint stars.</p>
        </div>
      </Card>
    </div>
  );
}

function ExposureStopCalc() {
  const [stops, setStops] = useState(0);
  const [baseISO, setBaseISO] = useState(1600);
  const newISO = Math.round(baseISO * Math.pow(2, stops));
  return (
    <Card className="bg-[#1a1a1a] border border-white/8 p-4">
      <p className="text-slate-300 text-xs font-bold uppercase tracking-widest mb-3">🔢 Exposure Stop Shift</p>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <label className="text-slate-500 text-[10px] block mb-1">Base ISO</label>
          <input
            type="number"
            value={baseISO}
            onChange={e => setBaseISO(Number(e.target.value) || 100)}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-red-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-slate-500 text-[10px] block mb-1">±Stops</label>
          <input
            type="number"
            value={stops}
            onChange={e => setStops(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-sm font-mono focus:outline-none focus:border-red-400"
            step={0.5}
          />
        </div>
        <div className="text-center">
          <p className="text-slate-500 text-[10px]">Result ISO</p>
          <p className={`text-xl font-black ${newISO > baseISO ? 'text-yellow-400' : 'text-emerald-400'}`}>{newISO}</p>
        </div>
      </div>
    </Card>
  );
}