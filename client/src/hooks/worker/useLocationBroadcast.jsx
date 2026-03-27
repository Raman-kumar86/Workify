import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setWorkerTracking,
  clearWorkerTracking,
} from "../../redux/slices/userSlice.jsx";
import { useSocket } from "../../context/SocketContext";
import axiosInstance from "../../api/axios.jsx";

/* ── Haversine ─────────────────────────────────── */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ── Bearing ───────────────────────────────────── */
const calcBearing = (lat1, lng1, lat2, lng2) => {
  const dL = ((lng2 - lng1) * Math.PI) / 180;
  const rl1 = (lat1 * Math.PI) / 180;
  const rl2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dL) * Math.cos(rl2);
  const x =
    Math.cos(rl1) * Math.sin(rl2) - Math.sin(rl1) * Math.cos(rl2) * Math.cos(dL);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

/* ── Bearing → compass label ───────────────────── */
export const bearingToLabel = (deg) => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
  return dirs[Math.round(deg / 45)];
};

/**
 * useLocationBroadcast
 *
 * When taskId is provided, starts watchPosition and emits
 * worker_location_update via socket (with HTTP fallback).
 * All state is stored in Redux under state.user.workerTracking.
 *
 * @param {string|null} taskId
 */
const useLocationBroadcast = (taskId) => {
  const { socket } = useSocket();
  const dispatch = useDispatch();

  /* Read tracking state from Redux */
  const workerTracking = useSelector((state) => state.user.workerTracking);

  const prevRef = useRef(null); // { lat, lng, ts }
  const watchIdRef = useRef(null);
  const lastEmitRef = useRef(0);
  const INTERVAL_MS = 4000;

  const emit = useCallback(
    async (lat, lng) => {
      if (!taskId) return;
      const now = Date.now();
      if (now - lastEmitRef.current < INTERVAL_MS) return;
      lastEmitRef.current = now;

      /* Compute speed & bearing from consecutive positions */
      let speed = 0;
      let bearing = 0;
      if (prevRef.current) {
        const { lat: pLat, lng: pLng, ts: pTs } = prevRef.current;
        const deltaKm = haversineKm(pLat, pLng, lat, lng);
        const deltaHr = (now - pTs) / 3_600_000;
        speed = deltaHr > 0 ? Math.round(deltaKm / deltaHr) : 0;
        bearing = Math.round(calcBearing(pLat, pLng, lat, lng));
      }
      prevRef.current = { lat, lng, ts: now };

      /* Update Redux tracking state */
      dispatch(
        setWorkerTracking({
          isTracking: true,
          speed,
          bearing,
          workerCoords: { lat, lng },
        })
      );

      /* Try socket first */
      if (socket?.connected) {
        socket.emit("worker_location_update", { taskId, lat, lng, timestamp: now });
      } else {
        /* HTTP fallback — axiosInstance uses VITE_API_URL + Redux token */
        try {
          await axiosInstance.post(`/api/worker/tasks/${taskId}/location`, { lat, lng });
        } catch (err) {
          console.warn("[Location] HTTP fallback failed:", err.message);
        }
      }
    },
    [taskId, socket, dispatch]
  );

  useEffect(() => {
    if (!taskId) {
      dispatch(clearWorkerTracking());
      return;
    }

    if (!navigator.geolocation) {
      console.warn("[Location] Geolocation not supported");
      return;
    }

    dispatch(clearWorkerTracking());
    dispatch(setWorkerTracking({ isTracking: true }));
    prevRef.current = null;

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        emit(coords.latitude, coords.longitude);
      },
      (err) => console.warn("[Location] watchPosition error:", err.message),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      dispatch(setWorkerTracking({ isTracking: false }));
    };
  }, [taskId, emit, dispatch]);

  /* Return from Redux so any component can read without prop drilling */
  return workerTracking;
};

export default useLocationBroadcast;

