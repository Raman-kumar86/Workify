import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["topup", "due_payment", "withdrawal", "ban_refund"],
      default: "topup",
    },
    context: {
      type: String,
      enum: ["user_wallet", "worker_dues", "worker_wallet"],
      default: "user_wallet",
      index: true,
    },
    method: {
      type: String,
      enum: ["upi", "card", "netbanking", "wallet"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ["success"],
      default: "success",
    },
  },
  { timestamps: true },
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema);

export default WalletTransaction;
