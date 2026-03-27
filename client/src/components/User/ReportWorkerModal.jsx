import React, { useState } from "react";
import { X, Flag, CheckCircle } from "lucide-react";
import useSubmitReport from "../../hooks/user/useSubmitReport.jsx";

const REPORT_REASONS = [
  "Unprofessional behavior",
  "Did not complete work",
  "Safety concern",
  "Overcharged",
  "No show",
  "Other",
];

const ReportWorkerModal = ({ taskId, isOpen, onClose, onSuccess }) => {
  const [reason, setReason]           = useState("");
  const [description, setDescription] = useState("");
  const { submitReport, loading, error, success } = useSubmitReport();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) return;
    try {
      await submitReport(taskId, { reason, description });
      if (onSuccess) onSuccess();
    } catch (_) {
      /* error stored in hook */
    }
  };

  /* ── Success screen ─────────────────────────────── */
  if (success) {
    return (
      <div className="fixed inset-0 z-[200001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tight mb-2">Report Submitted</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            We’ve received your report and will review it shortly. Thank you for keeping the community safe.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-xl">
              <Flag size={18} className="text-red-500" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight">Report Worker</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Reason pills */}
        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-3">
          Select a reason <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-5">
          {REPORT_REASONS.map((r) => {
            const active = reason === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-4 py-2 rounded-full text-xs font-bold border-2 transition-all ${
                  active
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Description */}
        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-2">
          Additional details <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          placeholder="Describe what happened…"
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
        />
        <p className="text-[11px] text-gray-400 text-right mt-1">{description.length}/1000</p>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs font-semibold mt-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="flex-[2] py-3 bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportWorkerModal;
