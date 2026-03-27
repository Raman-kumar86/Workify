import { useEffect, useState } from "react";
import useAdminTasks from "../../hooks/admin/useAdminTasks";
import ForceAssignModal from "./ForceAssignModal";
import { badgeCls, btnCls, TH, TD, TR, Pagination } from "./adminUtils";

const statusColor = (s) => ({ pending: "yellow", assigned: "blue", arrived: "orange", inProgress: "blue", completed: "green", cancelled: "red" }[s] ?? "gray");
const selectCls = "px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

const TasksMonitor = () => {
  const { tasks, pagination, loading, error, fetchTasks } = useAdminTasks();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [forceTask, setForceTask] = useState(null);

  useEffect(() => {
    fetchTasks({ page, limit: 20, status: statusFilter, search });
  }, [page, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTasks({ page: 1, limit: 20, status: statusFilter, search });
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading tasks...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tasks Monitor</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Tasks ({pagination?.total ?? 0})</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select className={selectCls} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {["pending", "assigned", "arrived", "inProgress", "completed", "cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                placeholder="Search title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className={btnCls("primary", true)}>Search</button>
            </form>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No tasks found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Title</th>
                  <th className={TH}>Type</th>
                  <th className={TH}>User</th>
                  <th className={TH}>Worker</th>
                  <th className={TH}>Status</th>
                  <th className={TH}>Date</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t._id} className={TR}>
                    <td className={TD + " font-medium"}>{t.title}</td>
                    <td className={TD}>{t.taskType}</td>
                    <td className={TD}>{t.userId?.name ?? "-"}</td>
                    <td className={TD}>
                      {t.assignedWorkerId?.userId?.name ?? (
                        <span className="text-gray-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className={TD}><span className={badgeCls(statusColor(t.status))}>{t.status}</span></td>
                    <td className={TD}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className={TD}>
                      {(t.status === "pending" || t.status === "assigned") && (
                        <button className={btnCls("primary", true)} onClick={() => setForceTask(t)}>
                          Force Assign
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

      {forceTask && (
        <ForceAssignModal
          task={forceTask}
          onClose={() => setForceTask(null)}
          onAssigned={() => {
            setForceTask(null);
            fetchTasks({ page, limit: 20, status: statusFilter, search });
          }}
        />
      )}
    </div>
  );
};

export default TasksMonitor;
