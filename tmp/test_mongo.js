import mongoose from 'mongoose';
import Product from '../src/backend/models/Product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/krishisaathi';

async function test() {
  try {
    console.log('Connecting to...', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected');

    const p = new Product({
      farmerId: 'test-farmer-' + Date.now(),
      name: 'Test Product ' + Date.now(),
      price: 15,
      category: 'Vegetables'
    });

    await p.save();
    console.log('✅ Product saved successfully:', p._id);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

test();
