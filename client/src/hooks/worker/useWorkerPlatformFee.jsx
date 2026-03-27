import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useWorkerPlatformFee = () => {
  const [feePercent, setFeePercent] = useState(null);
  const [workerPercent, setWorkerPercent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPlatformFee = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosInstance.get("/api/worker/platform-fee");
        if (cancelled) return;
        setFeePercent(res.data?.feePercent ?? 10);
        setWorkerPercent(res.data?.workerPercent ?? 90);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || "Failed to fetch platform fee");
        setFeePercent(10);
        setWorkerPercent(90);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPlatformFee();

    return () => {
      cancelled = true;
    };
  }, []);

  return { feePercent, workerPercent, loading, error };
};

export default useWorkerPlatformFee;
