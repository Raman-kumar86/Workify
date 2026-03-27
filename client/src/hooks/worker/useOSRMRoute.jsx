/**
 * useOSRMRoute — manages the expected OSRM route for the worker's navigation.
 *
 * Usage:
 *   const { routeCoords, distanceKm, durationMin, eta, isDeviated,
 *           deviationCount, isLoading, fetchRoute, checkDeviation } = useOSRMRoute();
 *
 * Call fetchRoute(workerCoords, destination) when the worker presses "Navigate".
 * Call checkDeviation(workerCoords, speed) every GPS update to detect off-route.
 */

import { useState, useCallback, useRef } from "react";
import {
  fetchOSRMRoute,
  distanceToPolyline,
  remainingPolylineKm,
} from "../../utils/osrm";

/** Threshold in km to flag deviation (100 m) */
const DEVIATION_THRESHOLD_KM = 0.1;

/** Minimum seconds between automatic re-fetches (30 s) */
const RECALC_COOLDOWN_MS = 30_000;

export default function useOSRMRoute() {
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const [eta, setEta] = useState(null);           // ETA in minutes from now
  const [isDeviated, setIsDeviated] = useState(false);
  const [deviationCount, setDeviationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store the latest route coords in a ref so checkDeviation can read them
  // without stale-closure issues
  const routeCoordsRef = useRef([]);
  const lastRecalcRef = useRef(0);
  const destinationRef = useRef(null);

  // ── fetchRoute ──────────────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (workerCoords, destination) => {
    if (!workerCoords || !destination) return;
    destinationRef.current = destination;
    setIsLoading(true);
    setError(null);
    setIsDeviated(false);
    try {
      const result = await fetchOSRMRoute(
        workerCoords.lat, workerCoords.lng,
        destination.lat, destination.lng
      );
      setRouteCoords(result.coords);
      routeCoordsRef.current = result.coords;
      setDistanceKm(parseFloat(result.distanceKm.toFixed(2)));
      setDurationMin(parseFloat(result.durationMin.toFixed(1)));
      // Initial ETA = durationMin → refine on each GPS update
      setEta(parseFloat(result.durationMin.toFixed(1)));
    } catch (err) {
      console.error("[OSRM] fetchRoute error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── checkDeviation ──────────────────────────────────────────────────────────
  /**
   * Call this on every GPS update.
   * @param {Object} workerCoords  { lat, lng }
   * @param {number} speed         km/h (used for ETA refinement)
   */
  const checkDeviation = useCallback(async (workerCoords, speed = 0) => {
    const coords = routeCoordsRef.current;
    if (!workerCoords || coords.length < 2) return;

    const { lat, lng } = workerCoords;

    // ── ETA refinement (speed-based or remaining-polyline-based) ───────────
    const remaining = remainingPolylineKm(lat, lng, coords);
    if (remaining !== null) {
      // Method A: remaining distance / current speed
      // Method B: fallback to remaining / assumed 20 km/h average
      const effectiveSpeed = speed > 2 ? speed : 20;
      const etaMin = (remaining / effectiveSpeed) * 60;
      setEta(parseFloat(etaMin.toFixed(1)));
    }

    // ── Deviation detection ─────────────────────────────────────────────────
    const offRouteKm = distanceToPolyline(lat, lng, coords);
    const deviated = offRouteKm > DEVIATION_THRESHOLD_KM;

    setIsDeviated(deviated);

    if (deviated) {
      const now = Date.now();
      if (now - lastRecalcRef.current > RECALC_COOLDOWN_MS && destinationRef.current) {
        lastRecalcRef.current = now;
        setDeviationCount((c) => c + 1);
        console.log(`[OSRM] Deviation detected (${(offRouteKm * 1000).toFixed(0)} m). Recalculating…`);
        // Recalculate without disrupting displayed route until new one arrives
        try {
          const result = await fetchOSRMRoute(
            lat, lng,
            destinationRef.current.lat, destinationRef.current.lng
          );
          setRouteCoords(result.coords);
          routeCoordsRef.current = result.coords;
          setIsDeviated(false);
        } catch {
          // Keep old route on recalc failure — user stays navigating
        }
      }
    }
  }, []);

  return {
    routeCoords,
    distanceKm,
    durationMin,
    eta,
    isDeviated,
    deviationCount,
    isLoading,
    error,
    fetchRoute,
    checkDeviation,
  };
}
