import { useSelector } from "react-redux";
import { useState } from "react";
import useAdminPlatformFee from "../../hooks/admin/useAdminPlatformFee";
import useAdminStats from "../../hooks/admin/useAdminStats";
import { inputCls, labelCls, btnCls } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const PlatformFeeSettings = () => {
  const { loading, saving, error, saveFee } = useAdminPlatformFee();
  const feePercent = useSelector((s) => s.admin.feePercent);
  const stats = useSelector((s) => s.admin.stats);
  useAdminStats();
  const [inputVal, setInputVal] = useState("");
  const { showPopup } = usePopup();

  const handleSave = async (e) => {
    e.preventDefault();
    const val = parseFloat(inputVal);
    if (isNaN(val) || val < 0 || val > 100) {
      showPopup({
        type: "error",
        title: "Invalid Value",
        message: "Please enter a value between 0 and 100",
      });
      return;
    }
    try {
      await saveFee(val);
      setInputVal("");
      showPopup({
        type: "success",
        title: "Fee Updated",
        message: `Platform fee updated to ${val}%`,
      });
    } catch (err) {
      showPopup({ type: "error", title: "Update Failed", message: err.message });
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading fee settings...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  const workerPct = feePercent != null ? 100 - feePercent : null;
  const platformEarnings = Number(stats?.finance?.platformEarnings || 0);
  const completedTasksCount = Number(stats?.finance?.completedTasksCount || 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finance / Platform Fee</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
        <h2 className="text-base font-bold text-gray-800 mb-5">Platform Fee Configuration</h2>

        {feePercent != null && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-5 text-center">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Platform Takes</p>
              <p className="text-4xl font-black text-blue-600">{feePercent}%</p>
            </div>
            <div className="bg-green-50 rounded-xl p-5 text-center">
              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Worker Gets</p>
              <p className="text-4xl font-black text-green-600">{workerPct}%</p>
            </div>
          </div>
        )}

        <div className="bg-amber-50 rounded-xl p-5 mb-6 border border-amber-100">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">Platform Fee Earnings</p>
          <p className="text-3xl font-black text-amber-700">₹{platformEarnings.toLocaleString("en-IN")}</p>
          <p className="text-xs text-amber-600 mt-1">From {completedTasksCount} completed tasks</p>
        </div>

        <form onSubmit={handleSave}>
          <div className="mb-4">
            <label className={labelCls}>New Fee Percentage (%)</label>
            <input
              type="number" min={0} max={100} step={0.5}
              className={inputCls}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={feePercent != null ? `Current: ${feePercent}%` : "e.g. 10"}
              required
            />
          </div>
          <button type="submit" className={btnCls("primary")} disabled={saving}>
            {saving ? "Saving..." : "Update Fee"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlatformFeeSettings;
