import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminReports = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/reports", { params });
      setReports(res.data.reports);
      setPagination(res.data.pagination);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const res = await axiosInstance.patch(`/api/admin/reports/${id}`, { status });
    setReports((prev) => prev.map((r) => (r._id === id ? res.data.report : r)));
    return res.data.report;
  };

  return { reports, pagination, loading, error, fetchReports, updateStatus };
};

export default useAdminReports;
