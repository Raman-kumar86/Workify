import mongoose from "mongoose";

/* Singleton document — only one record ever exists */
const platformFeeSchema = new mongoose.Schema(
  {
    feePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 10,
    },
  },
  { timestamps: true }
);

export const PlatformFee = mongoose.model("PlatformFee", platformFeeSchema);
