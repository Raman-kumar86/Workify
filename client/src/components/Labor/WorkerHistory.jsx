import React, { useEffect, lazy, Suspense, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Clock,
  CheckCircle,
  IndianRupee,
  MapPin,
  User,
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
  Menu,
  Search,
  X,
} from "lucide-react";
import useWorkerHistory from "../../hooks/worker/useWorkerHistory.jsx";
import { useAuth } from "../context/AuthContext";

const WorkerSidebar = lazy(() => import("./WorkerSidebar.jsx"));

/* ── helpers ─────────────────────────────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const calcDuration = (start, end) => {
  if (!start || !end) return null;
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

const WorkerHistory = () => {
  const navigate = useNavigate();
  const { tasks, loading, error, hasMore, total, stats, fetchHistory, loadMore } =
    useWorkerHistory();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const didFetch = useRef(false);

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchHistory();
    }
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-black">
      {/* Sidebar */}
      <Suspense fallback={null}>
        <WorkerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </Suspense>

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/worker/dashboard")}
            className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-2 rounded-xl">
              <Briefcase size={18} />
            </div>
            <span className="text-lg font-black tracking-tighter uppercase">
              Workify<span className="text-gray-400">Pro</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <Menu size={18} />
        </button>
      </nav>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Work History</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {total} completed task{total !== 1 ? "s" : ""}
            </p>
          </div>
          {total > 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-xs font-black uppercase tracking-widest text-green-700">
                {total} Jobs Done
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Earnings</p>
            <p className="text-2xl font-black text-green-700 mt-1">₹{Number(stats?.totalEarnings || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Withdrawn</p>
            <p className="text-2xl font-black text-gray-900 mt-1">₹{Number(stats?.totalWithdrawn || 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Withdrawable</p>
            <p className="text-2xl font-black text-blue-700 mt-1">₹{Number(stats?.withdrawableAmount || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Search bar */}
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
            <AlertCircle size={18} className="text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && tasks.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse h-36" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && tasks.length === 0 && !error && (
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">
              No completed tasks yet
            </p>
            <p className="text-xs text-gray-300 font-bold mt-1">
              Completed tasks will appear here
            </p>
          </div>
        )}

        {/* Task cards */}
        <div className="space-y-4">
          {(() => {
            const q = searchQuery.trim().toLowerCase();
            const filtered = q
              ? tasks.filter(
                  (t) =>
                    t.title?.toLowerCase().includes(q) ||
                    t.taskType?.toLowerCase().includes(q) ||
                    t.subcategory?.toLowerCase().includes(q) ||
                    t.address?.toLowerCase().includes(q)
                )
              : tasks;

            if (q && filtered.length === 0) {
              return (
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
                  <Search size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-black uppercase tracking-widest text-gray-400">
                    No tasks match "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-3 text-xs font-bold underline"
                  >
                    Clear search
                  </button>
                </div>
              );
            }

            return filtered.map((task) => {
            const platformFeePercent = typeof task.platformFeePercent === "number" ? task.platformFeePercent : 10;
            const workerEarned = Math.round((task.price || 0) * ((100 - platformFeePercent) / 100));
            const duration = calcDuration(task.inProgressAt, task.completedAt);
            return (
              <div
                key={task._id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded">
                        {task.taskType}
                      </span>
                      {task.subcategory && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded">
                          {task.subcategory}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight truncate">
                      {task.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600">
                      Completed
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Detail
                    icon={<IndianRupee size={13} className="text-gray-400" />}
                    label="Earned"
                    value={`₹${workerEarned}`}
                    valueClass="text-green-700 font-black text-base"
                  />
                  <Detail
                    icon={<Calendar size={13} className="text-gray-400" />}
                    label="Completed"
                    value={fmtDate(task.completedAt)}
                  />
                  <Detail
                    icon={<Clock size={13} className="text-gray-400" />}
                    label="Duration"
                    value={duration || "—"}
                  />
                  <Detail
                    icon={<User size={13} className="text-gray-400" />}
                    label="Client"
                    value={task.userId?.name || "—"}
                  />
                </div>

                {/* Address */}
                {task.address && (
                  <div className="px-6 pb-3 flex items-start gap-2">
                    <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-500 font-medium leading-relaxed">
                      {task.address}
                    </span>
                  </div>
                )}

                {/* Work Summary */}
                {task.workSummary && (
                  <div className="px-6 pb-4 flex items-start gap-2 border-t border-gray-50 pt-3">
                    <FileText size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        Work Summary
                      </p>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2">
                        {task.workSummary}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
            });
          })()}
        </div>

        {/* Load more */}
        {hasMore && (
          <div className="text-center pt-2">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-8 py-3 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              {loading ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const Detail = ({ icon, label, value, valueClass = "text-gray-900 font-bold text-sm" }) => (
  <div>
    <div className="flex items-center gap-1 mb-1">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </span>
    </div>
    <p className={valueClass}>{value}</p>
  </div>
);

export default WorkerHistory;
