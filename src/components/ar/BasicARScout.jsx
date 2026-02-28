import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Loader2, AlertCircle, Navigation } from 'lucide-react';

// Galactic core position
const GC_RA = 266.4; // degrees
const GC_DEC = -29.0;

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

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

export default function BasicARScout({ lat, lon, dateStr, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [compassHeading, setCompassHeading] = useState(0);
  const [timeOffset, setTimeOffset] = useState(0);
  const [gcPosition, setGcPosition] = useState(null);
  const streamRef = useRef(null);

  // Request camera access
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setCameraActive(true);
        }
      } catch (err) {
        setCameraError(err.message || 'Could not access camera');
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Request device orientation
  useEffect(() => {
    const handleOrientation = (event) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      });
    };

    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (DeviceOrientationEvent.requestPermission) {
        // iOS 13+
        DeviceOrientationEvent.requestPermission()
          .then(perm => {
            if (perm === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(() => setCameraError('Device orientation permission denied'));
      } else {
        // Android
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Request compass/magnetometer
  useEffect(() => {
    const handleDeviceMotion = (event) => {
      // Rough compass heading from device orientation
      const heading = deviceOrientation.alpha;
      setCompassHeading(heading);
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => window.removeEventListener('devicemotion', handleDeviceMotion);
  }, [deviceOrientation]);

  // Calculate galactic core position
  useEffect(() => {
    if (!lat || !lon) return;
    const d = new Date(dateStr + 'T12:00:00Z');
    d.setHours(d.getHours() + timeOffset);
    const jd = julianDate(d);
    const lst = lstDegrees(jd, lon);
    const { alt, az } = raDecToAltAz(GC_RA, GC_DEC, lst, lat);
    setGcPosition({ alt, az, visible: alt > -5 });
  }, [lat, lon, dateStr, timeOffset]);

  // Draw AR overlay on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !cameraActive || !gcPosition) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, w, h);

    // Device heading (compass)
    const deviceHeading = deviceOrientation.alpha; // 0–360°

    // Galactic core azimuth relative to device heading
    const gcAz = gcPosition.az;
    const relativeAz = ((gcAz - deviceHeading + 180) % 360) - 180;

    // Convert relative azimuth to screen X (center = 0)
    // Assume ~90° horizontal FOV, so ±45° = ±half-width
    const pixelsPerDegree = (w / 2) / 45;
    const gcX = w / 2 + relativeAz * pixelsPerDegree;
    const gcY = h / 2 - (gcPosition.alt * pixelsPerDegree * 0.7); // altitude affects vertical

    // Draw compass indicator (top)
    ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Heading: ${Math.round(deviceHeading)}°`, 10, 20);

    // Draw Milky Way arc (simple parabola)
    if (gcPosition.visible) {
      ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = Math.max(0, gcX - 80); x < Math.min(w, gcX + 80); x += 5) {
        const dx = x - gcX;
        const y = gcY + (dx * dx) / 150;
        if (x === Math.max(0, gcX - 80)) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw core dot
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(gcX, gcY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('Core', gcX + 12, gcY - 8);

      // Alt/Az
      ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
      ctx.font = '11px monospace';
      ctx.fillText(`Alt: ${Math.round(gcPosition.alt)}° Az: ${Math.round(gcAz)}°`, 10, h - 10);
    } else {
      ctx.fillStyle = 'rgba(200, 100, 100, 0.7)';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Milky Way below horizon', w / 2 - 80, h / 2);
    }

    // Time label
    ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
    ctx.font = '12px monospace';
    ctx.fillText(`Time: +${timeOffset}h`, 10, 40);
  }, [cameraActive, gcPosition, deviceOrientation, timeOffset]);

  if (cameraError) {
    return (
      <Card className="bg-red-900/20 border border-red-500/30 p-6 max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-bold text-sm mb-1">Camera Access Required</p>
            <p className="text-red-200 text-xs mb-3">{cameraError}</p>
            <Button size="sm" variant="outline" onClick={onClose} className="border-red-500/40 text-red-300">
              Close
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ WebkitTransform: 'scaleX(-1)' }}
      />

      {/* AR Canvas overlay */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="absolute inset-0 w-full h-full"
      />

      {/* Controls (bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-xs font-bold">Time Offset (hours)</label>
            <span className="text-blue-400 text-sm font-mono">{timeOffset > 0 ? '+' : ''}{timeOffset}h</span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={timeOffset}
            onChange={(e) => setTimeOffset(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-slate-500 text-[10px] mt-1">Scrub through time to see Milky Way movement</p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onClose}
            className="flex-1 bg-red-600 hover:bg-red-700 gap-2 h-9 text-xs"
          >
            <X className="w-4 h-4" /> Close Scout
          </Button>
          <div className="flex-1 bg-slate-800/60 rounded-lg px-3 py-2 text-center">
            <p className="text-emerald-300 text-[10px] font-bold uppercase tracking-widest">🧭 Live</p>
          </div>
        </div>
      </div>

      {/* Top instruction */}
      <div className="absolute top-4 left-4 right-4 bg-black/70 backdrop-blur rounded-lg px-4 py-2 flex items-start gap-2">
        <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-blue-200 text-xs">Point phone at sky to align. Move phone to see Milky Way arc.</p>
      </div>

      {!cameraActive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-300 text-sm">Loading camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}