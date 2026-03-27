import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useSetWorkerAvailability from "../../hooks/worker/useSetWorkerAvailability";
import useWorkerProfile from "../../hooks/worker/useWorkerProfile";
import useAvailableTasks from "../../hooks/worker/useAvailableTasks";
import useAcceptTask from "../../hooks/worker/useAcceptTask";
import useCompleteTask from "../../hooks/worker/useCompleteTask";
import useRejectTask from "../../hooks/worker/useRejectTask";
import useWorkerNotifications from "../../hooks/worker/useWorkerNotifications";
import useOTPActions from "../../hooks/worker/useOTPActions";
import useCategories from "../../hooks/useCategories";
import TaskDetailsModal from "./TaskDetailsModal";
import WorkerNavigationMap from "./WorkerNavigationMap";
import useLocationBroadcast, {
  bearingToLabel,
} from "../../hooks/worker/useLocationBroadcast";
import { DISTANCE_OPTIONS } from "../../constants/task.constants";
import ErrorModal from "./ErrorModal";
import SuccessModal from "./SuccessModal";
import BannedScreen from "./BannedScreen";
import BanWarningModal from "./BanWarningModal";
import WorkSummaryModal from "./WorkSummaryModal";
import {
  Briefcase,
  Power,
  Wallet,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  Bell,
  ArrowUpRight,
  Filter,
  X,
  AlertTriangle,
  Navigation,
  Map as MapIcon,
  ShieldCheck,
  Zap,
  IndianRupee,
  Compass,
  LogOut,
  User,
  Menu,
  Search,
} from "lucide-react";
import { Timer } from "lucide-react";

const WorkerSidebar = lazy(() => import("./WorkerSidebar.jsx"));

