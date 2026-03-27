import jwt from "jsonwebtoken";
import Worker from "../modal/Worker.model.js";
import Task from "../modal/user/Task.model.js";

let _io = null;

/** Export the io instance so controllers can emit events */
export const getIO = () => {
  if (!_io) throw new Error("Socket.IO has not been initialised yet");
  return _io;
};

/* ─────────────────────────────────────────────
   Haversine distance helper (returns km)
───────────────────────────────────────────── */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ─────────────────────────────────────────────
   Bearing in degrees (0 = North, CW positive)
───────────────────────────────────────────── */
const calcBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const rlat1 = (lat1 * Math.PI) / 180;
  const rlat2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(rlat2);
  const x =
    Math.cos(rlat1) * Math.sin(rlat2) -
    Math.sin(rlat1) * Math.cos(rlat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

/* ─────────────────────────────────────────────
   Initialise Socket.IO server
───────────────────────────────────────────── */
export const initSocketServer = (io) => {
  _io = io;

  /* ---------- JWT auth middleware ---------- */
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) return next(new Error("Authentication token missing"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded._id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  /* ---------- Per-socket rate-limit tracker ---------- */
  const lastUpdateAt = new Map(); // socketId → timestamp

  io.on("connection", (socket) => {
    const userId = socket.userId;
    // console.log(`[Socket] Connected: userId=${userId} socket=${socket.id}`);

    /* Auto-join the user's own room (for receiving live_location_update) */
    socket.join(`user:${userId}`);

    /* ── worker_location_update ───────────────────────────────── */
    socket.on("worker_location_update", async (payload) => {
      try {
        const { taskId, lat, lng } = payload || {};

        /* Basic validation */
        if (!taskId || lat == null || lng == null) {
          return socket.emit("error", { message: "Invalid payload" });
        }

        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lng);

        if (
          isNaN(parsedLat) ||
          isNaN(parsedLng) ||
          parsedLat < -90 ||
          parsedLat > 90 ||
          parsedLng < -180 ||
          parsedLng > 180
        ) {
          return socket.emit("error", { message: "Invalid coordinates" });
        }

        /* Rate-limit: max 1 update per 4 seconds per socket */
        const now = Date.now();
        const last = lastUpdateAt.get(socket.id) || 0;
        if (now - last < 4000) return;
        lastUpdateAt.set(socket.id, now);

        /* Find worker by userId */
        const worker = await Worker.findOne({ userId });
        if (!worker) return;

        /* GPS noise filter: reject jumps > ~360 km/h (unrealistic) */
        if (worker.workerLocation?.lat != null) {
          const prevLat = worker.workerLocation.lat;
          const prevLng = worker.workerLocation.lng;
          const prevTime = new Date(worker.workerLocation.updatedAt).getTime();
          const deltaKm = haversine(prevLat, prevLng, parsedLat, parsedLng);
          const deltaHr = (now - prevTime) / 3600000;
          const speedKmH = deltaHr > 0 ? deltaKm / deltaHr : 0;

          if (speedKmH > 360) {
            console.warn(
              `[Socket] GPS noise filtered for worker ${worker._id}: ${speedKmH.toFixed(0)} km/h`
            );
            return;
          }

          /* Compute speed and bearing */
          const bearing = calcBearing(prevLat, prevLng, parsedLat, parsedLng);
          worker.currentSpeed = Math.round(speedKmH);
          worker.currentBearing = Math.round(bearing);
        }

        /* Update workerLocation only */
        worker.workerLocation = { lat: parsedLat, lng: parsedLng, updatedAt: new Date() };
        worker.lastSeenAt = new Date();

        await worker.save();

        /* Find the task to get the destination and task owner */
        const task = await Task.findById(taskId).lean();
        if (!task) return;

        /* Distance to destination */
        let distanceKm = null;
        if (task.location?.coordinates?.length === 2) {
          const [destLng, destLat] = task.location.coordinates;
          distanceKm = haversine(parsedLat, parsedLng, destLat, destLng);
        }

        /* Emit to user's room */
        const updatePayload = {
          taskId,
          workerId: worker._id,
          lat: parsedLat,
          lng: parsedLng,
          speed: worker.currentSpeed,
          bearing: worker.currentBearing,
          distanceKm: distanceKm ? parseFloat(distanceKm.toFixed(3)) : null,
          timestamp: now,
        };

        io.to(`user:${task.userId.toString()}`).emit(
          "live_location_update",
          updatePayload
        );

        /* Also echo back to the worker socket (for their own map) */
        socket.emit("location_ack", updatePayload);
      } catch (err) {
        console.error("[Socket] worker_location_update error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      lastUpdateAt.delete(socket.id);
    });
  });
};
