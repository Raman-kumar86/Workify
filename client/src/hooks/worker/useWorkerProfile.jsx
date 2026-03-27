import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios.jsx";

const useWorkerProfile = () => {
  const [user, setUser] = useState(null);
  const [worker, setWorker] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkerProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/worker/profile");
      setUser(response.data.user || null);
      setWorker(response.data.worker);
      setActiveTask(response.data.activeTask);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch worker profile");
      console.error("Error fetching worker profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const response = await axiosInstance.patch("/api/worker/profile", payload);
    if (response.data?.user) {
      setUser(response.data.user);
    }
    if (response.data?.worker) {
      setWorker(response.data.worker);
    }
    return response.data;
  };

  useEffect(() => {
    fetchWorkerProfile();
  }, []);

  return {
    data: { user, worker, activeTask },
    user,
    worker,
    activeTask,
    loading,
    error,
    refetch: fetchWorkerProfile,
    updateProfile,
    setWorker,
  };
};

export default useWorkerProfile;
