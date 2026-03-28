// src/backend/routes/razorpay.js
import "../utils/env.js";
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";

const router = express.Router();

/**
 * Configuration (use environment variables)
 * - USER_SERVER_URL  => e.g. http://localhost:5002
 * - ORDERS_SERVER_URL => e.g. http://localhost:5001 (optional)
 * - RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET
 */
const USER_SERVER_URL = process.env.USER_SERVER_URL || "http://localhost:5002";
const ORDERS_SERVER_URL = process.env.ORDERS_SERVER_URL || "http://localhost:5001";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_RXkiOg4W6ACRdc";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "04c117tPS3f1bOVB21rbsee9";

/* Razorpay client */
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

/* Simple ephemeral idempotency store to avoid double-processing (use DB for production) */
const processedPayments = new Set();

/* ---------------- Helper: Save order to user profile (calls userserver) ---------------- */
async function saveOrderToUserProfile(uid, paymentInfo = {}, metadata = {}, forwardHeaders = {}) {
  if (!uid) {
    return { saved: false, reason: "uid missing" };
  }
  try {
    const url = `${USER_SERVER_URL.replace(/\/$/, "")}/api/users/${encodeURIComponent(uid)}/order`;
    const body = { paymentInfo, metadata };
    const resp = await axios.post(url, body, {
      headers: { "Content-Type": "application/json", ...forwardHeaders },
      timeout: 10000,
    });
    return { saved: true, response: resp.data };
  } catch (err) {
    return {
      saved: false,
      reason: err?.response?.data || err.message || "failed to save order to user profile",
    };
  }
}

/* ---------------- Helper: Create central order (calls orders service) ---------------- */
async function createCentralOrderIfPossible(payload, forwardHeaders = {}) {
  if (!ORDERS_SERVER_URL) return { created: false, reason: "ORDERS_SERVER_URL not configured" };

  if (!payload.items || !payload.customer) {
    return { created: false, reason: "items or customer missing" };
  }

  try {
    const resp = await axios.post(`${ORDERS_SERVER_URL.replace(/\/$/, "")}/api/orders`, payload, {
      headers: { "Content-Type": "application/json", ...forwardHeaders },
      timeout: 10000,
    });
    return { created: true, response: resp.data };
  } catch (err) {
    return {
      created: false,
      reason: err?.response?.data || err.message || "failed to create central order",
    };
  }
}

