import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Bell, MapPin, Navigation, ChevronDown, ChevronUp, Loader2, Search } from 'lucide-react';

// Geocode a place name using Nominatim (free, no API key)
async function geocodeName(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  return data.map(d => ({ name: d.display_name.split(',').slice(0, 2).join(', '), lat: parseFloat(d.lat), lon: parseFloat(d.lon) }));
}

// Reverse geocode lat/lon to a place name
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  const parts = data.display_name?.split(',') || [];
  return parts.slice(0, 2).join(', ').trim() || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

function MapPicker({ lat, lon, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically load leaflet
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkEl);

    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptEl.onload = () => {
      const L = window.L;
      const centerLat = lat || 45;
      const centerLon = lon || -100;
      const map = L.map(mapRef.current, { zoomControl: true }).setView([centerLat, centerLon], lat ? 10 : 4);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      const marker = lat ? L.marker([lat, lon]).addTo(map) : null;
      markerRef.current = marker;

      map.on('click', async (e) => {
        const { lat: clat, lng: clon } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clat, clon]);
        } else {
          markerRef.current = L.marker([clat, clon]).addTo(map);
        }
        const name = await reverseGeocode(clat, clon);
        onSelect({ lat: clat, lon: clon, name });
      });

      mapInstanceRef.current = map;
    };
    document.head.appendChild(scriptEl);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker when lat/lon changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    if (lat && lon) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      } else {
        markerRef.current = window.L.marker([lat, lon]).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.setView([lat, lon], 10);
    }
  }, [lat, lon]);

  return (
    <div
      ref={mapRef}
      style={{ height: 220, borderRadius: 10, overflow: 'hidden', zIndex: 1 }}
      className="w-full border border-white/10 mt-2"
    />
  );
}

export default function AuroraAlertManager({ alertLocations = [], alertsEnabled = true, onUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const handleNameChange = (val) => {
    setNameInput(val);
    setSuggestions([]);
    setLat('');
    setLon('');
    setError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await geocodeName(val);
      setSuggestions(results.slice(0, 4));
      setSearchLoading(false);
    }, 500);
  };

  const selectSuggestion = (s) => {
    setNameInput(s.name);
    setLat(s.lat.toString());
    setLon(s.lon.toString());
    setSuggestions([]);
    setShowMap(true);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) { setError('GPS not supported on this device.'); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const name = await reverseGeocode(latitude, longitude);
      setNameInput(name);
      setLat(latitude.toString());
      setLon(longitude.toString());
      setShowMap(true);
      setGpsLoading(false);
    }, () => {
      setError('Could not get GPS location. Please search or enter manually.');
      setGpsLoading(false);
    });
  };

  const handleMapSelect = ({ lat: mlat, lon: mlon, name }) => {
    setLat(mlat.toString());
    setLon(mlon.toString());
    if (!nameInput.trim() || !lat) setNameInput(name);
  };

  const handleAdd = () => {
    setError('');
    if (!nameInput.trim()) { setError('Please enter a location name or search for a place.'); return; }
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) {
      setError('Please select a place from suggestions, use GPS, or pick on the map to set coordinates.');
      return;
    }
    onUpdate({ locations: [...alertLocations, { id: `alert-${Date.now()}`, name: nameInput.trim(), lat: parsedLat, lon: parsedLon }] });
    setNameInput(''); setLat(''); setLon(''); setSuggestions([]);
    setShowManual(false); setShowMap(false); setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false); setNameInput(''); setLat(''); setLon('');
    setSuggestions([]); setShowManual(false); setShowMap(false); setError('');
  };

  const handleRemove = (id) => {
    onUpdate({ locations: alertLocations.filter(l => l.id !== id) });
  };

  const handleToggleAlerts = () => {
    onUpdate({ alertsEnabled: !alertsEnabled });
  };

  return (
    <div className="rounded-xl border border-white/8 p-6" style={{ background: '#1a1a1a' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-300" />
          <h3 className="text-white font-semibold">Aurora Alerts</h3>
        </div>
        <button
          onClick={handleToggleAlerts}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
            alertsEnabled
              ? 'bg-indigo-700/30 border-indigo-600/50 text-indigo-300 hover:bg-indigo-700/50'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
          }`}
        >
          {alertsEnabled ? '✓ Enabled' : '○ Disabled'}
        </button>
      </div>

      <p className="text-slate-400 text-sm mb-4">
        Get email alerts when aurora activity is forecast at your saved locations.
      </p>

      {/* Location list */}
      {alertLocations.length > 0 && (
        <div className="space-y-2 mb-4">
          {alertLocations.map(loc => (
            <div key={loc.id} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-100 font-medium text-sm truncate">{loc.name}</p>
                  <p className="text-slate-500 text-xs font-mono">{loc.lat.toFixed(3)}°, {loc.lon.toFixed(3)}°</p>
                </div>
              </div>
              <button onClick={() => handleRemove(loc.id)} className="ml-2 text-slate-600 hover:text-slate-300 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Form */}
      {isAdding ? (
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-slate-400 text-xs">Enter a place name or use GPS — we'll handle the rest.</p>

          {/* Search + GPS row */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                value={nameInput}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Search a city, park, or landmark…"
                className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-slate-100 placeholder-slate-600 outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              {searchLoading && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin" />}
            </div>
            <button
              onClick={handleGPS}
              disabled={gpsLoading}
              title="Use my current location"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
              style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              <span className="hidden sm:inline">My Location</span>
            </button>
          </div>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition-colors flex items-center gap-2"
                  style={{ background: '#1a1a1a', borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Map toggle */}
          {(lat && lon) || showMap ? (
            <div>
              <button
                onClick={() => setShowMap(v => !v)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-1"
              >
                {showMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showMap ? 'Hide map' : 'Show map & drag to adjust'}
              </button>
              {showMap && (
                <MapPicker
                  lat={lat ? parseFloat(lat) : null}
                  lon={lon ? parseFloat(lon) : null}
                  onSelect={handleMapSelect}
                />
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowMap(v => !v)}
              className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" /> Select on map instead
            </button>
          )}

          {/* Coordinates display / manual override */}
          {lat && lon && (
            <p className="text-slate-500 text-xs font-mono">
              📍 {parseFloat(lat).toFixed(4)}°, {parseFloat(lon).toFixed(4)}°
            </p>
          )}

          <button
            onClick={() => setShowManual(v => !v)}
            className="text-xs text-slate-600 hover:text-slate-400 underline"
          >
            {showManual ? 'Hide manual coordinates' : 'Enter coordinates manually'}
          </button>

          {showManual && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-500 text-xs block mb-1">Latitude</label>
                <input
                  type="number"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                  placeholder="40.5"
                  step="0.0001"
                  className="w-full px-3 py-2 rounded-lg text-sm text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs block mb-1">Longitude</label>
                <input
                  type="number"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                  placeholder="-111.5"
                  step="0.0001"
                  className="w-full px-3 py-2 rounded-lg text-sm text-slate-100 outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-amber-400 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: '#4f46e5' }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
            >
              Save Location
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              style={{ background: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 transition-all"
          style={{ border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Plus className="w-4 h-4" /> Add Alert Location
        </button>
      )}
    </div>
  );
}