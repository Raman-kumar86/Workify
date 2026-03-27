import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FiMail, FiLock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../../context/PopupContext.jsx";
import useGoogleAuth from "../../hooks/auth/useGoogleAuth";
import useLogin from "../../hooks/auth/useLogin";
import ImageSection from "./ImageSection";

const navigateByUserType = (navigate, response) => {
  const userType = response.user.userType;

  if (userType === "admin") {
    navigate("/admin");
    return;
  }

  if (userType === "worker" && response.user.isVerified === false) {
    navigate("/worker");
    return;
  }

  if (userType === "worker" && response.user.isVerified === true) {
    navigate("/worker/dashboard");
    return;
  }

  navigate("/user");
};

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const { loginUser, loading } = useLogin();
  const {
    authenticateWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();
  const { showPopup } = usePopup();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      showPopup({
        type: "warning",
        title: "Missing Fields",
        message: "Please fill in email and password",
      });
      return;
    }

    try {
      const response = await loginUser(form);
      showPopup({
        type: "success",
        title: "Welcome Back",
        message: "You are logged in successfully",
      });
      navigateByUserType(navigate, response);
    } catch (err) {
      // Error is handled by the hook and exposed via loginError
      showPopup({
        type: "error",
        title: "Login Failed",
        message: err.response?.data?.message || "Login failed",
      });
      console.error("Login failed", err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await authenticateWithGoogle();
      showPopup({
        type: "success",
        title: "Google Login",
        message: "Signed in with Google successfully",
      });
      navigateByUserType(navigate, response);
    } catch (err) {
      showPopup({
        type: "error",
        title: "Google Login Failed",
        message: err.response?.data?.message || googleError || "Google login failed",
      });
      console.error("Google login failed", err);
    }
  };

  const isSubmitting = loading || googleLoading;

  return (
    <div className="min-h-screen flex">
      {/* Left Image Section */}
      <ImageSection />
      

      {/* Right Login Form */}
      <div className="w-full md:w-2/5 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <FiMail className="absolute top-4 left-3 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <FiLock className="absolute top-4 left-3 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-black"
              />

              <div className="text-right mt-1">
                <a
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="grow border-gray-300" />
              <span className="text-gray-400 text-sm">OR</span>
              <hr className="grow border-gray-300" />
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 border py-3 rounded-lg hover:bg-gray-100 transition ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <FcGoogle size={22} />
              {googleLoading ? "Connecting to Google..." : "Continue with Google"}
            </button>

            {/* Signup Link */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Don’t have an account?{" "}
              <a
                href="/signup"
                className="text-blue-600 hover:underline font-medium"
              >
                Sign up here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
