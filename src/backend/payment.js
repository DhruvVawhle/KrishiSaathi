// src/backend/paymentServer.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import paymentRoutes from "./routes/payment.js";

dotenv.config();

const app = express();

/* ------------------------------------------------------
   🌍 CORS (supports Razorpay checkout iframe)
------------------------------------------------------ */
app.use(
  cors({
    origin:
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:5173" || // Vite default
      "*",
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
const PORT = process.env.PAYMENT_PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Payment Server running → http://localhost:${PORT}`);
});
