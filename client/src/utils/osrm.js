/**
 * OSRM Utility — Free, open-source routing using the public OSRM demo server.
 *
 * For production: replace OSRM_BASE with your self-hosted OSRM instance.
 *
 * All functions are pure (no React hooks) — safe to call from anywhere.
 */

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

// ─── Polyline decoder ────────────────────────────────────────────────────────
// Decodes a Google-encoded polyline string into [[lat, lng], ...] pairs.
export function decodePolyline(encoded) {
  const coords = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}

// ─── Haversine distance (km) between two points ──────────────────────────────
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Shortest distance (km) from point P to line segment AB ─────────────────
function pointToSegmentKm(pLat, pLng, aLat, aLng, bLat, bLng) {
  const dx = bLat - aLat;
  const dy = bLng - aLng;
  if (dx === 0 && dy === 0) return haversineKm(pLat, pLng, aLat, aLng);
  const t = Math.max(
    0,
    Math.min(1, ((pLat - aLat) * dx + (pLng - aLng) * dy) / (dx * dx + dy * dy))
  );
  return haversineKm(pLat, pLng, aLat + t * dx, aLng + t * dy);
}

// ─── Shortest distance (km) from GPS point to any segment of a polyline ──────
export function distanceToPolyline(lat, lng, coords) {
  if (!coords || coords.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentKm(lat, lng, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    if (d < min) min = d;
  }
  return min;
}

// ─── Remaining polyline distance from nearest point onwards (km) ─────────────
export function remainingPolylineKm(lat, lng, coords) {
  if (!coords || coords.length < 2) return null;

  // Find the index of the nearest segment start
  let nearestIdx = 0;
  let minDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentKm(lat, lng, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
    if (d < minDist) {
      minDist = d;
      nearestIdx = i;
    }
  }

  // Sum up polyline distance from nearestIdx to end
  let total = 0;
  for (let i = nearestIdx; i < coords.length - 1; i++) {
    total += haversineKm(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  return total;
}

// ─── Fetch an OSRM driving route ─────────────────────────────────────────────
/**
 * Calls the public OSRM demo server and returns:
 * {
 *   coords       : [[lat, lng], ...]   ← decoded polyline, ready for Leaflet
 *   distanceKm   : number
 *   durationMin  : number
 *   encodedPolyline : string           ← raw for storage
 * }
 *
 * Throws on network error or no route found.
 */
export async function fetchOSRMRoute(workerLat, workerLng, destLat, destLng) {
  const url =
    `${OSRM_BASE}/${workerLng},${workerLat};${destLng},${destLat}` +
    `?overview=full&geometries=polyline`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM fetch failed: ${res.status}`);

  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error("No route found by OSRM");
  }

  const route = data.routes[0];
  const encodedPolyline = route.geometry;
  const coords = decodePolyline(encodedPolyline);
  const distanceKm = route.distance / 1000;
  const durationMin = route.duration / 60;

  return { coords, distanceKm, durationMin, encodedPolyline };
}
