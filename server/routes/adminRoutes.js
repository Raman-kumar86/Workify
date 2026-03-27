import { Router } from "express";
import { adminOnly } from "../middleware/adminMiddleware.js";
import {
  getDashboardStats,
  getAllWorkers,
  getPendingWorkers,
  approveWorker,
  rejectWorker,
  getWorkerProfile,
  banWorker,
  unbanWorker,
  getAllUsers,
  getUserProfile,
  banUser,
  unbanUser,
  getAllTasks,
  getNearbyWorkers,
  forceAssignTask,
  getAllReviews,
  getAllReports,
  updateReportStatus,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getPlatformFee,
  setPlatformFee,
  getRejectedTasks,
  liftWorkerBan,
  getWorkerLocations,
  getTaskLocations,
} from "../controller/adminController.js";

const router = Router();

/* All admin routes require adminOnly middleware */
router.use(adminOnly);

/* Dashboard */
router.get("/stats", getDashboardStats);

/* Workers */
router.get("/workers", getAllWorkers);
router.get("/workers/pending", getPendingWorkers);
router.get("/workers/locations", getWorkerLocations);
router.get("/workers/:id/profile", getWorkerProfile);
router.patch("/workers/:id/approve", approveWorker);
router.patch("/workers/:id/reject", rejectWorker);
router.patch("/workers/:id/ban", banWorker);
router.patch("/workers/:id/unban", unbanWorker);

/* Users */
router.get("/users", getAllUsers);
router.get("/users/:id/profile", getUserProfile);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);

/* Tasks */
router.get("/tasks", getAllTasks);
router.get("/tasks/locations", getTaskLocations);
router.get("/tasks/:taskId/nearby-workers", getNearbyWorkers);
router.patch("/tasks/:taskId/force-assign", forceAssignTask);

/* Reviews */
router.get("/reviews", getAllReviews);

/* Reports */
router.get("/reports", getAllReports);
router.patch("/reports/:id", updateReportStatus);

/* Categories */
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

/* Platform fee */
router.get("/platform-fee", getPlatformFee);
router.patch("/platform-fee", setPlatformFee);

/* Task rejections */
router.get("/task-rejections", getRejectedTasks);
router.patch("/task-rejections/:id/lift-ban", liftWorkerBan);

export default router;
