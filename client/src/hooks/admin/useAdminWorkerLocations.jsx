import { useState, useCallback } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminWorkerLocations = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkerLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/workers/locations");
      setWorkers(res.data.workers);
      return res.data.workers;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch worker locations");
    } finally {
      setLoading(false);
    }
  }, []);

  return { workers, loading, error, fetchWorkerLocations };
};

export default useAdminWorkerLocations;
