import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

const CustomErrorModal = ({ isOpen, onClose, title = "Error", message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">

        {/* Header with Error Icon */}
        <div className="bg-red-50 p-6 flex items-center justify-between border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="text-red-600 w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-red-100/50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 font-medium leading-relaxed">
            {message || "Something went wrong. Please try again."}
          </p>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-all shadow-md hover:shadow-lg transform active:scale-95"
          >
            Dismiss
          </button>
        </div>

        {/* Decorative Alert Strip */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
      </div>
    </div>
  );
};

export default CustomErrorModal;
