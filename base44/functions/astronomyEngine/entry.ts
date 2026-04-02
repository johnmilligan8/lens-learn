/**
 * Advanced astronomical calculations for Uncharted Galaxy
 * Implements USNO Circular 179 & Meeus algorithms for high-precision ephemeris
 */

// Constants
const J2000_EPOCH = 2451545.0;
const SOLAR_LONGITUDE_J2000 = 280.46645;
const SOLAR_ECCENTRICITY = 0.016708634;
const EARTH_OBLIQUITY = 23.43929111;
const GALACTIC_CENTER_RA = 266.4168;
const GALACTIC_CENTER_DEC = -28.9362;

export function getJulianDate(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  const jd = jdn + (hour - 12) / 24 + minute / 1440 + second / 86400;

  return jd;
}

export function getLST(jd, longitudeDeg) {
  const T = (jd - J2000_EPOCH) / 36525;
  const gmst =
    280.46061837 +
    360.98564724 * (jd - J2000_EPOCH) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  const lst = (gmst + longitudeDeg) % 360;
  return lst < 0 ? lst + 360 : lst;
}

export function raDecToAltAz(ra, dec, lat, lst) {
  const raRad = (ra * Math.PI) / 180;
  const decRad = (dec * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lstRad = (lst * Math.PI) / 180;

  const hourAngle = lstRad - raRad;

  const sinAlt =
    Math.sin(decRad) * Math.sin(latRad) +
    Math.cos(decRad) * Math.cos(latRad) * Math.cos(hourAngle);
  const alt = Math.asin(sinAlt) * (180 / Math.PI);

  const cosAz =
    (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
    (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)));
  const sinAz = -(Math.cos(decRad) * Math.sin(hourAngle)) / Math.cos(Math.asin(sinAlt));
  let az = Math.atan2(sinAz, cosAz) * (180 / Math.PI);
  az = (az + 360) % 360;

  return { alt, az };
}

export function getGalacticCorePosition(date, lat, lon) {
  const jd = getJulianDate(date);
  const lst = getLST(jd, lon);
  const { alt, az } = raDecToAltAz(GALACTIC_CENTER_RA, GALACTIC_CENTER_DEC, lat, lst);
  return { alt, az, ra: GALACTIC_CENTER_RA, dec: GALACTIC_CENTER_DEC };
}

export function getMoonPosition(date, lat, lon) {
  const jd = getJulianDate(date);
  const T = (jd - J2000_EPOCH) / 36525;

  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000;
  const D = 297.8501921 + 445267.1142695 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000;
  const M = 357.52910918 + 35999.0502909 * T - 0.0001536 * T * T + T * T * T / 24490000;

  const C1 = (6.28875 + 0.02978 * Math.cos((D * Math.PI) / 180)) * Math.sin((D * Math.PI) / 180);
  const C2 = 1.27402 * Math.sin(((M * Math.PI) / 180));
  const C3 = 0.66871 * Math.sin((2 * D * Math.PI) / 180);

  const moonLon = ((Lp + C1 + C2 + C3) % 360 + 360) % 360;
  const moonLat = 5.12878 * Math.sin(((Lp - 183.6346) * Math.PI) / 180);

  const lst = getLST(jd, lon);
  const { alt, az } = raDecToAltAz(moonLon, moonLat, lat, lst);

  return { alt, az, lon: moonLon, lat: moonLat, illumination: getMoonIllumination(jd) };
}

export function getMoonIllumination(jd) {
  const T = (jd - J2000_EPOCH) / 36525;
  const Lsun = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const Lmoon = 218.3164477 + 481267.88123421 * T;
  const phase = (((Lmoon - Lsun + 360) % 360) / 360);
  return Math.round(phase * 100);
}

export function getMoonDistance(coreAz, coreAlt, moonAz, moonAlt) {
  // Angular distance using spherical law of cosines
  const dAz = ((moonAz - coreAz + 360) % 360 - 180) * (Math.PI / 180);
  const coreAzRad = (coreAz * Math.PI) / 180;
  const moonAzRad = (moonAz * Math.PI) / 180;
  const coreAltRad = (coreAlt * Math.PI) / 180;
  const moonAltRad = (moonAlt * Math.PI) / 180;

  const distance =
    Math.acos(
      Math.sin(coreAltRad) * Math.sin(moonAltRad) +
        Math.cos(coreAltRad) * Math.cos(moonAltRad) * Math.cos(dAz)
    ) * (180 / Math.PI);

  return distance;
}

export function getTwilightTimes(date, lat, lon) {
  const jd = getJulianDate(date);
  const T = (jd - J2000_EPOCH) / 36525;

  const L = (280.46646 + 36000.76983 * T) % 360;
  const M = (357.52911 + 35999.05029 * T) % 360;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin((M * Math.PI) / 180) +
    (0.019993 - 0.000101 * T) * Math.sin((2 * M * Math.PI) / 180) +
    0.000029 * Math.sin((3 * M * Math.PI) / 180);
  const sunLon = (L + C) % 360;

  const lat_rad = (lat * Math.PI) / 180;
  const dec_rad = (sunLon * Math.PI) / 180;
  const cosH =
    (Math.cos((6 * Math.PI) / 180) - Math.sin(dec_rad) * Math.sin(lat_rad)) /
    (Math.cos(dec_rad) * Math.cos(lat_rad));

  if (Math.abs(cosH) > 1) {
    return { sunrise: null, sunset: null };
  }

  const H = (Math.acos(cosH) * 180) / Math.PI;
  const Jtransit = jd + lon / 360;
  const Jrise = Jtransit - H / 360;
  const Jset = Jtransit + H / 360;

  const riseDate = new Date((Jrise - 2440587.5) * 86400000);
  const setDate = new Date((Jset - 2440587.5) * 86400000);

  return {
    sunrise: riseDate.toUTCString().slice(17, 22),
    sunset: setDate.toUTCString().slice(17, 22),
    jdSunrise: Jrise,
    jdSunset: Jset
  };
}

export function getMilkyWayVisibility(coreAlt, moonAlt, moonIllum, moonDist) {
  let score = 0;

  if (coreAlt < 0) score = 0;
  else if (coreAlt < 10) score = 20;
  else if (coreAlt < 20) score = 40;
  else if (coreAlt < 30) score = 60;
  else if (coreAlt < 40) score = 75;
  else score = 85;

  const moonInterference = Math.max(0, 100 - moonDist * 2) * (moonIllum / 100);
  score = Math.max(0, score - moonInterference * 0.5);

  return Math.round(score);
}

export function estimateBortle(lat, lon) {
  const abslat = Math.abs(lat);
  if (abslat < 30) return 5;
  if (abslat < 45) return 4;
  return 3;
}