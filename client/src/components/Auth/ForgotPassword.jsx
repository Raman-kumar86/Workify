import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axios.jsx";
import { usePopup } from "../../context/PopupContext.jsx";
import ImageSection from "./ImageSection";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

const formatCountdown = (targetTime, now) => {
  if (!targetTime) return "";

  const remainingMs = new Date(targetTime).getTime() - now;
  if (remainingMs <= 0) return "0s";

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [meta, setMeta] = useState({
    resendAvailableAt: null,
    otpExpiresAt: null,
  });
  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [now, setNow] = useState(Date.now());
  const { showPopup } = usePopup();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const resendCountdown = useMemo(
    () => formatCountdown(meta.resendAvailableAt, now),
    [meta.resendAvailableAt, now],
  );
  const otpExpiryCountdown = useMemo(
    () => formatCountdown(meta.otpExpiresAt, now),
    [meta.otpExpiresAt, now],
  );
  const canResend = !meta.resendAvailableAt || new Date(meta.resendAvailableAt).getTime() <= now;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();

    if (!form.email) {
      showPopup({
        type: "warning",
        title: "Email Required",
        message: "Please enter your email address",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post(
        "/api/auth/forgot-password/request-otp",
        { email: form.email.trim() },
      );

      setMeta({
        resendAvailableAt: response.data.resendAvailableAt,
        otpExpiresAt: response.data.otpExpiresAt,
      });
      setStep("reset");
      showPopup({
        type: "success",
        title: "OTP Sent",
        message: response.data.message || "OTP sent to your email",
      });
    } catch (requestError) {
      showPopup({
        type: "error",
        title: "OTP Request Failed",
        message: requestError.response?.data?.message || "Failed to send OTP",
      });
      if (requestError.response?.data?.resendAvailableAt) {
        setMeta((prev) => ({
          ...prev,
          resendAvailableAt: requestError.response.data.resendAvailableAt,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !form.email) {
      return;
    }

    setResendLoading(true);

    try {
      const response = await axiosInstance.post(
        "/api/auth/forgot-password/resend-otp",
        { email: form.email.trim() },
      );

      setMeta({
        resendAvailableAt: response.data.resendAvailableAt,
        otpExpiresAt: response.data.otpExpiresAt,
      });
      showPopup({
        type: "info",
        title: "OTP Resent",
        message: response.data.message || "OTP resent successfully",
      });
    } catch (requestError) {
      showPopup({
        type: "error",
        title: "Resend Failed",
        message: requestError.response?.data?.message || "Failed to resend OTP",
      });
      if (requestError.response?.data?.resendAvailableAt) {
        setMeta((prev) => ({
          ...prev,
          resendAvailableAt: requestError.response.data.resendAvailableAt,
        }));
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!form.otp || form.otp.trim().length !== 6) {
      showPopup({
        type: "warning",
        title: "Invalid OTP",
        message: "Enter the 6-digit OTP sent to your email",
      });
      return;
    }

    if (!PASSWORD_REGEX.test(form.password)) {
      showPopup({
        type: "warning",
        title: "Weak Password",
        message:
          "Password must be 8+ chars with uppercase, lowercase, number, and special character",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      showPopup({
        type: "warning",
        title: "Password Mismatch",
        message: "Passwords do not match",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post("/api/auth/forgot-password/reset", {
        email: form.email.trim(),
        otp: form.otp.trim(),
        password: form.password,
      });

      showPopup({
        type: "success",
        title: "Password Updated",
        message: response.data.message || "Password reset successful",
      });
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (requestError) {
      showPopup({
        type: "error",
        title: "Reset Failed",
        message: requestError.response?.data?.message || "Failed to reset password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <ImageSection />

      <div className="w-full md:w-2/5 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-3 text-gray-800">Forgot Password</h2>
          <p className="text-sm text-gray-500 mb-6">
            {step === "request"
              ? "Enter your email to receive a reset OTP."
              : "Enter the OTP and choose a new password."}
          </p>

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-black"
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 ${
                  loading ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  readOnly
                  className="w-full rounded-lg border bg-gray-50 p-3 text-gray-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600">OTP</label>
                <input
                  type="text"
                  name="otp"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={form.otp}
                  onChange={handleChange}
                  className="w-full rounded-lg border p-3 tracking-[0.35em] focus:ring-2 focus:ring-black"
                />
                <p className="mt-2 text-xs text-gray-500">
                  OTP expires in {otpExpiryCountdown || "15m 00s"}
                </p>
              </div>

              <input
                type="password"
                name="password"
                placeholder="New Password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-black"
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-lg border p-3 focus:ring-2 focus:ring-black"
              />

              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 ${
                  loading ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || !canResend}
                className={`w-full rounded-lg border py-3 transition ${
                  resendLoading || !canResend
                    ? "cursor-not-allowed border-gray-200 text-gray-400"
                    : "hover:bg-gray-50"
                }`}
              >
                {resendLoading
                  ? "Resending OTP..."
                  : canResend
                    ? "Resend OTP"
                    : `Resend OTP in ${resendCountdown}`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setForm((prev) => ({
                    ...prev,
                    otp: "",
                    password: "",
                    confirmPassword: "",
                  }));
                  setError("");
                  setSuccess("");
                }}
                className="w-full text-sm text-gray-500 underline-offset-4 hover:underline"
              >
                Change email
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-600">
            Remembered your password?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
