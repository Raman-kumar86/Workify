import express from "express";
import {
	login,
	signup,
	googleAuth,
	requestPasswordResetOtp,
	resendPasswordResetOtp,
	resetPasswordWithOtp,
	getMe,
	logout,
	changePassword,
} from "../controller/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/google", googleAuth);
router.post("/forgot-password/request-otp", requestPasswordResetOtp);
router.post("/forgot-password/resend-otp", resendPasswordResetOtp);
router.post("/forgot-password/reset", resetPasswordWithOtp);
router.get("/me", protect, getMe);   // session restore on page reload
router.post("/logout", logout);      // clear httpOnly cookie
router.post("/change-password", protect, changePassword);

export default router;