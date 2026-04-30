import {
  doc, getDoc, setDoc,
  updateDoc, deleteDoc,
  collection, query, where,
  limit, getDocs,
  onSnapshot, addDoc,
  serverTimestamp
} from 'firebase/firestore'
import { db } from '../config/firebaseConfig'

// ─── USER PROFILE ────────────────────────

export const createUserProfile = async (
  uid, userData
) => {
  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        uid,
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        role: userData.role || 'buyer',
        photoURL: userData.photoURL || '',
        address: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
    console.log('✅ User profile → Firestore')
    return true
  } catch (err) {
    console.error('createUserProfile:', err)
    return false
  }
}

export const getUserProfile = async (uid) => {
  try {
    const snap = await getDoc(
      doc(db, 'users', uid)
    )
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() }
    }
    return null
  } catch (err) {
    console.error('getUserProfile:', err)
    return null
  }
}

export const updateUserProfile = async (
  uid, updates
) => {
  try {
    await updateDoc(
      doc(db, 'users', uid),
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    )
    return true
  } catch (err) {
    console.error('updateUserProfile:', err)
    return false
  }
}

// ─── CART (REALTIME) ─────────────────────

export const getCartRealtime = (
  uid, callback
) => {
  return onSnapshot(
    doc(db, 'carts', uid),
    (snap) => {
      if (snap.exists()) {
        callback(snap.data().items || [])
      } else {
        callback([])
      }
    },
    (err) => {
      console.error('Cart realtime:', err)
      callback([])
    }
  )
}

export const saveCart = async (uid, items) => {
  try {
    await setDoc(
      doc(db, 'carts', uid),
      {
        uid,
        items,
        updatedAt: serverTimestamp()
      }
    )
    return true
  } catch (err) {
    console.error('saveCart:', err)
    return false
  }
}

export const clearCartFirestore = async (
  uid
) => {
  try {
    await setDoc(
      doc(db, 'carts', uid),
      {
        uid,
        items: [],
        updatedAt: serverTimestamp()
      }
    )
    return true
  } catch (err) {
    console.error('clearCart:', err)
    return false
  }
}

// ─── PRODUCTS ────────────────────────────

export const addProductToFirestore = async (
  productData
) => {
  try {
    const docRef = await addDoc(
      collection(db, 'products'),
      {
        ...productData,
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    )
    console.log('✅ Product → Firestore:', docRef.id)
    return { id: docRef.id, ...productData }
  } catch (err) {
    console.error('addProduct:', err)
    throw err
  }
}

export const getProductsFromFirestore = async (
  filters = {}
) => {
  try {
    const constraints = [
      where('isPublished', '==', true),
      limit(filters.limit || 100)
    ]

    if (filters.category &&
        filters.category !== 'all' && filters.category !== 'All') {
      constraints.unshift(
        where('category', '==', filters.category)
      )
    }

    const snap = await getDocs(
      query(
        collection(db, 'products'),
        ...constraints
      )
    )
    return snap.docs.map(d => ({
      id: d.id,
      _id: d.id,
      ...d.data()
    }))
  } catch (err) {
    console.warn('getProducts (Firestore):', err.message)
    return []
  }
}

export const getFarmerProductsFromFirestore = async (
  farmerId
) => {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'products'),
        where('farmerId', '==', farmerId)
      )
    )
    return snap.docs.map(d => ({
      id: d.id,
      _id: d.id,
      ...d.data()
    }))
  } catch (err) {
    console.warn('getFarmerProducts (Firestore):', err.message)
    return []
  }
}

export const getProductsRealtime = (
  callback
) => {
  return onSnapshot(
    query(
      collection(db, 'products'),
      where('isPublished', '==', true),
      // orderBy('createdAt', 'desc'),
      limit(100)
    ),
    (snap) => {
      const products = snap.docs.map(d => ({
        id: d.id,
        _id: d.id,
        ...d.data()
      }))
      callback(products)
    },
    (err) => {
      console.warn('Products realtime:', err.message)
      callback([])
    }
  )
}

export const updateProductInFirestore = async (
  productId, updates
) => {
  try {
    await updateDoc(
      doc(db, 'products', productId),
      {
        ...updates,
        updatedAt: serverTimestamp()
      }
    )
    return true
  } catch (err) {
    console.error('updateProduct:', err)
    return false
  }
}

export const deleteProductFromFirestore = async (
  productId
) => {
  try {
    await deleteDoc(
      doc(db, 'products', productId)
    )
    return true
  } catch (err) {
    console.error('deleteProduct:', err)
    return false
  }
}

export const toggleProductPublishFirestore = async (
  productId, currentStatus
) => {
  try {
    await updateDoc(
      doc(db, 'products', productId),
      {
        isPublished: !currentStatus,
        updatedAt: serverTimestamp()
      }
    )
    return !currentStatus
  } catch (err) {
    console.error('togglePublish:', err)
    return currentStatus
  }
}

// ─── NOTIFICATIONS ───────────────────────

export const saveNotificationsToFirestore = async (
  uid, notifications
) => {
  try {
    await setDoc(
      doc(db, 'notifications', uid),
      {
        uid,
        items: notifications,
        updatedAt: serverTimestamp()
      }
    )
    return true
  } catch (err) {
    console.error('saveNotifications:', err)
    return false
  }
}

export const getNotificationsFromFirestore = async (
  uid
) => {
  try {
    const snap = await getDoc(
      doc(db, 'notifications', uid)
    )
    if (snap.exists()) {
      return snap.data().items || []
    }
    return null
  } catch (err) {
    console.error('getNotifications:', err)
    return null
  }
}

export const getNotificationsRealtime = (uid, callback) => {
  return onSnapshot(doc(db, 'notifications', uid), (snap) => {
    if (snap.exists()) {
      callback(snap.data().items || [])
    } else {
      callback([])
    }
  }, (err) => {
    console.warn('Notifications realtime:', err.message)
    callback([])
  })
}
