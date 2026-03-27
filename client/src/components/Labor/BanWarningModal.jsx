import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const BanWarningModal = ({ isOpen, onClose, onConfirm, rejecting }) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-scale-in border-t-4 border-red-500">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="text-red-600" size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-black">Warning!</h3>
            <p className="text-gray-500 text-sm font-bold mt-2">Rejecting this task has consequences.</p>
          </div>

          <div className="bg-red-50 p-4 rounded-xl w-full border border-red-100 text-left space-y-2">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span>₹50 Fine will be deducted</span>
            </div>
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
              <span>6-Hour Ban from platform</span>
            </div>
          </div>

          <div className="w-full">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 block text-left">Reason for Rejection</label>
            <textarea
              className="w-full bg-gray-100 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black resize-none"
              rows="3"
              placeholder="Why act you rejecting this task?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            ></textarea>
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-black py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={rejecting}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95 disabled:opacity-70"
            >
              {rejecting ? "Processing..." : "Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanWarningModal;
