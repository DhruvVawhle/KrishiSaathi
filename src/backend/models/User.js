// src/backend/models/User.js
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: String },
  name: { type: String, default: "" },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  unit: { type: String, default: "" },
  image: { type: String, default: "" }
}, { _id: false });

const orderRefSchema = new mongoose.Schema({
  orderId: String,
  totalAmount: Number,
  createdAt: Date
}, { _id: false });

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
  orderHistory: { type: [orderRefSchema], default: [] }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
