// src/backend/paymentServer.js
import "./utils/env.js";
import express from "express";
import cors from "cors";
import paymentRoutes from "./routes/payment.js";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* ------------------------------------------------------
   🌍 CORS (supports Razorpay checkout iframe)
------------------------------------------------------ */
app.use(
  cors({
    origin:
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // 🔥 Required for Razorpay iframe
  })
);

/* ------------------------------------------------------
   📦 JSON Parsing
------------------------------------------------------ */
app.use(express.json({ limit: "5mb" }));

/* ------------------------------------------------------
   🩺 Health Check
------------------------------------------------------ */
app.get("/", (req, res) => {
  res.status(200).send("✅ KrishiSaathi Payment API is running successfully");
});

/* ------------------------------------------------------
   💳 Payment Routes
------------------------------------------------------ */
app.use("/api/payment", paymentRoutes);

/* ------------------------------------------------------
   ❗ Global Error Handler
------------------------------------------------------ */
app.use((err, req, res, next) => {
  console.error("❌ Global Server Error:", err);
  res.status(500).json({
    ok: false,
    error: err.message || "Internal Server Error",
  });
});

/* ------------------------------------------------------
   🚀 Start Server
------------------------------------------------------ */
/* ------------------------------------------------------
   🚀 Start Server
 ------------------------------------------------------ */
const PRIMARY_PORT = process.env.PORT_PAYMENT || process.env.PAYMENT_PORT || 5000;
const FALLBACK_PORT = 5010;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Payment Server running → http://localhost:${port}`);
    console.log(`📡 Configured FRONTEND_ORIGIN: ${process.env.FRONTEND_ORIGIN || "http://localhost:5173"}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (port === PRIMARY_PORT) {
        console.warn(`⚠️ Port ${port} busy, trying fallback ${FALLBACK_PORT}...`);
        startServer(FALLBACK_PORT);
      } else {
        console.error(`❌ Both ports ${PRIMARY_PORT} and ${FALLBACK_PORT} are busy.`);
        console.error(`Run this command to clear: taskkill /F /IM node.exe`);
        process.exit(1);
      }
    }
  });
};

startServer(PRIMARY_PORT);

process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port already in use! Run: taskkill /F /IM node.exe\n`);
  } else {
    console.error('❌ Uncaught Exception:', err);
  }
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});
