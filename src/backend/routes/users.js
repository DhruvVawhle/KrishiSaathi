// src/backend/routes/users.js
import express from "express";
import User from "../models/User.js";
import { initFirebaseFromEnv, verifyToken } from "../utils/verifyFirebase.js";

const router = express.Router();

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "KRISHI-SAATHI-SECRET";
const DEV_NO_AUTH = !!(process.env.DEV_NO_AUTH === "true");

// Helper: compute totals
const computeCartTotals = (cart = []) => cart.map(it => {
  const price = Number(it.price || 0);
  const qty = Math.max(1, Number(it.quantity || it.qty || 1));
  const total = Math.round((price * qty + Number.EPSILON) * 100) / 100;
  return { ...it, price, quantity: qty, total };
});

// Middleware: authenticate (supports DEV_NO_AUTH and internal secret)
async function authMiddleware(req, res, next) {
  // internal secret bypass
  if (req.headers["x-internal-secret"] === INTERNAL_SECRET) {
    req.isInternal = true;
    return next();
  }
  if (DEV_NO_AUTH) {
    req.isDevNoAuth = true;
    req.user = { uid: req.params.uid || req.body?.uid || `dev-${Math.random().toString(36).slice(2,6)}` };
    return next();
  }
  // token verify
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return res.status(401).json({ error: "Missing Bearer token" });
  const token = authHeader.split(" ")[1];
  try {
    initFirebaseFromEnv();
    const decoded = await verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token", detail: err.message });
  }
}

/* POST /api/users/onboard */
router.post("/onboard", authMiddleware, async (req, res) => {
  try {
    const bypass = req.isInternal || req.isDevNoAuth;
    const uid = bypass ? (req.body.uid || `dev_${(req.body.email || "guest").replace(/[^a-z0-9]/gi, "_")}`) : req.user.uid;
    if (!uid) return res.status(400).json({ error: "uid required" });

    const update = {
      uid,
      email: req.body.email || (req.user && req.user.email) || "",
      name: req.body.name || (req.user && req.user.name) || "",
      phone: req.body.phone || "",
      role: req.body.role || "",
      address: req.body.address || "",
      state: req.body.state || "",
      district: req.body.district || "",
      pincode: req.body.pincode || "",
      farmType: req.body.farmType || ""
    };

    const user = await User.findOneAndUpdate({ uid }, { $set: update }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ ok: true, user });
  } catch (err) {
    console.error("onboard error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

/* POST /api/users/:uid/cart */
router.post("/:uid/cart", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;
    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) return res.status(403).json({ error: "Forbidden" });

    const items = Array.isArray(req.body.items) ? req.body.items : null;
    if (!items) return res.status(400).json({ error: "items array required" });

    const computed = computeCartTotals(items);
    const updated = await User.findOneAndUpdate({ uid: uidParam }, { $setOnInsert: { uid: uidParam }, $set: { cart: computed } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ ok: true, cart: updated.cart });
  } catch (err) {
    console.error("save cart error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

/* POST /api/users/:uid/order -> This endpoint pushes order ref but real order creation in orders service */
router.post("/:uid/order", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;
    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) return res.status(403).json({ error: "Forbidden" });

    const user = await User.findOne({ uid: uidParam });
    if (!user) return res.status(404).json({ error: "User not found" });
    const cart = Array.isArray(user.cart) ? user.cart : [];
    if (!cart.length) return res.status(400).json({ error: "Cart is empty" });

    const cartWithTotals = computeCartTotals(cart);
    const total = cartWithTotals.reduce((s, it) => s + it.total, 0);
    const orderId = `KS-${Date.now()}`;

    // Push a simple order reference to user's orderHistory and clear cart
    user.orderHistory.unshift({ orderId, totalAmount: total, createdAt: new Date() });
    user.cart = [];
    await user.save();

    // Ideally call Orders service here to create full order doc (via internal secret)
    return res.status(201).json({ ok: true, orderRef: { orderId, total } });
  } catch (err) {
    console.error("user create order error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

export default router;
