import { useState } from "react";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { useDispatch } from "react-redux";
import axiosInstance from "../../api/axios.jsx";
import { useAuth } from "../../components/context/AuthContext.jsx";
import { auth, googleProvider } from "../../config/firebase.jsx";
import { setUser } from "../../redux/slices/userSlice.jsx";

const getGoogleErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  switch (error?.code) {
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled";
    case "auth/popup-blocked":
      return "Allow popups for this site to continue with Google";
    default:
      return "Google sign-in failed";
  }
};

const useGoogleAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const dispatch = useDispatch();

  const authenticateWithGoogle = async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await axiosInstance.post("/api/auth/google", {
        idToken,
        projectId: auth.app.options.projectId,
        userType: options.userType,
      });

      login(response.data);
      dispatch(setUser({ ...response.data.user, token: response.data.token }));
      return response.data;
    } catch (err) {
      setError(getGoogleErrorMessage(err));
      await firebaseSignOut(auth).catch(() => {});
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    authenticateWithGoogle,
    loading,
    error,
  };
};

export default useGoogleAuth;