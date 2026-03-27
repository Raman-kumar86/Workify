import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLiveTracking,
  clearLiveTracking,
} from "../../redux/slices/userSlice.jsx";
import { useSocket } from "../../context/SocketContext";

/* Haversine distance in km */
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

/**
 * useLiveTracking
 *
 * Subscribes to the Socket.IO `live_location_update` event for a given task.
 * All state is stored in Redux under state.user.liveTracking.
 *
 * @param {{ taskId, destination: { lat, lng } } | null} options
 */
const useLiveTracking = (options) => {
  const { socket } = useSocket();
  const { taskId, destination } = options || {};
  const dispatch = useDispatch();

  /* Read tracking state from Redux.
     Also subscribe to socketConnected so the effect re-runs when the
     socket connects (e.g. after a page refresh restores the token). */
  const liveTracking = useSelector((state) => state.user.liveTracking);
  // eslint-disable-next-line no-unused-vars
  const socketConnected = useSelector((state) => state.user.socketConnected);

  const handleUpdate = useCallback(
    (data) => {
      if (data.taskId !== taskId) return;

      const { lat, lng } = data;

      dispatch(
        setLiveTracking({
          workerCoords: { lat, lng },
          speed: data.speed ?? 0,
          bearing: data.bearing ?? 0,
          hasArrived: data.hasArrived ?? false,
        })
      );

      /* Compute distance locally if destination is known */
      if (destination) {
        const d = haversineKm(lat, lng, destination.lat, destination.lng);
        dispatch(setLiveTracking({ distanceKm: parseFloat(d.toFixed(3)) }));
      } else if (data.distanceKm != null) {
        dispatch(setLiveTracking({ distanceKm: data.distanceKm }));
      }
    },
    [taskId, destination, dispatch]
  );

  useEffect(() => {
    if (!socket || !taskId) return;
    socket.on("live_location_update", handleUpdate);
    return () => socket.off("live_location_update", handleUpdate);
  }, [socket, taskId, handleUpdate]);

  /* Reset when taskId changes */
  useEffect(() => {
    dispatch(clearLiveTracking());
  }, [taskId, dispatch]);

  /* Return from Redux so any component can read without prop drilling */
  return liveTracking;
};

export default useLiveTracking;