// ... WorkerDashboard component ...
const WorkerDashboard = () => {
  const navigate = useNavigate();
  // ... hooks ...
  const {
    worker,
    activeTask,
    loading: profileLoading,
    refetch: refetchProfile,
  } = useWorkerProfile();
  const { setAvailability, loading: toggleLoading } =
    useSetWorkerAvailability();
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    fetchTasks,
    setError: setTasksError,
  } = useAvailableTasks();
  const { categories } = useCategories();
  const {
    acceptTask,
    loading: acceptLoading,
    error: acceptError,
  } = useAcceptTask();
  const {
    completeTask,
    loading: completeLoading,
    error: completeError,
  } = useCompleteTask();
  const {
    rejectTask,
    loading: rejectLoading,
    error: rejectError,
  } = useRejectTask();

  const [isOnline, setIsOnline] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(10);
  const [customDistance, setCustomDistance] = useState("");
  const [isCustomDistance, setIsCustomDistance] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showNavMap, setShowNavMap] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileMenuRef = useRef(null);
  // OTP state
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const { markArrived, submitOTP, arrivedLoading, otpLoading } =
    useOTPActions();
  const {
    notifications: workerNotifs,
    popup: workerPopup,
    dismissPopup: dismissWorkerPopup,
    unreadCount: workerUnread,
    markAllRead: markAllReadWorker,
  } = useWorkerNotifications();
  const { logout } = useAuth();

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Live elapsed-time counter (runs for ALL active task statuses) ──
  const [elapsed, setElapsed] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    clearInterval(timerRef.current);

    const isActive =
      activeTask &&
      ["assigned", "arrived", "inProgress"].includes(activeTask.status);

    if (!isActive) {
      setElapsed("");
      return;
    }

    // Priority: inProgressAt (explicit work-start) → otpVerifiedAt → arrivedAt → acceptedAt
    const rawStart =
      activeTask.inProgressAt ||
      activeTask.otpVerifiedAt ||
      activeTask.arrivedAt ||
      activeTask.acceptedAt;

    const startTime = rawStart ? new Date(rawStart).getTime() : null;

    if (!startTime || isNaN(startTime)) {
      setElapsed("");
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(
        d > 0
          ? `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`
          : h > 0
            ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
            : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`,
      );
    };
    tick();
    timerRef.current = setInterval(tick, 1000);

    return () => clearInterval(timerRef.current);
  }, [
    activeTask?.status,
    activeTask?.inProgressAt,
    activeTask?.otpVerifiedAt,
    activeTask?.arrivedAt,
    activeTask?.acceptedAt,
  ]);

  // ── Real-time GPS tracking (active only when task exists) ──
  const { isTracking, speed, bearing, workerCoords } = useLocationBroadcast(
    activeTask?._id || null,
  );
  // ... (Fetch tasks effect remains same) ...
  useEffect(() => {
    if (worker) {
      setIsOnline(worker.isOnline); // Sync local state with DB
      if (worker.currentLocation) {
        const [lng, lat] = worker.currentLocation.coordinates;
        fetchTasks({ lat, lng, distance: selectedDistance });
      }
    }
  }, [worker, selectedDistance, fetchTasks]);

  // Derived state for ban
  const isBanned =
    worker?.banExpiresAt && new Date(worker.banExpiresAt) > new Date();
  const banExpiresAt = worker?.banExpiresAt;
  const getTaskWorkerPercent = (task) => {
    if (typeof task?.workerFeePercent === "number") return task.workerFeePercent;
    if (typeof task?.platformFeePercent === "number") {
      return 100 - task.platformFeePercent;
    }
    return 90;
  };

  const getTaskWorkerEarnings = (task) =>
    Math.round((task?.price || 0) * (getTaskWorkerPercent(task) / 100));

  const resolveTaskTypeLabel = (taskType) => {
    if (!taskType) return "";
    return categories.find((category) => category._id === taskType)?.name || taskType;
  };

  // If banned, show BannedScreen
  if (isBanned) {
    return <BannedScreen banExpiresAt={banExpiresAt} />;
  }

  // If not verified
  if (worker && worker.status !== "verified") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl maxWidth-md text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-yellow-600" size={40} />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">
            Verification Pending
          </h2>
          <p className="text-gray-500 font-medium">
            Your profile is currently under review or rejected.
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4">
            Status: {worker.status}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-black text-white rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-800"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  const handleToggleAvailability = async () => {
    // Check ban first
    if (isBanned) {
      alert(
        `You are banned until ${new Date(banExpiresAt).toLocaleTimeString()}`,
      );
      return;
    }

    if (activeTask) {
      alert("You cannot change availability while you have an active task.");
      return;
    }

    try {
      const newStatus = !isOnline;
      setIsOnline(newStatus);
      await setAvailability(newStatus);
      refetchProfile();
    } catch (error) {
      setIsOnline(!isOnline);
      console.error("Failed to toggle availability:", error);
    }
  };

  const handleDistanceChange = (distance) => {
    setSelectedDistance(distance);
    setIsCustomDistance(false);
    setCustomDistance("");
    if (worker && worker.currentLocation) {
      const [lng, lat] = worker.currentLocation.coordinates;
      fetchTasks({ lat, lng, distance });
    }
  };

  const handleCustomDistanceSubmit = (e) => {
    e.preventDefault();
    if (
      customDistance &&
      !isNaN(customDistance) &&
      Number(customDistance) > 0
    ) {
      setIsCustomDistance(true);
      setSelectedDistance(Number(customDistance));
      if (worker && worker.currentLocation) {
        const [lng, lat] = worker.currentLocation.coordinates;
        fetchTasks({ lat, lng, distance: Number(customDistance) });
      }
    }
  };

  const calculateDistance = (taskLocation) => {
    if (!worker || !worker.currentLocation || !taskLocation) return null;
    const [lng1, lat1] = worker.currentLocation.coordinates;
    const [lng2, lat2] = taskLocation.coordinates;

    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d.toFixed(1);
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await acceptTask(taskId);
      setSelectedTask(null);
      if (worker && worker.currentLocation) {
        const [lng, lat] = worker.currentLocation.coordinates;
        const distance =
          isCustomDistance && customDistance
            ? parseFloat(customDistance)
            : selectedDistance;
        fetchTasks({ lat, lng, distance });
      }
      await refetchProfile();
      setShowSuccessModal(true);
    } catch (err) {
      if (err.response?.data?.hasActiveTask) {
        setSelectedTask(null);
        setTimeout(() => {
          document
            .getElementById("active-task-section")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        return;
      }
      console.error("Failed to accept task", err);
      setTasksError(
        err.response?.data?.message || err.message || "Failed to accept task",
      );
    }
  };

  const handleCompleteTask = async () => {
    if (!activeTask) return;
    setShowCompleteModal(true);
  };

  const confirmCompleteTask = async (workSummary) => {
    try {
      await completeTask(activeTask._id, workSummary);
      setShowCompleteModal(false);
      await refetchProfile();
    } catch (err) {
      console.error(err);
      alert(
        "Failed to complete task: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleRejectTaskConfirm = async (reason) => {
    if (!activeTask) return;
    try {
      await rejectTask(activeTask._id, reason);
      setShowBanModal(false);
      await refetchProfile();
    } catch (err) {
      console.error(err);
      alert(
        "Failed to reject task: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleMarkArrived = async () => {
    if (!activeTask) return;
    try {
      await markArrived(activeTask._id);
      // Refetch to get updated task.status = 'arrived'
      await refetchProfile();
      setOtpInput("");
      setOtpError(null);
    } catch (err) {
      alert("Failed to mark arrival: " + err.message);
    }
  };

  const handleSubmitOTP = async () => {
    if (!activeTask || otpInput.trim().length !== 4) {
      setOtpError("Please enter the 4-digit code.");
      return;
    }
    setOtpError(null);
    try {
      await submitOTP(activeTask._id, otpInput.trim());
      setOtpSuccess(true);
      await refetchProfile(); // updates task to inProgress
    } catch (err) {
      if (err.expired) {
        setOtpError('⏱ Code expired. Tap "I\'ve Arrived" again to resend.');
      } else {
        setOtpError(err.message || "Incorrect code. Try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-black relative">
      <ErrorModal
        error={tasksError || acceptError || completeError || rejectError}
        onClose={() => setTasksError(null)}
      />
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        task={activeTask}
      />

      {/* Worker Sidebar */}
      <Suspense fallback={null}>
        <WorkerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </Suspense>
      <BanWarningModal
        isOpen={showBanModal}
        onClose={() => setShowBanModal(false)}
        onConfirm={handleRejectTaskConfirm}
        rejecting={rejectLoading}
      />

      <TaskDetailsModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        task={selectedTask}
        hasActiveTask={!!activeTask}
        hasOutstandingFees={(worker?.outstandingFines || 0) > 0}
        outstandingFeeAmount={worker?.outstandingFines || 0}
        onAccept={handleAcceptTask}
        loading={acceptLoading}
        workerLocation={worker?.currentLocation}
        isActiveTask={!!activeTask && selectedTask?._id === activeTask?._id}
        onReject={() => {
          setSelectedTask(null);
          setShowBanModal(true);
        }}
        onNavigate={() => {
          setSelectedTask(null);
          setShowNavMap(true);
        }}
        onComplete={() => {
          setSelectedTask(null);
          setShowCompleteModal(true);
        }}
        onPayNow={() => navigate("/worker/payments")}
        onMarkArrived={handleMarkArrived}
        arrivedLoading={arrivedLoading}
        activeTaskStatus={activeTask?.status}
      />

      {/* ── WORK SUMMARY MODAL (completion) ── */}
      <WorkSummaryModal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={confirmCompleteTask}
        loading={completeLoading}
        task={activeTask}
        elapsed={elapsed}
      />

      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-2 rounded-xl">
            <Briefcase size={20} />
          </div>
          <span className="text-lg font-black tracking-tighter uppercase">
            Workify<span className="text-gray-400">Pro</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Availability Toggle / Ban Status */}
          <div className="flex items-center gap-3">
            {isBanned ? (
              <div className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-200 flex items-center gap-1">
                <AlertTriangle size={12} />
                Banned until{" "}
                {new Date(banExpiresAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ) : (
              <>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest ${activeTask || isOnline ? "text-green-600" : "text-gray-400"}`}
                >
                  {activeTask ? "Busy" : isOnline ? "Online" : "Offline"}
                </span>
                <button
                  onClick={handleToggleAvailability}
                  disabled={toggleLoading || profileLoading || !!activeTask}
                  className={`w-14 h-8 rounded-full flex items-center p-1 transition-all duration-300 ${activeTask || isOnline ? "bg-black" : "bg-gray-200"} ${toggleLoading || activeTask ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${activeTask || isOnline ? "translate-x-6" : "translate-x-0"} flex items-center justify-center`}
                  >
                    <Power
                      size={12}
                      className={isOnline ? "text-black" : "text-gray-300"}
                    />
                  </div>
                </button>
              </>
            )}
          </div>

          <div className="w-px h-6 bg-gray-200"></div>

          {/* Notification Bell */}
          <button
            onClick={() => {
              setShowNotifPanel((p) => !p);
              markAllReadWorker();
            }}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <Bell size={20} className="text-gray-600" />
            {workerUnread > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce"
                style={{ minWidth: 18, height: 18 }}
              >
                {workerUnread}
              </span>
            )}
          </button>

          {/* Hamburger — opens sidebar */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
        </div>
      </nav>

      {/* ── WORKER NOTIFICATION PANEL ── */}
      {showNotifPanel && (
        <div className="fixed right-6 top-18 z-200 w-96 max-h-105 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <span className="text-xs font-black uppercase tracking-widest text-gray-900">
              Notifications
            </span>
            <button onClick={() => setShowNotifPanel(false)}>
              <X size={16} className="text-gray-400 hover:text-black" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-90 divide-y divide-gray-50">
            {workerNotifs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  No notifications yet
                </p>
              </div>
            ) : (
              workerNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`px-5 py-4 flex gap-3 ${!n.read ? "bg-blue-50/40" : ""}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      n.type === "task_assigned"
                        ? "bg-green-100 text-green-600"
                        : n.type === "task_cancelled"
                          ? "bg-red-100 text-red-600"
                          : n.type === "completed"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {n.type === "task_assigned" ? (
                      <Briefcase size={16} />
                    ) : n.type === "task_cancelled" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Zap size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 leading-tight">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                      {new Date(n.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── WORKER POPUP TOAST ── */}
      {workerPopup && (
        <div className="fixed top-6 right-6 z-9000 animate-slide-in-right">
          <div
            className={`w-96 rounded-2xl shadow-2xl border overflow-hidden ${
              workerPopup.type === "task_assigned"
                ? "bg-linear-to-r from-green-50 to-white border-green-200"
                : workerPopup.type === "task_cancelled"
                  ? "bg-linear-to-r from-red-50 to-white border-red-200"
                  : "bg-linear-to-r from-blue-50 to-white border-blue-200"
            }`}
          >
            <button
              onClick={dismissWorkerPopup}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 z-10"
            >
              <X size={16} />
            </button>
            <div className="p-5 flex gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  workerPopup.type === "task_assigned"
                    ? "bg-green-500 text-white"
                    : workerPopup.type === "task_cancelled"
                      ? "bg-red-500 text-white"
                      : "bg-blue-500 text-white"
                }`}
              >
                {workerPopup.type === "task_assigned" ? (
                  <Briefcase size={22} />
                ) : workerPopup.type === "task_cancelled" ? (
                  <AlertTriangle size={22} />
                ) : (
                  <Zap size={22} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-sm uppercase tracking-tight">
                  {workerPopup.title}
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {workerPopup.message}
                </p>
              </div>
            </div>
            <div
              className={`h-1 ${
                workerPopup.type === "task_assigned"
                  ? "bg-green-400"
                  : workerPopup.type === "task_cancelled"
                    ? "bg-red-400"
                    : "bg-blue-400"
              } animate-shrink-bar`}
            />
          </div>
          <style>{`
            @keyframes slideInRight { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.22,1,0.36,1); }
            @keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }
            .animate-shrink-bar { animation: shrinkBar 8s linear forwards; }
          `}</style>
        </div>
      )}

      <main className="max-w-6xl mx-auto w-full p-6 space-y-8">
        {/* ── Worker Navigation Map overlay ──────────────────────── */}
        {showNavMap && activeTask && (
          <WorkerNavigationMap
            task={activeTask}
            workerCoords={workerCoords}
            speed={speed}
            bearing={bearing}
            isTracking={isTracking}
            onClose={() => setShowNavMap(false)}
          />
        )}

        {/* ACTIVE TASK CARD */}
        {activeTask && (
          <div
            id="active-task-section"
            className="bg-black text-white rounded-3xl p-8 relative overflow-hidden shadow-2xl animate-fade-in-up"
          >
            {/* Background Blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="relative z-10">
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-sm p-2 pr-4 rounded-full border border-zinc-800">
                  <div className="bg-green-500 p-1.5 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                    <Zap size={14} fill="currentColor" className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
                    In Progress
                  </span>
                </div>

                {/* ── Tracking Active badge (hide when inProgress — worker already arrived) ── */}
                {isTracking && activeTask.status !== "inProgress" && (
                  <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                    <Navigation size={12} className="text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                      {speed} km/h · {bearingToLabel(bearing)}
                    </span>
                  </div>
                )}
              </div>

              {/* Title & Address */}
              <div className="mb-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">
                  {activeTask.title}
                </h3>
                <div className="flex items-center gap-2 text-gray-400">
                  <MapIcon size={16} />
                  <p className="font-bold text-sm tracking-wide">
                    {activeTask.address}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <IndianRupee size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Task Price
                    </span>
                  </div>
                  <p className="text-2xl font-black tracking-tighter">
                    ₹{activeTask.price}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">
                    Earning: ₹{getTaskWorkerEarnings(activeTask)}
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Clock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Est. Time
                    </span>
                  </div>
                  <p className="text-2xl font-black tracking-tighter">
                    {activeTask.estimatedDurationMinutes || "--"} min
                  </p>
                </div>
              </div>

              {/* ─── STATUS-AWARE ACTION AREA ─────────────────────────── */}

              {/* ASSIGNED: Show "I've Arrived" button */}
              {activeTask.status === "assigned" && (
                <div className="mt-2">
                  {/* Elapsed timer from acceptance */}
                  {elapsed && (
                    <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700 px-4 py-3 rounded-2xl mb-3">
                      <Timer size={16} className="text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Time Since Accepted
                      </span>
                      <span className="ml-auto text-lg font-black tracking-tight text-gray-200 font-mono">
                        {elapsed}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={handleMarkArrived}
                    disabled={arrivedLoading}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white disabled:opacity-60"
                  >
                    {arrivedLoading ? (
                      <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <MapPin size={18} />
                        <span>I've Arrived</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-gray-500 text-xs mt-2">
                    Tap when you reach the job location. An OTP will be sent to
                    the client's email.
                  </p>
                </div>
              )}

              {/* ARRIVED: Show OTP input */}
              {activeTask.status === "arrived" && (
                <div className="mt-2 bg-zinc-900/70 rounded-2xl border border-zinc-700 p-5">
                  {/* Elapsed timer */}
                  {elapsed && (
                    <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 px-3 py-2 rounded-xl mb-4">
                      <Timer size={14} className="text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Time Since Accepted
                      </span>
                      <span className="ml-auto font-black tracking-tight text-gray-200 font-mono text-sm">
                        {elapsed}
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-black uppercase tracking-widest text-green-400 mb-1">
                    OTP sent to client's email
                  </p>
                  <p className="text-gray-400 text-xs mb-4">
                    Ask the client for the 4-digit code and enter it below to
                    start the task.
                  </p>

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setOtpInput(v);
                      setOtpError(null);
                    }}
                    placeholder="• • • •"
                    className="w-full text-center text-3xl font-black tracking-[0.5em] bg-white/5 border border-zinc-600 rounded-xl px-4 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 mb-3"
                  />

                  {otpError && (
                    <p className="text-red-400 text-xs text-center mb-3 font-bold">
                      {otpError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkArrived}
                      disabled={arrivedLoading}
                      className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-gray-300 text-xs font-bold uppercase tracking-widest border border-zinc-700 disabled:opacity-50"
                      title="Resend OTP"
                    >
                      {arrivedLoading ? "↻" : "↻ Resend"}
                    </button>
                    <button
                      onClick={handleSubmitOTP}
                      disabled={otpLoading || otpInput.length !== 4}
                      className="flex-1 bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {otpLoading ? "Verifying…" : "✔ Verify & Start"}
                    </button>
                  </div>
                </div>
              )}

              {/* IN PROGRESS: Timer + Complete + Details + Reject (no Navigate — worker already arrived) */}
              {(activeTask.status === "inProgress" || !activeTask.status) && (
                <div>
                  {/* Live elapsed timer */}
                  {elapsed && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-2xl mb-3">
                      <Timer size={16} className="text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                        Working Time
                      </span>
                      <span className="ml-auto text-lg font-black tracking-tight text-amber-300 font-mono">
                        {elapsed}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    {/* Complete */}
                    <button
                      onClick={handleCompleteTask}
                      disabled={completeLoading}
                      className="flex-1 bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70"
                    >
                      {completeLoading ? (
                        "Completing..."
                      ) : (
                        <>
                          <CheckCircle
                            size={20}
                            className="group-hover:scale-110 transition-transform"
                          />
                          <span>Complete</span>
                        </>
                      )}
                    </button>

                    {/* Details */}
                    <button
                      className="bg-zinc-800 text-white px-5 rounded-2xl hover:bg-zinc-700 transition-all active:scale-[0.98] border border-zinc-700"
                      onClick={() => setSelectedTask(activeTask)}
                    >
                      <ArrowUpRight size={22} />
                    </button>

                    {/* Reject */}
                    <button
                      onClick={() => setShowBanModal(true)}
                      className="bg-red-500/10 text-red-500 px-4 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] border border-red-500/20 hover:border-red-500"
                      title="Reject Task"
                    >
                      <X size={22} />
                    </button>
                  </div>
                </div>
              )}

              {/* ASSIGNED / ARRIVED: also show Details  + Reject below the main action */}
              {(activeTask.status === "assigned" ||
                activeTask.status === "arrived") && (
                <div className="flex gap-2 mt-3">
                  <button
                    className="flex-1 bg-zinc-800 text-white py-3 rounded-2xl hover:bg-zinc-700 transition-all border border-zinc-700 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                    onClick={() => setSelectedTask(activeTask)}
                  >
                    <ArrowUpRight size={16} /> Details
                  </button>
                  <button
                    onClick={() => setShowBanModal(true)}
                    className="bg-red-500/10 text-red-500 px-5 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-[0.98] border border-red-500/20 hover:border-red-500"
                    title="Reject Task"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dynamic Feed Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Task Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-xl font-black uppercase tracking-tighter">
                {activeTask
                  ? "Nearby Opportunities (Queued)"
                  : "Nearby Opportunities"}
              </h3>

              {/* Distance Filter - Show if Online OR Active Task */}
              {(isOnline || activeTask) && (
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                  {DISTANCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleDistanceChange(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        !isCustomDistance && selectedDistance === opt.value
                          ? "bg-black text-white shadow-md"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <div className="h-4 w-px bg-gray-200 mx-1"></div>
                  <form
                    onSubmit={handleCustomDistanceSubmit}
                    className="flex items-center"
                  >
                    <input
                      type="number"
                      min={0}
                      placeholder="Custom"
                      value={customDistance}
                      onChange={(e) => setCustomDistance(e.target.value)}
                      className={`w-16 px-2 py-1 text-xs font-bold border rounded-l-lg focus:outline-none focus:ring-1 focus:ring-black ${
                        isCustomDistance
                          ? "border-black bg-gray-50"
                          : "border-gray-200"
                      }`}
                    />
                    <button
                      type="submit"
                      className={`px-2 py-1 rounded-r-lg text-[10px] font-bold uppercase tracking-widest border border-l-0 transition-all ${
                        isCustomDistance
                          ? "bg-black text-white border-black"
                          : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      km
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Search bar */}
            {(isOnline || activeTask) && (
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search by title, type, or address…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent shadow-sm placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* FEED CONTENT LOGIC */}
            {!isOnline && !activeTask ? (
              <div className="bg-gray-100 rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm italic">
                  Go Online to see available tasks in your area
                </p>
              </div>
            ) : tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-100 p-6 rounded-2xl animate-pulse h-40"
                  ></div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm italic">
                  No tasks found within this range.
                </p>
                <button
                  onClick={() => setSelectedDistance(100)}
                  className="mt-4 text-xs font-bold underline"
                >
                  Try increasing distance
                </button>
              </div>
            ) : (
              (() => {
                const q = searchQuery.trim().toLowerCase();
                const filteredTasks = q
                  ? tasks.filter(
                      (t) =>
                        t.title?.toLowerCase().includes(q) ||
                        resolveTaskTypeLabel(t.taskType)?.toLowerCase().includes(q) ||
                        t.subcategory?.toLowerCase().includes(q) ||
                        t.address?.toLowerCase().includes(q),
                    )
                  : tasks;

                if (filteredTasks.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                      <Search
                        size={28}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-sm italic">
                        No tasks match "{searchQuery}"
                      </p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className="mt-4 text-xs font-bold underline"
                      >
                        Clear search
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => {
                      const dist = calculateDistance(task.location);
                      return (
                        <div
                          key={task._id}
                          className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-black transition-all group shadow-sm hover:shadow-md"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded">
                                {resolveTaskTypeLabel(task.taskType)}
                              </span>
                              {task.subcategory && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded">
                                  {task.subcategory}
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-black uppercase tracking-tighter group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h4>

                            {/* Address */}
                            <div className="flex items-center gap-1.5 mt-1 mb-2">
                              <MapIcon size={12} className="text-gray-400" />
                              <p className="text-xs font-bold text-gray-500 line-clamp-1">
                                {task.address || "Location not specified"}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs font-medium">
                              <div className="flex items-center gap-1">
                                <Navigation
                                  size={14}
                                  className={
                                    dist && dist < 5 ? "text-green-600" : ""
                                  }
                                />
                                {dist ? `${dist} km away` : "Nearby"}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                {task.estimatedDurationMinutes
                                  ? `${task.estimatedDurationMinutes} mins`
                                  : "Flexible"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                            <div className="text-right">
                              <p className="text-2xl font-black tracking-tighter">
                                ₹{task.price}
                              </p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">
                                Earning: ₹{getTaskWorkerEarnings(task)}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="bg-black text-white p-4 rounded-xl hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                            >
                              <ArrowUpRight size={20} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>

          {/* Quick Actions / Recent Activity */}
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">
              Account
            </h3>

            <div className="bg-white border border-gray-200 p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-4 text-gray-400">
                <Star size={24} />
                <span className="text-[10px] font-bold uppercase tracking-widest italic">
                  Rating
                </span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter flex items-center gap-2">
                <Star size={28} className="text-amber-500" fill="currentColor" />
                {typeof worker?.rating === "number" ? worker.rating.toFixed(1) : "N/A"}
                <span className="text-sm font-bold text-gray-400">/ 5</span>
              </h2>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    size={14}
                    className={value <= Math.round(Number(worker?.rating || 0)) ? "text-amber-500" : "text-gray-300"}
                    fill={value <= Math.round(Number(worker?.rating || 0)) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-2 font-medium">
                {worker?.completedTasks || 0} Completed Tasks
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Earnings</p>
                <p className="text-2xl font-black text-green-700 mt-1">₹{Number(worker?.totalEarnings || 0).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pending Amount</p>
                <p className="text-2xl font-black text-amber-700 mt-1">₹{Number(worker?.outstandingFines || 0).toLocaleString("en-IN")}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Withdrawable</p>
                <p className="text-2xl font-black text-blue-700 mt-1">
                  ₹{Math.max(0, Number(worker?.totalEarnings || 0) + Number(worker?.walletCredit || 0) - Number(worker?.totalWithdrawn || 0)).toLocaleString("en-IN")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/worker/payments")}
                className="w-full bg-black text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
              >
                Open Payments / Withdraw
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerDashboard;
