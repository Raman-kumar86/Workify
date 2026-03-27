import mongoose from "mongoose";

const taskRejectionSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
    index: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Worker",
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  rejectedAt: {
    type: Date,
    default: Date.now
  },
  adminReviewed: {
    type: Boolean,
    default: false
  },
  banLifted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model("TaskRejection", taskRejectionSchema);
