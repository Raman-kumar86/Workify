import Notification from "../modal/user/Notification.js";
import Worker from "../modal/Worker.model.js";

/**
 * GET /api/notifications
 * Fetch all notifications for the logged-in user (last 3 days, newest first).
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("getNotifications error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the logged-in user.
 */
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, read: false }, { read: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("markAllRead error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Helper — called from socket event handlers to persist a notification.
 * Not an HTTP endpoint, used internally.
 */
export const createNotification = async ({
  userId,
  workerId,
  taskId,
  type,
  title,
  message,
  otp = null,
  taskTitle = null,
}) => {
  try {
    const notif = await Notification.create({
      userId,
      workerId,
      taskId,
      type,
      title,
      message,
      otp,
      taskTitle,
    });
    return notif;
  } catch (error) {
    console.error("createNotification error:", error);
    return null;
  }
};

/**
 * GET /api/notifications/worker
 * Fetch notifications for the logged-in worker.
 */
export const getWorkerNotifications = async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user._id }).select("_id");
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

    const notifications = await Notification.find({ workerId: worker._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    console.error("getWorkerNotifications error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * PATCH /api/notifications/worker/read-all
 * Mark all worker notifications as read.
 */
export const markAllReadWorker = async (req, res) => {
  try {
    const worker = await Worker.findOne({ userId: req.user._id }).select("_id");
    if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

    await Notification.updateMany({ workerId: worker._id, read: false }, { read: true });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("markAllReadWorker error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
