import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, task }) => {
  if (!isOpen) return null;

  const workerPercent =
    typeof task?.workerFeePercent === "number"
      ? task.workerFeePercent
      : typeof task?.platformFeePercent === "number"
        ? 100 - task.platformFeePercent
        : 90;
  const workerEarnings = Math.round((task?.price || 0) * (workerPercent / 100));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-70 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden animate-scale-in">
        <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <ShieldCheck className="text-green-600" size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-black">Task Accepted!</h3>
            <p className="text-gray-500 text-sm font-bold mt-2">You have successfully accepted the task.</p>
          </div>

          {task && (
            <div className="bg-gray-50 p-4 rounded-2xl w-full border border-gray-200 mt-2">
              <h4 className="font-bold text-sm line-clamp-1">{task.title}</h4>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs font-medium text-gray-500">Earnings:</span>
                <span className="text-lg font-black tracking-tighter">₹{workerEarnings}</span>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-black text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg active:scale-95 mt-4"
          >
            Go to Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
