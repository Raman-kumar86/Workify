import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useSubmitReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Submit a report for a worker on a task.
   * @param {string} taskId
   * @param {{ reason: string, description?: string }} data
   */
  const submitReport = async (taskId, { reason, description = "" }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await axiosInstance.post(`/api/user/task/${taskId}/report`, {
        reason,
        description,
      });
      setSuccess(true);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to submit report. Please try again.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return { submitReport, loading, error, success, reset };
};

export default useSubmitReport;
