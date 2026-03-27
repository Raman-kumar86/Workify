/**
 * useWorkerNotifications — persistent notifications for workers.
 *
 * On mount: fetches from GET /api/notifications/worker.
 * Real-time: listens to socket events (task_assigned, task_cancelled, etc.)
 * markAllRead persists to DB via PATCH /api/notifications/worker/read-all.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import axiosInstance from "../../api/axios";

const useWorkerNotifications = () => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState(null);
  const popupTimer = useRef(null);

  // ── Fetch existing notifications from DB on mount ──
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axiosInstance.get("/api/notifications/worker");
        if (data.success) {
          setNotifications(
            data.notifications.map((n) => ({
              id: n._id,
              type: n.type,
              title: n.title,
              message: n.message,
              taskId: n.taskId,
              taskTitle: n.taskTitle,
              read: n.read,
              time: n.createdAt,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch worker notifications:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // ── Push real-time notification ──
  const pushNotification = useCallback((notif) => {
    const entry = { ...notif, id: Date.now(), read: false, time: new Date() };
    setNotifications((prev) => [entry, ...prev]);

    setPopup(entry);
    clearTimeout(popupTimer.current);
    popupTimer.current = setTimeout(() => setPopup(null), 8000);
  }, []);

  // ── Socket listeners for worker events ──
  useEffect(() => {
    if (!socket) return;

    const handleTaskAssigned = (data) => {
      pushNotification({
        type: "task_assigned",
        title: "New Task Assigned!",
        message: `You've been assigned a new task. Check details and navigate to the location.`,
        taskId: data.taskId,
        taskTitle: data.taskTitle,
      });
    };

    const handleTaskCancelled = (data) => {
      pushNotification({
        type: "task_cancelled",
        title: "Task Cancelled",
        message: "The job poster has cancelled this task.",
        taskId: data.taskId,
        taskTitle: data.taskTitle,
      });
    };

    socket.on("task_assigned_worker", handleTaskAssigned);
    socket.on("task_cancelled_worker", handleTaskCancelled);

    return () => {
      socket.off("task_assigned_worker", handleTaskAssigned);
      socket.off("task_cancelled_worker", handleTaskCancelled);
    };
  }, [socket, pushNotification]);

  const dismissPopup = useCallback(() => {
    setPopup(null);
    clearTimeout(popupTimer.current);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await axiosInstance.patch("/api/notifications/worker/read-all");
    } catch (err) {
      console.error("Failed to mark worker notifications as read:", err.message);
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, popup, dismissPopup, unreadCount, markAllRead, loading };
};

export default useWorkerNotifications;