/* ---------------------- Create Razorpay Order ---------------------- */
router.post("/create-order", async (req, res) => {
  try {
    const { total, currency = "INR", receipt } = req.body || {};

    if (!total || Number(total) <= 0) {
      return res.status(400).json({ error: "Invalid total amount" });
    }

    const options = {
      amount: Math.round(Number(total) * 100), // paise
      currency,
      receipt: receipt || `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);
    return res.json(order);
  } catch (error) {
    console.error("❌ Razorpay create order error:", error);
    return res.status(500).json({ error: "Unable to create Razorpay order" });
  }
});

/* ---------------------- Verify Payment (client -> server) ----------------------
 Expected body:
 {
   razorpay_order_id, razorpay_payment_id, razorpay_signature,
   uid, items[], customer{...}, subtotal,total, metadata
 }
-----------------------------------------------------------------------------*/
router.post("/verify", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      uid,
      items,
      customer,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      metadata,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: "failed", message: "Missing Razorpay fields" });
    }

    // 1) Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("⚠️ Signature mismatch");
      return res.status(400).json({ status: "failed", message: "Invalid signature" });
    }

    // 2) Simple idempotency: avoid double processing of same payment id
    if (processedPayments.has(razorpay_payment_id)) {
      return res.status(200).json({ status: "already_processed", paymentId: razorpay_payment_id });
    }
    // Mark as processed (ephemeral). In production persist this.
    processedPayments.add(razorpay_payment_id);

    // 3) (Optional) verify amount against Razorpay order details
    try {
      const orderFetch = await razorpay.orders.fetch(razorpay_order_id);
      if (orderFetch && orderFetch.amount) {
        // amount is in paise
        const expectedPaise = Math.round(Number(total || subtotal || 0) * 100);
        if (Number(orderFetch.amount) !== expectedPaise) {
          console.warn("⚠️ Amount mismatch between client and Razorpay order", { orderFetchAmount: orderFetch.amount, expectedPaise });
          // We don't abort here — choose behavior: abort or continue. For safety, we abort.
          // Remove processed mark so a valid attempt later can be processed.
          processedPayments.delete(razorpay_payment_id);
          return res.status(400).json({ status: "failed", message: "Amount mismatch with Razorpay order" });
        }
      }
    } catch (fetchErr) {
      console.warn("⚠️ Could not fetch razorpay order to cross-check amount:", fetchErr?.message || fetchErr);
      // proceed if fetch fails; still processedPayment will be marked — depending on your risk model you might want to rollback.
    }

    // 4) Forward Authorization header if present (so userserver can verify Firebase token)
    const forwardHeaders = {};
    if (req.headers.authorization) forwardHeaders["Authorization"] = req.headers.authorization;

    // 5) Build paymentInfo object
    const paymentInfo = {
      paymentMethod: "razorpay",
      paymentStatus: "Paid",
      paymentId: razorpay_payment_id,
      razorpay_order_id,
    };

    // 6) Save order to user's profile (this reads user's cart from userserver and clears it)
    const userResult = await saveOrderToUserProfile(uid, paymentInfo, metadata || { items, subtotal, total }, forwardHeaders);

    // 7) Create central order in orders service
    let centralResult = { created: false, reason: "skipped (no data)" };
    if (items && customer && customer.email) {
      const payloadForOrders = {
        buyerId: uid || null,
        items,
        customer,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        payment_method: "razorpay",
        metadata: { razorpay_order_id, razorpay_payment_id, ...metadata },
      };
      centralResult = await createCentralOrderIfPossible(payloadForOrders, forwardHeaders);
    }

    return res.json({
      status: "success",
      message: "Payment verified and processed",
      paymentInfo,
      userServer: userResult,
      ordersServer: centralResult,
    });
  } catch (err) {
    console.error("❌ /verify error:", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

/* ---------------------- Webhook (gateway -> server) ----------------------
 * Razorpay sends webhooks with a signature header 'x-razorpay-signature'.
 * For this route we MUST read the raw body; use express.raw middleware for this route only.
 *-----------------------------------------------------------------------------*/
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body; // Buffer
    if (!signature) {
      console.warn("⚠️ Webhook missing signature");
      return res.status(400).send("missing signature");
    }

    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      console.warn("⚠️ Webhook signature mismatch");
      return res.status(400).send("invalid signature");
    }

    const payload = JSON.parse(body.toString("utf8"));
    console.log("📬 Webhook event:", payload.event);

    // Example: handle payment.captured
    if (payload.event === "payment.captured" || payload.event === "payment.authorized") {
      const payment = payload.payload?.payment?.entity || {};
      const razorpay_payment_id = payment.id;
      const razorpay_order_id = payment.order_id;
      const amount = payment.amount; // in paise

      if (processedPayments.has(razorpay_payment_id)) {
        console.log("ℹ️ webhook: payment already processed:", razorpay_payment_id);
        return res.status(200).send("ok");
      }

      // Mark processed (ephemeral)
      processedPayments.add(razorpay_payment_id);

      // If you included uid in metadata when creating payment, extract it:
      const uid = payment?.context?.user_id || (payment?.notes && payment.notes.uid) || null;

      const paymentInfo = {
        paymentMethod: "razorpay",
        paymentStatus: "Paid",
        paymentId: razorpay_payment_id,
        razorpay_order_id,
      };

      // Forward headers: no Authorization present in webhook; use server-to-server secret if configured (not included here)
      const forwardHeaders = {};

      // Save to user's profile if uid available
      if (uid) {
        try {
          await saveOrderToUserProfile(uid, paymentInfo, { webhook: true }, forwardHeaders);
        } catch (e) {
          console.error("❌ webhook -> saving to user profile failed:", e);
        }
      }

      // Optionally create central order - requires you to obtain items/customer (not present in webhook usually)
      // You might store mapping earlier (local DB) between razorpay_order_id and cart snapshot.
    }

    // Respond quickly
    return res.status(200).send("ok");
  } catch (err) {
    console.error("❌ webhook handler error:", err);
    return res.status(500).send("error");
  }
});

/* ---------------------- Cash On Delivery (COD) ---------------------- */
router.post("/cod-order", async (req, res) => {
  try {
    const { items, total, customer, uid, metadata } = req.body || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }
    if (!total || Number(total) <= 0) {
      return res.status(400).json({ error: "Invalid total amount" });
    }
    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({ error: "Customer name & email required" });
    }

    const forwardHeaders = {};
    if (req.headers.authorization) forwardHeaders["Authorization"] = req.headers.authorization;

    const ordersPayload = {
      items,
      customer,
      subtotal: req.body.subtotal || undefined,
      discount: req.body.discount || undefined,
      shipping: req.body.shipping || undefined,
      tax: req.body.tax || undefined,
      total,
      payment_method: "cod",
      metadata: metadata || {},
    };

    const centralResult = await createCentralOrderIfPossible(ordersPayload, forwardHeaders);

    let userResult = { saved: false, reason: "skipped (no uid provided)" };
    if (uid) {
      const paymentInfo = { paymentMethod: "cod", paymentStatus: "Pending", paymentId: "" };
      userResult = await saveOrderToUserProfile(uid, paymentInfo, metadata || { items, total }, forwardHeaders);
    }

    return res.json({
      status: "success",
      message: "COD order placed",
      ordersServer: centralResult,
      userServer: userResult,
    });
  } catch (err) {
    console.error("❌ COD order error:", err);
    return res.status(500).json({ error: "Failed to place COD order" });
  }
});

export default router;
