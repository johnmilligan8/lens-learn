/**
 * Reusable Leaflet location picker with:
 * - Nominatim autocomplete search
 * - Draggable marker
 * - Click-to-place
 * - GPS button
 * - Manual lat/lon inputs
 * - Confirm button
 */
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Navigation, MapPin, Search, X } from 'lucide-react';

async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0`;
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'UnchartedSkyApp/1.0',
    },
  });
  const data = await res.json();
  return data.map(d => ({
    name: d.display_name.split(',').slice(0, 3).join(', '),
    lat: parseFloat(d.lat),
    lon: parseFloat(d.lon),
  }));
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'UnchartedSkyApp/1.0',
    },
  });
  const data = await res.json();
  const parts = data.display_name?.split(',') || [];
  return parts.slice(0, 2).join(', ').trim() || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

async function ensureLeaflet() {
  if (window.L) return window.L;
  if (!document.querySelector('#leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  if (!document.querySelector('#leaflet-js')) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }
  return window.L;
}

function makeIcon(L, color = '#ef4444') {
  return L.divIcon({
    html: `<div style="width:34px;height:34px;background:${color};border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 10px rgba(0,0,0,0.55)"></div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    className: '',
  });
}

/**
 * Props:
 *   initial: { lat, lon, name } — optional starting position
 *   onConfirm({ lat, lon, name }) — called when user taps Confirm
 *   onCancel() — called when user dismisses
 *   confirmLabel — button text (default "Confirm Location")
 *   inline — if true, renders inline (no modal overlay)
 */
