import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [nearbyWorkers, setNearbyWorkers] = useState([]);

  const fetchTasks = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/tasks", { params });
      setTasks(res.data.tasks);
      setPagination(res.data.pagination);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyWorkers = async (taskId, radiusKm = 20) => {
    try {
      const res = await axiosInstance.get(`/api/admin/tasks/${taskId}/nearby-workers`, {
        params: { radiusKm },
      });
      setNearbyWorkers(res.data.workers);
      return res.data.workers;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to fetch nearby workers");
    }
  };

  const forceAssign = async (taskId, workerId) => {
    const res = await axiosInstance.patch(`/api/admin/tasks/${taskId}/force-assign`, { workerId });
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
    return res.data;
  };

  return { tasks, pagination, loading, error, nearbyWorkers, fetchTasks, fetchNearbyWorkers, forceAssign };
};

export default useAdminTasks;
