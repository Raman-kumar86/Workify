import { useEffect, useState } from "react";
import useAdminReviews from "../../hooks/admin/useAdminReviews";
import { TH, TD, TR, Pagination } from "./adminUtils";

const Stars = ({ n }) => (
  <span className="text-amber-400">
    {"★".repeat(n)}<span className="text-gray-300">{"★".repeat(5 - n)}</span>
  </span>
);

const ReviewsMonitor = () => {
  const { reviews, pagination, loading, error, fetchReviews } = useAdminReviews();
  const [page, setPage] = useState(1);

  useEffect(() => { fetchReviews({ page, limit: 20 }); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading reviews...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reviews Monitor</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Reviews ({pagination?.total ?? 0})</h2>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No reviews found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>User</th>
                  <th className={TH}>Worker</th>
                  <th className={TH}>Task</th>
                  <th className={TH}>Rating</th>
                  <th className={TH}>Comment</th>
                  <th className={TH}>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r._id} className={TR}>
                    <td className={TD}>{r.userId?.name ?? "-"}</td>
                    <td className={TD}>{r.workerId?.userId?.name ?? "-"}</td>
                    <td className={TD}>{r.taskId?.title ?? "-"}</td>
                    <td className={TD}>
                      <Stars n={r.rating} />
                      <span className="ml-1 text-xs text-gray-500">{r.rating}/5</span>
                    </td>
                    <td className={TD + " max-w-[200px] truncate"}>
                      {r.comment || <span className="text-gray-300">-</span>}
                    </td>
                    <td className={TD}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={pagination?.totalPages ?? 1} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  );
};

export default ReviewsMonitor;
