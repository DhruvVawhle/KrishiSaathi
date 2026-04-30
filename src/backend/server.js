// src/backend/server.js
import "./utils/env.js";
// General-purpose Express server on port 3000
// (phone number verification stub — Firebase Phone OTP is handled client-side)
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import recommendationRoutes from './routes/recommendations.js';
import mandiRoutes from './routes/mandi.js';
import productRoutes from './routes/products.js';
import einvoiceRoutes from './routes/einvoice.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/krishi_saathi")
  .then(() => console.log("📦 Connected to MongoDB (Main Server)"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Health check
app.get("/", (req, res) => {
  res.json({ ok: true, server: "KrishiSaathi main server", port: 3000 });
});

// Health check for all servers
app.get('/api/health', async (req, res) => {
  const checks = {
    main:    { port: 3000, status: 'ok' },
    orders:  { port: 5001, status: 'checking' },
    users:   { port: 5002, status: 'checking' },
    payment: { port: 5000, status: 'checking' }
  }

  // Check other servers
  const checkServer = async (port) => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(
        () => controller.abort(), 2000
      )
      const res = await fetch(
        `http://localhost:${port}/`,
        { signal: controller.signal }
      )
      clearTimeout(timeout)
      return res.ok ? 'ok' : 'error'
    } catch {
      return 'offline'
    }
  }

  checks.orders.status =
    await checkServer(5001)
  checks.users.status =
    await checkServer(5002)
  checks.payment.status =
    await checkServer(5000)

  const allOk = Object.values(checks)
    .every(c => c.status === 'ok')

  res.json({
    success: true,
    status: allOk ? 'all_ok' : 'partial',
    servers: checks,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Stub: Phone number verification
// Real verification is done client-side via Firebase SDK.
// This endpoint is kept for backward compatibility.
app.post("/verifiedPhoneNumber", (req, res) => {
  const token = req.body?.token;
  if (!token) {
    return res.status(400).json({ error: "Missing token in request body" });
  }
  // In production: verify via Firebase Admin SDK
  return res.status(200).json({
    success: true,
    message: "Verification handled client-side via Firebase SDK",
  });
});

// Recommendation API endpoint
app.use('/api/recommendations', recommendationRoutes);

// Mandi Rate Analysis endpoint
app.use('/api/mandi', mandiRoutes);

// Product management endpoint
app.use('/api/products', productRoutes);

// GST e-Invoice endpoint
app.use('/api/einvoice', einvoiceRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ [Main Server] Global Error:", err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
    path: req.path
  });
});

const PRIMARY_PORT = process.env.PORT_MAIN || process.env.PORT || 3000;
const FALLBACK_PORT = 3010;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ Main server running on http://localhost:${port}`);
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
