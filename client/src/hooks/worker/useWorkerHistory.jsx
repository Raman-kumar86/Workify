import { useState, useCallback } from "react";
import axiosInstance from "../../api/axios.jsx";

/**
 * Paginated hook for fetching the current worker's completed task history.
 * Default page size = 10; call loadMore() to fetch the next page.
 */
const useWorkerHistory = () => {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal]     = useState(0);
  const [stats, setStats]     = useState({
    totalEarnings: 0,
    totalWithdrawn: 0,
    walletCredit: 0,
    outstandingDue: 0,
    withdrawableAmount: 0,
  });
  const LIMIT = 10;

  /** Fetch the first page (resets state). */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/worker/history?page=1&limit=${LIMIT}`);
      const { tasks: data, pagination, stats: historyStats } = res.data;
      setTasks(data);
      setPage(1);
      setHasMore(pagination.hasMore);
      setTotal(pagination.total);
      setStats(historyStats || {
        totalEarnings: 0,
        totalWithdrawn: 0,
        walletCredit: 0,
        outstandingDue: 0,
        withdrawableAmount: 0,
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Append the next page to existing tasks. */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(
        `/api/worker/history?page=${nextPage}&limit=${LIMIT}`
      );
      const { tasks: data, pagination } = res.data;
      setTasks((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(pagination.hasMore);
      setTotal(pagination.total);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load more history.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  return { tasks, loading, error, hasMore, total, stats, fetchHistory, loadMore };
};

export default useWorkerHistory;
