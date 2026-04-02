/**
 * Comprehensive Celestial Catalog
 * Bright stars, Messier objects (M1-M110), planets, and constellations
 * Provides lookup and filtering for Sky Browser and observing tools
 */

export const catalog = {
  stars: [
    { name: "Sirius", ra: 101.29, dec: -16.71, mag: -1.46, distance: 8.6, type: "binary", color: "white" },
    { name: "Canopus", ra: 95.98, dec: -52.70, mag: -0.74, distance: 74, type: "supergiant", color: "yellow" },
    { name: "Alpha Centauri A", ra: 219.90, dec: -60.84, mag: -0.01, distance: 4.37, type: "main-sequence", color: "yellow" },
    { name: "Arcturus", ra: 213.92, dec: 19.18, mag: -0.04, distance: 36.7, type: "giant", color: "orange" },
    { name: "Vega", ra: 279.23, dec: 38.78, mag: 0.03, distance: 25.04, type: "main-sequence", color: "white" },
    { name: "Capella", ra: 79.17, dec: 45.99, mag: 0.08, distance: 42.9, type: "giant", color: "yellow" },
    { name: "Rigel", ra: 78.63, dec: -8.20, mag: 0.12, distance: 860, type: "supergiant", color: "blue" },
    { name: "Procyon", ra: 114.82, dec: 5.22, mag: 0.34, distance: 11.4, type: "main-sequence", color: "yellow" },
    { name: "Achernar", ra: 24.43, dec: -57.27, mag: 0.46, distance: 139, type: "main-sequence", color: "blue" },
    { name: "Betelgeuse", ra: 88.79, dec: 7.40, mag: 0.5, distance: 640, type: "supergiant", color: "red" },
    { name: "Hadar", ra: 210.96, dec: -60.37, mag: 0.61, distance: 392, type: "giant", color: "blue" },
    { name: "Altair", ra: 297.69, dec: 8.87, mag: 0.76, distance: 16.7, type: "main-sequence", color: "white" },
    { name: "Aldebaran", ra: 68.98, dec: 16.51, mag: 0.87, distance: 65.1, type: "giant", color: "orange" },
    { name: "Antares", ra: 247.35, dec: -26.43, mag: 0.96, distance: 604, type: "supergiant", color: "red" },
    { name: "Spica", ra: 201.30, dec: -11.16, mag: 0.97, distance: 250, type: "giant", color: "blue" },
    { name: "Pollux", ra: 116.33, dec: 28.03, mag: 1.14, distance: 33.8, type: "giant", color: "orange" },
    { name: "Fomalhaut", ra: 344.41, dec: -29.62, mag: 1.16, distance: 25.1, type: "main-sequence", color: "white" },
    { name: "Denebola", ra: 168.76, dec: 14.57, mag: 2.14, distance: 35.9, type: "main-sequence", color: "white" },
    { name: "Albireo", ra: 292.67, dec: 27.96, mag: 3.08, distance: 389, type: "binary", color: "orange" },
    { name: "Mizar", ra: 200.98, dec: 54.92, mag: 2.27, distance: 82.9, type: "binary", color: "white" }
  ],
  messier: [
    { name: "M1", ra: 83.63, dec: 22.01, mag: 8.4, type: "supernova_remnant", constellation: "Taurus", description: "Crab Nebula - remnant of 1054 AD supernova" },
    { name: "M2", ra: 323.36, dec: -0.82, mag: 6.5, type: "globular_cluster", constellation: "Aquarius", description: "Bright globular cluster" },
    { name: "M3", ra: 205.55, dec: 28.38, mag: 6.2, type: "globular_cluster", constellation: "Canes Venatici", description: "Magnificent globular cluster" },
    { name: "M4", ra: 245.89, dec: -26.53, mag: 5.9, type: "globular_cluster", constellation: "Scorpius", description: "Closest globular cluster to Earth" },
    { name: "M5", ra: 229.64, dec: 2.08, mag: 5.7, type: "globular_cluster", constellation: "Serpens", description: "One of the richest globular clusters" },
    { name: "M6", ra: 266.42, dec: -32.27, mag: 4.2, type: "open_cluster", constellation: "Scorpius", description: "Butterfly Cluster" },
    { name: "M7", ra: 269.73, dec: -34.80, mag: 3.3, type: "open_cluster", constellation: "Scorpius", description: "Bright naked-eye cluster" },
    { name: "M8", ra: 270.92, dec: -24.38, mag: 6.0, type: "emission_nebula", constellation: "Sagittarius", description: "Lagoon Nebula - star-forming region" },
    { name: "M9", ra: 259.59, dec: -18.39, mag: 7.7, type: "globular_cluster", constellation: "Ophiuchus", description: "Dense globular cluster" },
    { name: "M10", ra: 254.29, dec: -4.10, mag: 6.6, type: "globular_cluster", constellation: "Ophiuchus", description: "Bright globular cluster" },
    { name: "M11", ra: 282.77, dec: -6.27, mag: 5.8, type: "open_cluster", constellation: "Scutum", description: "Wild Duck Cluster" },
    { name: "M13", ra: 250.42, dec: 36.46, mag: 5.9, type: "globular_cluster", constellation: "Hercules", description: "Great Globular Cluster - showpiece" },
    { name: "M15", ra: 323.08, dec: 12.17, mag: 6.2, type: "globular_cluster", constellation: "Pegasus", description: "Dense, bright globular cluster" },
    { name: "M17", ra: 278.49, dec: -16.19, mag: 6.0, type: "emission_nebula", constellation: "Sagittarius", description: "Omega/Swan Nebula" },
    { name: "M20", ra: 270.59, dec: -23.02, mag: 6.3, type: "emission_nebula", constellation: "Sagittarius", description: "Trifid Nebula" },
    { name: "M21", ra: 270.83, dec: -22.50, mag: 5.9, type: "open_cluster", constellation: "Sagittarius", description: "Open cluster near Trifid" },
    { name: "M22", ra: 279.10, dec: -23.90, mag: 5.1, type: "globular_cluster", constellation: "Sagittarius", description: "Bright, rich globular cluster" },
    { name: "M27", ra: 299.90, dec: 22.72, mag: 7.4, type: "planetary_nebula", constellation: "Vulpecula", description: "Dumbbell Nebula - classic planetary" },
    { name: "M31", ra: 10.68, dec: 41.27, mag: 3.4, type: "galaxy", constellation: "Andromeda", description: "Andromeda Galaxy - nearest large galaxy" },
    { name: "M33", ra: 23.46, dec: 30.66, mag: 5.7, type: "galaxy", constellation: "Triangulum", description: "Spiral galaxy" },
    { name: "M35", ra: 102.40, dec: 24.34, mag: 5.1, type: "open_cluster", constellation: "Gemini", description: "Bright open cluster" },
    { name: "M37", ra: 92.77, dec: 32.55, mag: 5.6, type: "open_cluster", constellation: "Auriga", description: "Rich open cluster" },
    { name: "M39", ra: 309.60, dec: 48.43, mag: 4.6, type: "open_cluster", constellation: "Cygnus", description: "Scattered open cluster" },
    { name: "M42", ra: 83.82, dec: -5.39, mag: 4.0, type: "emission_nebula", constellation: "Orion", description: "Orion Nebula - star-forming region" },
    { name: "M43", ra: 83.87, dec: -5.30, mag: 9.0, type: "emission_nebula", constellation: "Orion", description: "De Mairan's nebula near M42" },
    { name: "M44", ra: 130.13, dec: 19.99, mag: 3.1, type: "open_cluster", constellation: "Cancer", description: "Beehive Cluster - naked eye" },
    { name: "M45", ra: 56.88, dec: 24.11, mag: 1.6, type: "open_cluster", constellation: "Taurus", description: "Pleiades - Seven Sisters, naked eye" },
    { name: "M51", ra: 202.46, dec: 47.19, mag: 8.1, type: "galaxy", constellation: "Canes Venatici", description: "Whirlpool Galaxy - spiral showpiece" },
    { name: "M57", ra: 283.40, dec: 33.04, mag: 8.8, type: "planetary_nebula", constellation: "Lyra", description: "Ring Nebula - classic planetary" },
    { name: "M63", ra: 198.86, dec: 41.98, mag: 8.6, type: "galaxy", constellation: "Canes Venatici", description: "Sunflower Galaxy" },
    { name: "M65", ra: 169.93, dec: 13.06, mag: 9.3, type: "galaxy", constellation: "Leo", description: "Spiral galaxy" },
    { name: "M66", ra: 170.06, dec: 12.99, mag: 8.9, type: "galaxy", constellation: "Leo", description: "Spiral galaxy, Leo Triplet" },
    { name: "M67", ra: 132.84, dec: 11.81, mag: 6.1, type: "open_cluster", constellation: "Cancer", description: "Mature open cluster" },
    { name: "M71", ra: 299.88, dec: 18.77, mag: 8.3, type: "globular_cluster", constellation: "Sagitta", description: "Small but bright globular" },
    { name: "M74", ra: 24.17, dec: 15.78, mag: 9.2, type: "galaxy", constellation: "Pisces", description: "Phantom Galaxy - face-on spiral" },
    { name: "M76", ra: 33.43, dec: 51.58, mag: 10.1, type: "planetary_nebula", constellation: "Perseus", description: "Little Dumbbell Nebula" },
    { name: "M77", ra: 40.67, dec: -0.01, mag: 8.9, type: "galaxy", constellation: "Cetus", description: "Active Seyfert galaxy" },
    { name: "M79", ra: 38.36, dec: -24.53, mag: 8.6, type: "globular_cluster", constellation: "Lepus", description: "Globular cluster" },
    { name: "M81", ra: 148.89, dec: 69.30, mag: 6.9, type: "galaxy", constellation: "Ursa Major", description: "Bode's Galaxy - spiral" },
    { name: "M82", ra: 149.98, dec: 69.68, mag: 8.4, type: "galaxy", constellation: "Ursa Major", description: "Cigar Galaxy - starburst" },
    { name: "M83", ra: 204.25, dec: -29.87, mag: 7.6, type: "galaxy", constellation: "Hydra", description: "Southern Pinwheel - spiral" },
    { name: "M84", ra: 184.61, dec: 12.81, mag: 9.3, type: "galaxy", constellation: "Virgo", description: "Elliptical galaxy" },
    { name: "M85", ra: 187.47, dec: 25.45, mag: 9.1, type: "galaxy", constellation: "Coma Berenices", description: "Lenticular galaxy" },
    { name: "M86", ra: 184.90, dec: 12.94, mag: 8.9, type: "galaxy", constellation: "Virgo", description: "Elliptical galaxy" },
    { name: "M87", ra: 187.71, dec: 12.39, mag: 8.6, type: "galaxy", constellation: "Virgo", description: "Virgo A - giant elliptical" },
    { name: "M88", ra: 188.38, dec: 14.43, mag: 9.6, type: "galaxy", constellation: "Coma Berenices", description: "Spiral galaxy" },
    { name: "M91", ra: 191.55, dec: 14.50, mag: 10.2, type: "galaxy", constellation: "Coma Berenices", description: "Spiral galaxy" },
    { name: "M97", ra: 150.98, dec: 55.01, mag: 9.9, type: "planetary_nebula", constellation: "Ursa Major", description: "Owl Nebula" },
    { name: "M101", ra: 210.80, dec: 54.35, mag: 7.9, type: "galaxy", constellation: "Ursa Major", description: "Pinwheel Galaxy - spiral" },
    { name: "M104", ra: 189.86, dec: -11.62, mag: 8.0, type: "galaxy", constellation: "Virgo", description: "Sombrero Galaxy - edge-on" },
    { name: "M106", ra: 168.07, dec: 47.30, mag: 8.4, type: "galaxy", constellation: "Canes Venatici", description: "Active Seyfert galaxy" }
  ],
  planets: [
    { name: "Mercury", type: "terrestrial", mag_range: [-2.5, 5.5], size: 3874, description: "Smallest planet, closest to Sun" },
    { name: "Venus", type: "terrestrial", mag_range: [-4.7, -3.0], size: 12104, description: "Brightest planet, morning/evening star" },
    { name: "Mars", type: "terrestrial", mag_range: [-2.9, 1.6], size: 6779, description: "Red planet, rusty iron oxide surface" },
    { name: "Jupiter", type: "gas_giant", mag_range: [-2.9, -1.6], size: 139820, description: "Largest planet, Great Red Spot" },
    { name: "Saturn", type: "gas_giant", mag_range: [1.2, 0.2], size: 116460, description: "Ringed planet, spectacular through telescopes" },
    { name: "Uranus", type: "ice_giant", mag_range: [5.9, 6.0], size: 50724, description: "Ice giant, rotates on its side" },
    { name: "Neptune", type: "ice_giant", mag_range: [7.8, 8.0], size: 49244, description: "Windy ice giant, deep blue color" }
  ],
  constellations: [
    { name: "Orion", abbr: "Ori", ra: 83, dec: 5, area: 1948, bright_stars: ["Betelgeuse", "Rigel", "Alnitak"], messier: ["M42", "M43"] },
    { name: "Ursa Major", abbr: "UMa", ra: 150, dec: 60, area: 1280, bright_stars: ["Mizar", "Dubhe", "Merak"], messier: ["M81", "M82", "M97", "M101"] },
    { name: "Ursa Minor", abbr: "UMi", ra: 210, dec: 80, area: 256, bright_stars: ["Polaris"], messier: [] },
    { name: "Cygnus", abbr: "Cyg", ra: 305, dec: 45, area: 804, bright_stars: ["Deneb", "Albireo"], messier: ["M39"] },
    { name: "Lyra", abbr: "Lyr", ra: 283, dec: 40, area: 286, bright_stars: ["Vega"], messier: ["M57"] },
    { name: "Aquila", abbr: "Aql", ra: 297, dec: 5, area: 652, bright_stars: ["Altair"], messier: [] },
    { name: "Sagittarius", abbr: "Sgr", ra: 270, dec: -25, area: 867, bright_stars: ["Kaus Australis"], messier: ["M8", "M17", "M20", "M21", "M22"] },
    { name: "Scorpius", abbr: "Sco", ra: 245, dec: -30, area: 737, bright_stars: ["Antares"], messier: ["M4", "M6", "M7"] },
    { name: "Virgo", abbr: "Vir", ra: 180, dec: 0, area: 1294, bright_stars: ["Spica"], messier: ["M84", "M86", "M87", "M104"] },
    { name: "Leo", abbr: "Leo", ra: 150, dec: 15, area: 947, bright_stars: ["Regulus"], messier: ["M65", "M66"] },
    { name: "Taurus", abbr: "Tau", ra: 70, dec: 15, area: 797, bright_stars: ["Aldebaran"], messier: ["M1", "M45"] },
    { name: "Gemini", abbr: "Gem", ra: 110, dec: 25, area: 514, bright_stars: ["Castor", "Pollux"], messier: ["M35"] },
    { name: "Auriga", abbr: "Aur", ra: 80, dec: 40, area: 657, bright_stars: ["Capella"], messier: ["M37"] },
    { name: "Andromeda", abbr: "And", ra: 10, dec: 40, area: 722, bright_stars: ["Alpheratz"], messier: ["M31"] },
    { name: "Canes Venatici", abbr: "CVn", ra: 190, dec: 45, area: 465, bright_stars: ["Cor Caroli"], messier: ["M3", "M51", "M63", "M106"] },
    { name: "Hercules", abbr: "Her", ra: 250, dec: 35, area: 1225, bright_stars: ["Rasalgethi"], messier: ["M13"] },
    { name: "Aquarius", abbr: "Aqr", ra: 330, dec: -10, area: 980, bright_stars: ["Sadalmelik"], messier: ["M2"] },
    { name: "Pegasus", abbr: "Peg", ra: 0, dec: 20, area: 1121, bright_stars: ["Alpheratz", "Markab"], messier: ["M15"] },
    { name: "Perseus", abbr: "Per", ra: 48, dec: 50, area: 615, bright_stars: ["Mirfak"], messier: ["M76"] },
    { name: "Cassiopeia", abbr: "Cas", ra: 10, dec: 60, area: 598, bright_stars: ["Schedar"], messier: [] }
  ]
};

// Helper function to get observable objects for a given location/time
export function getObservableObjects(lat, lon, date, minAltitude = 10) {
  // Filter objects with reasonable visibility at given location/time
  return catalog.messier.filter(m => {
    // Simple check: declination within visible range for latitude
    const maxDec = lat + 90;
    const minDec = lat - 90;
    return m.dec <= maxDec && m.dec >= minDec;
  });
}

// Helper to search across all object types
export function searchCatalog(query) {
  const results = [];
  const q = query.toLowerCase();

  catalog.stars.forEach(s => {
    if (s.name.toLowerCase().includes(q)) results.push({ ...s, type: 'star' });
  });

  catalog.messier.forEach(m => {
    if (m.name.toLowerCase().includes(q) || m.constellation.toLowerCase().includes(q)) {
      results.push({ ...m, type: 'messier' });
    }
  });

  catalog.planets.forEach(p => {
    if (p.name.toLowerCase().includes(q)) results.push({ ...p, type: 'planet' });
  });

  catalog.constellations.forEach(c => {
    if (c.name.toLowerCase().includes(q) || c.abbr.toLowerCase().includes(q)) {
      results.push({ ...c, type: 'constellation' });
    }
  });

  return results;
}