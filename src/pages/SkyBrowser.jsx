import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Star, Radio, Zap, Eye, Compass, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { catalog } from '../functions/celestialCatalog';

const typeIcons = {
  'binary': <Zap className="w-4 h-4" />,
  'main-sequence': <Star className="w-4 h-4" />,
  'giant': <Radio className="w-4 h-4" />,
  'supergiant': <Zap className="w-4 h-4" />,
  'globular_cluster': <Eye className="w-4 h-4" />,
  'open_cluster': <Eye className="w-4 h-4" />,
  'emission_nebula': <Radio className="w-4 h-4" />,
  'planetary_nebula': <Radio className="w-4 h-4" />,
  'supernova_remnant': <Zap className="w-4 h-4" />,
  'galaxy': <Eye className="w-4 h-4" />,
};

const typeColors = {
  'binary': 'bg-blue-100 text-blue-800',
  'main-sequence': 'bg-yellow-100 text-yellow-800',
  'giant': 'bg-orange-100 text-orange-800',
  'supergiant': 'bg-red-100 text-red-800',
  'globular_cluster': 'bg-purple-100 text-purple-800',
  'open_cluster': 'bg-indigo-100 text-indigo-800',
  'emission_nebula': 'bg-pink-100 text-pink-800',
  'planetary_nebula': 'bg-violet-100 text-violet-800',
  'supernova_remnant': 'bg-red-100 text-red-800',
  'galaxy': 'bg-slate-100 text-slate-800',
};

