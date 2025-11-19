// ✅ src/backend/ordersServer.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

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

/* --------------------------------------------------------
   ✅ Test route
---------------------------------------------------------*/
app.get("/", (_, res) =>
  res.send("🚀 KrishiSaathi Orders API is running successfully!")
);

/* --------------------------------------------------------
   ✅ Create New Order (improved error reporting)
---------------------------------------------------------*/
app.post("/api/orders", async (req, res) => {
  try {
    console.log("📥 RECEIVED PAYLOAD:");
    console.dir(req.body, { depth: null });

    const payload = req.body;

    if (!payload || !Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: "❌ items[] required" });
    }

    if (!payload.customer?.name || !payload.customer?.email) {
      return res
        .status(400)
        .json({ error: "❌ customer.name & customer.email required" });
    }

    // Compute totals (fallback to computed if not provided)
    const subtotal =
      Number(payload.subtotal) ||
      payload.items.reduce(
        (sum, it) =>
          sum + Number(it.price || 0) * Number(it.quantity || it.qty || 1),
        0
      );

    const discount = Number(payload.discount || 0);
    const shipping = Number(payload.shipping || 0);
    const tax = Number(payload.tax || 0);
    const total =
      Number(payload.total) || Math.max(0, subtotal - discount + shipping + tax);

    const orderId = `KS-${Date.now()}`;

    const orderDoc = new Order({
      orderId,
      customer: {
        name: payload.customer.name,
        email: payload.customer.email,
        phone: payload.customer.phone || "",
        address: payload.customer.address || "",
      },
      items: payload.items.map((it) => ({
        id: it.id || it.productId || `prod-${Date.now()}`,
        productId: it.productId || null,
        name: it.name,
        price: Number(it.price || 0),
        quantity: Number(it.quantity || it.qty || 1),
        unit: it.unit,
        image: it.image,
      })),
      subtotal,
      discount,
      shipping,
      tax,
      total,
      payment_method: payload.payment_method || payload.paymentMethod || "unknown",
      metadata: payload.metadata || {},
    });

    const saved = await orderDoc.save();

    console.log("✅ ORDER SAVED TO DB:", saved.orderId);

    return res.status(201).json({
      id: saved.orderId,
      message: "✅ Order saved successfully!",
      order: saved,
    });
  } catch (err) {
    console.error("❌ SAVE ORDER ERROR (detailed):", err);

    // Mongoose validation error -> return details back to client
    if (err.name === "ValidationError") {
      const details = Object.values(err.errors).map((e) => ({
        path: e.path,
        message: e.message,
        kind: e.kind,
        value: e.value,
      }));
      return res.status(400).json({ error: "Validation failed", details });
    }

    // Mongo duplicate (unique) key error
    if (err.code === 11000) {
      return res.status(409).json({ error: "Duplicate key", info: err.keyValue || err.message });
    }

    return res.status(500).json({ error: err.message || "Internal server error" });
  }
});

/* --------------------------------------------------------
   ✅ Get Orders (list)
---------------------------------------------------------*/
app.get("/api/orders", async (_, res) => {
  try {
    const list = await Order.find({}).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error("❌ Get orders error:", err);
    res.status(500).json({ error: "Could not fetch orders" });
  }
});

/* --------------------------------------------------------
   ✅ Start server
---------------------------------------------------------*/
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`✅ Server running → http://localhost:${PORT}`)
  );
});
