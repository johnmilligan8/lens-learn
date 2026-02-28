import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const DARK_SKY_SPOTS = [
  { name: 'Bonneville Salt Flats', lat: 40.7622, lon: -113.8847 },
  { name: 'Goblin Valley State Park', lat: 38.5683, lon: -110.7063 },
  { name: 'Capitol Reef NP', lat: 38.3670, lon: -111.2615 },
  { name: 'Bryce Canyon NP', lat: 37.6283, lon: -112.1677 },
  { name: 'Antelope Island', lat: 41.0787, lon: -112.2052 },
  { name: 'Natural Bridges NM', lat: 37.6019, lon: -109.9864 },
  { name: 'Canyonlands NP', lat: 38.3269, lon: -109.8783 },
];

export default function LocationPicker({ value, lat, lon, onChange }) {
  const [geoStatus, setGeoStatus] = useState(null); // null | 'loading' | 'denied' | 'ok'
  const [showCoords, setShowCoords] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [manualLat, setManualLat] = useState(lat != null ? String(lat) : '');
  const [manualLon, setManualLon] = useState(lon != null ? String(lon) : '');
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const marker = useRef(null);

  // Update manual coord fields when lat/lon props change
  useEffect(() => {
    if (lat != null) setManualLat(String(lat));
    if (lon != null) setManualLon(String(lon));
  }, [lat, lon]);

  // Init / update Leaflet map when showMap toggles or coords change
  useEffect(() => {
    if (!showMap) return;
    const L = window.L;
    if (!L) return;

    const centerLat = lat || 39.3;
    const centerLon = lon || -111.0;

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, { zoomControl: true }).setView([centerLat, centerLon], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 18,
      }).addTo(leafletMap.current);

      marker.current = L.marker([centerLat, centerLon], { draggable: true }).addTo(leafletMap.current);

      marker.current.on('dragend', () => {
        const pos = marker.current.getLatLng();
        reverseGeocode(pos.lat, pos.lng);
      });

      leafletMap.current.on('click', (e) => {
        marker.current.setLatLng(e.latlng);
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    } else {
      leafletMap.current.setView([centerLat, centerLon], 8);
      marker.current.setLatLng([centerLat, centerLon]);
      leafletMap.current.invalidateSize();
    }

    // Force redraw after mount
    setTimeout(() => leafletMap.current?.invalidateSize(), 100);
  }, [showMap]);

  // Load Leaflet CSS + JS dynamically
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if (!window.L && !document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.head.appendChild(script);
    }
  }, []);

  const reverseGeocode = async (rlat, rlon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${rlat}&lon=${rlon}`);
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
      const state = data.address?.state || '';
      const label = [city, state].filter(Boolean).join(', ') || `${rlat.toFixed(4)}, ${rlon.toFixed(4)}`;
      onChange({ name: label, lat: parseFloat(rlat.toFixed(6)), lon: parseFloat(rlon.toFixed(6)) });
    } catch {
      onChange({ name: `${rlat.toFixed(4)}, ${rlon.toFixed(4)}`, lat: parseFloat(rlat.toFixed(6)), lon: parseFloat(rlon.toFixed(6)) });
    }
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeoStatus('ok');
        await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (leafletMap.current && marker.current) {
          leafletMap.current.setView([pos.coords.latitude, pos.coords.longitude], 10);
          marker.current.setLatLng([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      () => setGeoStatus('denied'),
      { timeout: 10000 }
    );
  };

  const applyManualCoords = () => {
    const parsedLat = parseFloat(manualLat);
    const parsedLon = parseFloat(manualLon);
    if (isNaN(parsedLat) || isNaN(parsedLon)) return;
    onChange({ name: value || `${parsedLat.toFixed(4)}, ${parsedLon.toFixed(4)}`, lat: parsedLat, lon: parsedLon });
    if (leafletMap.current && marker.current) {
      leafletMap.current.setView([parsedLat, parsedLon], 10);
      marker.current.setLatLng([parsedLat, parsedLon]);
    }
  };

  const selectDarkSkySpot = (spot) => {
    onChange({ name: spot.name, lat: spot.lat, lon: spot.lon });
    setManualLat(String(spot.lat));
    setManualLon(String(spot.lon));
    if (leafletMap.current && marker.current) {
      leafletMap.current.setView([spot.lat, spot.lon], 11);
      marker.current.setLatLng([spot.lat, spot.lon]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Main text input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <Input
          placeholder="e.g. Salt Lake City, Utah"
          value={value}
          onChange={e => onChange({ name: e.target.value, lat, lon })}
          className="bg-slate-800 border-slate-700 text-white text-base h-12 pl-9"
        />
      </div>

      {/* Geolocation button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGeolocate}
        disabled={geoStatus === 'loading'}
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white gap-2"
      >
        {geoStatus === 'loading'
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location...</>
          : <><Navigation className="w-4 h-4 text-red-400" /> Use My Current Location</>
        }
      </Button>

      {geoStatus === 'denied' && (
        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-700/30 rounded-lg px-3 py-2">
          Location access denied — enter manually or select a dark sky spot below.
        </p>
      )}

      {/* Map toggle */}
      <button
        type="button"
        onClick={() => setShowMap(v => !v)}
        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
      >
        {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {showMap ? 'Hide map' : 'Pick on map'}
      </button>

      {showMap && (
        <div className="rounded-xl overflow-hidden border border-slate-700" style={{ height: 220 }}>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </div>
      )}

      {/* Manual coordinates toggle */}
      <button
        type="button"
        onClick={() => setShowCoords(v => !v)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        {showCoords ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        Enter coordinates manually
      </button>

      {showCoords && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Latitude</label>
              <Input
                type="number"
                placeholder="40.7608"
                value={manualLat}
                onChange={e => setManualLat(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                step="0.0001"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Longitude</label>
              <Input
                type="number"
                placeholder="-111.8910"
                value={manualLon}
                onChange={e => setManualLon(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white text-sm h-9"
                step="0.0001"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={applyManualCoords}
            className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Apply Coordinates
          </Button>
        </div>
      )}

      {/* Dark sky spots */}
      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <p className="text-xs text-slate-400 font-semibold mb-2">🏔 Utah Dark Sky Spots</p>
        <div className="flex flex-wrap gap-1.5">
          {DARK_SKY_SPOTS.map(spot => (
            <button
              key={spot.name}
              type="button"
              onClick={() => selectDarkSkySpot(spot)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                value === spot.name
                  ? 'bg-red-600/30 border-red-500/60 text-red-200'
                  : 'bg-slate-700/40 border-slate-600/40 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {spot.name}
            </button>
          ))}
        </div>
      </div>

      {lat && lon && (
        <p className="text-xs text-slate-600 font-mono">
          📍 {typeof lat === 'number' ? lat.toFixed(5) : lat}, {typeof lon === 'number' ? lon.toFixed(5) : lon}
        </p>
      )}

      {typeof onboarding !== 'undefined' && onboarding && (
        <p className="text-xs text-slate-600">Optional — skip if you prefer to enter location each time.</p>
      )}
    </div>
  );
}