import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  ClipboardList,
  IndianRupee,
  Clock,
  AlertTriangle,
} from 'lucide-react';

/**
 * WorkSummaryModal
 * Shown when the worker taps "Complete Task".
 * Collects a description of the work done before confirming completion.
 *
 * Props:
 *  isOpen       - boolean
 *  onClose      - fn()
 *  onConfirm    - fn(workSummary: string)
 *  loading      - boolean
 *  task         - activeTask object { title, price, estimatedDurationMinutes, taskType }
 *  elapsed      - formatted time string e.g. "12m 34s"
 */
const WorkSummaryModal = ({ isOpen, onClose, onConfirm, loading, task, elapsed }) => {
  const [summary, setSummary] = useState('');
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !task) return null;

  const workerPercent =
    typeof task.workerFeePercent === 'number'
      ? task.workerFeePercent
      : typeof task.platformFeePercent === 'number'
        ? 100 - task.platformFeePercent
        : 90;
  const workerEarnings = Math.round((task.price || 0) * (workerPercent / 100));

  const handleSubmit = () => {
    if (summary.trim().length < 10) {
      setError('Please describe the work you did (at least 10 characters).');
      return;
    }
    if (!cashConfirmed) {
      setError('Please confirm you have collected the cash from the client.');
      return;
    }
    setError('');
    onConfirm(summary.trim());
  };

  const handleClose = () => {
    if (loading) return;
    setSummary('');
    setCashConfirmed(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">

        {/* Header */}
        <div className="bg-black text-white px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter">Complete Task</h2>
              <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                {task.taskType}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8 space-y-6">

          {/* Task summary row */}
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Task</p>
              <p className="font-black text-sm uppercase tracking-tight line-clamp-1">{task.title}</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Earning</p>
              <p className="font-black text-lg tracking-tighter flex items-center gap-0.5">
                <IndianRupee size={16} strokeWidth={3} />
                {workerEarnings}
              </p>
            </div>
            {elapsed && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-right">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">Duration</p>
                <p className="font-black text-sm tracking-tighter text-amber-600 flex items-center gap-1">
                  <Clock size={13} />
                  {elapsed}
                </p>
              </div>
            )}
          </div>

          {/* Work description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-700 mb-2">
              Work Summary <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 font-medium mb-3">
              Briefly describe what you accomplished — this helps the client understand the work done.
            </p>
            <textarea
              rows={4}
              placeholder="e.g. Fixed the leaking pipe under the kitchen sink, replaced the valve and tested for 10 minutes. No further issues found."
              value={summary}
              onChange={(e) => { setSummary(e.target.value); setError(''); }}
              disabled={loading}
              className="w-full resize-none border border-gray-200 rounded-2xl p-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all disabled:opacity-60 disabled:bg-gray-50"
            />
            <p className={`text-[10px] font-bold mt-1 text-right ${summary.trim().length < 10 ? 'text-gray-300' : 'text-green-500'}`}>
              {summary.trim().length} / 10 min characters
            </p>
          </div>

          {/* Cash confirmation checkbox */}
          <button
            type="button"
            onClick={() => { setCashConfirmed((v) => !v); setError(''); }}
            disabled={loading}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
              cashConfirmed
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            } disabled:opacity-60`}
          >
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
              cashConfirmed ? 'border-green-500 bg-green-500' : 'border-gray-300'
            }`}>
              {cashConfirmed && <CheckCircle size={14} className="text-white" fill="currentColor" />}
            </div>
            <div>
              <p className={`text-sm font-black uppercase tracking-tight ${cashConfirmed ? 'text-green-700' : 'text-gray-700'}`}>
                {cashConfirmed ? 'Cash Collected ✓' : 'Confirm Cash Collection'}
              </p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                I have received <span className="font-black text-gray-700">₹{task.price}</span> from the client.
              </p>
            </div>
          </button>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 font-bold">{error}</p>
            </div>
          )}

          {/* Confirm button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Completing…</span>
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                <span>Confirm Completion</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkSummaryModal;
