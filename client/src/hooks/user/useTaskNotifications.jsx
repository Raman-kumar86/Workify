/**
 * useTaskNotifications — persistent notifications for the user (job poster).
 *
 * On mount: fetches existing notifications from GET /api/notifications.
 * In real-time: listens to socket events and persists them server-side
 *   (the backend already saves to DB), then prepends to local state.
 *
 * Events handled:
 *   task_arrived   — worker marked arrival, OTP sent
 *   task_started   — worker verified OTP, task is inProgress
 *   task_completed — worker finished the task
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import axiosInstance from "../../api/axios";

const useTaskNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  /** The latest popup to show (auto-clears after 8 seconds) */
  const [popup, setPopup] = useState(null);
  const popupTimer = useRef(null);

  // ── Fetch existing notifications from DB on mount ──
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axiosInstance.get("/api/notifications");
        if (data.success) {
          setNotifications(
            data.notifications.map((n) => ({
              id: n._id,
              type: n.type,
              title: n.title,
              message: n.message,
              otp: n.otp,
              taskTitle: n.taskTitle,
              taskId: n.taskId,
              read: n.read,
              time: n.createdAt,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // ── Push a real-time notification locally (DB save is done by backend) ──
  const pushNotification = useCallback((notif) => {
    const entry = { ...notif, id: Date.now(), read: false, time: new Date() };
    setNotifications((prev) => [entry, ...prev]);

    // Show popup
    setPopup(entry);
    clearTimeout(popupTimer.current);
    popupTimer.current = setTimeout(() => setPopup(null), 8000);
  }, []);

  // ── Socket listeners ──
  useEffect(() => {
    if (!socket) return;

    const handleArrived = (data) => {
      pushNotification({
        type: "arrived",
        title: "Worker Has Arrived!",
        message: "Share the code below with the worker to start the task.",
        taskId: data.taskId,
        otp: data.otp,
        taskTitle: data.taskTitle,
      });
    };

    const handleStarted = (data) => {
      pushNotification({
        type: "started",
        title: "Task In Progress",
        message: "The worker has verified the OTP. Your task is now being worked on!",
        taskId: data.taskId,
      });
    };

    const handleCompleted = (data) => {
      pushNotification({
        type: "completed",
        title: "Task Completed! 🎉",
        message: "The worker has finished your task. Please review and confirm.",
        taskId: data.taskId,
      });
    };

    socket.on("task_arrived", handleArrived);
    socket.on("task_started", handleStarted);
    socket.on("task_completed", handleCompleted);

    return () => {
      socket.off("task_arrived", handleArrived);
      socket.off("task_started", handleStarted);
      socket.off("task_completed", handleCompleted);
    };
  }, [socket, pushNotification]);

  const dismissPopup = useCallback(() => {
    setPopup(null);
    clearTimeout(popupTimer.current);
  }, []);

  // ── Mark all read (persisted to DB) ──
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await axiosInstance.patch("/api/notifications/read-all");
    } catch (err) {
      console.error("Failed to mark notifications as read:", err.message);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, popup, dismissPopup, unreadCount, markAllRead, loading };
};

export default useTaskNotifications;
