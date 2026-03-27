import React, { useState, useEffect } from 'react';
import {
  X, Clock, MapPin, IndianRupee, Trash2, RefreshCw,
  AlertCircle, Briefcase, Calendar, AlertTriangle, Navigation, Star, Flag,
} from 'lucide-react';
import LiveTrackingMap from './LiveTrackingMap';
import ReviewModal from './ReviewModal.jsx';
import ReportWorkerModal from './ReportWorkerModal.jsx';
import axiosInstance from '../../api/axios.jsx';

/** Statuses where the task has a live worker (tracking visible + delete penalty) */
const ACTIVE_STATUSES = new Set(["assigned", "inProgress", "arrived"]);

/** Tracks which completed taskIds have already auto-prompted the review modal this session */
const reviewPromptedIds = new Set();

/** Confirm modal shown before deleting an active task (warns about fine + ban) */
const PenaltyConfirmModal = ({ onConfirm, onCancel }) => (
  <div style={{
    position: "fixed", inset: 0, zIndex: 200000,
    background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  }}>
    <div style={{
      background: "#fff", borderRadius: 24,
      maxWidth: 380, width: "100%",
      boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
      borderTop: "6px solid #EF4444",
      padding: 32, textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, background: "#FEF2F2",
        borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <AlertTriangle size={36} color="#EF4444" />
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: -0.5, margin: "0 0 8px" }}>
        Cancel Active Task?
      </h2>
      <p style={{ color: "#6b7280", fontSize: 13, fontWeight: 500, margin: "0 0 20px", lineHeight: 1.5 }}>
        A worker has already accepted this task. Cancelling will result in:
      </p>

      <div style={{
        background: "#FFF5F5", border: "1px solid #FECACA",
        borderRadius: 14, padding: "14px 18px",
        textAlign: "left", marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: "#b91c1c", fontSize: 13 }}>₹100 fine deducted from your wallet</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: "#b91c1c", fontSize: 13 }}>60-minute account ban</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: "12px 0", background: "#f3f4f6",
          border: "none", borderRadius: 12, fontWeight: 800,
          fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
        }}>
          Go Back
        </button>
        <button onClick={onConfirm} style={{
          flex: 1, padding: "12px 0", background: "#EF4444", color: "#fff",
          border: "none", borderRadius: 12, fontWeight: 800,
          fontSize: 11, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(239,68,68,0.35)",
        }}>
          Accept & Cancel
        </button>
      </div>
    </div>
  </div>
);

