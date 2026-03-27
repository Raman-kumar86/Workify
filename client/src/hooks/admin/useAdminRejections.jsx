import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminRejections = () => {
  const [rejections, setRejections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRejections = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/task-rejections", { params });
      setRejections(res.data.rejections);
      setPagination(res.data.pagination);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch rejections");
    } finally {
      setLoading(false);
    }
  };

  const liftBan = async (id) => {
    const res = await axiosInstance.patch(`/api/admin/task-rejections/${id}/lift-ban`);
    setRejections((prev) =>
      prev.map((r) => (r._id === id ? { ...r, banLifted: true, adminReviewed: true } : r))
    );
    return res.data;
  };

  return { rejections, pagination, loading, error, fetchRejections, liftBan };
};

export default useAdminRejections;
