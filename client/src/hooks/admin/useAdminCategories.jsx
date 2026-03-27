import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../api/axios.jsx";
import {
  setAdminCategories,
  addAdminCategory,
  updateAdminCategory,
  removeAdminCategory,
} from "../../redux/slices/adminSlice.jsx";

const useAdminCategories = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/api/admin/categories");
      dispatch(setAdminCategories(res.data.categories));
      return res.data.categories;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (data) => {
    const res = await axiosInstance.post("/api/admin/categories", data);
    dispatch(addAdminCategory(res.data.category));
    return res.data.category;
  };

  const updateCategory = async (id, data) => {
    const res = await axiosInstance.put(`/api/admin/categories/${id}`, data);
    dispatch(updateAdminCategory(res.data.category));
    return res.data.category;
  };

  const deleteCategory = async (id) => {
    await axiosInstance.delete(`/api/admin/categories/${id}`);
    dispatch(removeAdminCategory(id));
  };

  useEffect(() => { fetchCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { loading, error, fetchCategories, createCategory, updateCategory, deleteCategory };
};

export default useAdminCategories;
