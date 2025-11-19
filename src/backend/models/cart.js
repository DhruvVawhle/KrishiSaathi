// models/Cart.js
import mongoose from "mongoose";

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        unit: String,
        image: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", CartSchema);
