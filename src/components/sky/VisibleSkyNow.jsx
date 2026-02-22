import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Eye, Clock, TrendingUp, MapPin } from 'lucide-react';

// Messier objects (subset of most popular + seasonal)
const MESSIER_CATALOG = [
  { id: 31, name: 'M31 Andromeda', type: 'Galaxy', ra: 10.68, dec: 41.27, mag: 3.4, season: 'autumn-winter', best: 'October-January' },
  { id: 42, name: 'M42 Orion Nebula', type: 'Nebula', ra: 83.82, dec: -5.39, mag: 4.0, season: 'winter', best: 'December-February' },
  { id: 57, name: 'M57 Ring Nebula', type: 'Nebula', ra: 283.40, dec: 33.04, mag: 8.8, season: 'summer', best: 'June-August' },
  { id: 13, name: 'M13 Hercules Cluster', type: 'Globular', ra: 250.42, dec: 36.46, mag: 5.8, season: 'summer', best: 'May-July' },
  { id: 51, name: 'M51 Whirlpool', type: 'Galaxy', ra: 202.24, dec: 47.19, mag: 8.1, season: 'spring-summer', best: 'April-June' },
  { id: 27, name: 'M27 Dumbbell Nebula', type: 'Nebula', ra: 299.90, dec: 22.72, mag: 7.5, season: 'summer-autumn', best: 'July-September' },
  { id: 104, name: 'M104 Sombrero Galaxy', type: 'Galaxy', ra: 189.86, dec: -11.62, mag: 8.0, season: 'spring', best: 'March-May' },
  { id: 5, name: 'M5 Globular Cluster', type: 'Globular', ra: 229.25, dec: 2.07, mag: 5.6, season: 'spring-summer', best: 'April-June' },
  { id: 11, name: 'M11 Wild Duck', type: 'Open Cluster', ra: 282.77, dec: -6.27, mag: 5.8, season: 'summer', best: 'June-August' },
  { id: 45, name: 'M45 Pleiades', type: 'Open Cluster', ra: 56.87, dec: 24.11, mag: 1.6, season: 'autumn-winter', best: 'September-February' },
];

// Key constellations (RA/Dec are central points)
const CONSTELLATIONS = [
  { name: 'Orion', ra: 80, dec: 0, season: 'winter', best: 'December-February', stars: 7 },
  { name: 'Cygnus', ra: 310, dec: 45, season: 'summer-autumn', best: 'June-October', stars: 5 },
  { name: 'Sagittarius', ra: 265, dec: -25, season: 'summer-autumn', best: 'June-September', stars: 8 },
  { name: 'Andromeda', ra: 30, dec: 45, season: 'autumn-winter', best: 'September-January', stars: 6 },
  { name: 'Lyra', ra: 282, dec: 40, season: 'summer', best: 'June-August', stars: 5 },
  { name: 'Aquila', ra: 295, dec: 5, season: 'summer-autumn', best: 'June-September', stars: 5 },
  { name: 'Cassiopeia', ra: 10, dec: 60, season: 'autumn-winter', best: 'August-February', stars: 5 },
  { name: 'Perseus', ra: 51, dec: 50, season: 'autumn-winter', best: 'August-February', stars: 5 },
  { name: 'Gemini', ra: 102, dec: 25, season: 'winter-spring', best: 'December-March', stars: 6 },
  { name: 'Leo', ra: 152, dec: 20, season: 'spring', best: 'February-April', stars: 7 },
];

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
  return { alt: Math.round(alt * 10) / 10, az: Math.round(az * 10) / 10 };
}

