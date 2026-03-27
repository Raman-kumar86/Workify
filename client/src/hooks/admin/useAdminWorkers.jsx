import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminWorkers = () => {
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkers = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/workers", { params });
      setWorkers(res.data.workers);
      setPagination(res.data.pagination);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch workers");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingWorkers = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/workers/pending", { params });
      setWorkers(res.data.workers);
      setPagination(res.data.pagination);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch pending workers");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerProfile = async (id) => {
    try {
      const res = await axiosInstance.get(`/api/admin/workers/${id}/profile`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to fetch worker profile");
    }
  };

  const approveWorker = async (id) => {
    const res = await axiosInstance.patch(`/api/admin/workers/${id}/approve`);
    setWorkers((prev) => prev.filter((w) => w._id !== id));
    return res.data;
  };

  const rejectWorker = async (id, reason) => {
    const res = await axiosInstance.patch(`/api/admin/workers/${id}/reject`, { reason });
    setWorkers((prev) => prev.filter((w) => w._id !== id));
    return res.data;
  };

  const banWorker = async (id, { reason, durationHours, fineAmount } = {}) => {
    const res = await axiosInstance.patch(`/api/admin/workers/${id}/ban`, { reason, durationHours, fineAmount });
    setWorkers((prev) => prev.map((w) => (w._id === id ? res.data.worker : w)));
    return res.data;
  };

  const unbanWorker = async (id) => {
    const res = await axiosInstance.patch(`/api/admin/workers/${id}/unban`);
    setWorkers((prev) => prev.map((w) => (w._id === id ? res.data.worker : w)));
    return res.data;
  };

  return {
    workers,
    pagination,
    loading,
    error,
    fetchWorkers,
    fetchPendingWorkers,
    fetchWorkerProfile,
    approveWorker,
    rejectWorker,
    banWorker,
    unbanWorker,
  };
};

export default useAdminWorkers;
