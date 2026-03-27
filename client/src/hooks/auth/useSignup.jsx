import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

import { useAuth } from "../../components/context/AuthContext.jsx";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice.jsx";

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const dispatch = useDispatch();

  const signupUser = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post("/api/auth/signup", userData);
      
      // If signup returns a token (e.g. for normal users), log them in immediately
      if (response.data.token) {
        login(response.data);
        dispatch(setUser({ ...response.data.user, token: response.data.token }));
      }
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { signupUser, loading, error };
};

export default useSignup;
