/**
 * useOTPActions — handles the "I've Arrived" + OTP verification flow for workers.
 *
 * markArrived(taskId)  → POST /api/worker/tasks/:taskId/arrived
 *   Sets task to 'arrived', triggers OTP email to user
 *
 * submitOTP(taskId, otp) → POST /api/worker/tasks/:taskId/verify-otp
 *   Verifies the 4-digit code; on success task becomes 'inProgress'
 */
import { useState } from "react";
import axiosInstance from "../../api/axios";

export default function useOTPActions() {
  const [arrivedLoading, setArrivedLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Call when worker taps "I've Arrived".
   * Returns { success, otpExpiresAt } on success, throws on failure.
   */
  const markArrived = async (taskId) => {
    setArrivedLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post(`/api/worker/tasks/${taskId}/arrived`);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to mark arrival";
      setError(msg);
      throw new Error(msg);
    } finally {
      setArrivedLoading(false);
    }
  };

  /**
   * Call when worker submits the OTP from the user.
   * Returns { success } on correct code.
   * Throws with err.expired = true if the OTP timed out.
   */
  const submitOTP = async (taskId, otp) => {
    setOtpLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.post(
        `/api/worker/tasks/${taskId}/verify-otp`,
        { otp }
      );
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "OTP verification failed";
      const expired = err.response?.data?.expired || false;
      setError(msg);
      const e = new Error(msg);
      e.expired = expired;
      throw e;
    } finally {
      setOtpLoading(false);
    }
  };

  return { markArrived, submitOTP, arrivedLoading, otpLoading, error, clearError: () => setError(null) };
}
