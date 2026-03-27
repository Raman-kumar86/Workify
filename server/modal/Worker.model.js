import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adharCardNumber: {
      type: String,
      required: [true, "Adhar Card Number is required"],
      trim: true,
    },
    idCardImage: {
      type: String,
      required: [true, "ID Card Image is required"],
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

  services: [{
    category: {
      type: String,
      required: true
    },
    subCategories: [String],
    hourlyRate: Number,
    experience: Number  // years
  }],
  
  /* Online status for broadcast */
  isOnline: {
    type: Boolean,
    default: false
  },
  
  /* Location for real-time matching */
  currentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point"
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]
    }
  },
  
  /* Performance metrics */
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  acceptanceRate: {
    type: Number,
    default: 100  // percentage
  },
  
  /* Ban & Fines */
  banExpiresAt: {
    type: Date,
    default: null
  },
  outstandingFines: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  totalSpentOnDues: {
    type: Number,
    default: 0
  },
  walletCredit: {
    type: Number,
    default: 0
  },
  banFineAmount: {
    type: Number,
    default: 0
  },
  banFinePaid: {
    type: Number,
    default: 0
  },

  /* ── Real-Time Tracking ───────────────────── */
  workerLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  },
  currentSpeed: { type: Number, default: 0 },    // km/h
  currentBearing: { type: Number, default: 0 },   // degrees (0 = North, CW)
  lastSeenAt: { type: Date, default: null }
}, { timestamps: true });
workerSchema.index({ "currentLocation": "2dsphere" });
workerSchema.index({ isOnline: 1, "services.category": 1 });
const Worker = mongoose.model("Worker", workerSchema);
export default Worker;
