import React, { useState } from "react";
import { X, Star, CheckCircle } from "lucide-react";
import useSubmitReview from "../../hooks/user/useSubmitReview.jsx";

const StarBtn = ({ filled, hovered, onClick, onEnter, onLeave, index }) => (
  <button
    type="button"
    onClick={() => onClick(index)}
    onMouseEnter={() => onEnter(index)}
    onMouseLeave={onLeave}
    className={`p-1 focus:outline-none transition-transform duration-150 ${
      filled || hovered ? "scale-110" : "scale-100"
    }`}
    aria-label={`Rate ${index} star${index > 1 ? "s" : ""}`}
  >
    <Star
      size={34}
      fill={filled || hovered ? "#F59E0B" : "none"}
      color={filled || hovered ? "#F59E0B" : "#D1D5DB"}
      strokeWidth={1.8}
    />
  </button>
);

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

const ReviewModal = ({ taskId, isOpen, onClose, onSuccess }) => {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState("");
  const { submitReview, loading, error, success } = useSubmitReview();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    try {
      await submitReview(taskId, { rating, comment });
      if (onSuccess) onSuccess(rating);
    } catch (_) {
      /* error already stored in hook */
    }
  };

  /* ── Success screen ─────────────────────────────── */
  if (success) {
    return (
      <div className="fixed inset-0 z-[200001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-10 text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-black uppercase tracking-tight mb-1">Review Submitted!</h2>
          <p className="text-gray-500 text-sm mb-4">Thank you for your feedback.</p>
          <div className="flex justify-center gap-1 mb-6">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={24}
                fill={i < rating ? "#F59E0B" : "none"}
                color={i < rating ? "#F59E0B" : "#D1D5DB"}
                strokeWidth={1.8}
              />
            ))}
          </div>
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

  const activeRating = hovered || rating;

  return (
    <div className="fixed inset-0 z-[200001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black uppercase tracking-tight">Rate the Worker</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarBtn
              key={star}
              index={star}
              filled={star <= rating}
              hovered={star <= hovered}
              onClick={setRating}
              onEnter={setHovered}
              onLeave={() => setHovered(0)}
            />
          ))}
        </div>

        {/* Rating label */}
        <p className="text-center text-xs font-black uppercase tracking-widest text-amber-500 min-h-[20px] mb-5">
          {LABELS[activeRating] || ""}
        </p>

        {/* Comment */}
        <label className="block text-[11px] font-black uppercase tracking-widest text-gray-700 mb-2">
          Comment <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          placeholder="Share your experience with this worker…"
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-gray-900 transition-all"
        />
        <p className="text-[11px] text-gray-400 text-right mt-1">{comment.length}/500</p>

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
            disabled={rating === 0 || loading}
            className="flex-[2] py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting…" : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
