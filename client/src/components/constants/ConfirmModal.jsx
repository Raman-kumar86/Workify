/**
 * ConfirmModal — Reusable premium confirmation dialog.
 *
 * Props:
 *   isOpen        {boolean}  Show / hide
 *   onClose       {fn}       Cancel callback
 *   onConfirm     {fn}       Confirm callback (called after checkbox is checked)
 *   loading       {boolean}  Spinner on confirm button
 *
 *   -- Header --
 *   title         {string}   Modal heading (e.g. "Complete This Task?")
 *   icon          {ReactNode} Lucide icon for the header circle
 *   gradient      {string}   Tailwind gradient classes for the header
 *                             default: "from-amber-400 via-yellow-400 to-amber-500"
 *
 *   -- Summary rows --
 *   summaryRows   {Array<{ label: string, value: string|ReactNode, highlight?: boolean }>}
 *                  e.g. [{ label: 'Task', value: 'Plumbing' }, { label: 'Payment', value: '₹500', highlight: true }]
 *
 *   -- Checkbox --
 *   checkboxLabel       {string}   Label when unchecked (e.g. "Have you collected the cash?")
 *   checkboxLabelChecked {string}  Label when checked   (e.g. "Cash Collected")
 *   checkboxDescription  {string|ReactNode}  Small helper text below label
 *   checkboxEmoji        {string}  Emoji shown before label (default "💰" / "✅")
 *
 *   -- Buttons --
 *   confirmText    {string}  Confirm button label (default "Confirm")
 *   cancelText     {string}  Cancel button label  (default "Cancel")
 */
import React, { useState } from "react";
import { CheckCircle } from "lucide-react";

const ConfirmModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  loading = false,
  // Header
  title = "Are you sure?",
  icon,
  gradient = "from-amber-400 via-yellow-400 to-amber-500",
  // Summary
  summaryRows = [],
  // Checkbox
  checkboxLabel = "I confirm this action",
  checkboxLabelChecked,
  checkboxDescription,
  checkboxEmoji = "💰",
  checkboxEmojiChecked = "✅",
  // Buttons
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
        {/* ── Header ── */}
        <div className={`bg-gradient-to-r ${gradient} px-6 py-5 text-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent)]"></div>
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-lg">
            {icon || <CheckCircle size={28} className="text-white drop-shadow" />}
          </div>
          <h3 className="text-lg font-black uppercase tracking-wider text-white drop-shadow-sm">
            {title}
          </h3>
        </div>

        <div className="p-6 space-y-5">
          {/* ── Summary rows ── */}
          {summaryRows.length > 0 && (
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              {summaryRows.map((row, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <div className="h-px bg-gray-200"></div>}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {row.label}
                    </span>
                    <span
                      className={`font-black truncate ml-4 ${row.highlight
                          ? "text-xl text-green-600"
                          : "text-sm text-gray-900"
                        }`}
                    >
                      {row.value}
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* ── Checkbox confirmation ── */}
          <label
            className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${confirmed
                ? "border-green-500 bg-green-50"
                : "border-amber-300 bg-amber-50"
              }`}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded accent-green-600 cursor-pointer"
            />
            <div>
              <p className="text-sm font-black text-gray-900">
                {confirmed
                  ? `${checkboxEmojiChecked} ${checkboxLabelChecked || checkboxLabel}`
                  : `${checkboxEmoji} ${checkboxLabel}`}
              </p>
              {checkboxDescription && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {checkboxDescription}
                </p>
              )}
            </div>
          </label>

          {/* ── Action buttons ── */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-all active:scale-[0.97]"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={!confirmed || loading}
              className={`flex-1 py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-[0.97] shadow-lg flex items-center justify-center gap-2 ${confirmed
                  ? "bg-green-500 hover:bg-green-400 text-white shadow-green-500/30"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                }`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={16} />
                  {confirmText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
