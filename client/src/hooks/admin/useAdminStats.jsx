import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../api/axios.jsx";
import { setAdminStats } from "../../redux/slices/adminSlice.jsx";

const useAdminStats = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/stats");
      dispatch(setAdminStats(res.data.stats));
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to fetch stats";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { loading, error, fetchStats };
};

export default useAdminStats;
