import React, { useEffect, useState, useRef, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  MessageSquare,
  AlertCircle,
  Loader2,
  ChevronDown,
  Briefcase,
  MapPin,
  Plus,
  Bell,
  User,
  LogOut,
  Menu,
  X as XIcon,
  Zap,
  Search,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setUserLocation } from "../../redux/slices/userSlice.jsx";
import { getGeolocation } from "../../constants/task.constants.jsx";
import useMyReviews from "../../hooks/user/useMyReviews.jsx";
import useTaskNotifications from "../../hooks/user/useTaskNotifications.jsx";
import { useAuth } from "../context/AuthContext";

const Sidebar = lazy(() => import("./Sidebar.jsx"));

/* ── Date/time helpers ────────────────────────────── */
const fmt = (date) =>
  date
    ? new Date(date).toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const fmtDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const calcDuration = (start, end) => {
  if (!start || !end) return null;
  const mins = Math.round((new Date(end) - new Date(start)) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/* ── Filled star row ──────────────────────────────── */
const StarRow = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={14}
        className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
      />
    ))}
  </div>
);

/* ── Label-value detail row ───────────────────────── */
const Detail = ({ label, value }) =>
  value ? (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-400 font-bold shrink-0 w-28">{label}</span>
      <span className="text-gray-700 font-semibold">{value}</span>
    </div>
  ) : null;

