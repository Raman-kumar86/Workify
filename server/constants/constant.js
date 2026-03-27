export const REPORT_REASONS = [
  "Unprofessional behavior",
  "Did not complete work",
  "Safety concern",
  "Overcharged",
  "No show",
  "Other",
];

// user constant
export const ACTIVE_STATUSES = new Set(["assigned", "inProgress", "arrived"]);
export const CANCELLATION_FINE = 100; // ₹100
export const CANCELLATION_BAN_MS = 60 * 60 * 1000; // 6 HOURS

// user constants ends

// worker constants
export const FINE_AMOUNT_WORKER = 50; // ₹100 fine for no-show or cancellation
export const NO_SHOW_BAN_MS_WORKER = 6; // 6hrs ban for cancellation
// worker constants

// Helper function to extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const pathParts = parts.slice(uploadIndex + 1);
    const relevantParts = pathParts.filter((part) => !part.match(/^v\d+$/));
    const fullPath = relevantParts.join("/");
    const lastDotIndex = fullPath.lastIndexOf(".");
    if (lastDotIndex === -1) return fullPath;
    return fullPath.substring(0, lastDotIndex);
  } catch (error) {
    console.error("Error parsing public ID:", error);
    return null;
  }
};

/* ─────────────────────────────────────────────────────────────
   HTTP FALLBACK: updateWorkerLocation
   POST /api/worker/tasks/:taskId/location
   Body: { lat, lng }
   Used when socket is unavailable / as backup
───────────────────────────────────────────────────────────── */
export const haversineKm = (lat1, lng1, lat2, lng2) => {
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

export const bearingDeg = (lat1, lng1, lat2, lng2) => {
  const dL = ((lng2 - lng1) * Math.PI) / 180;
  const rl1 = (lat1 * Math.PI) / 180;
  const rl2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dL) * Math.cos(rl2);
  const x =
    Math.cos(rl1) * Math.sin(rl2) -
    Math.sin(rl1) * Math.cos(rl2) * Math.cos(dL);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};
