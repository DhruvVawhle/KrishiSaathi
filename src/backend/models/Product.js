import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  farmerId: {
    type: String,
    required: true,
    index: true
  },
  farmerName: { type: String, default: '' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  unit: { type: String, default: 'kg' },
  priceUnit: { type: String, default: 'kg' },
  quantity: { type: Number, default: 0 },
  category: { type: String, required: true },
  image: { type: String, default: '' },
  grade: { type: String, default: 'local' },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { 
  timestamps: true 
})

// Compound index for fast queries
productSchema.index({
  farmerId: 1,
  isPublished: 1
})
productSchema.index({
  category: 1,
  isPublished: 1
})

// Auto update handled by { timestamps: true }

export default mongoose.model(
  'Product', productSchema
)
