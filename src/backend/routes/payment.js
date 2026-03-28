import "../utils/env.js";
import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

// --------------------------------------------------
// Razorpay Credentials
// --------------------------------------------------
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_RXkiOg4W6ACRdc";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "04c117tPS3f1bOVB21rbsee9";

// Instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// --------------------------------------------------
// Create Razorpay Order
// --------------------------------------------------
router.post("/create-order", async (req, res) => {
  const { total } = req.body;
  console.log("💳 Received order request for total:", total);

  if (!total || isNaN(total) || total <= 0) {
    console.warn("⚠️ Invalid total amount received:", total);
    return res.status(400).json({ error: "Invalid total amount" });
  }

  const options = {
    amount: Math.round(total * 100), // convert to paise and ensure it's an integer
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay Order Created:", order.id);
    res.json(order);
  } catch (err) {
    console.error("❌ Razorpay Order Creation Failed:", {
      message: err.message,
      code: err.code,
      description: err.description,
      metadata: err.metadata
    });
    res.status(500).json({ 
      error: "Unable to create order", 
      details: err.description || err.message 
    });
  }
});

// --------------------------------------------------
// VERIFY PAYMENT (FIXED)
// --------------------------------------------------
router.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ status: "failed", message: "Missing fields" });
  }

  // Generate signature using YOUR secret
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected === razorpay_signature) {
    console.log("✅ Payment Verified Successfully");
    return res.json({ status: "success" });
  } else {
    console.log("❌ Signature mismatch");
    return res.status(400).json({ status: "failed", message: "Invalid signature" });
  }
});

// --------------------------------------------------
// COD ORDER
// --------------------------------------------------
router.post("/cod-order", (req, res) => {
  const { items, total, customer } = req.body;

  if (!items || !items.length)
    return res.status(400).json({ error: "No items" });

  if (!total || total <= 0)
    return res.status(400).json({ error: "Invalid total" });

  console.log("🟢 COD Order:", { customer, total });

  res.json({ status: "success", message: "COD order accepted" });
});

export default router;
