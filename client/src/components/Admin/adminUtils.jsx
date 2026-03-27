/** Tailwind badge classes keyed by color name */
export const badgeCls = (color) => {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold";
  return (
    {
      green:  `${base} bg-green-100 text-green-700`,
      red:    `${base} bg-red-100 text-red-700`,
      yellow: `${base} bg-yellow-100 text-yellow-700`,
      blue:   `${base} bg-blue-100 text-blue-700`,
      orange: `${base} bg-orange-100 text-orange-700`,
      gray:   `${base} bg-gray-100 text-gray-500`,
    }[color] ?? `${base} bg-gray-100 text-gray-500`
  );
};

/** Tailwind button classes */
export const btnCls = (variant, sm = false) => {
  const px = sm ? "px-3 py-1.5" : "px-4 py-2";
  const base = `${px} rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`;
  return (
    {
      primary: `${base} bg-blue-600 text-white hover:bg-blue-700`,
      success: `${base} bg-green-600 text-white hover:bg-green-700`,
      danger:  `${base} bg-red-600 text-white hover:bg-red-700`,
      ghost:   `${base} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`,
      warning: `${base} bg-amber-500 text-white hover:bg-amber-600`,
      blue:    `${base} bg-blue-600 text-white hover:bg-blue-700`,
    }[variant] ?? `${base} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`
  );
};

/** Alert bar classes */
export const alertCls = (type) =>
  type === "error"
    ? "mb-5 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200"
    : "mb-5 px-4 py-3 rounded-lg text-sm bg-green-50 text-green-800 border border-green-200";

/** Shared input / label classes */
export const inputCls =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
export const labelCls = "block text-sm font-medium text-gray-700 mb-1";

/** Table atoms */
export const TH = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap";
export const TD = "px-4 py-3 text-gray-700 text-sm";
export const TR = "border-b border-gray-100 last:border-0 hover:bg-gray-50";

/** Modal atoms */
export const OVERLAY = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4";
export const MODAL   = "bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto";

/** Pagination bar */
export const Pagination = ({ page, totalPages, onPrev, onNext }) =>
  totalPages > 1 ? (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
      <button className={btnCls("ghost", true)} disabled={page === 1} onClick={onPrev}>
        ← Prev
      </button>
      <span className="text-xs text-gray-500">
        Page {page} / {totalPages}
      </span>
      <button className={btnCls("ghost", true)} disabled={page === totalPages} onClick={onNext}>
        Next →
      </button>
    </div>
  ) : null;
