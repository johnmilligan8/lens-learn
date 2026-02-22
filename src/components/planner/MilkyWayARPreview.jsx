import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Compass, AlertTriangle, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

// Math helpers (from PlannerTool)
function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

const GC_RA = 266.4; // Sgr A*
const GC_DEC = -29.0;

function julianDate(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function lstDegrees(jd, lonDeg) {
  const T = (jd - 2451545.0) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + T * T * 0.000387933 - T * T * T / 38710000;
  gmst = ((gmst % 360) + 360) % 360;
  return ((gmst + lonDeg) % 360 + 360) % 360;
}

function raDecToAltAz(ra, dec, lst, lat) {
  const ha = toRad(((lst - ra) % 360 + 360) % 360);
  const decR = toRad(dec);
  const latR = toRad(lat);
  const sinAlt = Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(ha);
  const alt = toDeg(Math.asin(Math.max(-1, Math.min(1, sinAlt))));
  const cosAz = (Math.sin(decR) - Math.sin(toRad(alt)) * Math.sin(latR)) / (Math.cos(toRad(alt)) * Math.cos(latR));
  let az = toDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
  if (Math.sin(ha) > 0) az = 360 - az;
  return { alt, az };
}

function getMoonPhase(date) {
  const knownNewMoon = new Date('2000-01-06T00:00:00Z');
  const lunarCycle = 29.53058867;
  const diff = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((diff % lunarCycle) + lunarCycle) % lunarCycle;
  const illum = Math.round((1 - Math.cos((phase / lunarCycle) * 2 * Math.PI)) / 2 * 100);
  return { illumination: illum };
}

export default function MilkyWayARPreview({ lat, lon, dateStr, isSubscribed, shooterMode }) {
  const [showARView, setShowARView] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [location, setLocation] = useState({ lat, lon, name: '' });
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(dateStr || today);
  const [dateWarning, setDateWarning] = useState('');
  const [selectedTime, setSelectedTime] = useState('22:00');
  const [loading, setLoading] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const [manualAzOffset, setManualAzOffset] = useState(0);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const deviceOrientationRef = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const compassHeadingRef = useRef(0);
  const animationIdRef = useRef(null);

  // Calculate Milky Way position with advanced ephemeris
  const getMWPosition = () => {
    const d = new Date(selectedDate + 'T' + selectedTime + ':00Z');
    const jd = julianDate(d);
    const lst = lstDegrees(jd, location.lon);
    const { alt, az } = raDecToAltAz(GC_RA, GC_DEC, lst, location.lat);
    
    // Moon position (simplified lunar model)
    const T = (jd - 2451545) / 36525;
    const Lp = 218.3164477 + 481267.88123421 * T;
    const D = 297.8501921 + 445267.1142695 * T;
    const moonLon = ((Lp + (6.28875 * Math.sin((D * Math.PI) / 180)) + 1.27402 * Math.sin((D * Math.PI) / 180)) % 360 + 360) % 360;
    const moonLat = 5.12878 * Math.sin(((Lp - 183.6346) * Math.PI) / 180);
    
    const { alt: alt_moon, az: az_moon } = raDecToAltAz(moonLon, moonLat, lst, location.lat);
    
    // Moon illumination
    const moon = getMoonPhase(d);
    
    // Moon distance from core (angular)
    const dAz = ((az_moon - az + 360) % 360 - 180) * (Math.PI / 180);
    const coreAltRad = (alt * Math.PI) / 180;
    const moonAltRad = (alt_moon * Math.PI) / 180;
    const moonDist = Math.acos(
      Math.sin(coreAltRad) * Math.sin(moonAltRad) + 
      Math.cos(coreAltRad) * Math.cos(moonAltRad) * Math.cos(dAz)
    ) * (180 / Math.PI);
    
    // Visibility score
    let visibility = 0;
    if (alt < 0) visibility = 0;
    else if (alt < 10) visibility = 20;
    else if (alt < 20) visibility = 40;
    else if (alt < 30) visibility = 60;
    else if (alt < 40) visibility = 75;
    else visibility = 85;
    
    const moonInterference = Math.max(0, 100 - moonDist * 2) * (moon.illumination / 100);
    visibility = Math.max(0, visibility - moonInterference * 0.5);
    
    return { 
      alt: Math.round(alt), 
      az: Math.round(az), 
      alt_moon: Math.round(alt_moon),
      az_moon: Math.round(az_moon),
      moonIllum: moon.illumination,
      moonDist: Math.round(moonDist * 10) / 10,
      visibility: Math.round(visibility)
    };
  };

  const handleDateChange = (newDate) => {
    const selected = new Date(newDate);
    const todayDate = new Date(today);
    if (selected < todayDate) {
      setDateWarning('⚠️ Planning is forward-only. Select today or a future date.');
      return;
    }
    setDateWarning('');
    setSelectedDate(newDate);
  };

  const startAR = async () => {
    if (!isSubscribed) {
      alert('AR Scout requires a Plus subscription.');
      return;
    }

    if (new Date(selectedDate) < new Date(today)) {
      alert('Cannot plan for past dates. Select today or future.');
      return;
    }

    setLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraAvailable(true);
      setPermissionError('');

      // Request device orientation (modern API)
      if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
        DeviceOrientationEvent.requestPermission()
          .then(() => {
            window.addEventListener('deviceorientation', handleDeviceOrientation);
          })
          .catch(() => {
            console.log('Orientation permission denied; manual calibration mode');
          });
      } else {
        // Fallback for non-iOS
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }

      // Compass (magnetometer)
      if ('DeviceOrientationEvent' in window) {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }

      setShowARView(true);
      setTimeout(() => drawOverlay(), 500);
    } catch (err) {
      setPermissionError('Camera access denied or unavailable.');
      setCameraAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceOrientation = (e) => {
    deviceOrientationRef.current = {
      alpha: e.alpha || 0, // Z axis (compass)
      beta: e.beta || 0,   // X axis (pitch)
      gamma: e.gamma || 0, // Y axis (roll)
    };
    compassHeadingRef.current = e.alpha || 0;
  };

  const drawOverlay = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationIdRef.current = requestAnimationFrame(drawOverlay);
      return;
    }

    const ctx = canvas.getContext('2d');
    const w = canvas.width = video.videoWidth;
    const h = canvas.height = video.videoHeight;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, w, h);

    const { alt, az, alt_moon, az_moon, moonIllum, moonDist, visibility } = getMWPosition();
    const heading = (compassHeadingRef.current + manualAzOffset) % 360;

    // Determine visibility color
    let visColor = '#ff4444';
    if (visibility > 60) visColor = '#44ff44';
    else if (visibility > 30) visColor = '#ffaa44';

    const visRating = `${visibility}%`;

    // Landscape detection (horizon line)
    const { horizonY, drawLandscapeOverlay, isObstructed } = useLandscapeDetector(videoRef, canvasRef);

    // Use enhanced AR overlay renderer
    PrecisionAROverlay({
      ctx,
      w,
      h,
      coreAlt: alt,
      coreAz: az,
      heading,
      manualOffset: manualAzOffset,
      visColor,
      visRating,
      moonAlt: alt_moon,
      moonAz: az_moon,
      moonIllum,
      moonDist,
      shooterMode,
      selectedDate,
      selectedTime,
      horizonY,
      drawLandscapeOverlay,
      isObstructed
    });

    animationIdRef.current = requestAnimationFrame(drawOverlay);
  };

  const stopAR = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
    if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
    setShowARView(false);
  };

  const handleCanvasMouseDown = (e) => {
    const startX = e.clientX;
    const startOffset = manualAzOffset;

    const handleMouseMove = (moveE) => {
      const delta = moveE.clientX - startX;
      const newOffset = startOffset + (delta / 10); // 10px per degree
      setManualAzOffset(newOffset);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!showARView && !showSetup) {
    return (
      <Button
        onClick={() => setShowSetup(true)}
        className="w-full bg-purple-600 hover:bg-purple-700 h-10 text-sm gap-2"
      >
        <Compass className="w-4 h-4" /> Milky Way AR Scout
      </Button>
    );
  }

  // Setup screen
  if (showSetup && !showARView) {
    return (
      <Card className="bg-slate-900/95 border-slate-700 p-5 fixed inset-4 max-w-sm mx-auto my-auto z-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">AR Scout Setup</h3>
          <button onClick={() => setShowSetup(false)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isSubscribed && (
          <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-600/40 rounded-lg text-xs text-yellow-300">
            ⚠️ AR Scout requires Plus tier. You'll see a text description instead.
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-slate-300 text-xs uppercase block mb-1">Location (Lat, Lon)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Lat"
                step="0.01"
                value={location.lat}
                onChange={e => setLocation({ ...location, lat: parseFloat(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white text-xs h-8 flex-1"
              />
              <Input
                type="number"
                placeholder="Lon"
                step="0.01"
                value={location.lon}
                onChange={e => setLocation({ ...location, lon: parseFloat(e.target.value) })}
                className="bg-slate-800 border-slate-700 text-white text-xs h-8 flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-slate-300 text-xs uppercase block mb-1">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                min={today}
                onChange={e => handleDateChange(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-xs h-8"
              />
              {dateWarning && <p className="text-yellow-400 text-xs mt-1">{dateWarning}</p>}
            </div>
            <div>
              <Label className="text-slate-300 text-xs uppercase block mb-1">Time (UTC)</Label>
              <Input
                type="time"
                value={selectedTime}
                onChange={e => setSelectedTime(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-xs h-8"
              />
            </div>
          </div>

          <Button
            onClick={startAR}
            disabled={loading || !cameraAvailable}
            className="w-full bg-purple-600 hover:bg-purple-700 h-9 text-sm gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Compass className="w-4 h-4" />}
            {isSubscribed ? 'Launch AR View' : 'View Text Preview'}
          </Button>

          {permissionError && (
            <p className="text-red-400 text-xs">{permissionError}</p>
          )}

          <Button
            onClick={() => setShowSetup(false)}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 h-9"
          >
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  // AR View
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <video
        ref={videoRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        muted
      />
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'grab' }}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
        <Button
          onClick={stopAR}
          className="bg-red-600 hover:bg-red-700 h-10 px-6 text-sm font-semibold"
        >
          <X className="w-4 h-4 mr-2" /> Exit AR
        </Button>
      </div>

      {/* Info overlay */}
      <div className="absolute top-4 right-4 bg-black/60 rounded-lg p-3 text-xs text-slate-300 max-w-xs">
        <p className="font-semibold text-white mb-1">📍 Position Preview</p>
        <p>Point your phone at the sky. The arc shows where the Milky Way will appear on {selectedDate}.</p>
      </div>
    </div>
  );
}