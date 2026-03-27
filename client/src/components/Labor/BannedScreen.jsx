import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

const BannedScreen = ({ banExpiresAt }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(banExpiresAt);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Ban Expired. Please refresh.");
        clearInterval(interval);
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [banExpiresAt]);

  const handleContactSupport = () => {
    // Placeholder for support contact
    window.location.href = "mailto:support@workifypro.com?subject=Ban Appeal";
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600 rounded-full blur-[100px] opacity-10 -ml-10 -mb-10"></div>

      <div className="relative z-10 max-w-md w-full space-y-8 animate-fade-in-up">
        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <AlertTriangle className="text-red-500" size={48} />
        </div>

        <h1 className="text-4xl font-black uppercase tracking-tighter text-red-500 mb-2">Access Restricted</h1>
        <p className="text-gray-400 font-medium">
          Your account has been temporarily suspended due to rejecting an assigned task.
        </p>

        <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-6 border border-zinc-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Ban Lifts In</p>
          <div className="text-5xl font-black text-white tracking-tighter font-mono">
            {timeLeft || "--:--:--"}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Repeated rejections may lead to a permanent ban.
          </p>
          <button
            onClick={handleContactSupport}
            className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
            Contact Support
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-bold text-gray-500 hover:text-white transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default BannedScreen;
