import { useEffect, useState } from "react";
import useAdminTasks from "../../hooks/admin/useAdminTasks";
import { badgeCls, btnCls, OVERLAY } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const ForceAssignModal = ({ task, onClose, onAssigned }) => {
  const { nearbyWorkers, loading, fetchNearbyWorkers, forceAssign } = useAdminTasks();
  const [selected, setSelected] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [radius, setRadius] = useState(20);
  const { showPopup } = usePopup();

  useEffect(() => {
    fetchNearbyWorkers(task._id, radius);
  }, [task._id, radius]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      await forceAssign(task._id, selected);
      showPopup({ type: "success", title: "Task Assigned", message: "Task assigned successfully." });
      setTimeout(() => onAssigned(), 1000);
    } catch {
      showPopup({ type: "error", title: "Assignment Failed", message: "Failed to assign task" });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className={OVERLAY} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Force Assign - {task.title}</h2>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-semibold text-gray-700">Radius (km):</label>
          <input
            type="number" min={1} max={100} value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value) || 20)}
            className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className={btnCls("ghost", true)} onClick={() => fetchNearbyWorkers(task._id, radius)}>Refresh</button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Loading nearby workers...</div>
        ) : nearbyWorkers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No workers found within {radius} km</div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2 mb-4">
            {nearbyWorkers.map((w) => (
              <div
                key={w._id}
                onClick={() => setSelected(w._id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selected === w._id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{w.userId?.name ?? "-"}</p>
                  <p className="text-xs text-gray-500">{w.userId?.email}</p>
                </div>
                <span className="text-sm text-gray-700">* {w.rating?.toFixed(1) ?? "0.0"}</span>
                <span className={badgeCls(w.isOnline ? "green" : "gray")}>{w.isOnline ? "Online" : "Offline"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button className={btnCls("ghost")} onClick={onClose}>Cancel</button>
          <button className={btnCls("primary")} disabled={!selected || assigning} onClick={handleAssign}>
            {assigning ? "Assigning..." : "Confirm Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForceAssignModal;
