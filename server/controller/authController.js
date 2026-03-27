import { generateToken } from "../config/jwt.js";
import { getFirebaseAdminAuth } from "../config/firebaseAdmin.js";
import User from "../modal/User.js";
import bcrypt from "bcrypt";
import { sendPasswordResetOTPEmail } from "../services/email.service.js";

/* ─── helpers ──────────────────────────────────────── */
const COOKIE_OPTS = {
  httpOnly: true,   // JS cannot read this cookie
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT expiry)
};

const setAuthCookie = (res, token) =>
  res.cookie("auth_token", token, COOKIE_OPTS);

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const RESET_OTP_EXPIRY_MS = 15 * 60 * 1000;
const RESET_OTP_RESEND_MS = 60 * 1000;

const createGooglePlaceholderPassword = () =>
  `GoogleAuth@${Math.random().toString(36).slice(2)}A1`;

const createPasswordResetOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const getRetryAfterSeconds = (availableAt) =>
  Math.max(0, Math.ceil((new Date(availableAt).getTime() - Date.now()) / 1000));

const getAdminEmails = () => {
  const adminEmailsStr = process.env.ADMIN_EMAIL_ID || "";
  return adminEmailsStr
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

const isAdminEmail = (email) => {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
};

const clearPasswordResetOtp = (user) => {
  user.passwordResetOtp = null;
  user.passwordResetOtpExpiresAt = null;
  user.passwordResetOtpSentAt = null;
};

const issuePasswordResetOtp = async (user, { enforceCooldown = true } = {}) => {
  const now = Date.now();
  const resendAvailableAt = new Date(now + RESET_OTP_RESEND_MS);

  if (
    enforceCooldown &&
    user.passwordResetOtpSentAt &&
    now - new Date(user.passwordResetOtpSentAt).getTime() < RESET_OTP_RESEND_MS
  ) {
    const retryAfterSeconds = getRetryAfterSeconds(
      new Date(new Date(user.passwordResetOtpSentAt).getTime() + RESET_OTP_RESEND_MS),
    );
    const error = new Error("You can resend OTP only after 1 minute");
    error.statusCode = 429;
    error.retryAfterSeconds = retryAfterSeconds;
    error.resendAvailableAt = new Date(
      new Date(user.passwordResetOtpSentAt).getTime() + RESET_OTP_RESEND_MS,
    );
    throw error;
  }

  const otp = createPasswordResetOtp();
  user.passwordResetOtp = await bcrypt.hash(otp, 10);
  user.passwordResetOtpSentAt = new Date(now);
  user.passwordResetOtpExpiresAt = new Date(now + RESET_OTP_EXPIRY_MS);
  await user.save();

  await sendPasswordResetOTPEmail({
    toEmail: user.email,
    userName: user.name,
    otp,
    expiresInMinutes: 15,
  });

  return {
    resendAvailableAt,
    otpExpiresAt: user.passwordResetOtpExpiresAt,
  };
};

const buildAuthResponse = (user, token) => ({
  success: true,
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    userType: user.userType,
    isVerified: user.isVerified,
    walletBalance: user.walletBalance ?? 0,
  },
  token,
});

