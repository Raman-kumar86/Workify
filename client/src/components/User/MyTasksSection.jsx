import React, { useState } from "react";
import {
  Briefcase,
  ChevronRight,
  Clock,
  AlertCircle,
  IndianRupee,
  RefreshCw,
  X as XIcon,
} from "lucide-react";
import CustomErrorModal from "../constants/CustomErrorModal.jsx";
import TaskDetailsModal from "./TaskDetailsModal.jsx";
import UserBanScreen from "./UserBanScreen.jsx";

const MyTasksSection = ({ tasks, loading, error, deleteTask, renewTask, refetch, banInfo, clearBan }) => {
  const [selectedTask, setSelectedTask] = useState(null);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Handle global errors
  React.useEffect(() => {
    if (error) {
      setErrorModal({ isOpen: true, message: error });
    }
  }, [error]);

  // Show ban screen immediately when banInfo arrives
  if (banInfo) {
    return <UserBanScreen banInfo={banInfo} onDismiss={clearBan} />;
  }

  const handleDismissError = () => {
    setErrorModal({ isOpen: false, message: "" });
  };

  const handleRenew = async (taskId) => {
    try {
      await renewTask(taskId);
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message || "Failed to renew task" });
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (e) {
      setErrorModal({ isOpen: true, message: e.message || "Failed to delete task" });
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );

  if (!tasks || tasks.length === 0) return (
    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
      <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-bold text-gray-900">No Works Posted Yet</h3>
      <p className="text-gray-500">Create your first task to get started.</p>
    </div>
  );

  // ── Status tab definitions ──
  const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "assigned", label: "Assigned" },
    { key: "inProgress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "expired", label: "Expired" },
  ];

  // ── Derive filtered + sorted list ──
  let filtered = tasks;

  // Status filter
  if (statusFilter !== "all") {
    filtered = filtered.filter((t) => {
      const isExp =
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        (t.status === "expired" || (t.expiresAt && new Date(t.expiresAt) < new Date()));
      if (statusFilter === "expired") return isExp;
      if (statusFilter === "open") return t.status === "open" || t.status === "pending";
      return t.status === statusFilter && !isExp;
    });
  }

  // Search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.taskType?.toLowerCase().includes(q) ||
        t.subcategory?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "priceHigh":
        return (b.price || 0) - (a.price || 0);
      case "priceLow":
        return (a.price || 0) - (b.price || 0);
      default: // newest
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  // Count per status for badges
  const countFor = (key) => {
    if (key === "all") return tasks.length;
    return tasks.filter((t) => {
      const isExp =
        t.status !== "completed" &&
        t.status !== "cancelled" &&
        (t.status === "expired" || (t.expiresAt && new Date(t.expiresAt) < new Date()));
      if (key === "expired") return isExp;
      if (key === "open") return t.status === "open" || t.status === "pending";
      return t.status === key && !isExp;
    }).length;
  };

  return (
    <>
      <CustomErrorModal
        isOpen={errorModal.isOpen}
        onClose={handleDismissError}
        title="Task Error"
        message={errorModal.message}
      />

      <TaskDetailsModal
        isOpen={!!selectedTask}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onRenew={handleRenew}
        onDelete={handleDelete}
      />

      {/* ── Filter / Search / Sort bar ── */}
      <div className="mb-6 space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map((tab) => {
            const count = countFor(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1.5 ${statusFilter === tab.key
                    ? "bg-black text-white shadow-md"
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search tasks by title, type, or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all bg-white"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black">
                <XIcon size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priceHigh">Price: High → Low</option>
            <option value="priceLow">Price: Low → High</option>
          </select>
        </div>
      </div>

      {/* ── Results count ── */}
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
        {filtered.length} {filtered.length === 1 ? "task" : "tasks"} found
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No tasks match your filters</p>
          <button onClick={() => { setStatusFilter("all"); setSearchQuery(""); }} className="mt-3 text-xs font-bold underline text-gray-500 hover:text-black">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((task) => {
            const isExpired =
              task.status !== "completed" &&
              task.status !== "cancelled" &&
              (
                task.status === "expired" ||
                (task.expiresAt && new Date(task.expiresAt) < new Date())
              );

            return (
              <div
                key={task._id}
                className={`
                    relative bg-white rounded-3xl overflow-hidden transition-all duration-500 group
                    ${isExpired ? 'border-2 border-red-100 shadow-red-100/50' : 'border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1'}
                `}
              >
                {/* STATUS BADGE */}
                <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm flex items-center gap-1.5 ${task.status === 'completed' ? 'bg-green-100 text-green-700' :
                  task.status === 'inProgress' ? 'bg-blue-100 text-blue-700' :
                    task.status === 'assigned' ? 'bg-purple-100 text-purple-700' :
                      isExpired ? 'bg-red-500 text-white animate-pulse' :
                        'bg-black text-white'
                  }`}>
                  {isExpired && <AlertCircle size={10} />}
                  {isExpired ? 'Expired' : task.status}
                </div>

                {/* IMAGE HEADER (if exists) */}
                <div className="h-32 w-full bg-gray-100 relative overflow-hidden cursor-pointer" onClick={() => setSelectedTask(task)}>
                  {task.images && task.images.length > 0 ? (
                    <img
                      src={task.images[0]}
                      alt={task.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <Briefcase size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                </div>

                {/* CARD BODY */}
                <div className="p-6 relative -mt-6">
                  <div className="bg-white rounded-t-2xl pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      {task.taskType} {task.subcategory && `• ${task.subcategory}`}
                    </p>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-gray-900 leading-none mb-4 cursor-pointer hover:underline decoration-2 underline-offset-4" onClick={() => setSelectedTask(task)}>
                      {task.title}
                    </h3>

                    {/* KEY DETAILS */}
                    <div className="space-y-3 mb-6">
                      {/* PRICE */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                          <IndianRupee size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Budget</p>
                          <p className="text-sm font-bold text-gray-900">₹{task.price}</p>
                        </div>
                      </div>

                      {/* DATE */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-900">
                          <Clock size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Posted Date</p>
                          <p className="text-sm font-bold text-gray-900">{new Date(task.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                      {isExpired && (
                        <button
                          onClick={() => handleRenew(task._id)}
                          className="flex-1 py-3 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-red-500/30 flex items-center justify-center gap-2"
                        >
                          <RefreshCw size={14} className="animate-spin-slow" /> Renew Task
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedTask(task)}
                        className={`${isExpired ? "flex-1" : "w-full"} py-2.5 bg-gray-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1 shadow-md hover:shadow-xl transform active:scale-95`}
                      >
                        More Info <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default MyTasksSection;
