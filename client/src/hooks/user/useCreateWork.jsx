import { useState, useEffect } from "react";
import axiosInstance from "../../api/axios.jsx";
import { useDispatch } from "react-redux";
import { addWork } from "../../redux/slices/userWorkSlice.jsx";

const useCreateWork = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState([]);
  const dispatch = useDispatch();

  // Fetch categories from the DB on mount
  useEffect(() => {
    axiosInstance
      .get("/api/admin/categories")
      .then((res) => setCategories(res.data?.categories || []))
      .catch(() => {}); // silently fall back to an empty array
  }, []);

  // Cloudinary Config
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  /**
   * Uploads a single file to Cloudinary
   */
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      if (!res.ok) throw new Error("Failed to upload image to Cloudinary");
      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  /**
   * createWork
   * Token is NOT required as a parameter — axiosInstance interceptor
   * injects it automatically from the Redux store.
   *
   * @param {Object} data - Task form data
   * @returns {Object} - Response from backend
   */
  const createWork = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload images to Cloudinary first
      let imageUrls = [];
      if (data.images && data.images.length > 0) {
        const uploadPromises = data.images.map((img) =>
          typeof img === "string" ? img : uploadToCloudinary(img)
        );
        imageUrls = await Promise.all(uploadPromises);
      }

      // 2. Build JSON payload
      const payload = { ...data, images: imageUrls };

      // 3. POST — axiosInstance automatically attaches Bearer token from Redux
      const response = await axiosInstance.post("/api/user/create", payload);

      setSuccess(true);

      // 4. Optimistically push new task into Redux
      if (response.data?.task) {
        dispatch(addWork(response.data.task));
      }

      return response.data;
    } catch (err) {
      console.error("Create work error:", err);
      const message =
        err.response?.data?.message || err.message || "Failed to create task";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { createWork, loading, error, success, categories };
};

export default useCreateWork;

