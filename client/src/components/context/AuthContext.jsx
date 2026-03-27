import React, { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser, setToken, clearUser } from "../../redux/slices/userSlice.jsx";
import axiosInstance from "../../api/axios.jsx";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // No localStorage — user is in React state only.
  // On refresh the httpOnly cookie is re-verified via /api/auth/me.
  const [user, setUserState] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // true while /me is in-flight
  const navigate = useNavigate();
  const dispatch = useDispatch();

  /* ── Restore session from httpOnly cookie on every page load ── */
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await axiosInstance.get("/api/auth/me");
        if (res.data?.success) {
          setUserState(res.data.user);
          dispatch(setUser(res.data.user));
          // Restore token in Redux so the socket provider can reconnect
          if (res.data.token) {
            dispatch(setToken(res.data.token));
          }
        }
      } catch {
        // Cookie missing / expired \u2014 user is simply not logged in
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = (userData) => {
    setUserState(userData.user);
    // Server already set the httpOnly cookie; store token in Redux for
    // the Authorization header fallback (socket handshake, etc.)
    if (userData.token) {
      dispatch(setToken(userData.token));
    }
    dispatch(setUser(userData.user));
  };

  const updateUser = (updater) => {
    setUserState((prev) => {
      const nextUser = typeof updater === "function" ? updater(prev) : updater;
      if (nextUser) {
        dispatch(setUser(nextUser));
      }
      return nextUser;
    });
  };

  const logout = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
    } catch { /* ignore */ }
    setUserState(null);
    dispatch(clearUser());
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, authLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;

