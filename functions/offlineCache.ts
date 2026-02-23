/**
 * Offline Cache — uses localStorage with TTL and versioning.
 * Keys are prefixed with "ug_cache_" to avoid collisions.
 */

const PREFIX = 'ug_cache_';
const VERSION = 1;

function key(name) {
  return `${PREFIX}v${VERSION}_${name}`;
}

export function cacheSet(name, data) {
  try {
    const payload = { data, ts: Date.now() };
    localStorage.setItem(key(name), JSON.stringify(payload));
    return true;
  } catch (e) {
    // Storage full or unavailable
    return false;
  }
}

/**
 * Get cached data. Returns null if missing or older than maxAgeMs.
 * Default maxAge: 24 hours.
 */
export function cacheGet(name, maxAgeMs = 24 * 60 * 60 * 1000) {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > maxAgeMs) return null;
    return data;
  } catch {
    return null;
  }
}

export function cacheDelete(name) {
  localStorage.removeItem(key(name));
}

/** Return all ug_cache_ keys with metadata */
export function cacheList() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith(PREFIX)) continue;
    try {
      const { ts, data } = JSON.parse(localStorage.getItem(k));
      const bytes = (localStorage.getItem(k) || '').length * 2; // UTF-16
      entries.push({ key: k, name: k.replace(`${PREFIX}v${VERSION}_`, ''), ts, bytes });
    } catch {}
  }
  return entries;
}

/** Total bytes used by the cache */
export function cacheTotalBytes() {
  return cacheList().reduce((s, e) => s + e.bytes, 0);
}

/** Clear all ug_cache_ entries */
export function cacheClearAll() {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) toRemove.push(k);
  }
  toRemove.forEach(k => localStorage.removeItem(k));
  return toRemove.length;
}

// ─── Ephemeris helpers ────────────────────────────────────────────────────────

/** Cache a day's ephemeris data (moon phase, sun/moon rise/set, DSO visibility) */
export async function getEphemerisWithCache(date, lat, lon, computeFn) {
  const cacheKey = `ephemeris_${date}_${lat?.toFixed(2)}_${lon?.toFixed(2)}`;
  const cached = cacheGet(cacheKey, 48 * 60 * 60 * 1000); // 48h TTL
  if (cached) return { data: cached, fromCache: true };
  const data = await computeFn();
  cacheSet(cacheKey, data);
  return { data, fromCache: false };
}

/** Cache aurora/NOAA KP forecast */
export async function getAuroraWithCache(fetchFn) {
  const cacheKey = `aurora_noaa_${new Date().toISOString().slice(0, 10)}`;
  const cached = cacheGet(cacheKey, 3 * 60 * 60 * 1000); // 3h TTL
  if (cached) return { data: cached, fromCache: true };
  const data = await fetchFn();
  cacheSet(cacheKey, data);
  return { data, fromCache: false };
}

/** Cache Open-Meteo cloud cover forecast for a location */
export async function getWeatherWithCache(lat, lon, fetchFn) {
  const cacheKey = `weather_${lat?.toFixed(2)}_${lon?.toFixed(2)}_${new Date().toISOString().slice(0, 10)}`;
  const cached = cacheGet(cacheKey, 6 * 60 * 60 * 1000); // 6h TTL
  if (cached) return { data: cached, fromCache: true };
  const data = await fetchFn();
  cacheSet(cacheKey, data);
  return { data, fromCache: false };
}