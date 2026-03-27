import React, { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import { setSocketConnected } from "../redux/slices/userSlice.jsx";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  /* Read JWT from Redux — no localStorage */
  const token = useSelector((state) => state.user.token);

  useEffect(() => {
    /* Don't open a socket until we have a token */
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // console.log("[Socket] Connected:", socket.id);
      dispatch(setSocketConnected(true));
    });

    socket.on("connect_error", (err) => {
      // console.warn("[Socket] Connection error:", err.message);
      dispatch(setSocketConnected(false));
    });

    socket.on("disconnect", () => {
      dispatch(setSocketConnected(false));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      dispatch(setSocketConnected(false));
    };
  }, [token, dispatch]);

  /*
   * Expose the ref itself (not .current) so that hooks like useAvailableTasks
   * can always access the live socket via socketRef.current in effects.
   */
  return (
    <SocketContext.Provider value={{ socketRef }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * useSocket() — returns { socket } where socket is always the live instance.
 * Usage: const { socket } = useSocket();
 */
export const useSocket = () => {
  const ctx = useContext(SocketContext);
  return { socket: ctx?.socketRef?.current ?? null };
};

export default SocketContext;
