import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axios";

const useMyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  /** banInfo: { banExpiresAt: Date, walletBalance: number } | null */
  const [banInfo, setBanInfo] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/user/my-works");
      setTasks(response.data.tasks);
      setError(null);
    } catch (err) {
      console.error("Error fetching my tasks:", err);
      setError(err.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  /**
   * deleteTask — handles both normal delete and penalised cancel.
   * Returns the server response data.
   */
  const deleteTask = async (taskId) => {
    try {
      const { data } = await axiosInstance.delete(`/api/user/delete/${taskId}`);

      if (data.penalised) {
        // Task was cancelled (not hard-deleted) — update status in local state
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: "cancelled" } : t))
        );
        // Store ban info so Dashboard can show the ban screen
        setBanInfo({
          banExpiresAt: new Date(data.banExpiresAt),
          walletBalance: data.walletBalance,
        });
      } else {
        // Normal delete — remove from list
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      }
      return data;
    } catch (err) {
      console.error("Error deleting task:", err);
      throw err;
    }
  };

  const renewTask = async (taskId, newDate) => {
    try {
      setLoading(true);
      const payload = newDate ? { newScheduledDate: newDate } : {};
      const response = await axiosInstance.put(`/api/user/task/${taskId}/renew`, payload);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? response.data.task : t))
      );
      alert("Task renewed successfully! It is now visible to workers again.");
    } catch (err) {
      console.error("Error renewing task:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearBan = () => setBanInfo(null);

  return { tasks, loading, error, deleteTask, renewTask, refetch: fetchTasks, banInfo, clearBan };
};

export default useMyTasks;
