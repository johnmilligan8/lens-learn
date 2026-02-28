import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Wind, Star, Zap, Layers, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LAYERS = [
  {
    id: 'clouds',
    label: 'Clouds',
    icon: Cloud,
    color: 'text-blue-400',
    activeBg: 'bg-blue-600',
    desc: 'OpenWeatherMap cloud cover',
    getTileUrl: (lat, lon) =>
      `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=DEMO_KEY`,
    useOpenWeather: true,
  },
  {
    id: 'wind',
    label: 'Wind',
    icon: Wind,
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-600',
    desc: 'Wind speed & direction',
    getTileUrl: () =>
      `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=DEMO_KEY`,
    useOpenWeather: true,
  },
  {
    id: 'bortle',
    label: 'Bortle',
    icon: Star,
    color: 'text-yellow-400',
    activeBg: 'bg-yellow-600',
    desc: 'Light pollution (Lorenz tiles)',
    getTileUrl: () =>
      `https://www.lightpollutionmap.info/tiles/world_2015/{z}/{x}/{y}.png`,
    useOpenWeather: false,
  },
  {
    id: 'aurora',
    label: 'Aurora',
    icon: Zap,
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-600',
    desc: 'NOAA aurora oval forecast',
    useNOAAImage: true,
  },
];

export default function MapOverlayLayers({ lat, lon, dateStr }) {
  const [activeLayer, setActiveLayer] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [noaaImageUrl, setNoaaImageUrl] = useState(null);
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);

  const currentLat = lat || 40.0;
  const currentLon = lon || -111.0;

  // Load Leaflet once
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
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.L) {
      setMapLoaded(true);
    } else {
      const existing = document.getElementById('leaflet-js');
      if (existing) existing.onload = () => setMapLoaded(true);
    }
  }, []);

  // Init map when expanded
  useEffect(() => {
    if (!expanded || !mapLoaded || !mapRef.current) return;
    const L = window.L;
    if (!L) return;

    if (!leafletMapRef.current) {
      leafletMapRef.current = L.map(mapRef.current, { zoomControl: true }).setView([currentLat, currentLon], 7);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 18,
      }).addTo(leafletMapRef.current);

      markerRef.current = L.circleMarker([currentLat, currentLon], {
        radius: 8,
        fillColor: '#cc0000',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(leafletMapRef.current);
    } else {
      leafletMapRef.current.setView([currentLat, currentLon], 7);
      markerRef.current?.setLatLng([currentLat, currentLon]);
      leafletMapRef.current.invalidateSize();
    }

    setTimeout(() => leafletMapRef.current?.invalidateSize(), 150);
  }, [expanded, mapLoaded, currentLat, currentLon]);

  // Toggle overlay tile layer
  useEffect(() => {
    if (!leafletMapRef.current || !mapLoaded) return;
    const L = window.L;
    if (!L) return;

    // Remove previous overlay
    if (tileLayerRef.current) {
      leafletMapRef.current.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (!activeLayer) return;

    const layer = LAYERS.find(l => l.id === activeLayer);
    if (!layer) return;

    if (layer.useNOAAImage) {
      // NOAA aurora image — shown separately, not as tile
      setNoaaImageUrl('https://services.swpc.noaa.gov/images/aurora-forecast-northern-hemisphere.jpg');
      return;
    } else {
      setNoaaImageUrl(null);
    }

    const tileUrl = layer.getTileUrl(currentLat, currentLon);
    tileLayerRef.current = L.tileLayer(tileUrl, {
      opacity: 0.7,
      attribution: layer.desc,
    });
    tileLayerRef.current.addTo(leafletMapRef.current);
  }, [activeLayer, mapLoaded]);

  const handleToggleLayer = (layerId) => {
    setActiveLayer(prev => prev === layerId ? null : layerId);
    if (!expanded) setExpanded(true);
  };

  const currentLayerInfo = LAYERS.find(l => l.id === activeLayer);

  return (
    <div className="mt-4">
      {/* Toggle row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-slate-500 text-xs flex items-center gap-1 font-semibold">
          <Layers className="w-3.5 h-3.5" /> Overlays:
        </span>
        {LAYERS.map(layer => {
          const Icon = layer.icon;
          const isActive = activeLayer === layer.id;
          return (
            <button
              key={layer.id}
              onClick={() => handleToggleLayer(layer.id)}
              title={layer.desc}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
                isActive
                  ? `${layer.activeBg} border-transparent text-white`
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              <Icon className="w-3 h-3" />
              {layer.label}
            </button>
          );
        })}
        {expanded && (
          <button
            onClick={() => { setExpanded(false); setActiveLayer(null); setNoaaImageUrl(null); }}
            className="ml-auto text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Map */}
      {expanded && (
        <div className="rounded-xl overflow-hidden border border-slate-700 relative" style={{ height: 260 }}>
          <div ref={mapRef} style={{ height: '100%', width: '100%' }} />

          {/* Aurora NOAA image overlay */}
          {noaaImageUrl && activeLayer === 'aurora' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
              <p className="text-emerald-400 font-bold text-xs mb-2 uppercase tracking-widest">NOAA Aurora Oval — Northern Hemisphere</p>
              <img
                src={noaaImageUrl}
                alt="NOAA Aurora Forecast"
                className="max-h-[200px] rounded-lg border border-emerald-600/40"
                onError={() => setNoaaImageUrl(null)}
              />
              <p className="text-slate-500 text-[10px] mt-1">Source: NOAA Space Weather Prediction Center</p>
            </div>
          )}

          {currentLayerInfo && activeLayer !== 'aurora' && (
            <div className="absolute bottom-2 left-2 bg-black/70 rounded-md px-2 py-1 text-xs text-slate-300 z-50">
              {currentLayerInfo.desc}
            </div>
          )}
        </div>
      )}
    </div>
  );
}