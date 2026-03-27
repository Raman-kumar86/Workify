import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useAcceptTask = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [acceptedTask, setAcceptedTask] = useState(null);

  const acceptTask = async (taskId) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axiosInstance.post(
        `/api/worker/tasks/${taskId}/accept`
      );
      console.log(response);
      setSuccess(true);
      setAcceptedTask(response.data.task);
      return response.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Failed to accept task";
      setError(message);
      console.log(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { acceptTask, loading, error, success, acceptedTask };
};

export default useAcceptTask;
