import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";

import {
  MapPin,
  Plus,
  User,
  Briefcase,
  Star,
  Users,
  CheckCircle,
  Bell,
  Zap,
  X as XIcon,
  LogOut,
  Menu,
} from "lucide-react";
import CreateTask from "./CreateTask.jsx";
import LocationPermissionModal from "./LocationPermissionModal.jsx";
import { useDispatch, useSelector } from "react-redux";
import { setUserLocation } from "../../redux/slices/userSlice.jsx";
import { categories, getGeolocation } from "../../constants/task.constants.jsx";
import useMyTasks from "../../hooks/user/useMyTasks.jsx";
import useTaskNotifications from "../../hooks/user/useTaskNotifications.jsx";
import { useAuth } from "../context/AuthContext";
import MyTasksSection from "./MyTasksSection.jsx";

// Lazy load Sidebar — only loaded when user first toggles it open
const Sidebar = lazy(() => import("./Sidebar.jsx"));

const Dashboard = () => {
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useSelector((state) => state.user.location);

  /* Lift task state here so we can refetch after task creation */
  const { tasks, loading, error, deleteTask, renewTask, refetch, banInfo, clearBan } = useMyTasks();

  /* Socket-based notifications (worker arrived / task started) */
  const { notifications, popup, dismissPopup, unreadCount, markAllRead } = useTaskNotifications();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Auto-refetch task list when we get arrival / start events */
  useEffect(() => {
    if (popup) refetch();
  }, [popup]); // eslint-disable-line react-hooks/exhaustive-deps

  /* LOCATE ME HANDLER */
  const handleLocateMe = async () => {
    setLoadingLocation(true);
    try {
      const loc = await getGeolocation();
      dispatch(setUserLocation(loc));
      return loc;
    } catch (error) {
      console.error("Error getting location:", error);
      setIsLocationModalOpen(true);
    } finally {
      setLoadingLocation(false);
    }
  };

  /* HANDLE ENABLE LOCATION FROM MODAL */
  const onEnableLocation = async () => {
    setIsLocationModalOpen(false);
    try {
      const loc = await getGeolocation();
      dispatch(setUserLocation(loc));
    } catch (err) {
      console.error("Still unable to get location:", err);
    }
  };

  /* NEW WORK CLICK HANDLER */
  const handleNewWorkClick = async () => {
    if (!location) {
      const loc = await handleLocateMe();
      if (!loc) return;
    }
    setIsCreateTaskOpen(true);
  };

  /* Close CreateTask and immediately re-fetch task list */
  const handleCreateTaskClose = () => {
    setIsCreateTaskOpen(false);
    refetch(); // pull fresh list so the new task appears
  };

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-black">
      {/* Navbar */}
      <nav className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50 bg-white">
        <div className="flex items-center gap-2">
          <div className="bg-black p-1.5 rounded-lg shadow-sm">
            <Briefcase size={22} className="text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tighter uppercase leading-none block">
              Workify
            </span>
            <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase leading-none">
              Pro Network
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLocateMe}
            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-md transition-all uppercase tracking-wider cursor-pointer"
          >
            <MapPin size={14} />
            Locate Me
          </button>
          <button
            onClick={handleNewWorkClick}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-md transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            <Plus size={14} />
            New Work
          </button>

          {/* ── Notification Bell ── */}
          <button
            onClick={() => { setShowNotifPanel((p) => !p); markAllRead(); }}
            className="relative w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-bounce"
                style={{ minWidth: 18, height: 18 }}>
                {unreadCount}
              </span>
            )}
          </button>

          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="w-9 h-9 border-2 border-black rounded-full flex items-center justify-center ml-1 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            >
              <User size={18} />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 top-12 z-200 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-black text-gray-900">{user?.name || "User"}</p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">{user?.email || ""}</p>
                </div>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/user/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  <span className="font-bold">Profile</span>
                </button>
                <div className="h-px bg-gray-100 mx-3"></div>
                <button
                  onClick={() => { setShowProfileMenu(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} className="text-red-400" />
                  <span className="font-bold">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Sidebar Toggle (hamburger) ── */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer ml-1"
            title="Open panel"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* ── NOTIFICATION PANEL (fixed below sticky navbar) ── */}
      {showNotifPanel && (
        <div className="fixed right-6 top-18 z-200 w-96 max-h-105 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-black uppercase tracking-widest text-gray-900">Notifications</span>
            <button onClick={() => setShowNotifPanel(false)}>
              <XIcon size={16} className="text-gray-400 hover:text-black" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-90 divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-bold uppercase tracking-widest">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-5 py-4 flex gap-3 ${!n.read ? 'bg-blue-50/40' : ''}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.type === 'arrived' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                    {n.type === 'arrived' ? <MapPin size={16} /> : <Zap size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 leading-tight">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                    {n.otp && (
                      <div className="mt-2 bg-black rounded-lg px-3 py-2 text-center">
                        <span className="text-white font-black text-lg tracking-[0.4em] font-mono">{n.otp}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                      {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── ARRIVAL POPUP TOAST ── */}
      {popup && (
        <div className="fixed top-6 right-6 z-9000 animate-slide-in-right">
          <div className={`w-96 rounded-2xl shadow-2xl border overflow-hidden ${popup.type === 'arrived' ? 'bg-linear-to-r from-green-50 to-white border-green-200'
            : popup.type === 'completed' ? 'bg-linear-to-r from-amber-50 to-white border-amber-200'
              : 'bg-linear-to-r from-blue-50 to-white border-blue-200'
            }`}>
            {/* Close button */}
            <button onClick={dismissPopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 z-10">
              <XIcon size={16} />
            </button>

            <div className="p-5 flex gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${popup.type === 'arrived' ? 'bg-green-500 text-white'
                : popup.type === 'completed' ? 'bg-amber-500 text-white'
                  : 'bg-blue-500 text-white'
                }`}>
                {popup.type === 'arrived' ? <MapPin size={22} /> : popup.type === 'completed' ? <CheckCircle size={22} /> : <Zap size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{popup.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{popup.message}</p>

                {popup.type === 'arrived' && popup.otp && (
                  <div className="mt-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Your OTP Code</p>
                    <div className="bg-black rounded-xl px-4 py-3 text-center shadow-inner">
                      <span className="text-white font-black text-3xl tracking-[0.6em] font-mono">{popup.otp}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1.5 text-center">Share this code with the worker · Also sent to your email</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar auto-dismiss indicator */}
            <div className={`h-1 ${popup.type === 'arrived' ? 'bg-green-400'
              : popup.type === 'completed' ? 'bg-amber-400'
                : 'bg-blue-400'
              } animate-shrink-bar`} />
          </div>

          <style>{`
            @keyframes slideInRight {
              from { transform: translateX(120%); opacity: 0; }
              to   { transform: translateX(0); opacity: 1; }
            }
            .animate-slide-in-right {
              animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            @keyframes shrinkBar {
              from { width: 100%; }
              to   { width: 0%; }
            }
            .animate-shrink-bar {
              animation: shrinkBar 8s linear forwards;
            }
          `}</style>
        </div>
      )}

      {/* Hero Section */}
      <main className="grow max-w-7xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <header className="text-center md:text-left">
            <h1 className="text-5xl font-black mb-3 uppercase tracking-tighter">
              Our Services
            </h1>
            <p className="text-gray-500 text-xl font-medium italic">
              Quality help, when you need it.
            </p>
          </header>

          {/* Customer Reach / Stats */}
          <div className="flex justify-center md:justify-end gap-8 border-l-0 md:border-l border-gray-200 md:pl-8">
            <div className="text-center">
              <div className="flex items-center gap-1 text-black font-black text-2xl tracking-tighter">
                <Users size={20} /> 15k+
              </div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                Active Workers
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-black font-black text-2xl tracking-tighter">
                <CheckCircle size={20} /> 50k+
              </div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">
                Tasks Done
              </p>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((item) => (
            <div
              key={item.id}
              className="group relative h-96 w-full overflow-hidden rounded-2xl bg-gray-200 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100"
            >
              {/* Category Image */}
              <img
                src={item.image}
                alt={item.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

              {/* Rating Badge (Top Right) */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 shadow-sm transition-transform group-hover:scale-110">
                <Star size={12} className="fill-black text-black" />
                <span className="text-[11px] font-black">{item.rating}</span>
              </div>

              {/* Text Content */}
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px w-6 bg-gray-400"></div>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
                    {item.completed} Jobs
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white uppercase leading-tight tracking-tighter mb-4">
                  {item.name}
                </h3>

                <button className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 rounded-lg">
                  Explore Workers
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MY POSTED TASKS SECTION */}
        <div className="mt-16">
          <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">
            My Posted Tasks
          </h2>
          <MyTasksSection
            tasks={tasks}
            loading={loading}
            error={error}
            deleteTask={deleteTask}
            renewTask={renewTask}
            refetch={refetch}
            banInfo={banInfo}
            clearBan={clearBan}
          />
        </div>
      </main>

      {/* Footer (Simplified) */}
      <footer className="border-t border-gray-100 py-10 px-6 mt-12 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-gray-400">
          <span className="text-lg font-black text-black uppercase tracking-tighter">
            Workify
          </span>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-black transition-colors">
              Safety
            </a>
            <a href="#" className="hover:text-black transition-colors">
              Support
            </a>
            <a href="#" className="hover:text-black transition-colors">
              Join as Worker
            </a>
          </div>
          <p className="text-[10px] font-bold uppercase">© 2026 WORKIFY</p>
        </div>
      </footer>

      {/* LOCATION PERMISSION MODAL */}
      {isLocationModalOpen && !location && (
        <LocationPermissionModal
          onEnableLocation={onEnableLocation}
          isLoading={loadingLocation}
        />
      )}

      {/* CREATE TASK MODAL OVERLAY */}
      {isCreateTaskOpen && (
        <div className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full h-full">
            <CreateTask onClose={handleCreateTaskClose} />
          </div>
        </div>
      )}

      {/* ── SIDEBAR (lazy loaded) ── */}
      <Suspense fallback={null}>
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </Suspense>
    </div>
  );
};

export default Dashboard;
