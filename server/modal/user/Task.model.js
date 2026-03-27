import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    /* =======================
       USER (JOB CREATOR)
    ======================= */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    /* =======================
       WORKER (ACCEPTOR)
    ======================= */
    assignedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null,
      index: true
    },

    /* =======================
       TASK DETAILS
    ======================= */
    title: {
      type: String,
      required: true
    },

    description: {
      type: String
    },

    taskType: {
      type: String, // plumber, electrician, delivery, etc.
      required: true,
      index: true
    },

    /* =======================
       ADDITIONAL INFO
    ======================= */
    images: {
      type: [String],
      default: []
    },

    contactNumber: {
      type: String
    },

    alternateContactNumber: {
      type: String
    },
    
    subcategory: {
        type: String
    },

    address: {
        type: String, // Human readable address
    },

    /* =======================
       SCHEDULING
    ======================= */
    scheduledStartAt: {
      type: Date,
      required: true,
      index: true
    },
    
    // Store original preference if needed
    availabilityTimeSlots: {
        type: [String] 
    },

    estimatedDurationMinutes: {
      type: Number
    },

    /* =======================
       LOCATION (READY FOR GEO)
    ======================= */
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true
      }
    },

    /* =======================
       STATUS MACHINE
    ======================= */
    /* =======================
       STATUS MACHINE
    ======================= */
    status: {
      type: String,
      enum: [
        "broadcasting", // visible to workers
        "assigned",     // first worker accepted
        "inProgress",   // task started
        "arrived",      // worker within 50m of destination
        "completed",
        "expired",      // not accepted before start (legacy/manual)
        "cancelled"
      ],
      default: "broadcasting",
      index: true
    },

    arrivedAt: {
      type: Date,
      default: null
    },

    inProgressAt: {
      type: Date,
      default: null   // set when worker verifies OTP → task becomes inProgress
    },

    /* =======================
       OTP (ARRIVAL VERIFICATION)
       Worker taps "Arrived" → OTP emailed to user → worker types it
    ======================= */
    otp: {
      type: String,    // stored as plain 4-digit code (not exposed to client)
      select: false,   // never returned in normal queries
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    otpVerifiedAt: {
      type: Date,
      default: null,   // set when worker correctly submits OTP
    },
    
    // Automatic Expiration
    expiresAt: {
        type: Date,
        index: true // Important for querying active tasks
    },

    /* =======================
       ACCEPTANCE RACE CONTROL
    ======================= */
    acceptedAt: {
      type: Date,
      default: null
    },

    rejectedAt: {
      type: Date,
      default: null
    },

    /* =======================
       PRICE / PAYMENT
    ======================= */
    price: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "INR"
    },

    /* Fee snapshot at time of task creation */
    platformFeePercent: {
      type: Number,
      default: null
    },
    workerFeePercent: {
      type: Number,
      default: null
    },

    /* =======================
       PAYMENT
    ======================= */
    paymentStatus: {
      type: String,
      enum: ["pending", "released", "held", "refunded"],
      default: "pending"
    },

    /* =======================
       WORK SUMMARY (filled by worker on completion)
    ======================= */
    workSummary: {
      type: String,
      default: null
    },

    completedAt: {
      type: Date,
      default: null
    },

    /* =======================
       AUDIT
    ======================= */
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

/* =======================
   INDEXES
======================= */

// Geo queries (nearby workers)
taskSchema.index({ location: "2dsphere" });

// Fast broadcast lookups
taskSchema.index({
  status: 1,
  taskType: 1,
  scheduledStartAt: 1
});

export default mongoose.model("Task", taskSchema);