export const signup = async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;

    if (!name || !email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: "Please add all fields",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if email is an admin email
    const adminEmailMatch = isAdminEmail(email);
    let finalUserType = userType;
    let isVerified = userType === "user";

    // If email matches admin list, promote to admin and mark verified
    if (adminEmailMatch) {
      finalUserType = "admin";
      isVerified = true;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      userType: finalUserType,
      isVerified,
    });

    // Workers should NOT get a token until verified (unless they're admin)
    if (finalUserType === "worker") {
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
        },
        message: "Worker account created. Await admin verification.",
      });
    }

    // For normal users, generate token
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        walletBalance: user.walletBalance ?? 0,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    //  Generate token
    const token = generateToken(user._id);

    if(user.userType === "worker"){
      setAuthCookie(res, token);
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          isVerified: user.isVerified,
          walletBalance: user.walletBalance ?? 0,
        },
        token,
      });
    }
    setAuthCookie(res, token);
    //  Send response (no password)
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        walletBalance: user.walletBalance ?? 0,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { idToken, projectId, userType } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required",
      });
    }

    const firebaseAdminAuth = getFirebaseAdminAuth(projectId);
    const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);
    const provider = decodedToken.firebase?.sign_in_provider;

    if (provider !== "google.com") {
      return res.status(400).json({
        success: false,
        message: "Only Google sign-in is supported for this endpoint",
      });
    }

    if (!decodedToken.email || !decodedToken.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Your Google account must have a verified email address",
      });
    }

    let user = await User.findOne({ email: decodedToken.email });

    if (!user) {
      // Check if email is an admin email
      const adminEmailMatch = isAdminEmail(decodedToken.email);
      const nextUserType = adminEmailMatch ? "admin" : (userType === "worker" ? "worker" : "user");
      const hashedPassword = await bcrypt.hash(
        createGooglePlaceholderPassword(),
        10,
      );

      user = await User.create({
        name: decodedToken.name || decodedToken.email.split("@")[0],
        email: decodedToken.email,
        password: hashedPassword,
        userType: nextUserType,
        isVerified: adminEmailMatch ? true : (nextUserType === "user"),
      });
    } else if (isAdminEmail(decodedToken.email) && user.userType !== "admin") {
      // If existing user matches admin email but isn't admin, promote them
      user.userType = "admin";
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);
    setAuthCookie(res, token);

    return res.status(200).json(buildAuthResponse(user, token));
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Google authentication failed",
    });
  }
};

export const requestPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetOtp +passwordResetOtpExpiresAt +passwordResetOtpSentAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const resetMeta = await issuePasswordResetOtp(user);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      ...resetMeta,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send OTP",
      retryAfterSeconds: error.retryAfterSeconds,
      resendAvailableAt: error.resendAvailableAt,
    });
  }
};

export const resendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email }).select(
      "+passwordResetOtp +passwordResetOtpExpiresAt +passwordResetOtpSentAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const resetMeta = await issuePasswordResetOtp(user);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email",
      ...resetMeta,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to resend OTP",
      retryAfterSeconds: error.retryAfterSeconds,
      resendAvailableAt: error.resendAvailableAt,
    });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8+ chars with uppercase, lowercase, number, and special character",
      });
    }

    const user = await User.findOne({ email }).select(
      "+password +passwordResetOtp +passwordResetOtpExpiresAt +passwordResetOtpSentAt",
    );

    if (!user || !user.passwordResetOtp || !user.passwordResetOtpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "Request a new OTP before resetting your password",
      });
    }

    if (Date.now() > new Date(user.passwordResetOtpExpiresAt).getTime()) {
      clearPasswordResetOtp(user);
      await user.save();
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Request a new code.",
      });
    }

    const isOtpValid = await bcrypt.compare(otp.trim(), user.passwordResetOtp);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    clearPasswordResetOtp(user);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset password",
    });
  }
};

/* ══════════════════════════════════════════════════
   GET ME — verify cookie token and return current user
   GET /api/auth/me
══════════════════════════════════════════════════ */
export const getMe = async (req, res) => {
  try {
    // req.user is populated by the protect middleware (reads cookie or header)
    const user = req.user;
    // Return the token so the client can restore socket auth after page refresh
    const token = req.cookies?.auth_token;
    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        isVerified: user.isVerified,
        walletBalance: user.walletBalance ?? 0,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ══════════════════════════════════════════════════
   LOGOUT — clear the auth cookie
   POST /api/auth/logout
══════════════════════════════════════════════════ */
export const logout = (req, res) => {
  res.clearCookie("auth_token", { ...COOKIE_OPTS, maxAge: 0 });
  return res.status(200).json({ success: true, message: "Logged out" });
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8+ chars with uppercase, lowercase, number and special character",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
};
