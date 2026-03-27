import React, { useEffect, useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, Navigation, Zap, Compass, Clock, AlertTriangle, RefreshCw, Route } from "lucide-react";
import { BiSolidNavigation } from "react-icons/bi";
import { bearingToLabel } from "../../hooks/worker/useLocationBroadcast";
import useOSRMRoute from "../../hooks/worker/useOSRMRoute";

/* ── Haversine (km) ─────────────────────────────── */
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

/* ── Auto-pan the Leaflet map to follow worker ─── */
const MapFollower = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.panTo(center, { animate: true, duration: 0.6 });
  }, [center, map]);
  return null;
};

/* ── Rotating BiSolidNavigation icon ───────────── */
const makeArrowIcon = (bearing) => {
  const svg = renderToStaticMarkup(
    <BiSolidNavigation style={{ color: "#F97316", width: 28, height: 28 }} />
  );
  return L.divIcon({
    html: `<div style="
      transform: rotate(${bearing}deg);
      transform-origin: center;
      display: flex; align-items: center; justify-content: center;
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
      width: 28px; height: 28px;
    ">${svg}</div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

/* ── Red pulsing destination icon ───────────────── */
const destIcon = L.divIcon({
  html: `
    <div style="position:relative;width:28px;height:28px">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:#EF4444;opacity:0.25;
        animation:pulse 1.5s ease-in-out infinite;
      "></div>
      <div style="position:absolute;inset:5px;border-radius:50%;background:#EF4444;"></div>
      <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.8)}}</style>
    </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/* ── Deviation icon: pulsing ring + BiSolidNavigation ── */
const makeDeviatedIcon = (bearing) => {
  const svg = renderToStaticMarkup(
    <BiSolidNavigation style={{ color: "#F97316", width: 28, height: 28 }} />
  );
  return L.divIcon({
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:#F97316;opacity:0.18;
          animation:devPulse 1s ease-in-out infinite;
        "></div>
        <div style="
          transform: rotate(${bearing}deg);
          transform-origin: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
          position:relative;z-index:1;
          display:flex;align-items:center;justify-content:center;
          width:28px;height:28px;
        ">${svg}</div>
        <style>@keyframes devPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.55)}}</style>
      </div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

/**
 * WorkerNavigationMap — Full-screen navigation overlay.
 *
 * Now uses OSRM for real road-snapped expected route, live ETA,
 * deviation detection, and automatic route recalculation.
 *
 * Props:
 *  task         — active task object (must have task.location.coordinates [lng, lat])
 *  workerCoords — { lat, lng } current GPS position
 *  speed        — number (km/h)
 *  bearing      — number (degrees)
 *  isTracking   — bool
 *  onClose      — () => void
 */
