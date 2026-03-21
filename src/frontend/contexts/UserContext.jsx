import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/frontend/config/firebaseConfig";
import * as hybridService from "../services/hybridService";

const UserContext = createContext({
  user: null,
  setUser: () => {},
  clearUser: () => {},
  isLoggedIn: false,
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);

  const saveUserToBothDatabases = async (firebaseUser, role = 'buyer') => {
    const userData = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName
        || firebaseUser.email?.split('@')[0]
        || 'User',
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      role: role,
      photoURL: firebaseUser.photoURL || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save to localStorage immediately
    localStorage.setItem('ks_user', JSON.stringify(userData))

    // Save to Firestore
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
      const { db } = await import('../config/firebaseConfig')
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
      
      // 🔥 CLEAR ALL CACHES & STORAGE
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear state
      setUser(null);
      setIsLoggedIn(false);
      setOrderHistory([]);

      console.log("Logout successful, navigating to login...");
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const clearUser = () => {
    setUser(null);
    setOrderHistory([]);
    localStorage.clear();
    sessionStorage.clear();
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
