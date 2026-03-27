import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../../context/PopupContext.jsx";
import useGoogleAuth from "../../hooks/auth/useGoogleAuth";
import useSignup from "../../hooks/auth/useSignup";
import ImageSection from "./ImageSection";

const navigateByUserType = (navigate, response) => {
  if (response.user.userType === "worker") {
    navigate(response.user.isVerified ? "/worker/dashboard" : "/worker");
    return;
  }

  navigate("/user");
};

export default function SignupPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    userType: "user",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const { signupUser, loading, error: signupError } = useSignup();
  const {
    authenticateWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();
  const { showPopup } = usePopup();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

    if (!/^[A-Za-z\s]+$/.test(form.name)) {
      newErrors.name = "Name should not contain special characters or numbers";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(
        form.password,
      )
    ) {
      newErrors.password =
        "Password must be 8+ chars with uppercase, lowercase, number & special character";
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        const { confirmPassword, ...signupData } = form; // Exclude confirmPassword
        const response = await signupUser(signupData);
        showPopup({
          type: "success",
          title: "Account Created",
          message:
            response?.message ||
            "Signup successful. Continue to login.",
        });
        navigate("/login"); // Navigate to login on success
      } catch (err) {
        showPopup({
          type: "error",
          title: "Signup Failed",
          message: err.response?.data?.message || "Signup failed",
        });
        console.error("Signup failed", err);
      }
    } else {
      showPopup({
        type: "warning",
        title: "Please Check Form",
        message: "Some fields are invalid. Fix them and try again.",
      });
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear specific error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const response = await authenticateWithGoogle({ userType: form.userType });
      showPopup({
        type: "success",
        title: "Google Signup",
        message: "Signed up and logged in successfully",
      });
      navigateByUserType(navigate, response);
    } catch (err) {
      showPopup({
        type: "error",
        title: "Google Signup Failed",
        message: err.response?.data?.message || googleError || "Google signup failed",
      });
      console.error("Google signup failed", err);
    }
  };

  const isSubmitting = loading || googleLoading;

  return (
    <div className="min-h-screen flex">
      {/* Left Image Section */}
      <ImageSection />
      {/* Right Form Section */}
      <div className="w-full md:w-2/5 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Create Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            {/* User Type */}
            <div className="flex gap-6">
              Account Type:
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="userType"
                  value="user"
                  checked={form.userType === "user"}
                  onChange={handleChange}
                />
                User
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="userType"
                  value="worker"
                  checked={form.userType === "worker"}
                  onChange={handleChange}
                />
                Worker
              </label>
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-black"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <hr className="grow border-gray-300" />
              <span className="text-gray-400 text-sm">OR</span>
              <hr className="grow border-gray-300" />
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-3 border py-3 rounded-lg hover:bg-gray-100 transition ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <FcGoogle size={22} />
              {googleLoading ? "Connecting to Google..." : "Sign up with Google"}
            </button>

            {/* Already have account */}
            <p className="text-center text-sm text-gray-600 mt-4">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Login here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