const WorkerNavigationMap = ({
  task,
  workerCoords,
  speed,
  bearing,
  isTracking,
  onClose,
}) => {
  const [routeFetched, setRouteFetched] = useState(false);

  /* Destination from task */
  const destination = useMemo(() => {
    if (!task?.location?.coordinates?.length) return null;
    const [lng, lat] = task.location.coordinates;
    return { lat, lng };
  }, [task]);

  /* OSRM route hook */
  const {
    routeCoords,
    distanceKm: routeDistKm,
    durationMin,
    eta,
    isDeviated,
    deviationCount,
    isLoading: routeLoading,
    fetchRoute,
    checkDeviation,
  } = useOSRMRoute();

  /* Fetch route once when worker coordinates become available */
  useEffect(() => {
    if (workerCoords && destination && !routeFetched) {
      setRouteFetched(true);
      fetchRoute(workerCoords, destination);
    }
  }, [workerCoords, destination, routeFetched, fetchRoute]);

  /* Check deviation on every GPS update */
  useEffect(() => {
    if (workerCoords && routeCoords.length > 0) {
      checkDeviation(workerCoords, speed);
    }
  }, [workerCoords, speed, routeCoords, checkDeviation]);

  /* Straight-line distance to destination (haversine) */
  const distanceKm = useMemo(() => {
    if (!workerCoords || !destination) return null;
    return haversineKm(workerCoords.lat, workerCoords.lng, destination.lat, destination.lng);
  }, [workerCoords, destination]);

  const hasArrived = distanceKm !== null && distanceKm < 0.05;

  const center = workerCoords
    ? [workerCoords.lat, workerCoords.lng]
    : destination
      ? [destination.lat, destination.lng]
      : [20.5937, 78.9629];

  const arrowIcon = useMemo(
    () => (isDeviated ? makeDeviatedIcon(bearing) : makeArrowIcon(bearing)),
    [bearing, isDeviated]
  );

  const dirLabel = bearingToLabel(bearing);

  const distDisplay = distanceKm !== null
    ? distanceKm >= 1
      ? `${distanceKm.toFixed(1)} km`
      : `${Math.round(distanceKm * 1000)} m`
    : "--";

  const etaDisplay = eta !== null
    ? eta < 1
      ? `< 1 min`
      : `~${Math.round(eta)} min`
    : durationMin
      ? `~${Math.round(durationMin)} min`
      : "--";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ── Deviation banner ────────────────────── */}
      {isDeviated && (
        <div style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2000,
          background: "rgba(251,146,60,0.95)",
          backdropFilter: "blur(8px)",
          borderRadius: 999,
          padding: "8px 20px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          boxShadow: "0 4px 20px rgba(251,146,60,0.4)",
          border: "1px solid rgba(255,255,255,0.2)",
          animation: "fadeIn 0.3s ease",
        }}>
          <AlertTriangle size={14} color="#fff" />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
            Off Route — Recalculating…
          </span>
          <RefreshCw size={12} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
        </div>
      )}

      {/* ── Top HUD ─────────────────────────────── */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        background: "rgba(10,10,20,0.90)",
        backdropFilter: "blur(14px)",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Task title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>
            Navigating to
          </p>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {task?.title || "Destination"}
          </p>
        </div>

        {/* Metrics row */}
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {/* Speed */}
          <HudStat icon={<Zap size={11} color="#F97316" />} value={speed ?? 0} sub="km/h" color="#F97316" />
          <Divider />
          {/* Compass */}
          <HudStat icon={<Compass size={11} color="#3B82F6" />} value={dirLabel} sub="dir" color="#3B82F6" />
          <Divider />
          {/* Distance remaining */}
          <HudStat icon={<Navigation size={11} color="#22C55E" />} value={distDisplay} sub="away" color="#22C55E" />
          <Divider />
          {/* ETA */}
          <HudStat icon={<Clock size={11} color="#A78BFA" />} value={etaDisplay} sub="ETA" color="#A78BFA" />
          {/* Deviation counter badge */}
          {deviationCount > 0 && (
            <div style={{
              background: "rgba(251,146,60,0.15)",
              border: "1px solid rgba(251,146,60,0.3)",
              borderRadius: 999,
              padding: "3px 8px",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Route size={10} color="#F97316" />
              <span style={{ color: "#F97316", fontWeight: 800, fontSize: 9, letterSpacing: 1 }}>
                {deviationCount}×
              </span>
            </div>
          )}
        </div>

        {/* Close */}
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#fff",
          flexShrink: 0,
        }}>
          <X size={18} />
        </button>
      </div>

      {/* ── OSRM route loading ───────────────────── */}
      {routeLoading && (
        <div style={{
          position: "absolute",
          top: 68, left: "50%", transform: "translateX(-50%)",
          zIndex: 1500,
          background: "rgba(59,130,246,0.9)",
          borderRadius: 999,
          padding: "6px 16px",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <RefreshCw size={12} color="#fff" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Calculating Route…
          </span>
        </div>
      )}

      {/* ── Map ─────────────────────────────────── */}
      <MapContainer center={center} zoom={16} style={{ flex: 1, width: "100%" }} zoomControl={false} attributionControl={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Auto-follow worker */}
        {workerCoords && <MapFollower center={[workerCoords.lat, workerCoords.lng]} />}

        {/* ── Expected road route (OSRM polyline) — Blue solid ── */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: isDeviated ? "#F97316" : "#3B82F6",
              weight: 5,
              opacity: 0.8,
              dashArray: isDeviated ? "8 6" : undefined,
            }}
          />
        )}

        {/* Fallback: dashed straight line while loading */}
        {routeCoords.length < 2 && workerCoords && destination && (
          <Polyline
            positions={[[workerCoords.lat, workerCoords.lng], [destination.lat, destination.lng]]}
            pathOptions={{ color: "#3B82F6", weight: 3, dashArray: "8 6", opacity: 0.5 }}
          />
        )}

        {/* ── Worker arrow marker ── */}
        {workerCoords && (
          <Marker position={[workerCoords.lat, workerCoords.lng]} icon={arrowIcon} />
        )}

        {/* ── Destination ── */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon} />
        )}
      </MapContainer>

      {/* ── Legend ──────────────────────────────── */}
      <div style={{
        position: "absolute", bottom: 80, right: 16, zIndex: 1000,
        background: "rgba(10,10,20,0.82)", backdropFilter: "blur(8px)",
        borderRadius: 12, padding: "10px 14px",
        display: "flex", flexDirection: "column", gap: 6,
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <LegendRow color="#3B82F6" label="Expected Route (OSRM)" />
        {isDeviated && <LegendRow color="#F97316" label="Deviating" dash />}
      </div>

      {/* ── GPS tracking badge ───────────────────── */}
      <div style={{
        position: "absolute", bottom: 24, left: "50%",
        transform: "translateX(-50%)", zIndex: 1000,
        background: isTracking ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
        border: `1px solid ${isTracking ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
        borderRadius: 999, padding: "8px 18px",
        display: "flex", alignItems: "center", gap: 8,
        backdropFilter: "blur(10px)",
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%",
          background: isTracking ? "#22C55E" : "#EF4444",
          boxShadow: isTracking ? "0 0 6px #22C55E" : "0 0 6px #EF4444",
          display: "inline-block",
          animation: isTracking ? "gpsPulse 1.5s ease-in-out infinite" : "none",
        }} />
        <span style={{ color: isTracking ? "#22C55E" : "#EF4444", fontWeight: 700, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
          {isTracking ? "GPS Active" : "GPS Inactive"}
        </span>
        <style>{`@keyframes gpsPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      </div>

      {/* ── Arrived banner ───────────────────────── */}
      {hasArrived && (
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 2000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 24,
            padding: "48px 40px", textAlign: "center",
            maxWidth: 320, boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
            borderTop: "6px solid #22C55E",
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📍</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 900, textTransform: "uppercase", letterSpacing: -1 }}>
              Arrived!
            </h2>
            <p style={{ color: "#6b7280", fontWeight: 600, margin: "0 0 8px", fontSize: 14 }}>
              You are within 50m of the task location.
            </p>
            {deviationCount > 0 && (
              <p style={{ color: "#F97316", fontWeight: 700, fontSize: 12, margin: "0 0 20px" }}>
                Route recalculated {deviationCount} time{deviationCount > 1 ? "s" : ""} during navigation.
              </p>
            )}
            <button onClick={onClose} style={{
              width: "100%", padding: "14px",
              background: "#000", color: "#fff",
              border: "none", borderRadius: 14,
              fontWeight: 800, fontSize: 13,
              letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
            }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Small sub-components ─────────────────────── */
const HudStat = ({ icon, value, sub, color }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {icon}
      <span style={{ color, fontWeight: 800, fontSize: 15, lineHeight: 1 }}>{value}</span>
    </div>
    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "2px 0 0" }}>
      {sub}
    </p>
  </div>
);

const Divider = () => (
  <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />
);

const LegendRow = ({ color, label, dash }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 24, height: 3.5, borderRadius: 2,
      background: dash ? "none" : color,
      ...(dash ? { backgroundImage: `repeating-linear-gradient(90deg,${color} 0,${color} 5px,transparent 5px,transparent 9px)` } : {}),
    }} />
    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: 600 }}>{label}</span>
  </div>
);

export default WorkerNavigationMap;
