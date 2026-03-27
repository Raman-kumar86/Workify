import express from "express";
import {
	createWork,
	getMyWorks,
	deleteWork,
	renewTask,
	submitReview,
	getTaskReview,
	submitReport,
	getMyReviews,
	getUserProfile,
	updateUserProfile,
	topUpWallet,
	getWalletHistory,
} from "../controller/userController.js";
import { getCategories } from "../controller/workerController.js";
const router = express.Router();

router.get("/profile", getUserProfile);
router.patch("/profile", updateUserProfile);
router.post("/wallet/topup", topUpWallet);
router.get("/wallet/history", getWalletHistory);

router.post("/create", createWork);
router.delete("/delete/:id", deleteWork);
router.put("/task/:id/renew", renewTask);
router.get("/my-works", getMyWorks);

// Review & Report
router.post("/task/:taskId/review", submitReview);
router.get("/task/:taskId/review", getTaskReview);
router.post("/task/:taskId/report", submitReport);
router.get("/reviews", getMyReviews);
router.get("/categories", getCategories);               // dynamic categories for task creation

export default router;
