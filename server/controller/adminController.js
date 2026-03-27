import mongoose from "mongoose";
import User from "../modal/User.js";
import Worker from "../modal/Worker.model.js";
import Task from "../modal/user/Task.model.js";
import Review from "../modal/Review.model.js";
import Report from "../modal/Report.model.js";
import TaskRejection from "../modal/TaskRejection.model.js";
import { Category } from "../modal/user/CategorySchema.modal.js";
import { PlatformFee } from "../modal/PlatformFee.model.js";
import Notification from "../modal/user/Notification.js";
import WalletTransaction from "../modal/user/WalletTransaction.model.js";
import { getIO } from "../services/socket.service.js";
import {
  sendWorkerApprovedEmail,
  sendWorkerRejectedEmail,
  sendBanLiftedEmail,
} from "../services/email.service.js";

/* ═══════════════════════════════════════════
   DASHBOARD STATS
   GET /api/admin/stats
═══════════════════════════════════════════ */
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalWorkers,
      pendingWorkers,
      verifiedWorkers,
      rejectedWorkers,
      totalTasks,
      tasksByStatus,
      platformEarnings,
      recentTasks,
      recentWorkers,
    ] = await Promise.all([
      User.countDocuments({ userType: "user" }),
      Worker.countDocuments(),
      Worker.countDocuments({ status: "pending" }),
      Worker.countDocuments({ status: "verified" }),
      Worker.countDocuments({ status: "rejected" }),
      Task.countDocuments(),
      Task.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        { $match: { status: "completed" } },
        {
          $project: {
            platformFeeAmount: {
              $round: [
                {
                  $multiply: [
                    { $ifNull: ["$price", 0] },
                    {
                      $divide: [
                        { $ifNull: ["$platformFeePercent", 10] },
                        100,
                      ],
                    },
                  ],
                },
                2,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalPlatformEarnings: { $sum: "$platformFeeAmount" },
            completedTasksCount: { $sum: 1 },
          },
        },
      ]),
      Task.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .lean(),
      Worker.find({ status: "pending" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .lean(),
    ]);

    const statusMap = {};
    tasksByStatus.forEach(({ _id, count }) => { statusMap[_id] = count; });
    const finance = platformEarnings?.[0] || { totalPlatformEarnings: 0, completedTasksCount: 0 };

    return res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers },
        workers: {
          total: totalWorkers,
          pending: pendingWorkers,
          verified: verifiedWorkers,
          rejected: rejectedWorkers,
        },
        tasks: {
          total: totalTasks,
          byStatus: statusMap,
        },
        finance: {
          platformEarnings: Math.round(Number(finance.totalPlatformEarnings || 0) * 100) / 100,
          completedTasksCount: Number(finance.completedTasksCount || 0),
        },
      },
      recentActivity: {
        tasks: recentTasks,
        pendingWorkers: recentWorkers,
      },
    });
  } catch (err) {
    console.error("getDashboardStats error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET ALL WORKERS (paginated + filters)
   GET /api/admin/workers?page=1&limit=20&status=pending&search=
═══════════════════════════════════════════ */
export const getAllWorkers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status && ["pending", "verified", "rejected"].includes(status)) {
      filter.status = status;
    }

    // If search, first find matching users then filter by userId
    let userIds;
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      userIds = users.map((u) => u._id);
      filter.userId = { $in: userIds };
    }

    const [workers, total] = await Promise.all([
      Worker.find(filter)
        .populate("userId", "name email contactNumber banExpiresAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Worker.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      workers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getAllWorkers error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET PENDING WORKERS
   GET /api/admin/workers/pending
═══════════════════════════════════════════ */
export const getPendingWorkers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [workers, total] = await Promise.all([
      Worker.find({ status: "pending" })
        .populate("userId", "name email contactNumber createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Worker.countDocuments({ status: "pending" }),
    ]);

    return res.status(200).json({
      success: true,
      workers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getPendingWorkers error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   APPROVE WORKER
   PATCH /api/admin/workers/:id/approve
═══════════════════════════════════════════ */
export const approveWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: "verified" },
      { new: true }
    ).populate("userId", "name email");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    // In-app notification
    await Notification.create({
      workerId: worker._id,
      type: "worker_verified",
      title: "Registration Approved",
      message: "Congratulations! Your worker registration has been approved. You can now start accepting tasks.",
    });

    // Socket emit
    try {
      const io = getIO();
      io.to(`user_${worker.userId._id}`).emit("worker_verified", {
        message: "Your registration has been approved!",
      });
    } catch { /* socket may not be connected */ }

    // Email
    try {
      await sendWorkerApprovedEmail({
        toEmail: worker.userId.email,
        workerName: worker.userId.name,
      });
    } catch (emailErr) {
      console.error("Approve email failed:", emailErr);
    }

    return res.status(200).json({ success: true, worker });
  } catch (err) {
    console.error("approveWorker error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   REJECT WORKER
   PATCH /api/admin/workers/:id/reject
═══════════════════════════════════════════ */
export const rejectWorker = async (req, res) => {
  try {
    const { reason } = req.body;
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    ).populate("userId", "name email");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    await Notification.create({
      workerId: worker._id,
      type: "worker_rejected",
      title: "Registration Rejected",
      message: reason
        ? `Your registration was rejected. Reason: ${reason}`
        : "Your registration was rejected. Please re-apply with valid documents.",
    });

  // Ban the user from re-registering as a worker for 3 days
  const banExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await User.findByIdAndUpdate(worker.userId._id, { banExpiresAt });

  try {
      const io = getIO();
      io.to(`user_${worker.userId._id}`).emit("worker_rejected", {
        message: "Your registration has been rejected.",
        reason,
      });
    } catch { /* socket may not be connected */ }

    try {
      await sendWorkerRejectedEmail({
        toEmail: worker.userId.email,
        workerName: worker.userId.name,
        reason,
        banExpiresAt,
      });
    } catch (emailErr) {
      console.error("Reject email failed:", emailErr);
    }

    return res.status(200).json({ success: true, worker });
  } catch (err) {
    console.error("rejectWorker error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET WORKER PROFILE (detail)
   GET /api/admin/workers/:id/profile
═══════════════════════════════════════════ */
export const getWorkerProfile = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id)
      .populate("userId", "name email contactNumber address createdAt banExpiresAt")
      .lean();

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    const [tasks, reviews, rejections] = await Promise.all([
      Task.find({ assignedWorkerId: worker._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("userId", "name")
        .lean(),
      Review.find({ workerId: worker._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "name")
        .lean(),
      TaskRejection.find({ workerId: worker._id })
        .sort({ rejectedAt: -1 })
        .limit(10)
        .populate("taskId", "title")
        .lean(),
    ]);

    return res.status(200).json({ success: true, worker, tasks, reviews, rejections });
  } catch (err) {
    console.error("getWorkerProfile error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   BAN WORKER
   PATCH /api/admin/workers/:id/ban
═══════════════════════════════════════════ */
export const banWorker = async (req, res) => {
  try {
    const { reason, durationHours, fineAmount = 0 } = req.body; // durationHours = null → permanent
    const banExpiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : new Date("9999-12-31");
    const normalizedFine = Math.max(0, Math.round(Number(fineAmount || 0) * 100) / 100);

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      {
        banExpiresAt,
        $inc: { outstandingFines: normalizedFine, banFineAmount: normalizedFine },
      },
      { new: true }
    ).populate("userId", "name email");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    await Notification.create({
      workerId: worker._id,
      type: "worker_banned",
      title: "Account Banned",
      message: reason
        ? `Your account has been banned. Reason: ${reason}${normalizedFine > 0 ? ` | Penalty: ₹${normalizedFine}` : ""}`
        : `Your account has been banned by an administrator.${normalizedFine > 0 ? ` Penalty: ₹${normalizedFine}` : ""}`,
    });

    try {
      const io = getIO();
      io.to(`user_${worker.userId._id}`).emit("worker_banned", { reason, banExpiresAt });
    } catch { /* socket may not be connected */ }

    return res.status(200).json({ success: true, worker });
  } catch (err) {
    console.error("banWorker error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   UNBAN WORKER
   PATCH /api/admin/workers/:id/unban
═══════════════════════════════════════════ */
export const unbanWorker = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).populate("userId", "name email");

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    const banFineAmount = Number(worker.banFineAmount || 0);
    const banFinePaid = Number(worker.banFinePaid || 0);
    const remainingBanFine = Math.max(0, Math.round((banFineAmount - banFinePaid) * 100) / 100);
    const refundAmount = Math.max(0, Math.round(banFinePaid * 100) / 100);

    worker.banExpiresAt = null;
    worker.outstandingFines = Math.max(0, Math.round((Number(worker.outstandingFines || 0) - remainingBanFine) * 100) / 100);
    worker.walletCredit = Math.round((Number(worker.walletCredit || 0) + refundAmount) * 100) / 100;
    worker.banFineAmount = 0;
    worker.banFinePaid = 0;
    await worker.save();

    if (refundAmount > 0) {
      await WalletTransaction.create({
        userId: worker.userId._id,
        type: "ban_refund",
        context: "worker_wallet",
        method: "netbanking",
        amount: refundAmount,
        status: "success",
      });
    }

    await Notification.create({
      workerId: worker._id,
      type: "ban_lifted",
      title: "Ban Lifted",
      message:
        refundAmount > 0
          ? `Your account ban has been removed. ₹${refundAmount} has been credited back to your withdrawable balance.`
          : "Your account ban has been removed by an administrator. You can now accept tasks.",
    });

    try {
      const io = getIO();
      io.to(`user_${worker.userId._id}`).emit("ban_lifted", {
        message: "Your ban has been lifted!",
      });
    } catch { /* socket may not be connected */ }

    return res.status(200).json({ success: true, worker });
  } catch (err) {
    console.error("unbanWorker error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET ALL USERS (paginated)
   GET /api/admin/users?page=1&limit=20&search=
═══════════════════════════════════════════ */
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { search } = req.query;

    const filter = { userType: "user" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET USER PROFILE (detail)
   GET /api/admin/users/:id/profile
═══════════════════════════════════════════ */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const tasks = await Task.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("assignedWorkerId", "userId")
      .lean();

    return res.status(200).json({ success: true, user, tasks });
  } catch (err) {
    console.error("getUserProfile error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   BAN USER
   PATCH /api/admin/users/:id/ban
═══════════════════════════════════════════ */
export const banUser = async (req, res) => {
  try {
    const { reason, durationHours } = req.body;
    const banExpiresAt = durationHours
      ? new Date(Date.now() + durationHours * 60 * 60 * 1000)
      : new Date("9999-12-31");

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banExpiresAt },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    try {
      const io = getIO();
      io.to(`user_${user._id}`).emit("user_banned", { reason, banExpiresAt });
    } catch { /* socket may not be connected */ }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("banUser error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   UNBAN USER
   PATCH /api/admin/users/:id/unban
═══════════════════════════════════════════ */
export const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { banExpiresAt: null, walletBalance: 0 },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    try {
      const io = getIO();
      io.to(`user_${user._id}`).emit("user_unbanned", {
        message: "Your ban has been lifted.",
      });
    } catch { /* socket may not be connected */ }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("unbanUser error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET ALL TASKS (paginated + filters)
   GET /api/admin/tasks?page=1&limit=20&status=&search=
═══════════════════════════════════════════ */
export const getAllTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: "i" };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email")
        .populate({ path: "assignedWorkerId", populate: { path: "userId", select: "name email" } })
        .lean(),
      Task.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      tasks,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getAllTasks error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET NEARBY WORKERS FOR A TASK
   GET /api/admin/tasks/:taskId/nearby-workers?radiusKm=20
═══════════════════════════════════════════ */
export const getNearbyWorkers = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).lean();
    if (!task) return res.status(404).json({ message: "Task not found" });

    const radiusKm = parseFloat(req.query.radiusKm) || 20;
    const [lng, lat] = task.location.coordinates;

    const workers = await Worker.find({
      status: "verified",
      banExpiresAt: { $not: { $gt: new Date() } },
      currentLocation: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000,
        },
      },
    })
      .populate("userId", "name email contactNumber")
      .limit(50)
      .lean();

    return res.status(200).json({ success: true, workers });
  } catch (err) {
    console.error("getNearbyWorkers error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   FORCE ASSIGN TASK
   PATCH /api/admin/tasks/:taskId/force-assign
   Body: { workerId }
═══════════════════════════════════════════ */
export const forceAssignTask = async (req, res) => {
  try {
    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ message: "workerId is required" });

    const [task, worker] = await Promise.all([
      Task.findById(req.params.taskId),
      Worker.findById(workerId).populate("userId", "name email _id"),
    ]);

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    task.assignedWorkerId = worker._id;
    task.status = "assigned";
    await task.save();

    await Notification.create({
      workerId: worker._id,
      taskId: task._id,
      type: "force_assigned",
      title: "Task Assigned by Admin",
      message: `You have been assigned the task "${task.title}" by an administrator.`,
      taskTitle: task.title,
    });

    try {
      const io = getIO();
      io.to(`user_${worker.userId._id}`).emit("task_force_assigned", {
        taskId: task._id,
        title: task.title,
        message: "You have been assigned a task by admin.",
      });
      io.to(`user_${task.userId}`).emit("task_force_assigned", {
        taskId: task._id,
        workerName: worker.userId.name,
        message: "A worker has been assigned to your task by admin.",
      });
    } catch { /* socket may not be connected */ }

    return res.status(200).json({ success: true, task });
  } catch (err) {
    console.error("forceAssignTask error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET ALL REVIEWS
   GET /api/admin/reviews?page=1&limit=20
═══════════════════════════════════════════ */
export const getAllReviews = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email")
        .populate({ path: "workerId", populate: { path: "userId", select: "name email" } })
        .populate("taskId", "title taskType")
        .lean(),
      Review.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      reviews,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getAllReviews error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   GET ALL REPORTS
   GET /api/admin/reports?status=pending
═══════════════════════════════════════════ */
export const getAllReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const { status } = req.query;

    const filter = {};
    if (status && ["pending", "reviewed", "resolved"].includes(status)) {
      filter.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email")
        .populate({ path: "workerId", populate: { path: "userId", select: "name email" } })
        .populate("taskId", "title taskType")
        .lean(),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      reports,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getAllReports error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   UPDATE REPORT STATUS
   PATCH /api/admin/reports/:id
   Body: { status: "reviewed" | "resolved" }
═══════════════════════════════════════════ */
export const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["reviewed", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!report) return res.status(404).json({ message: "Report not found" });

    return res.status(200).json({ success: true, report });
  } catch (err) {
    console.error("updateReportStatus error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   CATEGORIES CRUD
═══════════════════════════════════════════ */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    return res.status(200).json({ success: true, categories });
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, minPrice, subCategories, icon } = req.body;
    if (!name || minPrice == null) {
      return res.status(400).json({ message: "name and minPrice are required" });
    }

    const category = await Category.create({ name, minPrice, subCategories: subCategories || [], icon: icon || "" });
    return res.status(201).json({ success: true, category });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Category name already exists" });
    }
    console.error("createCategory error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { name, minPrice, subCategories, icon } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, minPrice, subCategories, icon },
      { new: true, runValidators: true }
    );

    if (!category) return res.status(404).json({ message: "Category not found" });
    return res.status(200).json({ success: true, category });
  } catch (err) {
    console.error("updateCategory error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    return res.status(200).json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   PLATFORM FEE
═══════════════════════════════════════════ */
export const getPlatformFee = async (req, res) => {
  try {
    let fee = await PlatformFee.findOne();
    if (!fee) fee = await PlatformFee.create({ feePercent: 10 });
    return res.status(200).json({ success: true, feePercent: fee.feePercent });
  } catch (err) {
    console.error("getPlatformFee error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const setPlatformFee = async (req, res) => {
  try {
    const { feePercent } = req.body;
    if (feePercent == null || feePercent < 0 || feePercent > 100) {
      return res.status(400).json({ message: "feePercent must be between 0 and 100" });
    }

    let fee = await PlatformFee.findOne();
    if (!fee) {
      fee = await PlatformFee.create({ feePercent });
    } else {
      fee.feePercent = feePercent;
      await fee.save();
    }

    return res.status(200).json({ success: true, feePercent: fee.feePercent });
  } catch (err) {
    console.error("setPlatformFee error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   TASK REJECTIONS
   GET /api/admin/task-rejections
═══════════════════════════════════════════ */
export const getRejectedTasks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [rejections, total] = await Promise.all([
      TaskRejection.find()
        .sort({ rejectedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("taskId", "title taskType status")
        .populate({ path: "workerId", populate: { path: "userId", select: "name email" } })
        .lean(),
      TaskRejection.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      rejections,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getRejectedTasks error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   LIFT WORKER BAN (via rejection record)
   PATCH /api/admin/task-rejections/:id/lift-ban
═══════════════════════════════════════════ */
export const liftWorkerBan = async (req, res) => {
  try {
    const rejection = await TaskRejection.findById(req.params.id)
      .populate({ path: "workerId", populate: { path: "userId", select: "name email _id" } });

    if (!rejection) return res.status(404).json({ message: "Rejection record not found" });

    const worker = rejection.workerId;

    const freshWorker = await Worker.findById(worker._id);
    if (!freshWorker) return res.status(404).json({ message: "Worker not found" });

    const banFineAmount = Number(freshWorker.banFineAmount || 0);
    const banFinePaid = Number(freshWorker.banFinePaid || 0);
    const remainingBanFine = Math.max(0, Math.round((banFineAmount - banFinePaid) * 100) / 100);
    const refundAmount = Math.max(0, Math.round(banFinePaid * 100) / 100);

    freshWorker.banExpiresAt = null;
    freshWorker.outstandingFines = Math.max(0, Math.round((Number(freshWorker.outstandingFines || 0) - remainingBanFine) * 100) / 100);
    freshWorker.walletCredit = Math.round((Number(freshWorker.walletCredit || 0) + refundAmount) * 100) / 100;
    freshWorker.banFineAmount = 0;
    freshWorker.banFinePaid = 0;
    await freshWorker.save();

    if (refundAmount > 0) {
      await WalletTransaction.create({
        userId: worker.userId._id,
        type: "ban_refund",
        context: "worker_wallet",
        method: "netbanking",
        amount: refundAmount,
        status: "success",
      });
    }

    // Mark rejection as reviewed + ban lifted
    rejection.adminReviewed = true;
    rejection.banLifted = true;
    await rejection.save();

    // In-app notification
    await Notification.create({
      workerId: worker._id,
      type: "ban_lifted",
      title: "Ban Lifted",
      message:
        refundAmount > 0
          ? `Your ban has been lifted by admin. ₹${refundAmount} has been credited back to your withdrawable balance.`
          : "Your ban has been reviewed and lifted by an administrator. Related penalties have been cleared.",
    });

    // Socket event
    try {
      const io = getIO();
      io.to(`user_${worker.userId._id}`).emit("ban_lifted", {
        message: "Your ban has been lifted by admin.",
      });
    } catch { /* socket may not be connected */ }

    // Email
    try {
      await sendBanLiftedEmail({
        toEmail: worker.userId.email,
        workerName: worker.userId.name,
      });
    } catch (emailErr) {
      console.error("Ban-lift email failed:", emailErr);
    }

    return res.status(200).json({ success: true, message: "Ban lifted successfully" });
  } catch (err) {
    console.error("liftWorkerBan error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   WORKER LOCATIONS MAP
   GET /api/admin/workers/locations
   Returns every worker's last known location for the admin map view.
═══════════════════════════════════════════ */
export const getWorkerLocations = async (req, res) => {
  try {
    const workers = await Worker.find(
      {},
      "workerLocation isOnline status lastSeenAt services userId"
    )
      .populate("userId", "name email")
      .lean();

    // Only return workers who have ever sent a location ping
    const located = workers.filter(
      (w) => w.workerLocation && w.workerLocation.lat != null && w.workerLocation.lng != null
    );

    const result = located.map((w) => ({
      _id: w._id,
      name: w.userId?.name || "Unknown",
      email: w.userId?.email || "",
      isOnline: w.isOnline,
      status: w.status,
      lastSeenAt: w.lastSeenAt,
      category: w.services?.[0]?.category || null,
      lat: w.workerLocation.lat,
      lng: w.workerLocation.lng,
      locationUpdatedAt: w.workerLocation.updatedAt,
    }));

    return res.status(200).json({ success: true, workers: result });
  } catch (err) {
    console.error("getWorkerLocations error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ═══════════════════════════════════════════
   TASK LOCATIONS MAP
   GET /api/admin/tasks/locations
   Returns every task that has a valid location for the density map view.
═══════════════════════════════════════════ */
export const getTaskLocations = async (req, res) => {
  try {
    const tasks = await Task.find(
      { location: { $ne: null } },
      "location address title status createdAt price"
    ).lean();

    const result = tasks
      .filter((t) => t.location?.coordinates?.length === 2)
      .map((t) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        address: t.address,
        price: t.price,
        createdAt: t.createdAt,
        // GeoJSON stores [lng, lat]
        lat: t.location.coordinates[1],
        lng: t.location.coordinates[0],
      }));

    return res.status(200).json({ success: true, tasks: result });
  } catch (err) {
    console.error("getTaskLocations error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};
