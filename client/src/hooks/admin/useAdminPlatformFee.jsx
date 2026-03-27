import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../api/axios.jsx";
import { setAdminFee } from "../../redux/slices/adminSlice.jsx";

const useAdminPlatformFee = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const fetchFee = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/admin/platform-fee");
      dispatch(setAdminFee(res.data.feePercent));
      return res.data.feePercent;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch fee");
    } finally {
      setLoading(false);
    }
  };

  const saveFee = async (feePercent) => {
    setSaving(true);
    try {
      const res = await axiosInstance.patch("/api/admin/platform-fee", { feePercent });
      dispatch(setAdminFee(res.data.feePercent));
      return res.data.feePercent;
    } catch (err) {
      throw new Error(err.response?.data?.message || "Failed to save fee");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { fetchFee(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { loading, saving, error, fetchFee, saveFee };
};

export default useAdminPlatformFee;
