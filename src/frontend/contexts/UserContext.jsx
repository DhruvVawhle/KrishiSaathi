import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const UserContext = createContext({
  user: null,
  setUser: () => {},
  clearUser: () => {},
});

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ks_user");
      if (raw) setUserState(JSON.parse(raw));
    } catch (err) {
      console.warn("Failed to read user from localStorage", err);
    }
  }, []);

  // Listen to Firebase auth changes and load/clear server-side profile
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          // load fresh profile from server when a user signs in
          await loadUserFromServer(u.uid);
          // notify other parts of the app that a user signed in
          try { window.dispatchEvent(new CustomEvent("ks:user-login", { detail: { uid: u.uid } })); } catch (e) {}
        } else {
          // signed out: clear local user and notify listeners
          clearUser();
          try { window.dispatchEvent(new CustomEvent("ks:user-logout")); } catch (e) {}
        }
      } catch (err) {
        console.warn("onAuthStateChanged handler error", err);
      }
    });
    return () => unsub();
  }, []);

  const setUser = (u) => {
    setUserState(u);
    try {
      localStorage.setItem("ks_user", JSON.stringify(u));
    } catch (err) {
      console.warn("Failed to save user to localStorage", err);
    }
  };

  // Fetch fresh user profile from backend and store it
  const loadUserFromServer = async (uid) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken(true) : null;
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await fetch(`${import.meta.env.VITE_USER_SERVER_URL || "http://localhost:5002"}/api/users/${encodeURIComponent(
        uid
      )}`, { headers });
      if (!resp.ok) {
        console.warn("loadUserFromServer failed", resp.status);
        return null;
      }
      const data = await resp.json().catch(() => null);
      if (data) {
        if (data.user) setUser(data.user);
        if (Array.isArray(data.orderHistory)) setOrderHistory(data.orderHistory || []);
        return data.user || null;
      }
    } catch (err) {
      console.warn("loadUserFromServer error", err);
    }
    return null;
  };

  const clearUser = () => {
    setUserState(null);
    setOrderHistory([]);
    try {
      localStorage.removeItem("ks_user");
    } catch (err) {
      console.warn("Failed to remove user from localStorage", err);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, clearUser, loadUserFromServer, orderHistory, setOrderHistory }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
