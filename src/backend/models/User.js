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
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    default: 'User'
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['buyer', 'farmer', 'admin'],
    default: 'buyer'
  },
  photoURL: {
    type: String,
    default: ''
  },
  farmName: {
    type: String, default: ''
  },
  farmLocation: {
    type: String, default: ''
  },
  farmSize: {
    type: String, default: ''
  },
  farmSizeUnit: {
    type: String, default: 'acres'
  },
  primaryCrops: {
    type: String, default: ''
  },
  experience: {
    type: String, default: ''
  },
  bio: {
    type: String, default: ''
  },
  state: {
    type: String, default: ''
  },
  district: {
    type: String, default: ''
  },
  pincode: {
    type: String, default: ''
  },
  upiId: {
    type: String, default: ''
  },
  bankName: {
    type: String, default: ''
  },
  accountNumber: {
    type: String, default: ''
  },
  ifscCode: {
    type: String, default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.models.User || mongoose.model("User", userSchema);
