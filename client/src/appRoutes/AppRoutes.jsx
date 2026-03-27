import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";

import SignupPage from "../components/Auth/Signup";
import LoginPage from "../components/Auth/LoginPage";
import ForgotPassword from "../components/Auth/ForgotPassword";
import PageLoader from "../components/constants/PageLoader";

const User_Dashboard = lazy(() => import("../components/User/User_Dashboard"));
const CreateTask = lazy(() => import("../components/User/CreateTask"));
const UserProfile = lazy(() => import("../components/User/UserProfile"));
const UserPayments = lazy(() => import("../components/User/UserPayments"));
const Registration = lazy(() => import("../components/Labor/Registration"));
const WorkerDashboard = lazy(() => import("../components/Labor/WorkerDashboard"));
const WorkerProfile = lazy(() => import("../components/Labor/WorkerProfile"));
const WorkerHistory = lazy(() => import("../components/Labor/WorkerHistory"));
const WorkerReviews = lazy(() => import("../components/Labor/WorkerReviews"));
const WorkerPayments = lazy(() => import("../components/Labor/WorkerPayments"));
const MyReviews = lazy(() => import("../components/User/MyReviews"));

/* Admin pages */
const AdminLayout = lazy(() => import("../components/Admin/AdminLayout"));
const AdminDashboard = lazy(() => import("../components/Admin/AdminDashboard"));
const AdminProfile = lazy(() => import("../components/Admin/AdminProfile"));
const WorkerVerification = lazy(() => import("../components/Admin/WorkerVerification"));
const WorkersList = lazy(() => import("../components/Admin/WorkersList"));
const UsersList = lazy(() => import("../components/Admin/UsersList"));
const TasksMonitor = lazy(() => import("../components/Admin/TasksMonitor"));
const CategoriesManager = lazy(() => import("../components/Admin/CategoriesManager"));
const ReviewsMonitor = lazy(() => import("../components/Admin/ReviewsMonitor"));
const ReportsMonitor = lazy(() => import("../components/Admin/ReportsMonitor"));
const PlatformFeeSettings = lazy(() => import("../components/Admin/PlatformFeeSettings"));
const TaskRejectionsPanel = lazy(() => import("../components/Admin/TaskRejectionsPanel"));
const WorkerLocationMap = lazy(() => import("../components/Admin/WorkerLocationMap"));
const TaskDensityMap = lazy(() => import("../components/Admin/TaskDensityMap"));

/* Redirects unauthenticated users to /login, preserving the attempted path */
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

/* Only admins can access these routes */
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (user.userType !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppRoutes = () => {
  const { authLoading } = useAuth();

  if (authLoading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="*" element={<LoginPage />} />

        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* user routes - require login */}
        <Route path="/user"             element={<ProtectedRoute><User_Dashboard /></ProtectedRoute>} />
        <Route path="/user/profile"     element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/user/hire"        element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
        <Route path="/user/reviews"     element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
        <Route path="/user/payments"    element={<ProtectedRoute><UserPayments /></ProtectedRoute>} />

        {/* Labor routes - require login */}
        <Route path="/worker"           element={<ProtectedRoute><Registration /></ProtectedRoute>} />
        <Route path="/worker/dashboard" element={<ProtectedRoute><WorkerDashboard /></ProtectedRoute>} />
        <Route path="/worker/profile"   element={<ProtectedRoute><WorkerProfile /></ProtectedRoute>} />
        <Route path="/worker/history"   element={<ProtectedRoute><WorkerHistory /></ProtectedRoute>} />
        <Route path="/worker/reviews"   element={<ProtectedRoute><WorkerReviews /></ProtectedRoute>} />
        <Route path="/worker/payments" element={<ProtectedRoute><WorkerPayments /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="workers" element={<WorkerVerification />} />
          <Route path="workers/all" element={<WorkersList />} />
          <Route path="users" element={<UsersList />} />
          <Route path="tasks" element={<TasksMonitor />} />
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="reviews" element={<ReviewsMonitor />} />
          <Route path="reports" element={<ReportsMonitor />} />
          <Route path="finance" element={<PlatformFeeSettings />} />
          <Route path="rejections" element={<TaskRejectionsPanel />} />
          <Route path="worker-map" element={<WorkerLocationMap />} />
          <Route path="task-density" element={<TaskDensityMap />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