function getSeasonalStatus(month) {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

function matchesSeason(objectSeason, currentSeason) {
  const seasonMap = {
    'winter': ['December', 'January', 'February'],
    'spring': ['March', 'April', 'May'],
    'summer': ['June', 'July', 'August'],
    'autumn': ['September', 'October', 'November'],
    'winter-spring': ['December', 'January', 'February', 'March', 'April', 'May'],
    'spring-summer': ['March', 'April', 'May', 'June', 'July', 'August'],
    'summer-autumn': ['June', 'July', 'August', 'September', 'October', 'November'],
    'autumn-winter': ['August', 'September', 'October', 'November', 'December', 'January'],
  };
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = monthNames[new Date().getMonth()];
  const range = seasonMap[objectSeason] || [];
  return range.includes(currentMonth);
}

export default function VisibleSkyNow({ lat, lon, locationName, overrideDate = null }) {
  const [visibleObjects, setVisibleObjects] = useState([]);
  const [visibleConstellations, setVisibleConstellations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // If no location provided, don't render
  if (!lat || !lon) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-6 text-center">
        <Eye className="w-6 h-6 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-400 text-sm">Enter a location to see what's visible now.</p>
      </Card>
    );
  }

  useEffect(() => {
    const calculate = () => {
      const now = overrideDate || new Date();
      setCurrentTime(now);

      const jd = julianDate(now);
      const lst = lstDegrees(jd, lon);

      // Calculate visible Messier objects
      const visibleM = MESSIER_CATALOG
        .map(obj => {
          const { alt, az } = raDecToAltAz(obj.ra, obj.dec, lst, lat);
          const isSeasonal = matchesSeason(obj.season, now.getMonth());
          return { ...obj, alt, az, isSeasonal };
        })
        .filter(obj => obj.alt > 0)
        .sort((a, b) => b.alt - a.alt);

      // Calculate visible constellations
      const visibleC = CONSTELLATIONS
        .map(cons => {
          const { alt, az } = raDecToAltAz(cons.ra, cons.dec, lst, lat);
          const isSeasonal = matchesSeason(cons.season, now.getMonth());
          return { ...cons, alt, az, isSeasonal };
        })
        .filter(cons => cons.alt > 0)
        .sort((a, b) => b.alt - a.alt);

      setVisibleObjects(visibleM);
      setVisibleConstellations(visibleC);
      setLoading(false);
    };

    calculate();
    const interval = setInterval(calculate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [lat, lon, overrideDate]);

  if (loading) {
    return (
      <Card className="bg-slate-900/60 border-slate-800 p-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-slate-400 text-sm">Calculating visible objects...</p>
        </div>
      </Card>
    );
  }

  const season = getSeasonalStatus(currentTime.getMonth());
  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });

  return (
    <Card className="bg-slate-900/60 border-slate-800 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-1">
            <Eye className="w-5 h-5 text-purple-400" /> What's Visible Now
          </h3>
          <p className="text-slate-400 text-xs flex items-center gap-2">
            <MapPin className="w-3 h-3" /> {locationName || 'Your Location'} • {season}
          </p>
        </div>
        <Badge className="bg-purple-600">{timeStr} UTC</Badge>
      </div>

      {/* Messier Objects */}
      {visibleObjects.length > 0 ? (
        <div>
          <p className="text-slate-300 font-semibold text-sm mb-2 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> Deep Sky Objects ({visibleObjects.length})
          </p>
          <div className="space-y-2">
            {visibleObjects.slice(0, 5).map((obj, i) => (
              <div key={i} className={`bg-slate-800/50 rounded p-3 ${!obj.isSeasonal ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{obj.name}</p>
                    {!obj.isSeasonal && <Badge variant="outline" className="text-xs text-slate-500">Off-Season</Badge>}
                  </div>
                  <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">{obj.type}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Mag: {obj.mag}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">Alt: <span className="text-white font-mono">{obj.alt}°</span></span>
                    <span className="text-slate-400">Az: <span className="text-white font-mono">{obj.az}°</span></span>
                  </div>
                </div>
              </div>
            ))}
            {visibleObjects.length > 5 && (
              <p className="text-slate-500 text-xs pt-1">+ {visibleObjects.length - 5} more objects</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/40 rounded p-3 text-center">
          <p className="text-slate-500 text-xs">No Messier objects visible at this time.</p>
        </div>
      )}

      {/* Constellations */}
      {visibleConstellations.length > 0 ? (
        <div className="pt-2 border-t border-slate-700">
          <p className="text-slate-300 font-semibold text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Visible Constellations ({visibleConstellations.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {visibleConstellations.slice(0, 6).map((cons, i) => (
              <div key={i} className={`bg-slate-800/50 rounded p-2.5 text-xs ${!cons.isSeasonal ? 'opacity-60' : ''}`}>
                <p className="text-white font-semibold">{cons.name}</p>
                <p className="text-slate-400">Alt: {cons.alt}° | Az: {cons.az}°</p>
                {!cons.isSeasonal && <p className="text-slate-600 text-[10px] mt-0.5">Off-season</p>}
              </div>
            ))}
          </div>
          {visibleConstellations.length > 6 && (
            <p className="text-slate-500 text-xs pt-1">+ {visibleConstellations.length - 6} more</p>
          )}
        </div>
      ) : (
        <div className="bg-slate-800/40 rounded p-3 text-center">
          <p className="text-slate-500 text-xs">No constellations visible at this time.</p>
        </div>
      )}

      <div className="text-slate-600 text-xs pt-2 border-t border-slate-700">
        Updates every minute | Objects with alt {'>'} 0° shown
      </div>
    </Card>
  );
}