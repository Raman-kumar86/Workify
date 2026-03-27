import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";

// ── Ban countdown screen shown after user cancels an active task ─────────────
const UserBanScreen = ({ banInfo, onDismiss }) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(banInfo.banExpiresAt) - new Date();
      if (diff <= 0) { setTimeLeft("00:00"); setExpired(true); return; }
      const m = String(Math.floor(diff / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTimeLeft(`${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [banInfo.banExpiresAt]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full blur-[120px] opacity-15 -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600 rounded-full blur-[120px] opacity-10 -ml-10 -mb-10" />

      <div className="relative z-10 max-w-md w-full space-y-8">
        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.25)]">
          <AlertTriangle className="text-red-500" size={48} />
        </div>

        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-red-500 mb-3">Account Suspended</h1>
          <p className="text-gray-400 font-medium text-sm leading-relaxed">
            You cancelled a task that had already been accepted by a worker.
          </p>
        </div>

        <div className="bg-zinc-900/80 rounded-2xl p-6 border border-zinc-800 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fine Applied</span>
            <span className="text-red-400 font-black">−₹100</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Wallet Balance</span>
            <span className="font-black text-white">₹{banInfo.walletBalance}</span>
          </div>
          <div className="h-px bg-zinc-700 my-2" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ban Lifts In</p>
          <div className="text-5xl font-black text-white tracking-tighter font-mono">
            {timeLeft || "--:--"}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-gray-500">Repeated cancellations may lead to a permanent ban.</p>
          {expired ? (
            <button
              onClick={onDismiss}
              className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              Dismiss — Ban Lifted
            </button>
          ) : (
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">Please wait for the ban to expire.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserBanScreen;
