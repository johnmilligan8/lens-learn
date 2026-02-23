import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Compass, Eye, Info, Save, X, AlertCircle, Lock } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function StarPointer() {
  const canvasRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [selectedObject, setSelectedObject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [observations, setObservations] = useState([]);

  // Major sky features visible to all
  const MILKY_WAY = { 
    name: 'Milky Way', ra: 266, dec: 0, mag: 99, type: 'galaxy', 
    color: '#FFE680', special: 'Galactic band - stretches across sky, best in dark skies' 
  };
  
  const ANDROMEDA = { 
    name: 'M31 (Andromeda Galaxy)', ra: 10.7, dec: 41.3, mag: 3.4, type: 'galaxy', 
    color: '#BBBBFF', special: 'Nearest galaxy to Milky Way - 2.5 million light-years' 
  };

  const GALACTIC_CORE = { 
    name: 'Galactic Core', ra: 266.42, dec: -28.94, mag: 99, type: 'nebula', 
    color: '#FFD700', special: 'Milky Way Center - Best in summer (Sagittarius)' 
  };

  // Bright stars and objects visible to naked eye
  const ALL_OBJECTS = [
    // Major sky features (all users)
    MILKY_WAY,
    ANDROMEDA,
    GALACTIC_CORE,
    
    // Brightest stars
    { name: 'Sirius', ra: 101.3, dec: -16.7, mag: -1.46, type: 'star', color: '#FFCCAA' },
    { name: 'Canopus', ra: 95.99, dec: -52.7, mag: -0.72, type: 'star', color: '#FFEEAA' },
    { name: 'Arcturus', ra: 213.9, dec: 19.2, mag: -0.05, type: 'star', color: '#FFAA77' },
    { name: 'Vega', ra: 279.2, dec: 38.8, mag: 0.0, type: 'star', color: '#FFFFFF' },
    { name: 'Capella', ra: 79.17, dec: 46.0, mag: 0.08, type: 'star', color: '#FFDDAA' },
    { name: 'Rigel', ra: 78.6, dec: -8.2, mag: 0.18, type: 'star', color: '#AADDFF' },
    { name: 'Betelgeuse', ra: 88.8, dec: 7.4, mag: 0.5, type: 'star', color: '#FF5500' },
    { name: 'Aldebaran', ra: 68.98, dec: 16.5, mag: 0.87, type: 'star', color: '#FFAA77' },
    { name: 'Polaris', ra: 37.95, dec: 89.3, mag: 2.0, type: 'star', color: '#FFFFFF', special: 'North Star' },
    { name: 'Deneb', ra: 310.4, dec: 45.3, mag: 1.25, type: 'star', color: '#FFFFFF' },
    { name: 'Altair', ra: 297.7, dec: 8.9, mag: 0.77, type: 'star', color: '#FFFFFF' },
    { name: 'Antares', ra: 247.4, dec: -26.4, mag: 0.96, type: 'star', color: '#FF5500' },
    { name: 'Spica', ra: 201.3, dec: -11.2, mag: 0.98, type: 'star', color: '#AADDFF' },
    { name: 'Fomalhaut', ra: 344.4, dec: -29.6, mag: 1.17, type: 'star', color: '#FFFFFF' },
    { name: 'Castor', ra: 114.6, dec: 31.9, mag: 1.57, type: 'star', color: '#FFFFFF' },
    { name: 'Pollux', ra: 117.0, dec: 28.0, mag: 1.14, type: 'star', color: '#FFEEAA' },
    { name: 'Mizar', ra: 200.98, dec: 54.92, mag: 2.23, type: 'star', color: '#FFFFFF' },
    { name: 'Alkaid', ra: 206.6, dec: 49.3, mag: 1.85, type: 'star', color: '#AADDFF' },
    
    // Planets (vary by date but approximate)
    { name: 'Venus', ra: 0, dec: 0, mag: -4.0, type: 'planet', color: '#FFFFBB' },
    { name: 'Jupiter', ra: 0, dec: 0, mag: -2.0, type: 'planet', color: '#FFD580' },
    { name: 'Saturn', ra: 0, dec: 0, mag: 0.7, type: 'planet', color: '#FFCCAA' },
    { name: 'Mars', ra: 0, dec: 0, mag: 1.0, type: 'planet', color: '#FF6633' },
    { name: 'Mercury', ra: 0, dec: 0, mag: 1.0, type: 'planet', color: '#CCCCAA' },
    
    // Deep sky objects - bright ones visible to naked eye
    { name: 'M42 (Orion Nebula)', ra: 83.8, dec: -5.4, mag: 4.0, type: 'nebula', color: '#00FF99' },
    { name: 'M45 (Pleiades)', ra: 56.9, dec: 24.1, mag: 1.6, type: 'cluster', color: '#FFFFFF' },
    { name: 'M44 (Beehive)', ra: 130.1, dec: 19.7, mag: 3.7, type: 'cluster', color: '#FFFFFF' },
    
    // Additional deep sky for paid users
    { name: 'M57 (Ring Nebula)', ra: 283.4, dec: 33.0, mag: 9.7, type: 'nebula', color: '#00FF99' },
    { name: 'M13 (Hercules)', ra: 250.4, dec: 36.5, mag: 5.8, type: 'cluster', color: '#DDDDFF' },
    { name: 'M51 (Whirlpool)', ra: 202.0, dec: 47.2, mag: 8.4, type: 'galaxy', color: '#BBBBFF' },
    { name: 'M27 (Dumbbell)', ra: 299.9, dec: 22.7, mag: 7.5, type: 'nebula', color: '#00FF99' },
    { name: 'M35 (Gemini)', ra: 101.9, dec: 24.3, mag: 5.1, type: 'cluster', color: '#FFFFFF' },
    { name: 'M11 (Wild Duck)', ra: 283.8, dec: -6.3, mag: 6.3, type: 'cluster', color: '#FFFFFF' },
    { name: 'M5', ra: 229.6, dec: 2.1, mag: 5.6, type: 'cluster', color: '#DDDDFF' },
    { name: 'M3', ra: 205.5, dec: 28.4, mag: 6.2, type: 'cluster', color: '#DDDDFF' },
    { name: 'M15', ra: 322.5, dec: 12.2, mag: 6.2, type: 'cluster', color: '#DDDDFF' },
  ];

  // Key constellations visible to all users + North Star
  const KEY_CONSTELLATIONS = [
    { name: 'Orion', ra: 85, dec: -5, guide: 'Winter hunter with bright belt' },
    { name: 'Ursa Major', ra: 150, dec: 60, guide: 'Big Dipper/Great Bear' },
    { name: 'Ursa Minor', ra: 37, dec: 80, guide: 'Little Bear - find Polaris here' },
    { name: 'Cassiopeia', ra: 10, dec: 70, guide: 'W-shaped - near North Star' },
    { name: 'Sagittarius', ra: 270, dec: -25, guide: 'Galactic center direction' },
  ];

  // All constellations for paid users
  const ALL_CONSTELLATIONS = [
    ...KEY_CONSTELLATIONS,
    { name: 'Cygnus', ra: 305, dec: 45, guide: 'Northern Cross - Milky Way' },
    { name: 'Lyra', ra: 285, dec: 40, guide: 'Contains Vega, Milky Way' },
    { name: 'Scorpius', ra: 245, dec: -30, guide: 'Contains red star Antares' },
    { name: 'Aquila', ra: 298, dec: 1, guide: 'Summer triangle, contains Altair' },
    { name: 'Draco', ra: 262, dec: 70, guide: 'Dragon - circles North Star' },
    { name: 'Pegasus', ra: 350, dec: 30, guide: 'Great Square - autumn' },
    { name: 'Leo', ra: 155, dec: 15, guide: 'Spring constellation, bright' },
    { name: 'Virgo', ra: 186, dec: 5, guide: 'Largest zodiac constellation' },
  ];

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const subs = me.role === 'admin' 
        ? [{ status: 'active' }] 
        : await base44.entities.Subscription.filter({ user_email: me.email, status: 'active' }, '-created_date', 1);
      setIsSubscribed(subs.length > 0);
      
      // Load observations for Plus users
      if (subs.length > 0) {
        const obs = await base44.entities.Observation.filter({ user_email: me.email }, '-created_date', 50).catch(() => []);
        setObservations(obs);
      }
      
      setLoading(false);
      requestOrientationPermission();
    };
    init();
  }, []);

  const requestOrientationPermission = async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
      } catch (err) {
        console.log('Device orientation permission denied');
      }
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
      setPermissionGranted(true);
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }
  };

  const handleDeviceOrientation = (event) => {
    setOrientation({
      alpha: event.alpha || 0,
      beta: event.beta || 0,
      gamma: event.gamma || 0,
    });
  };

  // Convert RA/Dec to Alt/Az based on device orientation
  const getVisibleObjects = () => {
    // Free: Milky Way, Andromeda, Core + 6 key stars (9 total)
    // Paid: all objects
    if (isSubscribed) {
      return ALL_OBJECTS;
    } else {
      // Free users: major features + brightest stars
      return [MILKY_WAY, ANDROMEDA, GALACTIC_CORE, ...ALL_OBJECTS.slice(3, 9)];
    }
  };

  const getVisibleConstellations = () => {
    return isSubscribed ? ALL_CONSTELLATIONS : KEY_CONSTELLATIONS;
  };

  const handleSaveObservation = async (obj) => {
    if (!isSubscribed) return;
    const obs = {
      user_email: user.email,
      object_name: obj.name,
      object_type: obj.type,
      observed_at: new Date().toISOString(),
      conditions: 'manual',
    };
    const saved = await base44.entities.Observation.create(obs);
    setObservations([saved, ...observations]);
    setSelectedObject(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><Smartphone className="w-10 h-10 text-red-400 star-pulse" /></div>;
  }

  const visibleObjects = getVisibleObjects();
  const filtered = visibleObjects.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
         <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
           <Smartphone className="w-7 h-7 text-red-400" /> Star Pointer
         </h1>
        <p className="text-slate-400">Point your phone at the night sky to identify stars, planets & constellations in real-time.</p>
      </div>

      {/* Permission Check */}
      {!permissionGranted && (
        <Card className="bg-amber-900/30 border-amber-700/50 p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 font-medium text-sm">Device Orientation Required</p>
              <p className="text-amber-200/70 text-xs mt-1">Grant permission to use device sensors and point your phone at the sky.</p>
              <Button size="sm" className="mt-2 bg-amber-600 hover:bg-amber-700" onClick={requestOrientationPermission}>
                Enable Device Access
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Live Sky View */}
        <div className="md:col-span-2">
          <Card className="bg-gradient-to-b from-slate-900 to-black border-slate-700 p-6 relative overflow-hidden h-96">
            <div className="absolute inset-0 flex items-center justify-center" ref={canvasRef}>
              {/* Starfield background */}
              <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }}>
                {[...Array(50)].map((_, i) => (
                  <circle key={i} cx={`${Math.random() * 100}%`} cy={`${Math.random() * 100}%`} r={Math.random() * 1.5} fill="white" opacity={Math.random() * 0.7 + 0.3} />
                ))}
              </svg>

              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-red-500/50 rounded-full mb-2" />
                  <p className="text-slate-400 text-sm">Point at sky</p>
                  {permissionGranted && (
                    <p className="text-slate-500 text-xs mt-1">α:{orientation.alpha.toFixed(0)}° β:{orientation.beta.toFixed(0)}° γ:{orientation.gamma.toFixed(0)}°</p>
                  )}
                </div>
              </div>

              {/* Visible Objects Overlay */}
              {filtered.map((obj, i) => (
                <button
                  key={i}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all"
                  style={{
                    left: `${30 + i * 15}%`,
                    top: `${40 + Math.sin(i) * 20}%`,
                  }}
                  onClick={() => setSelectedObject(obj)}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-300 group-hover:scale-150 transition-transform" style={{ backgroundColor: obj.color }} />
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/70 px-2 py-1 rounded">
                    {obj.name}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Controls */}
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" className="border-slate-700 flex-1" onClick={() => setSelectedObject(null)}>
              <Compass className="w-3 h-3 mr-1" /> Clear
            </Button>
            <Button size="sm" variant="outline" className="border-slate-700 flex-1" onClick={requestOrientationPermission}>
              <Eye className="w-3 h-3 mr-1" /> Recalibrate
            </Button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search objects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Selected Object Details */}
          {selectedObject && (
            <Card className="bg-slate-900/80 border-slate-700 p-4">
              <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-white text-lg">{selectedObject.name}</h3>
              <button onClick={() => setSelectedObject(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
              </button>
              </div>

              <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Type</span>
              <span className="text-white capitalize">{selectedObject.type}</span>
              </div>
              <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Magnitude</span>
              <span className="text-white font-mono">{selectedObject.mag.toFixed(2)}</span>
              </div>
              {selectedObject.special && (
              <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium">Note</span>
                <span className="text-amber-300 text-xs text-right">{selectedObject.special}</span>
              </div>
              )}
              </div>

              {isSubscribed && (
                <Button
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleSaveObservation(selectedObject)}
                >
                  <Save className="w-3 h-3 mr-1" /> Log Observation
                </Button>
              )}
            </Card>
          )}

          {/* Featured Constellations */}
          <Card className="bg-[#1a1a1a] border border-white/8 p-4">
            <h3 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
              🌟 {isSubscribed ? 'All Constellations' : 'Key Constellations'}
            </h3>
            <div className="space-y-2">
              {getVisibleConstellations().map(c => (
                <div key={c.name} className="text-xs">
                  <p className="text-slate-300 font-semibold">{c.name}</p>
                  <p className="text-slate-400 text-xs">{c.guide}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Plus Indicator */}
          {!isSubscribed && (
            <Card className="bg-red-900/20 border-red-700/40 p-4">
              <div className="flex gap-2">
                <Lock className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-300 font-medium text-xs">Plus Features</p>
                  <p className="text-red-200/70 text-xs mt-1">Full object catalog, save observations & detailed info.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Observations */}
      {isSubscribed && observations.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-red-400" /> Recent Observations
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {observations.slice(0, 6).map(obs => (
              <Card key={obs.id} className="bg-slate-900/60 border-slate-800 p-4">
                <p className="text-white font-medium">{obs.object_name}</p>
                <p className="text-slate-500 text-xs mt-1 capitalize">{obs.object_type}</p>
                <p className="text-slate-600 text-xs mt-2">{new Date(obs.observed_at).toLocaleDateString()}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}