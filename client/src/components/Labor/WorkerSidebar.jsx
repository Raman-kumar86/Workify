import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  User,
  Star,
  ClipboardList,
  LogOut,
  ChevronRight,
  Briefcase,
  History,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { icon: User,          label: "My Profile",    path: "/worker/profile" },
  { icon: History,       label: "Work History",  path: "/worker/history" },
  { icon: Star,          label: "My Reviews",    path: "/worker/reviews" },
  { icon: Wallet,        label: "Payments",      path: "/worker/payments" },
];

const WorkerSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const go = (path) => { onClose(); navigate(path); };

  const handleKey = useCallback(
    (e) => { if (e.key === "Escape") onClose(); },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, handleKey]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-300 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-400 h-screen w-80 max-w-[95vw] bg-white shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-label="Worker menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-black p-1.5 rounded-lg">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="text-lg font-black uppercase tracking-tighter">
              Workify<span className="text-gray-400">Pro</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Worker info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center shrink-0">
            <User size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-gray-900 leading-tight truncate">
              {user?.name || "Worker"}
            </p>
            <p className="text-[11px] text-gray-400 font-medium truncate">
              {user?.email || ""}
            </p>
            <span className="inline-block mt-0.5 px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded">
              Worker
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
            <button
              key={path}
              onClick={() => go(path)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors group"
            >
              <Icon
                size={17}
                className="text-gray-400 group-hover:text-black transition-colors shrink-0"
              />
              <span className="text-sm font-bold flex-1 text-left">{label}</span>
              <ChevronRight
                size={14}
                className="text-gray-300 group-hover:text-gray-500 transition-colors"
              />
            </button>
          ))}
        </nav>

        {/* Footer — logout */}
        <div className="px-3 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={() => { onClose(); logout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
          >
            <LogOut size={17} className="shrink-0" />
            <span className="text-sm font-bold">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default WorkerSidebar;
