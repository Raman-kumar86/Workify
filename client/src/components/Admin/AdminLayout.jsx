import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => (
  <div className="flex h-screen bg-gray-50 overflow-hidden">
    <AdminSidebar />
    <main className="flex-1 overflow-y-auto p-6 lg:p-8">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
