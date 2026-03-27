import { useEffect, useState } from "react";
import useAdminWorkers from "../../hooks/admin/useAdminWorkers";
import { btnCls, TH, TD, TR, OVERLAY, MODAL, inputCls, labelCls, Pagination } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const WorkerVerification = () => {
  const { workers, pagination, loading, error, fetchPendingWorkers, approveWorker, rejectWorker } =
    useAdminWorkers();
  const [page, setPage] = useState(1);
  const [viewWorker, setViewWorker] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { showPopup } = usePopup();

  useEffect(() => {
    fetchPendingWorkers({ page, limit: 20 });
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApprove = async (id) => {
    setActionLoading(true);
    try {
      await approveWorker(id);
      showPopup({ type: "success", title: "Worker Approved", message: "Worker approved successfully." });
    } catch {
      showPopup({ type: "error", title: "Approval Failed", message: "Failed to approve worker" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      await rejectWorker(rejectModal._id, rejectReason);
      setRejectModal(null);
      setRejectReason("");
      showPopup({ type: "success", title: "Worker Rejected", message: "Worker rejected successfully." });
    } catch {
      showPopup({ type: "error", title: "Rejection Failed", message: "Failed to reject worker" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading pending workers...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Worker Verification</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Pending Workers ({pagination?.total ?? 0})</h2>
        </div>

        {workers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No pending workers</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Contact</th>
                  <th className={TH}>Aadhar</th>
                  <th className={TH}>Submitted</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w._id} className={TR}>
                    <td className={TD}>{w.userId?.name ?? "-"}</td>
                    <td className={TD}>{w.userId?.email ?? "-"}</td>
                    <td className={TD}>{w.userId?.contactNumber ?? "-"}</td>
                    <td className={TD}>{w.adharCardNumber}</td>
                    <td className={TD}>{new Date(w.createdAt).toLocaleDateString()}</td>
                    <td className={TD}>
                      <div className="flex gap-2">
                        <button className={btnCls("ghost", true)} onClick={() => setViewWorker(w)}>View ID</button>
                        <button className={btnCls("success", true)} disabled={actionLoading} onClick={() => handleApprove(w._id)}>Approve</button>
                        <button className={btnCls("danger", true)} disabled={actionLoading} onClick={() => { setRejectModal(w); setRejectReason(""); }}>Reject</button>
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

      {/* View ID Card Modal */}
      {viewWorker && (
        <div className={OVERLAY} onClick={() => setViewWorker(null)}>
          <div className={MODAL} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">ID Card - {viewWorker.userId?.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Aadhar: <strong>{viewWorker.adharCardNumber}</strong></p>
            {viewWorker.idCardImage ? (
              <img src={viewWorker.idCardImage} alt="ID Card" className="w-full rounded-lg border border-gray-200 mb-4" />
            ) : (
              <p className="text-gray-400 text-sm mb-4">No image uploaded</p>
            )}
            <div className="flex justify-end">
              <button className={btnCls("ghost")} onClick={() => setViewWorker(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className={OVERLAY} onClick={() => setRejectModal(null)}>
          <div className={MODAL} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reject Worker</h2>
            <p className="text-sm text-gray-500 mb-4">Rejecting: <strong>{rejectModal.userId?.name}</strong></p>
            <div className="mb-4">
              <label className={labelCls}>Reason (optional)</label>
              <textarea className={inputCls} rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Invalid Aadhar document" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button className={btnCls("ghost")} onClick={() => setRejectModal(null)}>Cancel</button>
              <button className={btnCls("danger")} disabled={actionLoading} onClick={handleReject}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerVerification;
