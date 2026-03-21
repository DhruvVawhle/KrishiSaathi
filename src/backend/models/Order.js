// src/backend/models/Order.js
import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: false, default: '' },
  name:      { type: String, required: true },
  price:     { type: Number, required: true, min: 0 },
  qty:       { type: Number, required: true, min: 1, default: 1 },
  image:     { type: String, required: false, default: '' },
  farmerId:  { type: String, required: false, default: 'demo' },
  category:  { type: String, required: false, default: '' },
  unit:      { type: String, required: false, default: 'kg' }
}, { _id: false });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: String
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  buyerId: {
    type: String,
    required: true,
    index: true
  },
  buyerName: { type: String, default: '' },
  buyerEmail: { type: String, default: '' },
  items: [
    {
      productId: { type: String, default: '' },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      qty: { type: Number, default: 1 },
      image: { type: String, default: '' },
      farmerId: { type: String, default: '' },
      category: { type: String, default: '' },
      unit: { type: String, default: 'kg' }
    }
  ],
  total: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  deliveryFee: { type: Number, default: 40 },
  discount: { type: Number, default: 0 },
  deliveryAddress: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  paymentMethod: {
    type: String,
    default: 'cod'
  },
  status: {
    type: String,
    enum: [
      'confirmed', 'preparing',
      'dispatched', 'delivered',
      'cancelled'
    ],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
})

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
