import express from "express";
import {
  getNotifications,
  markAllRead,
  getWorkerNotifications,
  markAllReadWorker,
} from "../controller/notificationController.js";

const router = express.Router();

// User-scoped
router.get("/", getNotifications);
router.patch("/read-all", markAllRead);

// Worker-scoped
router.get("/worker", getWorkerNotifications);
router.patch("/worker/read-all", markAllReadWorker);

export default router;
