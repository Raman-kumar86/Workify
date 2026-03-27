import { useState, useCallback } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminTaskLocations = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTaskLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/tasks/locations");
      setTasks(res.data.tasks);
      return res.data.tasks;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch task locations");
    } finally {
      setLoading(false);
    }
  }, []);

  return { tasks, loading, error, fetchTaskLocations };
};

export default useAdminTaskLocations;
