import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      match: [/^[A-Za-z\s]+$/, "Name must contain only letters and spaces"],
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    userType: {
      type: String,
      required: true,
      enum: {
        values: ["user", "worker", "admin"],
        message: "User type must be 'user', 'worker', or 'admin'",
      },
      default: "user",
    },

    password: {
      type: String,
      select: false,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      validate: {
        validator: function (value) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(
            value,
          );
        },
        message:
          "Password must include uppercase, lowercase, number, and special character",
      },
    },
    contactNumber: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit contact number"],
    },
    address: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    passwordResetOtp: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetOtpExpiresAt: {
      type: Date,
      select: false,
      default: null,
    },
    passwordResetOtpSentAt: {
      type: Date,
      select: false,
      default: null,
    },

    /* ── Penalty / Ban system ────────────────────────── */
    walletBalance: {
      type: Number,
      default: 0,   // negative = in debt
    },
    banExpiresAt: {
      type: Date,
      default: null, // null = not banned
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
