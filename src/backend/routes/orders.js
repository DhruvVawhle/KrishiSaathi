// src/backend/routes/orders.js
import express from "express";
import Order from "../models/Order.js";

const router = express.Router();

// Create new order
router.post("/", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: "items[] required" });
    }
    if (!payload.customer?.name || !payload.customer?.email) {
      return res.status(400).json({ error: "customer.name & customer.email required" });
    }

    const subtotal = Number(payload.subtotal) || payload.items.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || it.qty || 1), 0);
    const discount = Number(payload.discount || 0);
    const shipping = Number(payload.shipping || 0);
    const tax = Number(payload.tax || 0);
    const total = Number(payload.total) || Math.max(0, subtotal - discount + shipping + tax);

    const orderId = `KS-${Date.now()}`;

    const orderDoc = new Order({
      orderId,
      customer: {
        name: payload.customer.name,
        email: payload.customer.email,
        phone: payload.customer.phone || "",
        address: payload.customer.address || ""
      },
      items: payload.items.map((it) => ({
        id: it.id || it.productId || `prod-${Date.now()}`,
        productId: it.productId || null,
        name: it.name,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || it.qty || 1),
        unit: it.unit,
        image: it.image
      })),
      subtotal,
      discount,
      shipping,
      tax,
      total,
      payment_method: payload.payment_method || payload.paymentMethod || "unknown",
      metadata: payload.metadata || {}
    });

    const saved = await orderDoc.save();
    return res.status(201).json({ id: saved.orderId, message: "Order saved", order: saved });
  } catch (err) {
    console.error("orders create error:", err);
    if (err.name === "ValidationError") {
      const details = Object.values(err.errors).map(e => ({ path: e.path, message: e.message }));
      return res.status(400).json({ error: "Validation failed", details });
    }
    if (err.code === 11000) return res.status(409).json({ error: "Duplicate key", info: err.keyValue });
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const email = req.query.email;
    const query = email ? { "customer.email": email } : {};
    const list = await Order.find(query).sort({ createdAt: -1 }).lean();
    return res.json(list);
  } catch (err) {
    console.error("orders fetch error:", err);
    return res.status(500).json({ error: "Could not fetch orders" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).lean();
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  } catch (err) {
    console.error("orders get error:", err);
    return res.status(500).json({ error: "Could not fetch order" });
  }
});

export default router;
