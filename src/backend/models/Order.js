// src/backend/models/Order.js
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  id: String,
  productId: String,
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: String,
  image: String
}, { _id: false });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: String
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  customer: { type: CustomerSchema, required: true },
  items: { type: [OrderItemSchema], required: true },
  subtotal: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  shipping: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  payment_method: { type: String, default: "unknown" },
  status: { type: String, default: "received" },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
