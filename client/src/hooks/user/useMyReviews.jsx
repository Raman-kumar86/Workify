import { useState, useCallback } from "react";
import axiosInstance from "../../api/axios.jsx";

/**
 * Paginated hook for fetching the current user's past reviews.
 * Default page size = 10; call loadMore() to fetch the next page.
 */
const useMyReviews = () => {
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [total, setTotal]           = useState(0);
  const LIMIT = 10;

  /** Fetch the first page (resets state). */
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(`/api/user/reviews?page=1&limit=${LIMIT}`);
      const { reviews: data, pagination } = res.data;
      setReviews(data);
      setPage(1);
      setHasMore(pagination.hasMore);
      setTotal(pagination.total);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Append the next page to existing reviews. */
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get(
        `/api/user/reviews?page=${nextPage}&limit=${LIMIT}`
      );
      const { reviews: data, pagination } = res.data;
      setReviews((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(pagination.hasMore);
      setTotal(pagination.total);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load more reviews.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page]);

  return { reviews, loading, error, hasMore, total, fetchReviews, loadMore };
};

export default useMyReviews;
