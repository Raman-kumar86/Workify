import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    /* Who receives it — supports both users and workers */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      index: true,
    },

    /* Related task */
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      index: true,
    },

    /* Notification content */
    type: {
      type: String,
      enum: [
        "arrived",         // worker arrived
        "started",         // task in progress
        "completed",       // task completed
        "task_available",  // broadcast to workers
        "task_assigned",   // assigned to worker
        "task_unavailable",
        "task_cancelled",
        "ban_lifted",      // admin lifted worker ban
        "force_assigned",  // admin force-assigned task
        "worker_verified", // admin approved worker registration
        "worker_rejected", // admin rejected worker registration
        "worker_banned",   // admin banned worker
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },

    /* Extra data (e.g. OTP for arrived notifications) */
    otp: { type: String, default: null },
    taskTitle: { type: String, default: null },

    /* Read state */
    read: { type: Boolean, default: false },

    /* Auto-delete after 3 days via MongoDB TTL index */
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

// Compound index for efficient user notification queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ workerId: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
