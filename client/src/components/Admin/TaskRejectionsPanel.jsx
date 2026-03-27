import { useEffect, useState } from "react";
import useAdminRejections from "../../hooks/admin/useAdminRejections";
import { badgeCls, btnCls, TH, TD, TR, Pagination } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const TaskRejectionsPanel = () => {
  const { rejections, pagination, loading, error, fetchRejections, liftBan } = useAdminRejections();
  const [page, setPage] = useState(1);
  const [liftingId, setLiftingId] = useState(null);
  const { showPopup } = usePopup();

  useEffect(() => { fetchRejections({ page, limit: 20 }); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLiftBan = async (id) => {
    setLiftingId(id);
    try {
      await liftBan(id);
      showPopup({ type: "success", title: "Ban Lifted", message: "Ban lifted successfully." });
    } catch {
      showPopup({ type: "error", title: "Action Failed", message: "Failed to lift ban" });
    } finally {
      setLiftingId(null);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading rejections...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Task Rejections</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Rejections ({pagination?.total ?? 0})</h2>
        </div>

        {rejections.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No rejections found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Worker</th>
                  <th className={TH}>Task</th>
                  <th className={TH}>Reason</th>
                  <th className={TH}>Rejected At</th>
                  <th className={TH}>Reviewed</th>
                  <th className={TH}>Ban Lifted</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rejections.map((r) => (
                  <tr key={r._id} className={TR}>
                    <td className={TD}>{r.workerId?.userId?.name ?? "-"}</td>
                    <td className={TD}>{r.taskId?.title ?? "-"}</td>
                    <td className={TD + " max-w-[200px] truncate"}>{r.reason}</td>
                    <td className={TD}>{new Date(r.rejectedAt).toLocaleDateString()}</td>
                    <td className={TD}><span className={badgeCls(r.adminReviewed ? "green" : "yellow")}>{r.adminReviewed ? "Yes" : "No"}</span></td>
                    <td className={TD}><span className={badgeCls(r.banLifted ? "green" : "red")}>{r.banLifted ? "Lifted" : "Active"}</span></td>
                    <td className={TD}>
                      {!r.banLifted && (
                        <button className={btnCls("success", true)} disabled={liftingId === r._id} onClick={() => handleLiftBan(r._id)}>
                          {liftingId === r._id ? "..." : "Lift Ban"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={pagination?.totalPages ?? 1} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  );
};

export default TaskRejectionsPanel;
