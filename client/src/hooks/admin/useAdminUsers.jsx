import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/users", { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (id) => {
    const res = await axiosInstance.get(`/api/admin/users/${id}/profile`);
    return res.data;
  };

  const banUser = async (id, { reason, durationHours } = {}) => {
    const res = await axiosInstance.patch(`/api/admin/users/${id}/ban`, { reason, durationHours });
    setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
    return res.data;
  };

  const unbanUser = async (id) => {
    const res = await axiosInstance.patch(`/api/admin/users/${id}/unban`);
    setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
    return res.data;
  };

  return { users, pagination, loading, error, fetchUsers, fetchUserProfile, banUser, unbanUser };
};

export default useAdminUsers;