const TaskDetailsModal = ({ task, isOpen, onClose, onRenew, onDelete }) => {
  const [renewDate, setRenewDate] = useState("");
  const [showPenaltyConfirm, setShowPenaltyConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [reviewFetched, setReviewFetched] = useState(false);

  const isExpired =
    task?.status !== "completed" &&
    task?.status !== "cancelled" &&
    (
      task?.status === "expired" ||
      (task?.expiresAt && new Date(task.expiresAt) < new Date()) ||
      (!task?.expiresAt && task?.status === "broadcasting" && new Date(task?.scheduledStartAt) < new Date())
    );

  const isLiveTask = task && ACTIVE_STATUSES.has(task.status);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setRenewDate(now.toISOString().slice(0, 10));
    }
  }, [isOpen, task]);

  // Fetch existing review whenever a completed task is opened;
  // auto-open ReviewModal once if the task has never been reviewed.
  useEffect(() => {
    if (isOpen && task?.status === 'completed' && task?._id && !reviewFetched) {
      axiosInstance
        .get(`/api/user/task/${task._id}/review`)
        .then((res) => {
          const review = res.data?.review || null;
          setExistingReview(review);
          setReviewFetched(true);

          // Auto-open the review modal only if:
          //   1. No review exists yet
          //   2. We haven't prompted the user for this task this session
          if (!review && !reviewPromptedIds.has(task._id)) {
            reviewPromptedIds.add(task._id);
            setShowReviewModal(true);
          }
        })
        .catch(() => setReviewFetched(true));
    }
    // Reset when modal is closed or task changes
    if (!isOpen) {
      setExistingReview(null);
      setReviewFetched(false);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleRenewClick = () => {
    if (!renewDate) { alert("Please select a date for renewal."); return; }
    onRenew(task._id, renewDate);
    onClose();
  };

  const handleDeleteClick = () => {
    if (isLiveTask) {
      // Show penalty warning first
      setShowPenaltyConfirm(true);
    } else {
      onDelete(task._id);
      onClose();
    }
  };

  const handlePenaltyConfirm = () => {
    setShowPenaltyConfirm(false);
    onDelete(task._id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Penalty confirm — layered above modal */}
      {showPenaltyConfirm && (
        <PenaltyConfirmModal
          onConfirm={handlePenaltyConfirm}
          onCancel={() => setShowPenaltyConfirm(false)}
        />
      )}

      {/* Review modal */}
      <ReviewModal
        taskId={task?._id}
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSuccess={(rating) => {
          setExistingReview({ rating });
          setShowReviewModal(false);
        }}
      />

      {/* Report modal */}
      <ReportWorkerModal
        taskId={task?._id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSuccess={() => setShowReportModal(false)}
      />

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* ── Header image ─────────────────────────────── */}
        <div className="h-48 bg-gray-100 relative shrink-0">
          {task.images?.length > 0 ? (
            <img src={task.images[0]} alt={task.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
              <Briefcase size={48} />
            </div>
          )}
          <button onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-all">
            <X size={20} />
          </button>
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm flex items-center gap-1.5 ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
              task.status === 'inProgress' ? 'bg-blue-100 text-blue-700' :
                task.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                  task.status === 'arrived' ? 'bg-orange-100 text-orange-700' :
                    isExpired ? 'bg-red-500 text-white' : 'bg-black text-white'
            }`}>
            {isExpired && <AlertCircle size={10} />}
            {isExpired ? 'Expired' : task.status}
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────── */}
        <div className="overflow-y-auto custom-scrollbar flex-1">

          {/* ── LIVE TRACKING MAP (only for active tasks) ── */}
          {isLiveTask && (
            <div style={{ height: 300, position: "relative" }}>
              {/* Section header */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 16px",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)",
              }}>
                <Navigation size={14} color="#22C55E" />
                <span style={{ color: "#fff", fontWeight: 800, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
                  Live Worker Tracking
                </span>
                <span style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#22C55E",
                  boxShadow: "0 0 5px #22C55E", flexShrink: 0,
                  animation: "gpsPulse 1.5s ease-in-out infinite",
                }} />
                <style>{`@keyframes gpsPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
              </div>

              <LiveTrackingMap task={task} />
            </div>
          )}

          {/* ── Task details ─────────────────────────────── */}
          <div className="p-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-2">
              {task.title}
            </h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">
              {task.taskType} {task.subcategory && `• ${task.subcategory}`}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                  <IndianRupee size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Budget</span>
                </div>
                <p className="text-xl font-black text-gray-900">₹{task.price}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-1 text-gray-400">
                  <Calendar size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Posted</span>
                </div>
                <p className="text-sm font-bold text-gray-900">{new Date(task.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{task.description || "No description provided."}</p>
              </div>

              {task.address && (
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-2">Location</h3>
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <p className="text-sm">{task.address}</p>
                  </div>
                </div>
              )}

              {task.images?.length > 1 && (
                <div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-3">Gallery</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {task.images.slice(1).map((img, idx) => (
                      <img key={idx} src={img} alt="gallery" className="w-full h-24 rounded-xl object-cover border border-gray-100" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer actions ────────────────────────────── */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-3 shrink-0">
          {isExpired && (
            <div className="flex-1 flex gap-2">
              <input
                type="date" value={renewDate}
                onChange={(e) => setRenewDate(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button onClick={handleRenewClick}
                className="px-6 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg flex items-center gap-2">
                <RefreshCw size={14} /> Renew
              </button>
            </div>
          )}

          {/* ── Review & Report (completed tasks only) ─── */}
          {task.status === 'completed' && (
            <div className="flex gap-3 w-full">
              {/* Review button — shows submitted stars if already reviewed */}
              {existingReview ? (
                <div
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, background: '#FFFBEB', border: '1.5px solid #FDE68A',
                    borderRadius: 12, padding: '12px 0',
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < existingReview.rating ? '#F59E0B' : 'none'}
                      color={i < existingReview.rating ? '#F59E0B' : '#D1D5DB'}
                      strokeWidth={1.8}
                    />
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 }}>
                    Reviewed
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', color: '#92400E' }}
                >
                  <Star size={14} />
                  Review Worker
                </button>
              )}

              {/* Report button */}
              <button
                onClick={() => setShowReportModal(true)}
                className="flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626' }}
              >
                <Flag size={14} />
                Report Worker
              </button>
            </div>
          )}

          {/* Delete / Cancel button */}
          {task.status !== 'completed' && (
            <button
              onClick={handleDeleteClick}
              className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${isLiveTask
                  ? 'flex-1 bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : isExpired
                    ? 'px-6 bg-white border-red-200 text-red-500 hover:bg-red-50'
                    : 'flex-1 bg-gray-900 text-white hover:bg-black'
                }`}
            >
              <Trash2 size={14} />
              {isLiveTask ? 'Cancel Task (₹100 Fine)' : 'Delete'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
