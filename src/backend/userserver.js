// src/backend/userserver.js
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

dotenv.config();

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
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    firebaseInitialized = true;
    console.log("✅ Firebase Admin initialized from env service account");
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const keyPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
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

/* ---------- Schemas & Models ---------- */
const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: false },
  name: { type: String, default: "" },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  unit: { type: String, default: "" },
  image: { type: String, default: "" },
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: false },
  name: { type: String, default: "" },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  unit: { type: String, default: "" },
  image: { type: String, default: "" },
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
    // If client passed a uid in body or params, set req.user mock
    req.user = { uid: req.params.uid || (req.body && req.body.uid) || `dev-${Math.random().toString(36).slice(2, 6)}` };
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

    const user = await User.findOne({ uid: uidParam }).lean();
    if (!user) return respondError(res, 404, "User not found", "USER_NOT_FOUND");

    // remove potentially large or sensitive raw fields
    const { cart, orderHistory, __v, _id, ...safe } = user;
    return res.json({ ok: true, user: safe, cart: user.cart || [], orderHistory: user.orderHistory || [] });
  } catch (err) {
    console.error("Get user error:", err?.message || err);
    return respondError(res, 500, "Failed to fetch user", "USER_FETCH_ERROR", err?.message);
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
      paymentStatus: paymentInfo.paymentStatus || "Paid",
      paymentMethod: paymentInfo.paymentMethod || paymentInfo.method || "",
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

/* Basic health */
app.get("/", (_, res) => res.send("User server running"));

/* ---------- Graceful shutdown & uncaught handlers ---------- */
process.on("unhandledRejection", (err) => {
  console.error("UnhandledRejection:", err?.message || err);
});
process.on("uncaughtException", (err) => {
  console.error("UncaughtException:", err?.message || err);
});

/* Start */
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ User Server → http://localhost:${PORT}`);
    console.log(`   Firebase initialized: ${firebaseInitialized}`);
    console.log(`   DEV_NO_AUTH: ${DEV_NO_AUTH}`);
    console.log(`   INTERNAL_SECRET: ${INTERNAL_SECRET ? "[set]" : "[not-set]"}`);
  });
};

startServer();

export default app; // exported for tests
