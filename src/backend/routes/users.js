// src/backend/routes/users.js
import "../utils/env.js";
import express from "express";
import User from "../models/User.js";
import { initFirebaseFromEnv, verifyToken } from "../utils/verifyFirebaseToken.js";

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

/* POST /api/users - Upsert User (Simple) */
router.post("/", async (req, res) => {
  try {
    const { uid, name, email, phone, role } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID required" });
    }

    // 🔥 UPSERT USER (avoid duplicates)
    const user = await User.findOneAndUpdate(
      { uid },
      { uid, name, email, phone, role },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (err) {
    console.error("User save error:", err.message);
    res.status(500).json({ error: "Failed to save user" });
  }
});

/* POST /api/users/sync - Robust Upsert User */
router.post('/sync', async (req, res) => {
  try {
    console.log(
      '[UserSync] Body received:',
      req.body
    )

    const {
      uid,
      name,
      email,
      phone,
      role,
      photoURL,
      farmName,
      farmLocation,
      farmSize,
      farmSizeUnit,
      primaryCrops,
      state,
      district,
      pincode,
      experience,
      bio,
      upiId,
      bankName,
      accountNumber,
      ifscCode
    } = req.body

    if (!uid) {
      console.error(
        '[UserSync] No uid in body'
      )
      return res.status(400).json({
        success: false,
        message: 'uid is required'
      })
    }

    const updateData = {
      $set: {
        uid,
        name: name || 'User',
        email: email || '',
        phone: phone || '',
        role: role || 'farmer',
        photoURL: photoURL || '',
        farmName: farmName || '',
        farmLocation: farmLocation || '',
        farmSize: farmSize || '',
        farmSizeUnit:
          farmSizeUnit || 'acres',
        primaryCrops: primaryCrops || '',
        state: state || '',
        district: district || '',
        pincode: pincode || '',
        experience: experience || '',
        bio: bio || '',
        upiId: upiId || '',
        bankName: bankName || '',
        accountNumber:
          accountNumber || '',
        ifscCode: ifscCode || '',
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    }

    console.log(
      '[UserSync] Upserting uid:', uid
    )

    const user =
      await User.findOneAndUpdate(
        { uid },
        updateData,
        {
          upsert: true,
          new: true,
          runValidators: false,
          setDefaultsOnInsert: true
        }
      )

    console.log(
      '✅ [UserSync] Saved:',
      user._id
    )

    res.json({
      success: true,
      message: 'Profile saved',
      user: {
        uid: user.uid,
        name: user.name,
        role: user.role
      }
    })

  } catch (err) {
    console.error(
      '❌ [UserSync] Error:',
      err.message
    )

    // Handle duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        error: err.message
      })
    }

    res.status(500).json({
      success: false,
      message: 'Save failed',
      error: err.message
    })
  }
})

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

/* GET /api/users/:uid - Optimized profile fetch */
router.get("/:uid", authMiddleware, async (req, res) => {
  try {
    const uidParam = req.params.uid;
    // Auth check: internal, dev_no_auth, or own uid
    if (!(req.isInternal || req.isDevNoAuth) && req.user.uid !== uidParam) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Parallel fetch using .lean() for speed
    const [user, orders] = await Promise.all([
      User.findOne({ uid: uidParam }).lean(),
      // Check if orders are in a separate collection or inside user.orderHistory
      // If separate, we'd fetch from Order model here. 
      // For now, assume they are inside user.orderHistory as per models.
      Promise.resolve([]) 
    ]);

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ 
      ok: true, 
      user, 
      orderHistory: user.orderHistory || [] 
    });
  } catch (err) {
    console.error("fetch user error:", err);
    return res.status(500).json({ error: "Server error", detail: err.message });
  }
});

// Ensure indexes on startup
User.createIndexes().catch(err => console.error("User indexes error:", err));

export default router;
