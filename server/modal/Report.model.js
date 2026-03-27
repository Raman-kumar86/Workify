import mongoose from "mongoose";
import { REPORT_REASONS } from "../constants/constant.js";

const reportSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      enum: {
        values: REPORT_REASONS,
        message: "Invalid report reason",
      },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

reportSchema.index({ workerId: 1 });
reportSchema.index({ userId: 1 });
reportSchema.index({ status: 1 });

const Report = mongoose.model("Report", reportSchema);
export { REPORT_REASONS };
export default Report;
