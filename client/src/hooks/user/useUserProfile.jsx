import { useEffect, useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useUserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/user/profile");
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch profile");
      console.error("Error fetching user profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (payload) => {
    const response = await axiosInstance.patch("/api/user/profile", payload);
    if (response.data?.user) {
      setUser(response.data.user);
    }
    return response.data;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    user,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile,
  };
};

export default useUserProfile;
