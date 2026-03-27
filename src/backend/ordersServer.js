// ✅ src/backend/ordersServer.js
import "./utils/env.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/krishisaathi";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

/* ---------------------------
   Optional: enable mongoose debug (uncomment to see queries)
   mongoose.set("debug", true);
----------------------------*/

/* --------------------------------------------------------
   ✅ Mongoose Models
---------------------------------------------------------*/
const OrderItemSchema = new mongoose.Schema({
  id: String,
  productId: String,
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  farmerId: String,
  unit: String,
  image: String,
});

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: String,
});

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customer: { type: CustomerSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payment_method: { type: String, default: "unknown" },
    buyerId: { type: String, index: true },
    status: { type: String, default: "received" },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

/* --------------------------------------------------------
   ✅ Connect to MongoDB
---------------------------------------------------------*/
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected:", MONGO_URI);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

/* --------------------------------------------------------
   ✅ Middleware (CORS + JSON)
   - allow Authorization header and custom X- headers
---------------------------------------------------------*/
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Secret"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));

import ordersRouter from "./routes/orders.js";
app.use("/api/orders", ordersRouter);


/* --------------------------------------------------------
   ✅ Start server
---------------------------------------------------------*/
const PRIMARY_PORT = process.env.PORT || 5001;
const FALLBACK_PORT = 5111;

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ Orders server running on http://localhost:${port}`);
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

connectDB().then(() => {
  startServer(PRIMARY_PORT);
});

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
