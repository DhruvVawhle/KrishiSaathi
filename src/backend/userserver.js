// src/backend/userserver.js
import "./utils/env.js";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import usersRoutes from "./routes/users.js";

dotenv.config({ path: path.join(__dirname, ".env") });

/* ---------- Config ---------- */
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/krishisaathi";
const PORT = process.env.USER_PORT || 5002;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "*";
const DEV_NO_AUTH = !!(process.env.DEV_NO_AUTH === "true");
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "KRISHI-SAATHI-SECRET";
const NODE_ENV = process.env.NODE_ENV || "development";
const SHOW_ERROR_DETAILS = NODE_ENV !== "production";

/* ---------- Firebase Admin init (optional) ---------- */
let firebaseInitialized = false;
try {
  // Option 1: Full JSON string
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin initialized from env service account (JSON)");
  } 
  // Option 2: Individual variables
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    const sa = {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      // Optional defaults or other fields if needed
      type: 'service_account',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    };
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin initialized from individual env variables");
  }
  // Option 3: File path (fallback)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    let keyPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (!fs.existsSync(keyPath)) {
      const fb = path.resolve(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(fb)) keyPath = fb;
    }
    if (fs.existsSync(keyPath)) {
      const raw = fs.readFileSync(keyPath, "utf8");
      const sa = JSON.parse(raw);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      firebaseInitialized = true;
      console.log("✅ Firebase Admin initialized from file:", keyPath);
    } else {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_PATH not found:", keyPath);
    }
  } else {
    console.warn("⚠️ Firebase Admin NOT initialized (no service account provided). DEV_NO_AUTH may be used for dev.");
  }
} catch (err) {
  console.error("❌ Firebase Admin init error:", err?.message || err);
  firebaseInitialized = false;
}

/* ---------- App & middleware ---------- */
const app = express();

// Security: Helmet
app.use(helmet());

// CORS: allow Authorization header for preflight
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Secret"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" })); // increased limit as carts can be large (adjust as needed)

