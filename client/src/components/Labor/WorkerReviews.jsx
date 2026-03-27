import React, { useEffect, lazy, Suspense, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Star,
  MessageSquare,
  User,
  Calendar,
  Loader2,
  AlertCircle,
  Menu,
  MapPin,
  IndianRupee,
  Search,
  X,
} from "lucide-react";
import useWorkerReviews from "../../hooks/worker/useWorkerReviews.jsx";

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

const StarRow = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={15}
        className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"}
      />
    ))}
  </div>
);

const WorkerReviews = () => {
  const navigate = useNavigate();
  const { reviews, loading, error, hasMore, total, fetchReviews, loadMore } =
    useWorkerReviews();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const didFetch = useRef(false);

  useEffect(() => {
    if (!didFetch.current) {
      didFetch.current = true;
      fetchReviews();
    }
  }, [fetchReviews]);

  /* Average rating */
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

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
            <h1 className="text-2xl font-black uppercase tracking-tighter">My Reviews</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {total} review{total !== 1 ? "s" : ""} from customers
            </p>
          </div>
          {avgRating && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
              <Star size={18} className="fill-amber-400 text-amber-400" />
              <div>
                <p className="text-xl font-black tracking-tighter text-amber-700 leading-none">
                  {avgRating}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                  Avg Rating
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rating breakdown (visible when we have reviews already loaded) */}
        {reviews.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">
              Rating Breakdown
            </p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12 shrink-0">
                      <span className="text-xs font-bold text-gray-600">{star}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-400 w-8 text-right shrink-0">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by customer, task, or comment…"
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
        {loading && reviews.length === 0 && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 animate-pulse h-32" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && reviews.length === 0 && !error && (
          <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">
              No reviews yet
            </p>
            <p className="text-xs text-gray-300 font-bold mt-1">
              Customer reviews will appear here after you complete jobs
            </p>
          </div>
        )}

        {/* Review cards */}
        <div className="space-y-4">
          {(() => {
            const q = searchQuery.trim().toLowerCase();
            const filtered = q
              ? reviews.filter(
                  (r) =>
                    r.userId?.name?.toLowerCase().includes(q) ||
                    r.comment?.toLowerCase().includes(q) ||
                    r.taskId?.title?.toLowerCase().includes(q) ||
                    r.taskId?.taskType?.toLowerCase().includes(q)
                )
              : reviews;

            if (q && filtered.length === 0) {
              return (
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center">
                  <Search size={28} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-black uppercase tracking-widest text-gray-400">
                    No reviews match "{searchQuery}"
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

            return filtered.map((review) => (
            <div
              key={review._id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Customer avatar */}
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 leading-tight">
                      {review.userId?.name || "Customer"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarRow rating={review.rating} />
                      <span className="text-[10px] font-black text-amber-500">
                        {review.rating}.0
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar size={12} className="text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400">
                    {fmtDate(review.createdAt)}
                  </span>
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <div className="px-6 py-3 flex items-start gap-2">
                  <MessageSquare size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 font-medium leading-relaxed">
                    "{review.comment}"
                  </p>
                </div>
              )}

              {/* Task info */}
              {review.taskId && (
                <div className="px-6 pb-4 pt-1 bg-gray-50/60 border-t border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    Task
                  </p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded self-start">
                      {review.taskId.taskType}
                    </span>
                    <span className="text-sm font-black text-gray-800">
                      {review.taskId.title}
                    </span>
                    {review.taskId.price && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-gray-500">
                        <IndianRupee size={11} />
                        {review.taskId.price}
                      </span>
                    )}
                    {review.taskId.address && (
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <MapPin size={11} />
                        {review.taskId.address}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            ));
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
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkerReviews;
