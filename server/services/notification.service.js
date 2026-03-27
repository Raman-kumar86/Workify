import Notification from "../modal/user/Notification.js";
import Worker from "../modal/Worker.model.js";
import Task from "../modal/user/Task.model.js";

/**
 * Create notifications in bulk (broadcast)
 */
export const broadcastTaskAvailable = async ({ task, workerFilter = {} }) => {
  // Find eligible workers
  const workers = await Worker.find({
    isOnline: true,
    status: "verified",
    ...workerFilter
  }).select("_id");

  if (!workers.length) return;

  const notifications = workers.map(worker => ({
    workerId: worker._id,
    taskId: task._id,
    type: "task_available",
    title: "New Task Available",
    message: `A new task "${task.title}" is available near you.`,
    taskTitle: task.title,
    expiresAt: task.scheduledStartAt
  }));

  await Notification.insertMany(notifications);
};

/**
 * Notify winner + invalidate others
 */
export const notifyTaskAccepted = async ({ taskId, winnerWorkerId }) => {
  // Fetch task for title/message
  const task = await Task.findById(taskId).select("title").lean();
  const taskTitle = task?.title ?? "A task";

  // Winner notification
  await Notification.create({
    workerId: winnerWorkerId,
    taskId,
    type: "task_assigned",
    title: "Task Assigned",
    message: `You have been assigned the task "${taskTitle}".`,
    taskTitle
  });

  // Expire all others
  await Notification.updateMany(
    {
      taskId,
      workerId: { $ne: winnerWorkerId },
      type: "task_available"
    },
    {
      type: "task_unavailable",
      status: "expired"
    }
  );
};

/**
 * Re-broadcast after rejection
 */
export const rebroadcastTask = async ({ task, workerFilter = {} }) => {
  // Old notifications expire automatically (TTL)
  await broadcastTaskAvailable({ task, workerFilter });
};

/**
 * Cancel task (user cancel / expiry)
 */
export const notifyTaskCancelled = async ({ taskId }) => {
  await Notification.updateMany(
    { taskId },
    {
      type: "task_cancelled",
      status: "expired"
    }
  );
};

/**
 * Mark notification as read 
 */
export const markNotificationRead = async ({ notificationId, workerId }) => {
  await Notification.findOneAndUpdate(
    { _id: notificationId, workerId },
    { status: "read" }
  );
};
