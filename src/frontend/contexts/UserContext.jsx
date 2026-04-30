import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/frontend/config/firebaseConfig";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
// hybridService available for future use

const UserContext = createContext({
  user: null,
  setUser: () => {},
  clearUser: () => {},
  isLoggedIn: false,
  handleLogout: async () => {},
  orderHistory: [],
  setOrderHistory: () => {}
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);

  const saveUserToBothDatabases = async (firebaseUser, role) => {
    // Preserve existing role if not explicitly provided
    const stored = localStorage.getItem('ks_user');
    let currentRole = role;
    
    if (!currentRole && stored) {
      try {
        const parsed = JSON.parse(stored);
        const ALLOWED_ROLES = ['buyer', 'farmer', 'seller', 'admin'];
        
        // Validate UID match and Role whitelist
        if (parsed && parsed.uid === firebaseUser.uid && ALLOWED_ROLES.includes(parsed.role)) {
          currentRole = parsed.role;
        } else {
          console.warn("Invalid user data in storage:", { 
            uidMatch: parsed?.uid === firebaseUser.uid, 
            roleValid: ALLOWED_ROLES.includes(parsed?.role) 
          });
        }
      } catch (e) {
        console.error("Error parsing stored user data:", e, "Stored value:", stored);
      }
    }
    
    if (!currentRole) currentRole = 'buyer';

    const userData = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName
        || firebaseUser.email?.split('@')[0]
        || 'User',
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      role: currentRole,
      photoURL: firebaseUser.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save to localStorage immediately
    localStorage.setItem('ks_user', JSON.stringify(userData))

    // Save to Firestore
    try {
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          ...userData,
          updatedAt: serverTimestamp()
        },
        { merge: true }
      )
      console.log('✅ User → Firestore')
    } catch (err) {
      console.warn('Firestore user save:', err.message)
    }

    // Save to MongoDB
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })
      if (res.ok) {
        console.log('✅ User → MongoDB')
      } else {
        const errData = await res.json()
        console.warn('MongoDB user save:', errData.message)
      }
    } catch (err) {
      console.warn('MongoDB user save:', err.message)
    }

    return userData
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // 🔥 CLEAR OLD STATE
        setUser(null)
        setIsLoggedIn(false)
        localStorage.removeItem('ks_user')
        return
      }

      try {
        // 🔥 SYNC TO BOTH DATABASES
        const userData = await saveUserToBothDatabases(firebaseUser)
        setUser(userData)
        setIsLoggedIn(true)
      } catch (err) {
        console.error('Auth sync error:', err)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth);
      
      // 🔥 TARGETED STORAGE CLEANUP
      localStorage.removeItem('ks_user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      sessionStorage.removeItem('ks_cart_draft');
      
      // Clear state
      setUser(null);
      setIsLoggedIn(false);
      setOrderHistory([]);

      console.log("Logout successful, handling redirection...");
      const path = window.location.pathname;
      if (path.includes('dashboard') || path.includes('profile') || path.includes('checkout')) {
        window.location.href = "/";
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const clearUser = () => {
    setUser(null);
    setIsLoggedIn(false);
    setOrderHistory([]);
    localStorage.removeItem('ks_user');
    localStorage.removeItem('isLoggedIn');
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      clearUser, 
      isLoggedIn, 
      handleLogout, 
      orderHistory, 
      setOrderHistory 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
