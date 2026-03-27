import { useEffect, useState } from "react";
import useAdminUsers from "../../hooks/admin/useAdminUsers";
import { badgeCls, btnCls, TH, TD, TR, OVERLAY, MODAL, inputCls, labelCls, Pagination } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const isBanned = (u) => u.banExpiresAt && new Date(u.banExpiresAt) > new Date();
const statusColor = (s) => ({ completed: "green", assigned: "blue", cancelled: "red", pending: "yellow" }[s] ?? "gray");
const selectCls = "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const UsersList = () => {
  const { users, pagination, loading, error, fetchUsers, fetchUserProfile, banUser, unbanUser } = useAdminUsers();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [profileModal, setProfileModal] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [banModal, setBanModal] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { showPopup } = usePopup();

  useEffect(() => { fetchUsers({ page, limit: 20 }); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers({ page: 1, limit: 20, search });
  };

  const openProfile = async (user) => {
    setProfileModal(user);
    setProfileData(null);
    try {
      const data = await fetchUserProfile(user._id);
      setProfileData(data);
    } catch { /* show spinner */ }
  };

  const handleBan = async () => {
    if (!banModal) return;
    setActionLoading(true);
    try {
      await banUser(banModal._id, { reason: banReason, durationHours: banDuration ? parseInt(banDuration) : undefined });
      setBanModal(null);
      showPopup({ type: "success", title: "User Banned", message: "User has been banned." });
    } catch {
      showPopup({ type: "error", title: "Ban Failed", message: "Failed to ban user" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (id) => {
    setActionLoading(true);
    try {
      await unbanUser(id);
      showPopup({ type: "success", title: "User Unbanned", message: "User has been unbanned." });
    } catch {
      showPopup({ type: "error", title: "Unban Failed", message: "Failed to unban user" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading users...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Users</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Users ({pagination?.total ?? 0})</h2>
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

        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Email</th>
                  <th className={TH}>Wallet</th>
                  <th className={TH}>Joined</th>
                  <th className={TH}>Ban?</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className={TR}>
                    <td className={TD}>{u.name}</td>
                    <td className={TD}>{u.email}</td>
                    <td className={TD}>INR {u.walletBalance ?? 0}</td>
                    <td className={TD}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className={TD}>
                      <span className={badgeCls(isBanned(u) ? "red" : "green")}>{isBanned(u) ? "Banned" : "Active"}</span>
                    </td>
                    <td className={TD}>
                      <div className="flex gap-2">
                        <button className={btnCls("ghost", true)} onClick={() => openProfile(u)}>Profile</button>
                        {isBanned(u) ? (
                          <button className={btnCls("success", true)} disabled={actionLoading} onClick={() => handleUnban(u._id)}>Unban</button>
                        ) : (
                          <button className={btnCls("danger", true)} disabled={actionLoading} onClick={() => { setBanModal(u); setBanReason(""); setBanDuration(""); }}>Ban</button>
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
          <div className={MODAL} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">User Profile:  {profileModal.name}</h2>
            {!profileData ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-5 text-sm">
                  <div><span className="font-semibold text-gray-600">Email:</span> {profileData.user.email}</div>
                  <div><span className="font-semibold text-gray-600">Wallet:</span> INR {profileData.user.walletBalance ?? 0}</div>
                  <div><span className="font-semibold text-gray-600">Joined:</span> {new Date(profileData.user.createdAt).toLocaleDateString()}</div>
                </div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Tasks ({profileData.tasks.length})</h4>
                <div className="space-y-1">
                  {profileData.tasks.slice(0, 5).map((t) => (
                    <div key={t._id} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
                      <span className="text-gray-800 font-medium">{t.title}</span>
                      <span className={badgeCls(statusColor(t.status))}>{t.status}</span>
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">Ban User - {banModal.name}</h2>
            <div className="mb-4">
              <label className={labelCls}>Reason (optional)</label>
              <textarea className={inputCls} rows={2} value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder="Enter reason..." />
            </div>
            <div className="mb-4">
              <label className={labelCls}>Duration (hours, leave empty for permanent)</label>
              <input className={inputCls} type="number" min={1} value={banDuration} onChange={(e) => setBanDuration(e.target.value)} placeholder="e.g. 24" />
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

export default UsersList;
