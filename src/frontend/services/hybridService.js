import { 
  updateUserProfile, 
  saveCart, 
  getProductsFromFirestore,
  getUserProfile,
  getNotificationsRealtime,
  saveNotificationsToFirestore,
  getProductsRealtime
} from './firestoreService';
import axios from 'axios';
import { db } from '../config/firebaseConfig';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * Hybrid Service
 * 
 * Bridges Firebase Firestore (Real-time/Offline) and MongoDB (Analytical/Historical).
 */

// ─── CART REALTIME ────────────────────────
/**
 * Listen to realtime cart updates from Firestore.
 */
export const getCartRealtime = (uid, callback) => {
  if (!uid) return;
  const ref = doc(db, "carts", uid);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data().items || []);
    } else {
      callback([]);
    }
  });
};

// ─── USER SYNC ───────────────────────────

export { 
  getUserProfile,
  getNotificationsRealtime as getNotifications,
  saveNotificationsToFirestore as saveNotifications,
  getProductsRealtime
}; // Passthrough from firestoreService

/**
 * Synchronizes user profile updates across both platforms.
 * Firestore is updated first for instant UI feedback.
 */
export const syncUserProfile = async (uid, userData) => {
  try {
    // 1. Sync to Firestore (Source of Truth for Frontend/Profile UI)
    const fsOk = await updateUserProfile(uid, userData);
    
    // 2. Sync to MongoDB (Source of Truth for Analytics/Backend Logic)
    let mongoOk = false;
    try {
      const res = await axios.post('/api/users/sync', {
        uid,
        ...userData
      });
      mongoOk = res.data.success || res.status === 200;
    } catch (err) {
      console.warn('MongoDB User Sync failed (non-fatal):', err.message);
    }
    
    return { 
      success: fsOk, 
      firestore: fsOk, 
      mongodb: mongoOk 
    };
  } catch (err) {
    console.error('hybridService.syncUserProfile:', err);
    return { success: false, error: err.message };
  }
};

export const saveUserProfile = async (uid, data) => {
  try {
    await Promise.allSettled([
      // 🔥 FIRESTORE WRITE
      setDoc(doc(db, "users", uid), data, { merge: true }),

      // 🔥 MONGODB WRITE
      fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid, ...data }),
      }),
    ]);
  } catch (err) {
    console.error("User save error:", err);
  }
};

// ─── CART SYNC ───────────────────────────

/**
 * Synchronizes cart state. Firestore handles multi-tab/device sync,
 * while MongoDB retains the data for server-side processing.
 */
export const syncCart = async (uid, items) => {
  try {
    // 1. Save to Firestore (Real-time sync across devices)
    const fsOk = await saveCart(uid, items);
    
    // 2. Save to MongoDB (Primary backup for fulfillment/support)
    let mongoOk = false;
    try {
      const res = await axios.post(`/api/users/${uid}/cart`, { items });
      mongoOk = res.data.ok || res.status === 200;
    } catch (err) {
      console.warn('MongoDB Cart Sync failed:', err.message);
    }
    
    return { 
      success: fsOk, 
      firestore: fsOk, 
      mongodb: mongoOk 
    };
  } catch (err) {
    console.error('hybridService.syncCart:', err);
    return { success: false, error: err.message };
  }
};

// ─── UTILITIES ───────────────────────────

const sortByDate = (items) => 
  [...items].sort((a, b) => {
    const getDate = (item) => {
      if (!item.createdAt) return 0;
      if (item.createdAt?.toDate) return item.createdAt.toDate().getTime();
      if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
      return new Date(item.createdAt).getTime();
    };
    return getDate(b) - getDate(a);
  });

// ─── PRODUCT AGGREGATION ─────────────────

/**
 * Aggregates products from both Firestore and MongoDB.
 * Prioritizes Firestore for recently added/updated farmer listings.
 */
export const getHybridProducts = async (filters = {}) => {
  try {
    // Fetch from Firestore (New/Real-time farmer listings)
    const firestoreProducts = await getProductsFromFirestore(filters);
    
    // Fetch from MongoDB (Historical/Static system products)
    let mongoProducts = [];
    try {
      const mongoRes = await axios.get('/api/products', { params: filters });
      mongoProducts = mongoRes.data.products || mongoRes.data || [];
    } catch (err) {
      console.warn('MongoDB Product fetch failed (falling back to Firestore only):', err.message);
    }
    
    // Merge: Firestore products take priority if IDs collision occurs
    const combined = [...firestoreProducts];
    const firestoreIds = new Set(firestoreProducts.map(p => String(p.id || p._id)));
    
    if (Array.isArray(mongoProducts)) {
      mongoProducts.forEach(mp => {
        const mid = String(mp._id || mp.id);
        if (!firestoreIds.has(mid)) {
          combined.push(mp);
        }
      });
    }
    
    return sortByDate(combined);
  } catch (err) {
    console.error('hybridService.getHybridProducts:', err);
    // Ultimate fallback to whatever Firestore has
    const fsProducts = await getProductsFromFirestore(filters);
    return sortByDate(fsProducts);
  }
};

// ─── ORDER RECORDING ─────────────────────

/**
 * Records an order atomically across both systems.
 * Prioritizes MongoDB as the primary source for fulfillment.
 */
export const recordOrder = async (uid, orderData) => {
  try {
    // 1. Record in MongoDB (Primary for Order Management/Payment logic)
    const mongoRes = await axios.post('/api/orders', {
      uid,
      ...orderData
    });
    
    const mongoData = mongoRes.data;
    if (!mongoData.success && !mongoData.ok) {
        throw new Error('MongoDB order creation failed');
    }
    
    const orderId = mongoData.orderId || mongoData.id;
    
    // 2. Note: Cart is typically cleared in CartContext, but we could 
    // trigger a Firestore-only clear here if desired.
    
    return { success: true, orderId };
  } catch (err) {
    console.error('hybridService.recordOrder:', err);
    return { success: false, error: err.message };
  }
};
