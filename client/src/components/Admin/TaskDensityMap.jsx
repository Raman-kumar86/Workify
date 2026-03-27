import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
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
import useAdminTaskLocations from "../../hooks/admin/useAdminTaskLocations.jsx";

// Fix leaflet default icon paths broken by bundlers
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
L.Marker.prototype.options.icon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// ─── Center-pin icon ──────────────────────────────────────────────────────────
const centerIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#8b5cf6;border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,.5)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// ─── Status colour map ────────────────────────────────────────────────────────
const STATUS_COLOR = {
  broadcasting: "#f59e0b",
  assigned:     "#3b82f6",
  inProgress:   "#8b5cf6",
  arrived:      "#06b6d4",
  completed:    "#22c55e",
  expired:      "#94a3b8",
  cancelled:    "#ef4444",
};
function taskColor(status) {
  return STATUS_COLOR[status] || "#64748b";
}

// ─── Client-side grid clustering ─────────────────────────────────────────────
// Converts zoom level to approximate km per pixel at given latitude, then
// groups tasks whose screen-distance is below a threshold into one cluster.
function clusterTasks(tasks, zoom) {
  // At zoom Z, one tile (256px) covers 360/2^Z degrees of longitude.
  // We use a simple degree-based bucket approach instead of pixel math
  // to avoid needing map bounds:
  // bucket size ≈ 40 / 2^zoom degrees (empirically reasonable)
  const bucketDeg = 40 / Math.pow(2, zoom);

  const buckets = new Map();
  for (const t of tasks) {
    const bLat = Math.floor(t.lat / bucketDeg);
    const bLng = Math.floor(t.lng / bucketDeg);
    const key = `${bLat}:${bLng}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(t);
  }

  return Array.from(buckets.values()).map((group) => {
    // Average position for the cluster centre
    const lat = group.reduce((s, t) => s + t.lat, 0) / group.length;
    const lng = group.reduce((s, t) => s + t.lng, 0) / group.length;
    return { lat, lng, tasks: group, count: group.length };
  });
}

// ─── Cluster colour by count ──────────────────────────────────────────────────
function clusterColor(count) {
  if (count >= 50) return "#dc2626";  // red
  if (count >= 20) return "#f97316";  // orange
  if (count >= 10) return "#f59e0b";  // amber
  if (count >= 5)  return "#3b82f6";  // blue
  return "#8b5cf6";                   // purple
}

// ─── Zoom-aware reclustering hook ─────────────────────────────────────────────
function ZoomTracker({ onZoomChange }) {
  const map = useMap();
  useEffect(() => {
    onZoomChange(map.getZoom());
    const handler = () => onZoomChange(map.getZoom());
    map.on("zoomend", handler);
    return () => map.off("zoomend", handler);
  }, [map, onZoomChange]);
  return null;
}

// ─── Center picker ────────────────────────────────────────────────────────────
function CenterPicker({ onCenterSet }) {
  useMapEvents({
    click(e) {
      onCenterSet({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ─── FlyTo helper ─────────────────────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 13, { duration: 1.2 });
  }, [target, map]);
  return null;
}

// ─── Status filter badge ──────────────────────────────────────────────────────
const ALL_STATUSES = [
  "broadcasting", "assigned", "inProgress", "arrived",
  "completed", "expired", "cancelled",
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function TaskDensityMap() {
  const { tasks, loading, error, fetchTaskLocations } = useAdminTaskLocations();

  const [zoom, setZoom] = useState(5);
  const [center, setCenter] = useState(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [filterActive, setFilterActive] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);
  const [pickingCenter, setPickingCenter] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState(new Set(ALL_STATUSES));

  useEffect(() => { fetchTaskLocations(); }, [fetchTaskLocations]);

  const handleMapClick = useCallback(
    (pos) => {
      if (!pickingCenter) return;
      setCenter(pos);
      setPickingCenter(false);
      setFilterActive(true);
    },
    [pickingCenter]
  );

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

  const toggleStatus = (s) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };

  // 1. Filter by status
  // 2. Filter by distance if active
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!selectedStatuses.has(t.status)) return false;
      if (!filterActive || !center) return true;
      return haversineKm(t.lat, t.lng, center.lat, center.lng) <= radiusKm;
    });
  }, [tasks, selectedStatuses, filterActive, center, radiusKm]);

  // Cluster into buckets based on current zoom
  const clusters = useMemo(() => clusterTasks(filteredTasks, zoom), [filteredTasks, zoom]);

  // Dissolve threshold: at zoom >= 14 show individual pins
  const dissolve = zoom >= 14;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-wrap items-center gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Task Density Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cluster view of all task locations - zoom in to see individual tasks
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
            {filteredTasks.length} tasks visible
          </span>
          <button
            onClick={fetchTaskLocations}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <MdRefresh size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Controls bar ── */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3 shrink-0">
        {/* Status filter */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className="text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer capitalize"
              style={{
                background: selectedStatuses.has(s) ? taskColor(s) : "transparent",
                borderColor: taskColor(s),
                color: selectedStatuses.has(s) ? "#fff" : taskColor(s),
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Radius filter */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => { setPickingCenter(true); setFilterActive(false); }}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              pickingCenter
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-slate-700 border-slate-300 hover:bg-purple-50"
            }`}
          >
            {pickingCenter ? "Click map to set center..." : "Set Filter Center"}
          </button>
          <button
            onClick={handleLocateMe}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-purple-50 text-slate-700 transition-colors cursor-pointer"
          >
            <MdMyLocation size={16} />
            My Location
          </button>
          {center && (
            <>
              <input
                type="range"
                min={1}
                max={200}
                step={1}
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-32 accent-purple-600"
              />
              <span className="text-sm text-slate-600 w-16">{radiusKm} km</span>
              <button
                onClick={() => setFilterActive(!filterActive)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  filterActive
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-purple-50"
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
            <span className="text-slate-600 text-sm font-medium animate-pulse">Loading tasks...</span>
          </div>
        )}
        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-1000 bg-red-100 text-red-700 text-sm px-4 py-2 rounded-lg shadow">
            {error}
          </div>
        )}

        {/* Zoom hint */}
        {!dissolve && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-990 bg-white/90 text-xs text-slate-500 px-3 py-1 rounded-full shadow pointer-events-none">
            Zoom in further to see individual task pins
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

          <ZoomTracker onZoomChange={setZoom} />
          <CenterPicker onCenterSet={handleMapClick} />
          {flyTarget && <FlyTo target={flyTarget} />}

          {/* Radius circle */}
          {filterActive && center && (
            <Circle
              center={[center.lat, center.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: "#8b5cf6", fillColor: "#8b5cf6", fillOpacity: 0.07, weight: 2 }}
            />
          )}

          {/* Center pin */}
          {center && (
            <Marker position={[center.lat, center.lng]} icon={centerIcon}>
              <Popup>Filter center</Popup>
            </Marker>
          )}

          {/* Clustered view - zoom < 14 */}
          {!dissolve &&
            clusters.map((cl, i) => {
              const r = Math.min(8 + cl.count * 1.8, 55);
              const color = clusterColor(cl.count);
              return (
                <CircleMarker
                  key={i}
                  center={[cl.lat, cl.lng]}
                  radius={r}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.75,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-45 max-h-48 overflow-y-auto">
                      <p className="font-semibold text-slate-800 mb-1">
                        {cl.count} task{cl.count !== 1 ? "s" : ""} in this area
                      </p>
                      {cl.tasks.slice(0, 10).map((t) => (
                        <div key={t._id} className="flex items-center gap-1.5 py-0.5 border-b border-slate-100 last:border-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: taskColor(t.status) }}
                          />
                          <span className="text-xs text-slate-700 truncate">{t.title || "Untitled"}</span>
                          <span className="text-xs text-slate-400 ml-auto capitalize shrink-0">{t.status}</span>
                        </div>
                      ))}
                      {cl.count > 10 && (
                        <p className="text-xs text-slate-400 mt-1">...and {cl.count - 10} more. Zoom in to see all.</p>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}

          {/* Dissolved individual pins - zoom >= 14 */}
          {dissolve &&
            filteredTasks.map((t) => (
              <CircleMarker
                key={t._id}
                center={[t.lat, t.lng]}
                radius={7}
                pathOptions={{
                  color: taskColor(t.status),
                  fillColor: taskColor(t.status),
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-sm min-w-40">
                    <p className="font-semibold text-slate-800">{t.title || "Untitled"}</p>
                    {t.address && <p className="text-xs text-slate-500 mt-0.5">{t.address}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: taskColor(t.status) }}
                      />
                      <span className="capitalize text-xs" style={{ color: taskColor(t.status) }}>
                        {t.status}
                      </span>
                    </div>
                    {t.price != null && (
                      <p className="text-xs text-slate-600 mt-0.5">INR {t.price}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>

      {/* ── Legend ── */}
      <div className="px-6 py-2 bg-white border-t border-slate-200 flex flex-wrap items-center gap-3 shrink-0">
        <span className="text-xs text-slate-500 font-medium">Legend:</span>
        {ALL_STATUSES.map((s) => (
          <span key={s} className="flex items-center gap-1 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: taskColor(s) }} />
            <span className="capitalize">{s}</span>
          </span>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          Total: {tasks.length} tasks · Filtered: {filteredTasks.length}
          {filterActive && center && ` within ${radiusKm} km`}
        </span>
      </div>
    </div>
  );
}
