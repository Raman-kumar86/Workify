import { useState, useCallback, useEffect, useRef } from "react";
import axiosInstance from "../../api/axios";
import { WORKER_API_ENDPOINTS } from "../../constants/task.constants";
import { useSocket } from "../../context/SocketContext";

const useAvailableTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocket();

  // Store the last fetch params so we can auto-refetch on new task events
  const lastParamsRef = useRef(null);

  const fetchTasks = useCallback(async ({ lat, lng, distance, category }) => {
    lastParamsRef.current = { lat, lng, distance, category };
    setLoading(true);
    setError(null);
    try {
      const params = { lat, lng, distance };
      if (category && category !== "All") params.category = category;

      const response = await axiosInstance.get(
        WORKER_API_ENDPOINTS.GET_AVAILABLE_TASKS,
        { params }
      );

      if (response.data.success) {
        setTasks(response.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch tasks"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Real-time: remove a task the moment another worker accepts it ── */
  useEffect(() => {
    if (!socket) return;

    const handleTaskAccepted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    // Auto-refresh when a new task is posted by any user
    const handleTaskCreated = () => {
      if (lastParamsRef.current) {
        fetchTasks(lastParamsRef.current);
      }
    };

    socket.on("task_accepted", handleTaskAccepted);
    socket.on("task_created", handleTaskCreated);
    return () => {
      socket.off("task_accepted", handleTaskAccepted);
      socket.off("task_created", handleTaskCreated);
    };
  }, [socket, fetchTasks]);

  return { tasks, loading, error, fetchTasks, setError };
};

export default useAvailableTasks;

