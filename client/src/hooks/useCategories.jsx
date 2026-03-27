import { useEffect, useState } from "react";
import axiosInstance from "../api/axios.jsx";

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    axiosInstance
      .get("/api/user/categories")
      .then((res) => {
        if (!cancelled) setCategories(res.data?.categories ?? []);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message || "Failed to load categories");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
};

export default useCategories;
