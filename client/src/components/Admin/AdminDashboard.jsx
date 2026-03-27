import { useSelector } from "react-redux";
import useAdminStats from "../../hooks/admin/useAdminStats";
import { badgeCls } from "./adminUtils";

const COLOR_MAP = {
  pending: "yellow", assigned: "blue", arrived: "orange",
  inProgress: "blue", completed: "green", cancelled: "red",
};

const StatCard = ({ label, value, sub, accent }) => (
  <div
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
    style={{ borderTop: `3px solid ${accent}` }}
  >
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
    <p className="text-3xl font-black text-gray-900">{value ?? "-"}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const MiniTable = ({ title, rows }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    <h3 className="text-sm font-bold text-gray-800 mb-4">{title}</h3>
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
          <th className="pb-2 text-left text-xs font-semibold text-gray-500 uppercase">Count</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ label, value, color }) => (
          <tr key={label} className="border-b border-gray-50 last:border-0">
            <td className="py-2">
              <span className={badgeCls(color)}>{label}</span>
            </td>
            <td className="py-2 font-semibold text-gray-800">{value ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AdminDashboard = () => {
  const { loading, error } = useAdminStats();
  const stats = useSelector((s) => s.admin.stats);

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading dashboard...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  const t = stats?.tasks?.byStatus ?? {};
  const w = stats?.workers ?? {};
  const u = stats?.users ?? {};
  const f = stats?.finance ?? {};

  const taskRows = Object.entries(t).map(([status, count]) => ({
    label: status, value: count, color: COLOR_MAP[status] ?? "gray",
  }));

  const workerRows = [
    { label: "Verified", value: w.verified, color: "green" },
    { label: "Pending",  value: w.pending,  color: "yellow" },
    { label: "Rejected", value: w.rejected, color: "red" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users"       value={u.total}                                                       accent="#2563eb" />
        <StatCard label="Total Workers"     value={w.total}  sub={`${w.pending ?? 0} pending`}                   accent="#f59e0b" />
        <StatCard label="Verified Workers"  value={w.verified}                                                    accent="#16a34a" />
        <StatCard label="Pending Approvals" value={w.pending}                                                     accent="#ea580c" />
        <StatCard label="Total Tasks"       value={stats?.tasks?.total}                                           accent="#8b5cf6" />
        <StatCard label="Active Tasks"      value={(t.assigned ?? 0) + (t.inProgress ?? 0) + (t.arrived ?? 0)}  accent="#06b6d4" />
        <StatCard label="Completed"         value={t.completed ?? 0}                                              accent="#16a34a" />
        <StatCard label="Pending Tasks"     value={t.pending ?? 0}                                                accent="#64748b" />
        <StatCard
          label="Platform Fee Earned"
          value={`₹${Number(f.platformEarnings || 0).toLocaleString("en-IN")}`}
          sub={`${f.completedTasksCount ?? 0} completed tasks`}
          accent="#0ea5e9"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {taskRows.length > 0 ? (
          <MiniTable title="Tasks by Status" rows={taskRows} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-400">No task data</div>
        )}
        <MiniTable title="Workers by Status" rows={workerRows} />
      </div>
    </div>
  );
};

export default AdminDashboard;