// Rate limiter (basic)
const apiLimiter = rateLimit({
  windowMs: 30 * 1000, // 30s
  max: 150, // limit per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(apiLimiter);

// HTTP logger
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Basic request logger (still helpful)
app.use((req, res, next) => {
  console.debug(`${new Date().toISOString()} → ${req.method} ${req.path}`);
  next();
});

// 🔥 Mount external users router
app.use("/api/users", usersRoutes);

/* ---------- MongoDB connect ---------- */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, { autoIndex: NODE_ENV !== "production" });
    console.log(`✅ MongoDB connected → ${conn.connection.host}:${conn.connection.port}`);
    console.log(`📦 Using DB: ${conn.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connect failed:", err?.message || err);
    process.exit(1);
  }
};

/* ---------- MongoDB indexes (run once on startup) ---------- */
const addIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    // Users collection
    await db.collection('users').createIndex({ uid: 1 }, { unique: true, background: true });
    await db.collection('users').createIndex({ email: 1 }, { sparse: true, background: true });
    await db.collection('users').createIndex({ role: 1 }, { background: true });
    // Orders collection
    await db.collection('orders').createIndex({ uid: 1, createdAt: -1 }, { background: true });
    await db.collection('orders').createIndex({ createdAt: -1 }, { background: true });
    // Products collection (may not exist yet — create silently)
    try {
      await db.collection('products').createIndex({ farmerId: 1 }, { background: true });
      await db.collection('products').createIndex({ category: 1 }, { background: true });
      await db.collection('products').createIndex({ soldCount: -1 }, { background: true });
    } catch { /* products collection may not exist */ }
    console.log('✅ MongoDB indexes created/verified');
  } catch (error) {
    console.error('⚠️ Index creation error (non-fatal):', error?.message || error);
  }
};

/* ---------- Schemas & Models ---------- */
const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: false },
  name: { type: String, default: "" },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  unit: { type: String, default: "" },
  image: { type: String, default: "" },
  farmerId: { type: String, default: "demo" },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: false },
  name: { type: String, default: "" },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  unit: { type: String, default: "" },
  image: { type: String, default: "" },
  farmerId: { type: String, default: "demo" },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, index: true },
  uid: { type: String, required: false, index: true },
  items: { type: [orderItemSchema], default: [] },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, default: "Pending" },
  paymentMethod: { type: String, default: "" },
  paymentId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  role: { type: String, default: "" },
  name: { type: String, default: "" },
  address: { type: String, default: "" },
  state: { type: String, default: "" },
  district: { type: String, default: "" },
  pincode: { type: String, default: "" },
  farmType: { type: String, default: "" },
  cart: { type: [cartItemSchema], default: [] },
  orderHistory: { type: [orderSchema], default: [] },
}, { timestamps: true });

const User = mongoose.models?.User || mongoose.model("User", userSchema);
const Order = mongoose.models?.Order || mongoose.model("Order", orderSchema);

/* ---------- Helpers ---------- */
const computeCartTotals = (cart = []) =>
  cart.map((it) => {
    const price = Number(it.price) || 0;
    const qty = Math.max(1, Number(it.quantity || it.qty || 1));
    const total = Math.round((price * qty + Number.EPSILON) * 100) / 100;
    return { ...it, price, quantity: qty, total };
  });

const sumCart = (cart = []) => cart.reduce((s, it) => s + (Number(it.total) || 0), 0);

const respondError = (res, status = 500, message = "Server error", code = "SERVER_ERROR", detail = null) => {
  const payload = { ok: false, error: message, code };
  if (SHOW_ERROR_DETAILS && detail) payload.detail = detail;
  return res.status(status).json(payload);
};

/* ---------- Auth middleware (centralized) ---------- */
const authMiddleware = async (req, res, next) => {
  // Internal secret bypass
  if (req.headers["x-internal-secret"] === INTERNAL_SECRET) {
    req.isInternal = true;
    return next();
  }

  // Dev no-auth override
  if (DEV_NO_AUTH) {
    req.isDevNoAuth = true;
    // Prioritize UID from body, then params, then fallback to a stable-ish mock
    const bodyUid = req.body && req.body.uid;
    const paramUid = req.params.uid;
    const emailPrefix = (req.body && req.body.email) ? req.body.email.split('@')[0] : 'dev';
    
    const phoneStr = req.body?.phone || '';
    const digits = phoneStr.replace(/\D/g, '');
    req.user = { 
      uid: bodyUid || paramUid || `dev-${emailPrefix}-${digits || 'user'}`
    };
    return next();
  }

  // If firebase isn't initialized, tell caller to enable DEV_NO_AUTH or provide service account
  if (!firebaseInitialized) {
    return respondError(res, 500, "Firebase Admin SDK not initialized on server", "FIREBASE_NOT_INIT");
  }

  // Normal bearer token flow
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return respondError(res, 401, "Missing Authorization Bearer token", "NO_BEARER_TOKEN");
  }
  const idToken = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn("Token verification failed:", err?.message || err);
    return respondError(res, 401, "Invalid or expired auth token", "INVALID_TOKEN");
  }
};

/* ========== ROUTES ========== */

/*
  Dev-friendly public onboarding endpoint
  - Enabled when DEV_NO_AUTH === true OR ALLOW_PUBLIC_ONBOARD === "true"
  - Accepts { uid?, email, name, phone, role, address,... }
  - Upserts user by uid (if provided) or by a generated uid from email
  - This exists to help local dev environments where Firebase Admin isn't configured
*/
app.post("/api/users/onboard-public", async (req, res) => {
  try {
    const allowed = DEV_NO_AUTH || (process.env.ALLOW_PUBLIC_ONBOARD === "true");
    if (!allowed) return respondError(res, 403, "Public onboarding disabled", "NOT_ALLOWED");

    const uidProvided = req.body?.uid;
    const email = req.body?.email || "";
    const name = req.body?.name || "";
    const phone = req.body?.phone || "";
    const role = req.body?.role || "";

    const uid = uidProvided || `dev_${(email || "guest").replace(/[^a-z0-9]/gi, "_")}_${Math.random().toString(36).slice(2,6)}`;

    const update = {
      uid,
      email,
      name,
      phone,
      role,
      address: req.body?.address || "",
      state: req.body?.state || "",
      district: req.body?.district || "",
      pincode: req.body?.pincode || "",
      farmType: req.body?.farmType || "",
    };

    const user = await User.findOneAndUpdate({ uid }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.status(200).json({ ok: true, user, isPublic: true });
  } catch (err) {
    console.error("onboard-public error:", err?.message || err);
    return respondError(res, 500, "Failed to onboard user (public)", "ONBOARD_PUBLIC_ERROR", err?.message);
  }
});


/**
 * POST /api/users/onboard
 * - Accepts internal secret or DEV_NO_AUTH or Bearer token
 * - Upserts user
 */
app.post("/api/users/onboard", authMiddleware, async (req, res) => {
  try {
    // If using dev-no-auth or internal call, allow body.uid
    const isBypass = req.isInternal || req.isDevNoAuth;
    const uidFromReq = req.body?.uid;
    const email = req.body?.email || (req.user && req.user.email) || "";
    const name = req.body?.name || (req.user && req.user.name) || "";
    const phone = req.body?.phone || "";
    const role = req.body?.role || "";

    const uid = isBypass ? (uidFromReq || `dev_${(email || "guest").replace(/[^a-z0-9]/gi, "_")}`) : req.user.uid;

    if (!uid) return respondError(res, 400, "uid required", "MISSING_UID");

    const update = {
      uid,
      email,
      name,
      phone,
      role,
      address: req.body?.address || "",
      state: req.body?.state || "",
      district: req.body?.district || "",
      pincode: req.body?.pincode || "",
      farmType: req.body?.farmType || "",
    };

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log("🟢 onboard saved/updated user:", { uid: user.uid, _id: user._id });
    return res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error("onboard error:", err?.message || err);
    return respondError(res, 500, "Failed to onboard user", "ONBOARD_ERROR", err?.message);
  }
});

/*
  GET /api/users/:uid
  - Returns user profile (safe fields) for the given uid
  - Requires authMiddleware to ensure caller is same user or internal/dev
*/
app.get("/api/users/:uid", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;
    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) {
      return respondError(res, 403, "Forbidden - uid mismatch", "FORBIDDEN_UID");
    }

    const user = await User.findOne({
      $or: [
        { uid: uidParam },
        { firebaseUid: uidParam },
        { userId: uidParam }
      ]
    }).lean();

    if (!user) {
      return res.status(404).json({
        message: 'User not found in DB',
        uid: uidParam
      });
    }

    // remove potentially large or sensitive raw fields
    const { cart, orderHistory, __v, _id, password, ...safe } = user;
    return res.json({ ok: true, user: safe, cart: user.cart || [], orderHistory: user.orderHistory || [] });
  } catch (err) {
    console.error("Get user error:", err?.message || err);
    return respondError(res, 500, "Failed to fetch user", "USER_FETCH_ERROR", err?.message);
  }
});

// POST /api/users/sync
// Creates or updates user after Firebase login
app.post('/api/users/sync', async (req, res) => {
  try {
    const {
      uid, name, email,
      phone, role, photoURL
    } = req.body;

    if (!uid) return res.status(400).json({ message: 'uid required' });

    const user = await User.findOneAndUpdate(
      { uid },
      {
        uid,
        name: name || 'KrishiSaathi User',
        email: email || '',
        phone: phone || '',
        role: role || 'buyer',
        photoURL: photoURL || '',
        updatedAt: new Date()
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    ).lean();

    res.json({
      success: true,
      user: {
        uid: user.uid,
        name: user.name,
        email: user.email,
        role: user.role,
        photoURL: user.photoURL
      }
    });

  } catch (error) {
    console.error('Sync user error:', error);
    return respondError(res, 500, 'Failed to sync user', 'SYNC_USER_ERROR', error.message);
  }
});

/* Save Cart: upsert user.cart */
app.post("/api/users/:uid/cart", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;
    const items = Array.isArray(req.body.items) ? req.body.items : null;
    if (!Array.isArray(items)) return respondError(res, 400, "items array required", "INVALID_PAYLOAD");

    // if auth enforced, ensure correct user
    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) {
      return respondError(res, 403, "Forbidden - uid mismatch", "FORBIDDEN_UID");
    }

    const computed = computeCartTotals(items);
    const updated = await User.findOneAndUpdate(
      { uid: uidParam },
      { $setOnInsert: { uid: uidParam }, $set: { cart: computed } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    console.log(`🛒 Cart updated for uid=${uidParam}, items=${computed.length}`);
    return res.status(200).json({ ok: true, cart: updated.cart || [] });
  } catch (err) {
    console.error("Save cart error:", err?.message || err);
    return respondError(res, 500, "Server error while saving cart", "CART_SAVE_ERROR", err?.message);
  }
});

/* Create order: push to orderHistory and clear cart (atomic-ish) */
app.post("/api/users/:uid/order", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;
    const { paymentInfo = {} } = req.body || {};

    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) {
      return respondError(res, 403, "Forbidden - uid mismatch", "FORBIDDEN_UID");
    }

    // read user
    const user = await User.findOne({ uid: uidParam }).lean();
    if (!user) return respondError(res, 404, "User not found", "USER_NOT_FOUND");

    const cart = Array.isArray(user.cart) ? user.cart : [];
    if (!cart.length) return respondError(res, 400, "Cart is empty", "CART_EMPTY");

    const cartWithTotals = computeCartTotals(cart);
    const totalAmount = Math.round((sumCart(cartWithTotals) + Number.EPSILON) * 100) / 100;
    const orderId = new mongoose.Types.ObjectId().toHexString();

    const orderObj = {
      orderId,
      uid: uidParam,
      items: cartWithTotals,
      totalAmount,
      paymentStatus: paymentInfo.paymentStatus || (paymentInfo.method === 'COD' || paymentInfo.paymentMethod === 'COD' ? 'Pending' : 'Paid'),
      paymentMethod: paymentInfo.paymentMethod || paymentInfo.method || 'COD',
      paymentId: paymentInfo.paymentId || paymentInfo.id || "",
      createdAt: new Date(),
    };

    // Save top-level order doc (non-blocking)
    try {
      await Order.create(orderObj);
      console.log("🗂️ Order saved to orders collection:", orderObj.orderId);
    } catch (err) {
      console.warn("⚠️ Failed to create top-level Order doc:", err?.message || err);
      // not fatal
    }

    // Push into user's history and clear cart
    const updated = await User.findOneAndUpdate(
      { uid: uidParam },
      { $push: { orderHistory: { $each: [orderObj], $position: 0 } }, $set: { cart: [] } },
      { new: true }
    );

    return res.status(201).json({ ok: true, message: "Order saved", order: orderObj });
  } catch (err) {
    console.error("Create order error:", err?.message || err);
    return respondError(res, 500, "Failed to create order", "ORDER_CREATE_ERROR", err?.message);
  }
});

/* Fetch orders for a user (top-level collection first, fallback to user.orderHistory) */
app.get("/api/users/:uid/orders", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;

    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) {
      return respondError(res, 403, "Forbidden - uid mismatch", "FORBIDDEN_UID");
    }

    // Prefer top-level orders collection for easier pagination
    const orders = await Order.find({ uid: uidParam }).sort({ createdAt: -1 }).lean();
    if (orders && orders.length) return res.json({ ok: true, orders });

    // fallback to user.orderHistory
    const user = await User.findOne({ uid: uidParam }).lean();
    const oh = (user && Array.isArray(user.orderHistory) ? user.orderHistory : []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ ok: true, orders: oh });
  } catch (err) {
    console.error("Get orders error:", err?.message || err);
    return respondError(res, 500, "Failed to fetch orders", "ORDERS_FETCH_ERROR", err?.message);
  }
});

/* Personalized Recommendations — returns category hints, frontend filters products */
app.get("/api/users/:uid/recommendations", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;

    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) {
      return respondError(res, 403, "Forbidden - uid mismatch", "FORBIDDEN_UID");
    }

    // Try top-level orders first
    let orders = await Order.find({ uid: uidParam }).select('items').lean();

    // Fallback to user.orderHistory
    if (!orders || orders.length === 0) {
      const user = await User.findOne({ uid: uidParam }).select('orderHistory').lean();
      orders = (user && Array.isArray(user.orderHistory)) ? user.orderHistory : [];
    }

    // New user — recommend popular products
    if (!orders.length) {
      return res.json({ type: 'popular', categories: [], message: 'Show popular products' });
    }

    // Returning user — extract purchased categories
    const boughtCategories = [
      ...new Set(
        orders.flatMap(o =>
          (Array.isArray(o.items) ? o.items : []).map(i => i.category).filter(Boolean)
        )
      )
    ];

    return res.json({
      type: 'personalized',
      categories: boughtCategories,
      message: `Personalized for ${boughtCategories.length} categories`
    });
  } catch (err) {
    console.error("Recommendations error:", err?.message || err);
    return respondError(res, 500, "Could not fetch recommendations", "RECOMMENDATIONS_ERROR", err?.message);
  }
});

/* ---------- Orders API ---------- */

// GET all orders for a user — OPTIMIZED
app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find(
      { uid: userId },
      // Only fetch needed fields for history list
      {
        orderId: 1,
        status: 1,
        totalAmount: 1,
        items: 1,
        paymentMethod: 1,
        createdAt: 1,
        uid: 1
      }
    )
    .sort({ createdAt: -1 })  // newest first
    .limit(50)                 // max 50 orders
    .lean();                   // plain JS, faster

    // Compatibility mapper for frontend expectation of 'total'
    const mapped = orders.map(o => ({
      ...o,
      total: o.totalAmount || o.total || 0,
      paymentMethod: o.paymentMethod || "unknown"
    }));

    res.json({ orders: mapped });

  } catch (error) {
    console.error('Orders fetch error:', error);
    return respondError(res, 500, 'Failed to fetch orders', 'ORDERS_FETCH_ERROR', error.message);
  }
});

// GET single order by ID — for tracking
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ 
      $or: [
        { orderId: orderId },
        { _id: mongoose.isValidObjectId(orderId) ? orderId : new mongoose.Types.ObjectId() }
      ]
    }).lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Order fetch error:', error);
    return respondError(res, 500, 'Failed to fetch order', 'ORDER_FETCH_ERROR', error.message);
  }
});

// POST place new order
app.post("/api/orders", async (req, res) => {
  try {
    const {
      uid, items, total,
      paymentMethod
    } = req.body;

    const orderId = 'ORD' + Date.now();
    const order = new Order({
      orderId,
      uid,
      items: items.map(item => ({
        ...item,
        total: (item.price || 0) * (item.quantity || item.qty || 1)
      })),
      totalAmount: total,
      paymentMethod: paymentMethod || 'cod',
      status: 'confirmed',
      createdAt: new Date()
    });

    await order.save();

    // Clear cart for the user
    await User.findOneAndUpdate(
      { uid },
      { $set: { cart: [] } }
    );

    res.status(201).json({
      success: true,
      id: orderId,
      orderId: orderId
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return respondError(res, 500, 'Failed to place order', 'ORDER_CREATE_ERROR', error.message);
  }
});

/* Basic health */
app.get("/", (_, res) => res.send("User server running"));

// Global Error Handler
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error("❌ [User Server] Global Error:", err);
  const status = err.status || err.statusCode || 500;
  
  res.status(status).json({
    success: false,
    error: SHOW_ERROR_DETAILS ? (err.message || "Internal Server Error") : "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
    path: req.path
  });
});


/* ---------- Graceful shutdown & uncaught handlers ---------- */
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

/* Start */
const PRIMARY_PORT = process.env.USER_PORT || 5002;
const FALLBACK_PORT = 5012;

const startListening = (port) => {
  const server = app.listen(port, () => {
    console.log(`✅ User Server running on http://localhost:${port}`);
    console.log(`   Firebase initialized: ${firebaseInitialized}`);
    console.log(`   DEV_NO_AUTH: ${DEV_NO_AUTH}`);
    console.log(`   INTERNAL_SECRET: ${INTERNAL_SECRET ? "[set]" : "[not-set]"}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (port === PRIMARY_PORT) {
        console.warn(`⚠️ Port ${port} busy, trying fallback ${FALLBACK_PORT}...`);
        startListening(FALLBACK_PORT);
      } else {
        console.error(`❌ Both ports ${PRIMARY_PORT} and ${FALLBACK_PORT} are busy.`);
        console.error(`Run this command to clear: taskkill /F /IM node.exe`);
        process.exit(1);
      }
    }
  });
};

const startServer = async () => {
  await connectDB();
  await addIndexes();
  startListening(PRIMARY_PORT);
};

startServer();

export default app; // exported for tests
