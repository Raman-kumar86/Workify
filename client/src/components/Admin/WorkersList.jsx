import { useEffect, useState } from "react";
import useAdminWorkers from "../../hooks/admin/useAdminWorkers";
import { badgeCls, btnCls, TH, TD, TR, OVERLAY, MODAL, inputCls, labelCls, Pagination } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const isBanned = (w) => {
  const ban = w.banExpiresAt || w.userId?.banExpiresAt;
  return ban && new Date(ban) > new Date();
};

const statusBadge = (status) =>
  ({ verified: "green", pending: "yellow", rejected: "red", completed: "green", assigned: "blue", cancelled: "red" }[status] ?? "gray");

const selectCls = "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const WorkersList = () => {
  const { workers, pagination, loading, error, fetchWorkers, fetchWorkerProfile, banWorker, unbanWorker } = useAdminWorkers();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [profileModal, setProfileModal] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");
  const [banFineAmount, setBanFineAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { showPopup } = usePopup();

  useEffect(() => {
    fetchWorkers({ page, limit: 20, search, status: statusFilter });
  }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWorkers({ page: 1, limit: 20, search, status: statusFilter });
  };

  const openProfile = async (worker) => {
    setProfileModal(worker);
    setProfileData(null);
    try {
      const data = await fetchWorkerProfile(worker._id);
      setProfileData(data);
    } catch { /* keep showing spinner */ }
  };

  const handleBan = async () => {
    if (!banModal) return;
    setActionLoading(true);
    try {
      await banWorker(banModal._id, {
        reason: banReason,
        durationHours: banDuration ? parseInt(banDuration) : undefined,
        fineAmount: banFineAmount ? Number(banFineAmount) : 0,
      });
      setBanModal(null);
      showPopup({ type: "success", title: "Worker Banned", message: "Worker has been banned." });
    } catch {
      showPopup({ type: "error", title: "Ban Failed", message: "Failed to ban worker" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (id) => {
    setActionLoading(true);
    try {
      await unbanWorker(id);
      showPopup({ type: "success", title: "Worker Unbanned", message: "Worker has been unbanned." });
    } catch {
      showPopup({ type: "error", title: "Unban Failed", message: "Failed to unban worker" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading workers...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Workers</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Workers ({pagination?.total ?? 0})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select className={selectCls} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
                placeholder="Search name / email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className={btnCls("primary", true)}>Search</button>
            </form>
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No workers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Rating</th>
                  <th className={TH}>Completed</th>
                  <th className={TH}>Total Earning</th>
                  <th className={TH}>Ban?</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id} className={TR}>
                    <td className={TD}>{w.userId?.name ?? "-"}</td>
                    <td className={TD}>{w.userId?.email ?? "-"}</td>
                    <td className={TD}><span className={badgeCls(statusBadge(w.status))}>{w.status}</span></td>
                    <td className={TD}>* {w.rating?.toFixed(1) ?? "0.0"}</td>
                    <td className={TD}>{w.completedTasks ?? 0}</td>
                    <td className={TD}>₹{Number(w.totalEarnings || 0).toLocaleString("en-IN")}</td>
                    <td className={TD}>
                      <span className={badgeCls(isBanned(w) ? "red" : "green")}>{isBanned(w) ? "Banned" : "Active"}</span>
                    </td>
                    <td className={TD}>
                      <div className="flex gap-2">
                        <button className={btnCls("ghost", true)} onClick={() => openProfile(w)}>Profile</button>
                        {isBanned(w) ? (
                          <button className={btnCls("success", true)} disabled={actionLoading} onClick={() => handleUnban(w._id)}>Unban</button>
                        ) : (
                          <button className={btnCls("danger", true)} disabled={actionLoading} onClick={() => { setBanModal(w); setBanReason(""); setBanDuration(""); setBanFineAmount(""); }}>Ban</button>
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

      {/* Profile Modal */}
      {profileModal && (
        <div className={OVERLAY} onClick={() => setProfileModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Worker Profile - {profileModal.userId?.name}</h2>
            {!profileData ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading profile...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                  <div><span className="font-semibold text-gray-600">Email:</span> {profileData.worker.userId?.email}</div>
                  <div><span className="font-semibold text-gray-600">Rating:</span> * {profileData.worker.rating?.toFixed(1)}</div>
                  <div><span className="font-semibold text-gray-600">Tasks Completed:</span> {profileData.worker.completedTasks}</div>
                  <div><span className="font-semibold text-gray-600">Total Earning:</span> ₹{Number(profileData.worker.totalEarnings || 0).toLocaleString("en-IN")}</div>
                  <div><span className="font-semibold text-gray-600">Pending Amount:</span> ₹{Number(profileData.worker.outstandingFines || 0).toLocaleString("en-IN")}</div>
                  <div><span className="font-semibold text-gray-600">Withdrawable:</span> ₹{Math.max(0, Number(profileData.worker.totalEarnings || 0) + Number(profileData.worker.walletCredit || 0) - Number(profileData.worker.totalWithdrawn || 0)).toLocaleString("en-IN")}</div>
                  <div>
                    <span className="font-semibold text-gray-600">Status:</span>{" "}
                    <span className={badgeCls(statusBadge(profileData.worker.status))}>{profileData.worker.status}</span>
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Tasks ({profileData.tasks.length})</h4>
                <div className="space-y-1">
                  {profileData.tasks.slice(0, 5).map((t) => (
                    <div key={t._id} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
                      <span className="text-gray-800 font-medium">{t.title}</span>
                      <span className={badgeCls(statusBadge(t.status))}>{t.status}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
              <button className={btnCls("ghost")} onClick={() => setProfileModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal && (
        <div className={OVERLAY} onClick={() => setBanModal(null)}>
          <div className={MODAL} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ban Worker - {banModal.userId?.name}</h2>
            <div className="mb-4">
              <label className={labelCls}>Reason (optional)</label>
              <textarea className={inputCls} rows={2} value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Enter reason..." />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Duration (hours, leave empty for permanent)</label>
              <input className={inputCls} type="number" min={1} value={banDuration} onChange={(e) => setBanDuration(e.target.value)} placeholder="e.g. 24" />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Pending Amount To Add (optional)</label>
              <input className={inputCls} type="number" min={0} value={banFineAmount} onChange={(e) => setBanFineAmount(e.target.value)} placeholder="e.g. 300" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button className={btnCls("ghost")} onClick={() => setBanModal(null)}>Cancel</button>
              <button className={btnCls("danger")} disabled={actionLoading} onClick={handleBan}>Confirm Ban</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkersList;