/* ── Single review card ───────────────────────────── */
const ReviewCard = ({ review }) => {
  const task   = review.taskId   || {};
  const worker = review.workerId || {};
  const workerName = worker.userId?.name || worker.name || null;
  const dur = calcDuration(task.inProgressAt, task.completedAt);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow">

      {/* ── Header: title + star rating ── */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-black text-gray-900 leading-snug flex-1">
            {task.title || "Untitled Task"}
          </h3>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <StarRow rating={review.rating} />
            <span className="text-[10px] font-black text-amber-500">
              {review.rating} / 5
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {task.taskType && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-100 rounded-md px-2 py-0.5">
              {task.taskType}
            </span>
          )}
          {task.subcategory && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
              {task.subcategory}
            </span>
          )}
        </div>
      </div>

      {/* ── Task images thumbnail strip ── */}
      {task.images?.length > 0 && (
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-gray-50 scrollbar-hide">
          {task.images.map((url, i) => (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 transition-opacity"
            >
              <img
                src={url}
                alt={`Task image ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      )}

      {/* ── Task & worker details ── */}
      <div className="px-5 py-4 space-y-2 border-b border-gray-50">
        <Detail label="Worker"         value={workerName} />
        {worker.rating > 0 && (
          <Detail
            label="Worker Rating"
            value={`${worker.rating} ★ `}
          />
        )}
        <Detail label="Address"         value={task.address} />
        <Detail label="Scheduled"       value={fmt(task.scheduledStartAt)} />
        <Detail label="Work Started"    value={fmt(task.inProgressAt)} />
        <Detail label="Completed At"    value={fmt(task.completedAt)} />
        {dur && <Detail label="Duration" value={dur} />}
        <Detail label="Price Paid"      value={task.price ? `₹${task.price}` : null} />
      </div>

      {/* ── Worker's completion note ── */}
      {task.workSummary && (
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
            Worker's Completion Note
          </p>
          <p className="text-sm text-gray-600 leading-relaxed italic">
            "{task.workSummary}"
          </p>
        </div>
      )}

      {/* ── User's review ── */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
          Your Review
        </p>
        {review.comment ? (
          <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-amber-300 pl-3 italic">
            "{review.comment}"
          </p>
        ) : (
          <p className="text-xs text-gray-300 italic">No comment left</p>
        )}
        <p className="text-[10px] text-gray-300 font-bold mt-2 uppercase tracking-widest">
          Reviewed on {fmtDate(review.createdAt)}
        </p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   MY REVIEWS PAGE
══════════════════════════════════════════════════ */
const MyReviews = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, logout } = useAuth();
  const location = useSelector((state) => state.user.location);
  const { reviews, loading, error, hasMore, total, fetchReviews, loadMore } =
    useMyReviews();
  const { notifications, unreadCount, markAllRead } = useTaskNotifications();

  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileMenuRef = useRef(null);

  const filteredReviews = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return reviews;
    return reviews.filter((r) => {
      const task   = r.taskId   || {};
      const worker = r.workerId || {};
      const workerName = (worker.userId?.name || worker.name || "").toLowerCase();
      return (
        (task.title       || "").toLowerCase().includes(q) ||
        (task.taskType    || "").toLowerCase().includes(q) ||
        (task.subcategory || "").toLowerCase().includes(q) ||
        (task.address     || "").toLowerCase().includes(q) ||
        (task.workSummary || "").toLowerCase().includes(q) ||
        (r.comment        || "").toLowerCase().includes(q) ||
        workerName.includes(q)
      );
    });
  }, [reviews, searchQuery]);

  /* Load first page on mount */
  useEffect(() => {
    fetchReviews();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Close profile menu on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocateMe = async () => {
    try {
      const loc = await getGeolocation();
      dispatch(setUserLocation(loc));
    } catch (err) {
      console.error("Location error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-black">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        {/* Left: back + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
          >
            <ArrowLeft size={17} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-black p-1.5 rounded-lg shadow-sm">
              <Briefcase size={20} className="text-white" />
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
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleLocateMe}
            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold rounded-md transition-all uppercase tracking-wider cursor-pointer"
          >
            <MapPin size={14} />
            Locate Me
          </button>

          <button
            onClick={() => navigate("/user")}
            className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-bold rounded-md transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            <Plus size={14} />
            New Work
          </button>

          {/* Bell */}
          <button
            onClick={() => { setShowNotifPanel((p) => !p); markAllRead(); }}
            className="relative w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce"
                style={{ minWidth: 18, height: 18 }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              className="w-9 h-9 border-2 border-black rounded-full flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
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
                  onClick={() => { setShowProfileMenu(false); navigate("/user/profile"); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={16} className="text-gray-400" />
                  <span className="font-bold">Profile</span>
                </button>
                <div className="h-px bg-gray-100 mx-3" />
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

          {/* Sidebar toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer ml-1"
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {/* ── Notification panel (fixed below navbar) ── */}
      {showNotifPanel && (
        <div className="fixed right-6 top-18 z-200 w-96 max-h-105 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
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
                <div key={n.id} className={`px-5 py-4 flex gap-3 ${!n.read ? "bg-blue-50/40" : ""}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === "arrived" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    {n.type === "arrived" ? <MapPin size={16} /> : <Zap size={16} />}
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
                      {new Date(n.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">My Reviews</h1>
            {total > 0 && (
              <p className="text-sm text-gray-400 font-medium mt-0.5">
                {searchQuery.trim()
                  ? `${filteredReviews.length} of ${total} review${total !== 1 ? "s" : ""}`
                  : `${total} review${total !== 1 ? "s" : ""} submitted`}
              </p>
            )}
          </div>
          {/* Search bar */}
          {reviews.length > 0 && (
            <div className="relative w-full sm:w-72">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by task, worker, address…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 text-xs font-semibold bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors placeholder:text-gray-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6 text-sm font-bold">
            <AlertCircle size={17} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Loading skeleton (first load) */}
        {loading && reviews.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-100 bg-white p-5 animate-pulse"
              >
                <div className="flex justify-between mb-3">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && reviews.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
              <MessageSquare size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tighter">
              No Reviews Yet
            </h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Reviews you submit after completing tasks will appear here.
            </p>
            <button
              onClick={() => navigate("/user")}
              className="mt-6 px-6 py-2.5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Browse Tasks
            </button>
          </div>
        )}

        {/* No search match */}
        {!loading && reviews.length > 0 && filteredReviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-300" />
            </div>
            <h2 className="text-base font-black text-gray-900 mb-1 uppercase tracking-tighter">
              No matches found
            </h2>
            <p className="text-sm text-gray-400 max-w-xs">
              No reviews match "<span className="font-bold text-gray-600">{searchQuery}</span>"
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-5 py-2 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-white hover:border-gray-400 transition-all"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Review list */}
        {filteredReviews.length > 0 && (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}

        {/* Load More — always based on raw reviews (not filtered) */}
        {hasMore && reviews.length > 0 && !searchQuery.trim() && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-white hover:border-gray-400 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Load More
                </>
              )}
            </button>
          </div>
        )}

        {/* All loaded */}
        {!hasMore && reviews.length > 0 && !searchQuery.trim() && (
          <p className="mt-8 text-center text-[11px] text-gray-300 font-bold uppercase tracking-widest">
            All {total} reviews loaded
          </p>
        )}
      </main>

      {/* ── Sidebar (lazy) ── */}
      <Suspense fallback={null}>
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      </Suspense>
    </div>
  );
};

export default MyReviews;
