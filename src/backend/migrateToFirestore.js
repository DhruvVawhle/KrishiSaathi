// src/backend/migrateToFirestore.js
import mongoose from 'mongoose';
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import User from './models/User.js';
import Product from './models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');

async function migrate() {
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('\n❌ ERROR: Service account key not found at:', serviceAccountPath);
    console.log('------------------------------------------------------------------');
    console.log('To run this migration, you need a Firebase Service Account JSON:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts.');
    console.log('2. Click "Generate new private key".');
    console.log('3. Save the file as "serviceAccountKey.json" in the project root.');
    console.log('------------------------------------------------------------------\n');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/krishi_saathi";
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Migrate Users
    console.log('\n👤 Migrating Users to Firestore...');
    const users = await User.find({});
    console.log(`   Found ${users.length} users in MongoDB.`);
    
    let userCount = 0;
    for (const u of users) {
      if (!u.uid) continue;
      const uObj = u.toObject();
      delete uObj._id;
      delete uObj.__v;

      await db.collection('users').doc(u.uid).set({
        ...uObj,
        migratedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      userCount++;
      if (userCount % 10 === 0) process.stdout.write('.');
    }
    console.log(`\n✅ ${userCount} Users migrated`);

    // 2. Migrate Products
    console.log('\n📦 Migrating Products to Firestore...');
    const products = await Product.find({});
    console.log(`   Found ${products.length} products in MongoDB.`);

    let productCount = 0;
    for (const p of products) {
      const pObj = p.toObject();
      const id = pObj._id.toString();
      delete pObj._id;
      delete pObj.__v;
      
      await db.collection('products').doc(id).set({
        ...pObj,
        id: id,
        migratedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      productCount++;
      if (productCount % 10 === 0) process.stdout.write('.');
    }
    console.log(`\n✅ ${productCount} Products migrated`);

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
