import { useState } from "react";
import axiosInstance from "../../api/axios";
import { useAuth } from "../../components/context/AuthContext";

const useWorkerRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  // Cloudinary Config
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  /**
   * Uploads a file to Cloudinary
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

  const registerWorker = async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload ID Image if it's a file object
      // The component sends FormData which is hard to iterate/modify for this specific logic
      // if passing pure object, it's easier. But let's assume component is sending FormData or object.
      // The current component code sends `new FormData()`. We need to handle that or change component invocation.
      // CHANGING COMPONENT INVOCATION IS BETTER but user asked to fix here. The hook receives `formData`.
      
      // If formData is FormData instance
      let idCardImageUrl = null;
      let payload = {};

      if (formData instanceof FormData) {
        const file = formData.get("file");
        if (file && file instanceof File) {
          idCardImageUrl = await uploadToCloudinary(file);
        }
        
        // Convert FormData to plain object
        formData.forEach((value, key) => {
          if (key !== "file") payload[key] = value;
        });
      } else {
        // If it's a plain object (future proofing)
         payload = { ...formData };
         if (payload.file && payload.file instanceof File) {
             idCardImageUrl = await uploadToCloudinary(payload.file);
             delete payload.file;
         }
      }

      if (idCardImageUrl) {
        payload.idCardImage = idCardImageUrl;
      }

      // 2. Send JSON payload to backend
      const response = await axiosInstance.post(
        "/api/worker/verify-worker",
        payload,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
            // Axios handles Content-Type: application/json automatically
          },
        },
      );

      if (response.data.success) {
        setSuccess(true);
        return response.data;
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Something went wrong during registration.",
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { registerWorker, loading, error, success };
};

export default useWorkerRegistration;
