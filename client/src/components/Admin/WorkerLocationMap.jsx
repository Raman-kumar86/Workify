import { useEffect, useState, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MdMyLocation, MdRefresh } from "react-icons/md";
import { haversineKm } from "../../utils/osrm.js";
import useAdminWorkerLocations from "../../hooks/admin/useAdminWorkerLocations.jsx";

// Fix leaflet default icon paths broken by bundlers
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ─── Colored dot icons ────────────────────────────────────────────────────────
function dotIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 4px rgba(0,0,0,.45)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

const onlineIcon = dotIcon("#22c55e");   // green-500
const offlineIcon = dotIcon("#94a3b8");  // slate-400
const centerIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// ─── Center picker - click map to set center ─────────────────────────────────
function CenterPicker({ onCenterSet }) {
  useMapEvents({
    click(e) {
      onCenterSet({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ─── Fly to on locate-me ─────────────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 13, { duration: 1.2 });
  }, [target, map]);
  return null;
}

// ─── Format date helper ───────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "Never";
  return new Date(d).toLocaleString();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function WorkerLocationMap() {
  const { workers, loading, error, fetchWorkerLocations } = useAdminWorkerLocations();

  const [center, setCenter] = useState(null);       // { lat, lng } - filter center
  const [radiusKm, setRadiusKm] = useState(10);     // km
  const [filterActive, setFilterActive] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [pickingCenter, setPickingCenter] = useState(false);
  const [showOffline, setShowOffline] = useState(true);

  // Fetch on mount
  useEffect(() => { fetchWorkerLocations(); }, [fetchWorkerLocations]);

  // Click-map handler
  const handleMapClick = useCallback((pos) => {
    if (!pickingCenter) return;
    setCenter(pos);
    setPickingCenter(false);
    setFilterActive(true);
  }, [pickingCenter]);

  // Locate-me button
  const handleLocateMe = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude };
        setCenter(pos);
        setFlyTarget(pos);
        setFilterActive(true);
      },
      () => alert("Could not get your location")
    );
  };

  // Derived: workers visible on map
  const visibleWorkers = workers.filter((w) => {
    if (!showOffline && !w.isOnline) return false;
    if (!filterActive || !center) return true;
    return haversineKm(w.lat, w.lng, center.lat, center.lng) <= radiusKm;
  });

  const onlineCount  = visibleWorkers.filter((w) => w.isOnline).length;
  const offlineCount = visibleWorkers.filter((w) => !w.isOnline).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-wrap items-center gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Worker Location Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Last-known GPS position of every registered worker
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            {onlineCount} online
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            {offlineCount} offline
          </span>
          <button
            onClick={fetchWorkerLocations}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <MdRefresh size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 shrink-0">
        {/* Toggle offline */}
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOffline}
            onChange={(e) => setShowOffline(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show offline workers
        </label>

        {/* Radius filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPickingCenter(true); setFilterActive(false); }}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              pickingCenter
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-blue-50"
            }`}
          >
            {pickingCenter ? "Click map to set center..." : "Set Filter Center"}
          </button>
          <button
            onClick={handleLocateMe}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-blue-50 text-slate-700 transition-colors cursor-pointer"
          >
            <MdMyLocation size={16} />
            Use My Location
          </button>
          {center && (
            <>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-32 accent-blue-600"
              />
              <span className="text-sm text-slate-600 w-16">{radiusKm} km</span>
              <button
                onClick={() => { setFilterActive(!filterActive); }}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  filterActive
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-blue-50"
                }`}
              >
                {filterActive ? "Filter ON" : "Filter OFF"}
              </button>
              <button
                onClick={() => { setCenter(null); setFilterActive(false); }}
                className="text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative min-h-0">
        {loading && (
          <div className="absolute inset-0 z-1000 bg-white/70 flex items-center justify-center">
            <span className="text-slate-600 text-sm font-medium animate-pulse">Loading workers...</span>
          </div>
        )}
        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg shadow">
            {error}
          </div>
        )}

        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          className="h-full w-full"
          style={{ cursor: pickingCenter ? "crosshair" : "grab" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          <CenterPicker onCenterSet={handleMapClick} />
          {flyTarget && <FlyTo target={flyTarget} />}

          {/* Radius circle */}
          {filterActive && center && (
            <Circle
              center={[center.lat, center.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 2 }}
            />
          )}

          {/* Center pin */}
          {center && (
            <Marker position={[center.lat, center.lng]} icon={centerIcon}>
              <Popup>Filter center</Popup>
            </Marker>
          )}

          {/* Worker pins */}
          {visibleWorkers.map((w) => (
            <Marker
              key={w._id}
              position={[w.lat, w.lng]}
              icon={w.isOnline ? onlineIcon : offlineIcon}
            >
              <Popup>
                <div className="text-sm min-w-40">
                  <p className="font-semibold text-slate-800">{w.name}</p>
                  {w.email && <p className="text-slate-500 text-xs">{w.email}</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        w.isOnline ? "bg-green-500" : "bg-slate-400"
                      }`}
                    />
                    <span className={w.isOnline ? "text-green-600" : "text-slate-500"}>
                      {w.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                  {w.category && (
                    <p className="text-slate-600 text-xs mt-0.5">Category: {w.category}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">
                    Status: <span className="capitalize">{w.status}</span>
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Last seen: {fmtDate(w.lastSeenAt)}
                  </p>
                  <p className="text-slate-400 text-xs">
                    Location at: {fmtDate(w.locationUpdatedAt)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* ── Footer stats ── */}
      <div className="px-6 py-2 bg-white border-t border-slate-200 text-xs text-slate-500 shrink-0">
        Showing {visibleWorkers.length} of {workers.length} workers
        {filterActive && center && ` within ${radiusKm} km of selected center`}
      </div>
    </div>
  );
}
