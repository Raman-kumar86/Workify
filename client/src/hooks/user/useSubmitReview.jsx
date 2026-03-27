import { useState } from "react";
import axiosInstance from "../../api/axios.jsx";

const useSubmitReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  /**
   * Submit a review for a completed task.
   * @param {string} taskId
   * @param {{ rating: number, comment?: string }} data
   */
  const submitReview = async (taskId, { rating, comment = "" }) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await axiosInstance.post(`/api/user/task/${taskId}/review`, {
        rating,
        comment,
      });
      setSuccess(true);
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to submit review. Please try again.";
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

  return { submitReview, loading, error, success, reset };
};

export default useSubmitReview;
