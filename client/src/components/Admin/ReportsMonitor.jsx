import { useEffect, useState } from "react";
import useAdminReports from "../../hooks/admin/useAdminReports";
import { badgeCls, btnCls, TH, TD, TR, Pagination } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const statusColor = (s) => ({ pending: "yellow", reviewed: "blue", resolved: "green" }[s] ?? "gray");
const selectCls = "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const ReportsMonitor = () => {
  const { reports, pagination, loading, error, fetchReports, updateStatus } = useAdminReports();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const { showPopup } = usePopup();

  useEffect(() => {
    fetchReports({ page, limit: 20, status: statusFilter });
  }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatus = async (id, status) => {
    try {
      await updateStatus(id, status);
      showPopup({
        type: "success",
        title: "Report Updated",
        message: `Report marked as ${status}`,
      });
    } catch {
      showPopup({ type: "error", title: "Update Failed", message: "Failed to update status" });
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading reports...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports Monitor</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Reports ({pagination?.total ?? 0})</h2>
          <select className={selectCls} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No reports found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>User</th>
                  <th className={TH}>Worker</th>
                  <th className={TH}>Task</th>
                  <th className={TH}>Reason</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id} className={TR}>
                    <td className={TD}>{r.userId?.name ?? "-"}</td>
                    <td className={TD}>{r.workerId?.userId?.name ?? "-"}</td>
                    <td className={TD}>{r.taskId?.title ?? "-"}</td>
                    <td className={TD + " max-w-45 truncate"}>{r.reason}</td>
                    <td className={TD}><span className={badgeCls(statusColor(r.status))}>{r.status}</span></td>
                    <td className={TD}>
                      <div className="flex gap-2">
                        {r.status === "pending" && (
                          <button className={btnCls("blue", true)} onClick={() => handleStatus(r._id, "reviewed")}>Mark Reviewed</button>
                        )}
                        {r.status !== "resolved" && (
                          <button className={btnCls("success", true)} onClick={() => handleStatus(r._id, "resolved")}>Resolve</button>
                        )}
                      </div>
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

export default ReportsMonitor;
