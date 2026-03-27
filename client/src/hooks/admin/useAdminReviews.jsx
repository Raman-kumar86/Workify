import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReviews = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/reviews", { params });
      setReviews(res.data.reviews);
      setPagination(res.data.pagination);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  return { reviews, pagination, loading, error, fetchReviews };
};

export default useAdminReviews;