export default function SkyBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stars'); // stars, messier, planets, constellations
  const [filterType, setFilterType] = useState('all');
  const [minMag, setMinMag] = useState(-5);
  const [maxMag, setMaxMag] = useState(10);
  const [expandedObject, setExpandedObject] = useState(null);

  // Filter & search logic
  const filteredObjects = useMemo(() => {
    let objects = [];

    if (activeTab === 'stars') {
      objects = catalog.stars.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || s.type === filterType;
        const matchesMag = s.mag >= minMag && s.mag <= maxMag;
        return matchesSearch && matchesType && matchesMag;
      });
      objects.sort((a, b) => a.mag - b.mag); // Sort by magnitude (brightest first)
    } else if (activeTab === 'messier') {
      objects = catalog.messier.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              m.constellation.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || m.type === filterType;
        const matchesMag = m.mag >= minMag && m.mag <= maxMag;
        return matchesSearch && matchesType && matchesMag;
      });
      objects.sort((a, b) => parseFloat(a.name.slice(1)) - parseFloat(b.name.slice(1))); // Sort by M number
    } else if (activeTab === 'planets') {
      objects = catalog.planets.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || p.type === filterType;
        return matchesSearch && matchesType;
      });
    } else if (activeTab === 'constellations') {
      objects = catalog.constellations.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                              c.abbr.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
      });
      objects.sort((a, b) => a.name.localeCompare(b.name));
    }

    return objects;
  }, [searchQuery, activeTab, filterType, minMag, maxMag]);

  const getTypeOptions = () => {
    if (activeTab === 'stars') {
      return ['binary', 'main-sequence', 'giant', 'supergiant'];
    } else if (activeTab === 'messier') {
      return ['globular_cluster', 'open_cluster', 'emission_nebula', 'planetary_nebula', 'supernova_remnant', 'galaxy'];
    } else if (activeTab === 'planets') {
      return ['terrestrial', 'gas_giant', 'ice_giant'];
    }
    return [];
  };

  return (
    <div className="min-h-screen cosmic-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-[#111111] to-[#1a1a1a] border-b border-slate-800/40 p-6">
        <Link to={createPageUrl('PlannerTool')} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 text-sm">
          <ChevronDown className="w-4 h-4 rotate-90" /> Back to Planner
        </Link>
        <h1 className="text-3xl font-black text-white mb-2 gradient-text">Sky Browser</h1>
        <p className="text-slate-400 text-sm">Explore bright stars, deep-sky objects, planets & constellations</p>

        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'stars', label: '⭐ Bright Stars', count: catalog.stars.length },
            { id: 'messier', label: '🌌 Messier (M1–M110)', count: catalog.messier.length },
            { id: 'planets', label: '🪐 Planets', count: catalog.planets.length },
            { id: 'constellations', label: '🗺 Constellations', count: catalog.constellations.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFilterType('all'); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-[150px] z-30 bg-[#111111]/95 backdrop-blur border-b border-slate-800/40 p-6 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder={activeTab === 'stars' ? 'Search stars...' : activeTab === 'messier' ? 'Search M-objects, constellations...' : 'Search...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>

        {/* Magnitude Filter (stars & messier) */}
        {(activeTab === 'stars' || activeTab === 'messier') && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Min Mag</label>
              <Input
                type="number"
                min="-5"
                max="10"
                step="0.5"
                value={minMag}
                onChange={e => setMinMag(parseFloat(e.target.value))}
                className="bg-slate-800 border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max Mag</label>
              <Input
                type="number"
                min="-5"
                max="10"
                step="0.5"
                value={maxMag}
                onChange={e => setMaxMag(parseFloat(e.target.value))}
                className="bg-slate-800 border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1.5 rounded"
              >
                <option value="all">All Types</option>
                {getTypeOptions().map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 'planets' && (
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded"
          >
            <option value="all">All Planet Types</option>
            <option value="terrestrial">Terrestrial</option>
            <option value="gas_giant">Gas Giant</option>
            <option value="ice_giant">Ice Giant</option>
          </select>
        )}
      </div>

      {/* Results */}
      <div className="p-6 max-w-4xl mx-auto space-y-3">
        {filteredObjects.length === 0 ? (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No objects match your search.</p>
          </div>
        ) : (
          filteredObjects.map(obj => (
            <ObjectCard
              key={obj.name}
              obj={obj}
              type={activeTab}
              isExpanded={expandedObject === obj.name}
              onToggleExpand={() => setExpandedObject(expandedObject === obj.name ? null : obj.name)}
              typeColors={typeColors}
              typeIcons={typeIcons}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ObjectCard({ obj, type, isExpanded, onToggleExpand, typeColors, typeIcons }) {
  if (type === 'stars') {
    return (
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer" onClick={onToggleExpand}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{obj.name}</h3>
                <Badge className={`${typeColors[obj.type] || 'bg-slate-700 text-slate-200'} text-xs`}>
                  {typeIcons[obj.type]} {obj.type.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-300">Mag {obj.mag}</Badge>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                RA: {obj.ra.toFixed(2)}° | Dec: {obj.dec.toFixed(2)}° | Distance: {obj.distance} ly
              </p>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-slate-300 text-sm"><strong>Color:</strong> {obj.color}</p>
              <p className="text-slate-400 text-xs mt-2">💡 Tip: Best observed when above 30° altitude</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (type === 'messier') {
    return (
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer" onClick={onToggleExpand}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{obj.name} • {obj.constellation}</h3>
                <Badge className={`${typeColors[obj.type] || 'bg-slate-700 text-slate-200'} text-xs`}>
                  {typeIcons[obj.type]} {obj.type.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-300">Mag {obj.mag}</Badge>
              </div>
              <p className="text-slate-400 text-sm mt-1">{obj.description}</p>
              <p className="text-slate-400 text-xs mt-1">RA: {obj.ra.toFixed(2)}° | Dec: {obj.dec.toFixed(2)}°</p>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-slate-300 text-sm">
                {obj.type === 'globular_cluster' && '💡 Rich, dense cluster - stunning in larger scopes'}
                {obj.type === 'open_cluster' && '💡 Beautiful scattered star field'}
                {obj.type === 'emission_nebula' && '💡 Star-forming region - use O-III filter for best contrast'}
                {obj.type === 'planetary_nebula' && '💡 Shells of ejected material - look for rings or structure'}
                {obj.type === 'galaxy' && '💡 Island universe - very faint outer regions, save core for averted vision'}
                {obj.type === 'supernova_remnant' && '💡 Expanding shell from ancient explosion'}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (type === 'planets') {
    return (
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer" onClick={onToggleExpand}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{obj.name}</h3>
                <Badge className={`${typeColors[obj.type] || 'bg-slate-700 text-slate-200'} text-xs`}>
                  {obj.type.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-slate-400 text-sm mt-1">{obj.description}</p>
              <p className="text-slate-400 text-xs mt-1">Size: {obj.size.toLocaleString()} km | Magnitude: {obj.mag_range[0]} to {obj.mag_range[1]}</p>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <p className="text-slate-300 text-sm">
                {obj.name === 'Jupiter' && '💡 Look for Great Red Spot and cloud bands in modest telescopes'}
                {obj.name === 'Saturn' && '💡 Rings visible in 50mm+ optics - spectacular at 100x magnification'}
                {obj.name === 'Venus' && '💡 Observe phase changes, always beautiful at twilight'}
                {obj.name === 'Mars' && '💡 Surface features visible when above 30° altitude'}
                {obj.name === 'Mercury' && '💡 Best near sunrise/sunset, always low in sky'}
                {obj.name === 'Uranus' && '💡 Pale blue disk in telescopes, requires dark skies'}
                {obj.name === 'Neptune' && '💡 Deep blue, faint even in telescopes, use averted vision'}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (type === 'constellations') {
    return (
      <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer" onClick={onToggleExpand}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{obj.name}</h3>
                <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">{obj.abbr}</Badge>
                <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">{obj.area} sq°</Badge>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                <strong>Bright stars:</strong> {obj.bright_stars.join(', ')}
              </p>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
              {obj.messier.length > 0 && (
                <p className="text-slate-300 text-sm">
                  <strong>Messier objects:</strong> {obj.messier.join(', ')}
                </p>
              )}
              <p className="text-slate-400 text-xs">
                💡 Located at RA {obj.ra}° | Dec {obj.dec}°
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }
}