export default function LeafletLocationPicker({ initial, onConfirm, onCancel, confirmLabel, inline }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markerRef = useRef(null);

  const defaultCenter = { lat: 39.5, lon: -98.35 };
  const isDefaultPos = !initial?.lat;
  const [pos, setPos] = useState(initial || defaultCenter);
  const [name, setName] = useState(initial?.name || '');
  const [manualLat, setManualLat] = useState(initial?.lat?.toFixed(5) || '');
  const [manualLon, setManualLon] = useState(initial?.lon?.toFixed(5) || '');
  const [searchVal, setSearchVal] = useState(initial?.name || '');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const debounceRef = useRef(null);

  // Init map
  useEffect(() => {
    let active = true;
    const init = async () => {
      const L = await ensureLeaflet();
      if (!active || !mapRef.current || leafletMapRef.current) return;

      const initialZoom = isDefaultPos ? 4 : 11;
      const map = L.map(mapRef.current, { zoomControl: true, tap: false }).setView([pos.lat, pos.lon], initialZoom);
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([pos.lat, pos.lon], { draggable: true, icon: makeIcon(L) }).addTo(map);
      markerRef.current = marker;

      marker.bindTooltip('Drag to adjust', { permanent: false, direction: 'top', offset: [0, -38] });

      const updateFromLatLng = (lat, lng) => {
        const newLat = parseFloat(lat.toFixed(5));
        const newLon = parseFloat(lng.toFixed(5));
        setPos({ lat: newLat, lon: newLon });
        setManualLat(newLat.toFixed(5));
        setManualLon(newLon.toFixed(5));
      };

      marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        updateFromLatLng(latlng.lat, latlng.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        updateFromLatLng(e.latlng.lat, e.latlng.lng);
      });

      setMapReady(true);
    };
    init();
    return () => {
      active = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Sync pos → map (from external state changes)
  useEffect(() => {
    if (!leafletMapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([pos.lat, pos.lon]);
    leafletMapRef.current.setView([pos.lat, pos.lon], Math.max(leafletMapRef.current.getZoom(), 11));
  }, [pos.lat, pos.lon]);

  // Nominatim autocomplete
  const handleSearchChange = (val) => {
    setSearchVal(val);
    setSuggestions([]);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) return;
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      const results = await nominatimSearch(val);
      setSuggestions(results.slice(0, 5));
      setSearchLoading(false);
    }, 450);
  };

  const selectSuggestion = (s) => {
    setSearchVal(s.name);
    setName(s.name);
    setPos({ lat: s.lat, lon: s.lon });
    setManualLat(s.lat.toFixed(5));
    setManualLon(s.lon.toFixed(5));
    setSuggestions([]);
  };

  // GPS
  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const lat = parseFloat(p.coords.latitude.toFixed(5));
        const lon = parseFloat(p.coords.longitude.toFixed(5));
        const placeName = await reverseGeocode(lat, lon).catch(() => 'My Location');
        setPos({ lat, lon });
        setManualLat(lat.toFixed(5));
        setManualLon(lon.toFixed(5));
        if (!name) { setName(placeName); setSearchVal(placeName); }
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 10000 }
    );
  };

  // Manual lat/lon fields
  const applyManualCoords = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      setPos({ lat, lon });
    }
  };

  const handleConfirm = () => {
    const finalName = name.trim() || searchVal.trim() || `${pos.lat.toFixed(3)}, ${pos.lon.toFixed(3)}`;
    onConfirm({ lat: pos.lat, lon: pos.lon, name: finalName });
  };

  const inner = (
    <div className="flex flex-col gap-0" style={{ maxHeight: inline ? undefined : '90vh' }}>
      {/* Header (only in modal mode) */}
      {!inline && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-white font-bold text-sm">Pin Your Location</h3>
          {onCancel && (
            <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="px-4 pt-3 space-y-2 flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          {searchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 animate-spin" />}
          <input
            value={searchVal}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search name or move marker for exact location"
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-lg pl-9 pr-3 py-2.5 placeholder:text-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-800 z-10">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-2 border-b border-slate-700/50 last:border-0"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                {s.name}
              </button>
            ))}
          </div>
        )}

        {/* GPS Button */}
        <button
          onClick={handleGPS}
          disabled={gpsLoading}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-blue-500/40 bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 transition-colors w-full justify-center"
        >
          {gpsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
          Use My Current Location (GPS)
        </button>
      </div>

      {/* Map */}
      <div className="relative mx-4 mt-2 rounded-xl overflow-hidden border border-slate-700" style={{ height: 260, flexShrink: 0 }}>
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 rounded-xl">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {/* coords overlay */}
        <div className="absolute bottom-2 left-2 z-[800] bg-black/70 rounded-lg px-2 py-1">
          <p className="text-slate-300 text-[10px] font-mono">{pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}</p>
        </div>
      </div>

      <div className="px-4 pt-2 flex-shrink-0">
        <p className="text-slate-500 text-[11px] text-center">
          Verify spot on map — drag pin or tap to reposition
        </p>
      </div>

      {/* Manual lat/lon toggle */}
      <div className="px-4 pt-1 flex-shrink-0">
        <button
          onClick={() => setShowManualCoords(v => !v)}
          className="text-slate-600 text-xs hover:text-slate-400 transition-colors flex items-center gap-1"
        >
          {showManualCoords ? '▼' : '▶'} Enter coordinates manually
        </button>
        {showManualCoords && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="text-slate-500 text-[10px] block mb-1">Latitude</label>
              <input
                type="number"
                value={manualLat}
                onChange={e => setManualLat(e.target.value)}
                onBlur={applyManualCoords}
                placeholder="40.0"
                step="0.00001"
                className="w-full px-2.5 py-1.5 rounded-lg text-sm text-slate-100 bg-slate-800 border border-slate-700 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-500 text-[10px] block mb-1">Longitude</label>
              <input
                type="number"
                value={manualLon}
                onChange={e => setManualLon(e.target.value)}
                onBlur={applyManualCoords}
                placeholder="-111.5"
                step="0.00001"
                className="w-full px-2.5 py-1.5 rounded-lg text-sm text-slate-100 bg-slate-800 border border-slate-700 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div className="px-4 py-3 flex-shrink-0 space-y-2">
        <Button onClick={handleConfirm} className="w-full bg-red-600 hover:bg-red-700 font-bold h-12 text-base gap-2">
          <Check className="w-5 h-5" /> {confirmLabel || 'Confirm to save exact location'}
        </Button>
        {onCancel && (
          <button onClick={onCancel} className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors py-1">
            Cancel
          </button>
        )}
      </div>
    </div>
  );

  if (inline) return <div className="bg-[#0f0f1a] border border-slate-700 rounded-2xl overflow-hidden">{inner}</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#0f0f1a] border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg overflow-y-auto" style={{ maxHeight: '95svh' }}>
        {inner}
      </div>
    </div>
  );
}