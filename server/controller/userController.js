import cloudinary from "../config/cloudinary.js";
import Task from "../modal/user/Task.model.js";
import User from "../modal/User.js";
import Worker from "../modal/Worker.model.js";
import Review from "../modal/Review.model.js";
import Report from "../modal/Report.model.js";
import { PlatformFee } from "../modal/PlatformFee.model.js";
import { Category } from "../modal/user/CategorySchema.modal.js";
import WalletTransaction from "../modal/user/WalletTransaction.model.js";
import {
  ACTIVE_STATUSES,
  CANCELLATION_FINE,
  CANCELLATION_BAN_MS,
  getPublicIdFromUrl,
} from "../constants/constant.js";

export const getUserProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        contactNumber: req.user.contactNumber ?? "",
        address: req.user.address ?? "",
        profileImage: req.user.profileImage ?? "",
        walletBalance: req.user.walletBalance ?? 0,
        isVerified: req.user.isVerified ?? false,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("getUserProfile error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, contactNumber, address, profileImage } = req.body;

    if (contactNumber && !/^\d{10}$/.test(String(contactNumber).trim())) {
      return res.status(400).json({ message: "Contact number must be a valid 10-digit number" });
    }

    const updates = {};
    if (typeof name === "string") updates.name = name.trim();
    if (typeof contactNumber === "string") updates.contactNumber = contactNumber.trim();
    if (typeof address === "string") updates.address = address.trim();

    if (Object.prototype.hasOwnProperty.call(req.body, "profileImage") && typeof profileImage === "string") {
      const oldProfileImage = req.user.profileImage;
      const nextProfileImage = profileImage.trim();

      if (oldProfileImage && oldProfileImage !== nextProfileImage) {
        const oldPublicId = getPublicIdFromUrl(oldProfileImage);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      updates.profileImage = nextProfileImage;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true, context: "query" },
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber ?? "",
        address: user.address ?? "",
        profileImage: user.profileImage ?? "",
        walletBalance: user.walletBalance ?? 0,
        isVerified: user.isVerified ?? false,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("updateUserProfile error:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const topUpWallet = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    const allowedMethods = ["upi", "card", "netbanking"];
    const method = allowedMethods.includes(req.body?.method) ? req.body.method : "upi";

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Enter a valid amount" });
    }

    const normalizedAmount = Math.round(amount * 100) / 100;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: normalizedAmount } },
      { new: true },
    ).select("walletBalance");

    const transaction = await WalletTransaction.create({
      userId: req.user._id,
      type: "topup",
      context: "user_wallet",
      method,
      amount: normalizedAmount,
      status: "success",
    });

    return res.status(200).json({
      success: true,
      message: "Wallet topped up successfully",
      walletBalance: updatedUser?.walletBalance ?? 0,
      addedAmount: normalizedAmount,
      transaction: {
        id: transaction._id,
        type: transaction.type,
        method: transaction.method,
        amount: transaction.amount,
        status: transaction.status,
        date: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("topUpWallet error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getWalletHistory = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({
      userId: req.user._id,
      type: "topup",
      context: "user_wallet",
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      transactions: transactions.map((txn) => ({
        id: txn._id,
        type: txn.type,
        method: txn.method,
        amount: txn.amount,
        status: txn.status,
        date: txn.createdAt,
      })),
    });
  } catch (error) {
    console.error("getWalletHistory error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create a new task
export const createWork = async (req, res) => {
  try {
    let {
      taskTitle,
      description,
      category,
      subcategory,
      cost,
      availabilityDate,
      availabilityTimeSlots,
      contactNumber,
      alternateContactNumber,
      address,
      location, // { lat, lng } or JSON string
      images, // Now expecting array of URLs from body
    } = req.body;

    // Parse location if it's a string
    if (typeof location === "string") {
      location = JSON.parse(location);
    }

    // Validation: ensure location
    if (!location || !location.lat || !location.lng) {
      return res.status(400).json({ message: "Location is required" });
    }

    // Ensure images is an array
    let imageUrls = [];
    if (images) {
      if (Array.isArray(images)) {
        imageUrls = images;
      } else if (typeof images === "string") {
        imageUrls = [images];
      }
    }

    // Construct scheduledStartAt from availabilityDate and first time slot
    // Use local noon as safe default to avoid midnight-UTC timezone issues
    let scheduledDate = new Date(availabilityDate + "T09:00:00"); // default 9 AM local
    if (availabilityTimeSlots && availabilityTimeSlots.length > 0) {
      const startHour = parseInt(availabilityTimeSlots[0].split("-")[0], 10);
      scheduledDate = new Date(
        availabilityDate + `T${String(startHour).padStart(2, "0")}:00:00`,
      );
    }

    const now = new Date();
    // expiresAt is always 3 days from CREATION TIME (now), not from scheduledDate
    // This prevents tasks with past/midnight scheduledDate from immediately expiring
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const feeDoc = await PlatformFee.findOne().lean();
    const platformFeePercent = feeDoc?.feePercent ?? 10;
    const workerFeePercent = 100 - platformFeePercent;

    const categoryDoc = await Category.findById(category).select("name").lean();
    const taskType = categoryDoc?.name || category;

    // Create the task
    const task = new Task({
      userId: req.user._id,
      title: taskTitle,
      description,
      taskType,
      subcategory,
      price: cost,
      platformFeePercent,
      workerFeePercent,
      scheduledStartAt: scheduledDate,
      expiresAt, // ← 3 days from now (creation time)
      availabilityTimeSlots,
      contactNumber,
      alternateContactNumber,
      address,
      images: imageUrls,
      location: {
        type: "Point",
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
      },
    });

    await task.save();

    // Broadcast to all online workers so their dashboards auto-refresh
    try {
      const { getIO } = await import("../services/socket.service.js");
      getIO().emit("task_created", {
        taskId: task._id.toString(),
        taskType: task.taskType,
        location: task.location,
      });
    } catch (_) {}

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

export const deleteWork = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Ownership check
    if (task.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this task" });
    }

    /* ==========================================================
       PENALTY: task is actively assigned to a worker
       → ₹100 fine + 60-min ban 
    ========================================================== */
    if (ACTIVE_STATUSES.has(task.status)) {
      const banExpiresAt = new Date(Date.now() + CANCELLATION_BAN_MS);

      // Apply fine & ban in one atomic update
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: { walletBalance: -CANCELLATION_FINE }, // deduct ₹100
          $set: { banExpiresAt },
        },
        { new: true },
      );

      // Cancel the task (keep it in DB for records, mark cancelled)
      await Task.findByIdAndUpdate(id, {
        status: "cancelled",
        $unset: { assignedWorkerId: 1 },
      });

      return res.status(200).json({
        success: true,
        penalised: true,
        message: `Task cancelled. A ₹${CANCELLATION_FINE} fine has been applied and you are banned for 60 minutes.`,
        banExpiresAt,
        walletBalance: updatedUser.walletBalance,
      });
    }

    /* ==========================================================
       NORMAL DELETE: task has no active worker
    ========================================================== */
    // Remove images from Cloudinary
    if (task.images && task.images.length > 0) {
      for (const imageUrl of task.images) {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) await cloudinary.uploader.destroy(publicId);
      }
    }

    await task.deleteOne();
    return res.status(200).json({
      success: true,
      penalised: false,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get all works created by the logged-in user
export const getMyWorks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
// Renew an expired or cancelled task
export const renewTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Check ownership
    if (task.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to renew this task" });
    }

    // Only allow renewal if status is expired, cancelled, or broadcasting (to bump it up)
    // Actually, user might want to renew a broadcasting task to bring it to top?
    // But mainly for expired/cancelled.

    // Update scheduledStartAt to user provided date OR now
    // Expect `newScheduledDate` in body, else default to NOW
    const { newScheduledDate } = req.body;
    const startDate = newScheduledDate
      ? new Date(newScheduledDate)
      : new Date();

    if (isNaN(startDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    task.scheduledStartAt = startDate;
    task.expiresAt = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

    task.status = "broadcasting";
    task.assignedWorkerId = null; // Clear assignment if any
    task.acceptedAt = null;
    task.rejectedAt = null;

    await task.save();

    res.status(200).json({
      success: true,
      message: "Task renewed successfully",
      task,
    });
  } catch (error) {
    console.error("Renew Task Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ═════════════════════════════════════════════════
   SUBMIT REVIEW — user rates a completed task
   POST /api/user/task/:taskId/review
   Body: { rating: 1-5, comment?: string }
══════════════════════════════════════════════════ */
export const submitReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only the task creator can review
    if (task.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only review your own tasks" });
    }

    // Task must be completed
    if (task.status !== "completed") {
      return res
        .status(400)
        .json({ message: "You can only review completed tasks" });
    }

    // Must have an assigned worker
    if (!task.assignedWorkerId) {
      return res
        .status(400)
        .json({ message: "No worker assigned to this task" });
    }

    // Check for existing review
    const existing = await Review.findOne({ taskId });
    if (existing) {
      return res
        .status(409)
        .json({ message: "You have already reviewed this task" });
    }

    // Create review
    const review = await Review.create({
      taskId,
      userId,
      workerId: task.assignedWorkerId,
      rating: Math.round(rating),
      comment: comment?.trim() || "",
    });

    // Recalculate worker average rating
    const allReviews = await Review.find({ workerId: task.assignedWorkerId });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Worker.findByIdAndUpdate(task.assignedWorkerId, {
      rating: Math.round(avgRating * 10) / 10, // 1 decimal place
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    console.error("Submit Review Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ══════════════════════════════════════════════════
   GET TASK REVIEW — fetch existing review for a task
   GET /api/user/task/:taskId/review
══════════════════════════════════════════════════ */
export const getTaskReview = async (req, res) => {
  try {
    const { taskId } = req.params;
    const review = await Review.findOne({ taskId });
    return res.status(200).json({ review: review || null });
  } catch (error) {
    console.error("Get Review Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ══════════════════════════════════════════════════
   GET MY REVIEWS — paginated list of reviews the user submitted
   GET /api/user/reviews?page=1&limit=10
══════════════════════════════════════════════════ */
export const getMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          "taskId",
          "title taskType subcategory description address price scheduledStartAt inProgressAt completedAt workSummary images"
        )
        .populate({
          path: "workerId",
          select: "rating completedTasks profileImage userId",
          populate: { path: "userId", select: "name" },
        }),
      Review.countDocuments({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + reviews.length < total,
      },
    });
  } catch (error) {
    console.error("Get My Reviews Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

/* ══════════════════════════════════════════════════
   SUBMIT REPORT — user reports a worker
   POST /api/user/task/:taskId/report
   Body: { reason: string, description?: string }
══════════════════════════════════════════════════ */
export const submitReport = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { reason, description } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Only the task creator can report
    if (task.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only report workers on your own tasks" });
    }

    // Must have an assigned worker
    if (!task.assignedWorkerId) {
      return res
        .status(400)
        .json({ message: "No worker assigned to this task" });
    }

    // Check for duplicate report on same task
    const existing = await Report.findOne({ taskId, userId });
    if (existing) {
      return res.status(409).json({
        message: "You have already reported the worker for this task",
      });
    }

    const report = await Report.create({
      taskId,
      userId,
      workerId: task.assignedWorkerId,
      reason,
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully. We will review it shortly.",
      report,
    });
  } catch (error) {
    console.error("Submit Report Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
