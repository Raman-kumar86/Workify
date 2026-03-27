import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorModal = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100 opacity-100">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-red-600">Error</h3>
            <p className="text-gray-500 text-sm font-medium mt-1">{error}</p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
          >
            Dimiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
