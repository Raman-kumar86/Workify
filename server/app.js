import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import connectDB from "./config/db.js";
import { protect } from "./middleware/authMiddleware.js";
import workerRoutes from "./routes/workerRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { initSocketServer } from "./services/socket.service.js";

const app = express();
const server = http.createServer(app);

connectDB();

const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", process.env.FRONTEND_URL];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/serverHealth", (req, res) => {
  res.send("API is running...");
});

app.use(express.json());
app.use(cookieParser());

/* ── HTTP Routes ─────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use(protect);
app.use("/api/user", userRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

/* ── Socket.IO ───────────────────────────────────── */
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  },
});

initSocketServer(io);

/* ── Start server ────────────────────────────────── */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);


export default app;