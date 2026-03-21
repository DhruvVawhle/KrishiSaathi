import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  User,
  Search as SearchIcon,
  Bell,
  BellOff,
  Package,
  XCircle,
  CreditCard,
  Tag,
  AlertTriangle,
  Sprout,
  Star,
  Leaf,
  ShoppingBag,
  Settings,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import { useCart } from "@/frontend/contexts/CartContext";
import {
  getNotificationsRealtime,
  saveNotificationsToFirestore
} from '../services/firestoreService';
import { toast } from 'react-toastify';

// ─── Config ───
// ─── Role-aware nav links ───
const getRoleNavLinks = (role) => {
  if (role === 'farmer') return [
    { name: "Dashboard",    to: "/dashboard/farmer" },
    { name: "My Products",  to: "/add-product" },
    { name: "Market Rates", to: "/mandi-rates" },
    { name: "About",        to: "/about" },
    { name: "Contact",      to: "/contact" },
  ];
  if (role === 'buyer') return [
    { name: "Home",        to: "/home" },
    { name: "Marketplace", to: "/marketplace" },
    { name: "My Orders",   to: "/orderhistory" },
    { name: "About",       to: "/about" },
    { name: "Contact",     to: "/contact" },
  ];
  // guest
  return [
    { name: "Home",        to: "/home" },
    { name: "Marketplace", to: "/marketplace" },
    { name: "About",       to: "/about" },
    { name: "Contact",     to: "/contact" },
    { name: "Support",     to: "/support" },
  ];
};

const PRODUCTS_SEARCH_URL =
  import.meta.env.VITE_PRODUCTS_API || "/api/products/search";

const font = "'DM Sans', system-ui, sans-serif";

/* ─── Availability helper ─── */
const detectAvailability = (p = {}) => {
  if (typeof p.available === "boolean") return p.available;
  if (typeof p.isAvailable === "boolean") return p.isAvailable;
  if (typeof p.available === "string") {
    const v = p.available.toLowerCase();
    if (["true", "yes"].includes(v)) return true;
    if (["false", "no"].includes(v)) return false;
  }
  const stockFields = [
    "inStock", "stock", "countInStock", "qty", "quantity",
    "availableQty", "availableQuantity", "quantityAvailable",
  ];
  for (const f of stockFields) {
    if (p[f] !== undefined && p[f] !== null) {
      const n = Number(p[f]);
      if (!Number.isNaN(n)) return n > 0;
    }
  }
  if (p.status && typeof p.status === "string") {
    const st = p.status.toLowerCase();
    if (st.includes("out") || st.includes("sold")) return false;
    if (st.includes("in") || st.includes("available")) return true;
  }
  return true;
};

// Storage Helpers
const NOTIF_KEY = (uid) => `ks_notifications_${uid}`;

const FIRST_LOGIN_KEY = (uid) => `ks_first_login_${uid}`;

const loadNotifications = (uid) => {
  try {
    const raw = localStorage.getItem(NOTIF_KEY(uid));
    if (!raw) return null;
    return JSON.parse(raw).map(n => ({
      ...n,
      time: (() => {
        const t = n.time
        if (!t) return new Date()
        if (t?.toDate) return t.toDate()
        if (t?.seconds) return new Date(t.seconds * 1000)
        if (typeof t === 'string' || typeof t === 'number') return new Date(t)
        return new Date()
      })()
    }));
  } catch { return null; }
};

const saveNotifications = (uid, notifs) => {
  try {
    localStorage.setItem(
      NOTIF_KEY(uid),
      JSON.stringify(notifs)
    );
  } catch {}
};

const getBuyerStarters = (user) => {
  const now = new Date();
  return [
    {
      id: `welcome_${user.uid}`,
      type: 'welcome',
      title: `Welcome, ${user.name || 'there'}! 🌾`,
      body: 'Discover fresh produce from Indian farmers.',
      time: new Date(now - 0),
      read: false,
      userId: user.uid,
      actionUrl: '/marketplace'
    },
    {
      id: `promo_${user.uid}`,
      type: 'promo',
      title: 'Summer Fresh Sale — 15% Off 🎉',
      body: 'Use code FRESH15 at checkout.',
      time: new Date(now - 1000 * 60 * 5),
      read: false,
      userId: user.uid,
      actionUrl: '/marketplace'
    },
    {
      id: `profile_${user.uid}`,
      type: 'system',
      title: 'Complete Your Profile',
      body: 'Add delivery address for faster checkout.',
      time: new Date(now - 1000 * 60 * 30),
      read: false,
      userId: user.uid,
      actionUrl: '/profile'
    },
    {
      id: `arrivals_${user.uid}`,
      type: 'new_product',
      title: 'Fresh Arrivals This Week 🥦',
      body: 'Organic vegetables just listed.',
      time: new Date(now - 1000 * 60 * 60 * 2),
      read: true,
      userId: user.uid,
      actionUrl: '/marketplace'
    },
    {
      id: `delivery_${user.uid}`,
      type: 'system',
      title: 'Free Delivery Above ₹499',
      body: 'Shop more, save more on every order.',
      time: new Date(now - 1000 * 60 * 60 * 24),
      read: true,
      userId: user.uid,
      actionUrl: '/marketplace'
    }
  ];
};

const getFarmerStarters = (user) => {
  const now = new Date();
  return [
    {
      id: `welcome_${user.uid}`,
      type: 'welcome',
      title: `Welcome, Farmer ${user.name || 'there'}! 🌱`,
      body: 'Start listing produce and reach buyers directly.',
      time: new Date(now - 0),
      read: false,
      userId: user.uid,
      actionUrl: '/dashboard/farmer'
    },
    {
      id: `profile_${user.uid}`,
      type: 'system',
      title: 'Complete Your Farm Profile',
      body: 'Add farm details to build buyer trust.',
      time: new Date(now - 1000 * 60 * 10),
      read: false,
      userId: user.uid,
      actionUrl: '/dashboard/farmer'
    },
    {
      id: `list_${user.uid}`,
      type: 'new_product',
      title: 'List Your First Product',
      body: 'Tap Add Product to start selling.',
      time: new Date(now - 1000 * 60 * 60),
      read: false,
      userId: user.uid,
      actionUrl: '/add-product'
    },
    {
      id: `payout_${user.uid}`,
      type: 'payment',
      title: 'How Payouts Work 💰',
      body: 'Earnings transferred within 3 business days.',
      time: new Date(now - 1000 * 60 * 60 * 3),
      read: true,
      userId: user.uid,
      actionUrl: '/dashboard/farmer'
    },
    {
      id: `tip_${user.uid}`,
      type: 'system',
      title: 'Tip: Add Clear Photos',
      body: 'Products with photos sell 3x faster.',
      time: new Date(now - 1000 * 60 * 60 * 24),
      read: true,
      userId: user.uid,
      actionUrl: '/add-product'
    }
  ];
};

const NOTIF_CONFIG = {
  order_placed:    { icon: ShoppingBag,   color: '#2D4F1E' },
  order_delivered: { icon: Package,       color: '#4CAF50' },
  order_cancelled: { icon: XCircle,       color: '#FF5252' },
  payment:         { icon: CreditCard,    color: '#F0A080' },
  promo:           { icon: Tag,           color: '#E27D60' },
  low_stock:       { icon: AlertTriangle, color: '#E27D60' },
  new_product:     { icon: Leaf,          color: '#4A7A35' },
  system:          { icon: Bell,          color: '#7A7A7A' },
  farmer_review:   { icon: Star,          color: '#F5A623' },
  welcome:         { icon: Leaf,          color: '#2D4F1E' },
};

/* ═══════════════════════════════════════════ */
/*            NAVBAR COMPONENT                 */
/* ═══════════════════════════════════════════ */

const Navbar = ({ onOpenCart }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Cart
  const cartContext = useCart() || {};
  const { cart = [], addToCart: contextAddToCart } = cartContext;
  const cartCount = Array.isArray(cart)
    ? cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    : 0;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState(null);
  const [localProducts, setLocalProducts] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Auth State Setup (Simulated Auth Context)
  const storedUserRaw = localStorage.getItem("krishisaathi_user");
  const storedRole = localStorage.getItem("userRole");
  const [user, setUser] = useState(
    storedUserRaw ? JSON.parse(storedUserRaw) : (isLoggedIn ? {
      id: "user_" + (userEmail || "anonymous"),
      name: userEmail ? userEmail.split("@")[0] : "Demo",
      email: userEmail || "demo@example.com",
      role: storedRole || "buyer",
    } : null)
  );

  // Re-sync user on prop/storage changes
  useEffect(() => {
    if (isLoggedIn) {
      if (!user || user.email !== userEmail) {
        setUser({
          id: "user_" + (userEmail || "anonymous"),
          name: userEmail ? userEmail.split("@")[0] : "Demo",
          email: userEmail || "demo@example.com",
          role: localStorage.getItem("userRole") || "buyer",
        });
      }
    } else {
      setUser(null);
    }
  }, [isLoggedIn, userEmail]);

  const mobileRef = useRef(null);
  const profileRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

    // ── Notification State ──
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [initialized, setInitialized] = useState(false);
  const prevUserRef = useRef(null);
  const notifPanelRef = useRef(null);
  const bellRef = useRef(null);

  // Get user from Firebase + localStorage
  const notifUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem('ks_user')
      ) || null;
    } catch { return null; }
  })();

  // Use Firebase uid as identifier
  const userId = notifUser?.uid || null;
  const notifIsLoggedIn = !!userId;

  // MAIN EFFECT — login/logout/switch (Firestore Realtime)
  useEffect(() => {
    let unsubNotifs = null;
    
    if (!notifIsLoggedIn || !userId) {
      setNotifications([]);
      setNotifOpen(false);
      setInitialized(false);
      prevUserRef.current = null;
      return;
    }

    if (initialized && prevUserRef.current === userId) return;
    
    prevUserRef.current = userId;

    // Listen to Firestore
    unsubNotifs = getNotificationsRealtime(userId, (items) => {
      if (items.length === 0) {
        // First time or empty — check if we should add starters
        const isFirst = !localStorage.getItem(FIRST_LOGIN_KEY(userId));
        if (isFirst) {
          const starters = notifUser?.role === 'farmer'
            ? getFarmerStarters(notifUser)
            : getBuyerStarters(notifUser);
          setNotifications(starters);
          saveNotificationsToFirestore(userId, starters);
          localStorage.setItem(FIRST_LOGIN_KEY(userId), 'done');
        } else {
          setNotifications([]);
        }
      } else {
        setNotifications(items);
      }
      setInitialized(true);
    });

    return () => {
      if (unsubNotifs) unsubNotifs();
    };
  }, [notifIsLoggedIn, userId, initialized]);

  // FIX 4: CHECK RECENT ORDER STATUS ON LOGIN
  useEffect(() => {
    if (!userId || !notifIsLoggedIn) return;

    const checkRecentOrderStatus = async () => {
      try {
        const token = localStorage.getItem('idToken') || localStorage.getItem('ks_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await axios.get(`/api/orders/user/${userId}`, { headers });
        const data = res.data;
        const orders = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
        if (orders.length === 0) return;

        // Sort by date to get the most recent
        const latestOrder = [...orders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const lastStatusKey = `ks_last_order_status_${userId}`;
        const prevStatus = localStorage.getItem(lastStatusKey);

        if (prevStatus && prevStatus.toLowerCase() !== latestOrder.status?.toLowerCase()) {
          // Status changed! Notify user.
          toast.info(
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Order Update! 📦</div>
              <div style={{ fontSize: 13 }}>Order #{latestOrder.orderId || latestOrder._id.slice(-6).toUpperCase()} is now <span style={{ color: '#E27D60', fontWeight: 800 }}>{latestOrder.status.toUpperCase()}</span></div>
            </div>, 
            {
              icon: '📦',
              toastId: `order_update_${latestOrder._id}`,
              position: "top-right",
              autoClose: 5000
            }
          );
        }
        
        localStorage.setItem(lastStatusKey, latestOrder.status);
      } catch (err) {
        console.warn("Failed to check recent order status:", err);
      }
    };

    // Small delay to let other things initialize
    const timer = setTimeout(checkRecentOrderStatus, 2000);
    return () => clearTimeout(timer);
  }, [userId, notifIsLoggedIn]);

  // SAVE EFFECT (Debounced wrapper for actions that modify notifications)
  const syncNotifs = useCallback((updated) => {
    if (!userId) return;
    saveNotificationsToFirestore(userId, updated);
  }, [userId]);

  // OUTSIDE CLICK + ESCAPE (REMOVED REDUNDANT — MAIN ONE IS AT LINE 700)

  // COMPUTED VALUES
  const unreadCount = notifications.filter(
    n => !n.read && n.userId === userId
  ).length;

  const tabs = notifUser?.role === 'farmer'
    ? ['All', 'Farm', 'Sales', 'System']
    : ['All', 'Orders', 'Promos', 'System'];

  const filteredNotifications = notifications
    .filter(n => n.userId === userId)
    .filter(n => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Orders')
        return ['order_placed',
          'order_delivered',
          'order_cancelled'].includes(n.type);
      if (activeTab === 'Promos')
        return n.type === 'promo';
      if (activeTab === 'Farm')
        return ['new_product',
          'low_stock',
          'farmer_review'].includes(n.type);
      if (activeTab === 'Sales')
        return ['order_placed',
          'payment'].includes(n.type);
      if (activeTab === 'System')
        return ['system',
          'welcome'].includes(n.type);
      return true;
    })
    .sort((a, b) =>
      new Date(b.time) - new Date(a.time)
    );

  // ACTIONS (Wrap with syncNotifs)
  const markRead = (id) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    syncNotifs(updated);
  };

  const markAllRead = () => {
    const updated = notifications.map(n =>
      n.userId === userId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    syncNotifs(updated);
  };

  const dismissNotif = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    syncNotifs(updated);
  };

  const clearAllRead = () => {
    const updated = notifications.filter(n =>
      n.userId === userId ? !n.read : true
    );
    setNotifications(updated);
    syncNotifs(updated);
  };

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
    setNotifOpen(false);
  };

  /* ── Notification Helpers ── */
  const formatNotifDate = (dateValue) => {
    if (!dateValue) return 'Just now';
    try {
      let date;
      if (dateValue?.toDate) {
        date = dateValue.toDate();
      } else if (dateValue?.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return 'Just now';
      }

      if (isNaN(date.getTime())) return 'Just now';

      const now = new Date();
      const diff = now - date;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: days > 365 ? 'numeric' : undefined
      });
    } catch {
      return 'Just now';
    }
  };

  const getHeaderName = () => {
    try {
      // PRIORITY ORDER:
      // 1. Real name from context
      // 2. Display name from Firebase
      // 3. Email prefix
      // 4. Role label

      // Try user context name
      if (user?.name &&
          user.name !== 'User' &&
          user.name !== 'Farmer' &&
          user.name.length > 1 &&
          // Skip if it looks like farm name
          // Farm names have "Farm" in them
          !user.name.toLowerCase()
            .includes('farm') &&
          !user.name.toLowerCase()
            .includes('agri') &&
          !user.name.toLowerCase()
            .includes('krishi')) {
        return user.name
      }

      // Try Firebase displayName
      if (user?.displayName &&
          user.displayName !== 'User' &&
          !user.displayName.toLowerCase()
            .includes('farm')) {
        return user.displayName
      }

      // Try localStorage
      try {
        const stored = JSON.parse(
          localStorage.getItem('ks_user')
          || 'null'
        )
        if (stored?.name &&
            stored.name !== 'User' &&
            !stored.name.toLowerCase()
              .includes('farm')) {
          return stored.name
        }
        // Use email prefix as fallback
        if (stored?.email) {
          const prefix =
            stored.email.split('@')[0]
          // Capitalize first letter
          return prefix.charAt(0)
            .toUpperCase()
            + prefix.slice(1)
        }
      } catch {}

      // Final fallback by role
      return user?.role === 'farmer'
        ? '🌾 Farmer'
        : '🛒 Buyer'

    } catch {
      return 'User'
    }
  }

  const getUserName = () => {
    return getHeaderName();
  };

  const checkIsLoggedIn = () => {
    if (isLoggedIn && user?.uid) return true;
    try {
      const stored = JSON.parse(localStorage.getItem('ks_user') || 'null');
      return !!(stored?.uid || stored?.id);
    } catch {
      return false;
    }
  };

  const actuallyLoggedIn = checkIsLoggedIn();

  // ─── Derive current role for nav/UI rendering ───
  const currentRole = (() => {
    try {
      const ksUser = JSON.parse(localStorage.getItem('ks_user') || 'null');
      return ksUser?.role || user?.role || storedRole || 'guest';
    } catch { return 'guest'; }
  })();
  const navLinks = getRoleNavLinks(actuallyLoggedIn ? currentRole : 'guest');

  // DATE GROUPING
  const groupByDate = (notifs) => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterday = new Date(
      today - 86400000
    );
    const thisWeek = new Date(
      today - 86400000 * 7
    );

    const groups = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': []
    };

    notifs.forEach(n => {
      const d = new Date(n.time);
      const day = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      );
      if (day >= today)
        groups['Today'].push(n);
      else if (day >= yesterday)
        groups['Yesterday'].push(n);
      else if (day >= thisWeek)
        groups['This Week'].push(n);
      else
        groups['Earlier'].push(n);
    });

    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0);
  };

  /* ── Notification CSS ── */
  useEffect(() => {
    if (!document.getElementById("unified-header-style")) {
      const style = document.createElement("style");
      style.id = "unified-header-style";
      style.innerHTML = `
        @keyframes bellShake {
          0% { transform: rotate(0deg) }
          15% { transform: rotate(12deg) }
          30% { transform: rotate(-10deg) }
          45% { transform: rotate(8deg) }
          60% { transform: rotate(-6deg) }
          75% { transform: rotate(4deg) }
          100% { transform: rotate(0deg) }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .notif-shimmer {
          background: linear-gradient(90deg, #EDD9B0 0%, #F5E6CC 50%, #EDD9B0 100%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .notif-custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .notif-custom-scroll::-webkit-scrollbar-track {
          background: #EDD9B0;
        }
        .notif-custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(45, 79, 30, 0.3);
          border-radius: 999px;
        }
        .notif-custom-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(45, 79, 30, 0.6);
        }
        .notif-item {
          transition: background 150ms;
        }
        .notif-item:hover {
          background: #F0F5EE !important;
        }
        .notif-dismiss-btn {
          opacity: 0;
        }
        .notif-dismiss-icon {
          color: #C0B8B0;
        }
        .notif-item:hover .notif-dismiss-btn {
          opacity: 1;
        }
        .notif-item:hover .notif-dismiss-btn:hover {
          background: #EDD9B0 !important;
        }
        .notif-item:hover .notif-dismiss-btn:hover .notif-dismiss-icon {
          color: #7A7A7A;
        }
        .notif-action-chip {
          display: inline-block;
          background: rgba(45, 79, 30, 0.08);
          border: 1px solid rgba(45, 79, 30, 0.15);
          font-family: 'DM Sans', sans-serif;
          font-weight: 600;
          font-size: 11px;
          color: #2D4F1E;
          border-radius: 999px;
          padding: 3px 9px;
          transition: all 150ms;
        }
        .notif-item:hover .notif-action-chip {
          background: #2D4F1E;
          color: white;
        }
        @media (max-width: 639px) {
          .notif-panel-mobile-fix {
            position: fixed !important;
            top: 70px !important;
            right: 8px !important;
            width: calc(100vw - 16px) !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  /* ─── Scroll detection for glassmorphism effect ─── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ─── Products broadcast ─── */
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (Array.isArray(window.__KS_PRODUCTS))
        setLocalProducts(window.__KS_PRODUCTS);
      const onProducts = (e) => {
        const payload = e?.detail ?? window.__KS_PRODUCTS ?? null;
        if (Array.isArray(payload)) setLocalProducts(payload);
      };
      window.addEventListener("ks:products", onProducts);
      return () => window.removeEventListener("ks:products", onProducts);
    }
  }, []);

  /* ─── Auth state ─── */
  useEffect(() => {
    const logged = localStorage.getItem("isLoggedIn") === "true";
    const email = localStorage.getItem("userEmail") || "";
    setIsLoggedIn(logged);
    setUserEmail(email);
    const onStorage = (e) => {
      if (["isLoggedIn", "userEmail"].includes(e.key)) {
        setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
        setUserEmail(localStorage.getItem("userEmail") || "");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ─── Close on outside click / Esc ─── */
  useEffect(() => {
    const onDocClick = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target))
        setMobileOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        e.target !== inputRef.current
      )
        setShowSuggestions(false);

      if (notifOpen && notifPanelRef.current && !notifPanelRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);
        setShowSuggestions(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

  /* ─── Search ─── */
  useEffect(() => {
    if (!query?.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = query.trim().toLowerCase();
    let cancelled = false;
    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        if (Array.isArray(localProducts) && localProducts.length > 0) {
          const matches = localProducts
            .map((p) => ({ ...p, __available: detectAvailability(p) }))
            .filter((p) => {
              const name = (p.name || p.title || "").toLowerCase();
              const cat = (p.category || p.subcategory || "").toLowerCase();
              return (
                name.includes(q) ||
                cat.includes(q) ||
                String(p._id || p.id || "").includes(q)
              );
            })
            .sort((a, b) =>
              a.__available === b.__available ? 0 : a.__available ? -1 : 1
            );
          if (!cancelled) {
            setSuggestions(matches);
            setShowSuggestions(true);
          }
          return;
        }
        const resp = await axios.get(
          `${PRODUCTS_SEARCH_URL}?q=${encodeURIComponent(q)}`
        );
        if (!cancelled) {
          const payload = Array.isArray(resp.data)
            ? resp.data
            : resp.data?.results || [];
          const annotated = payload.map((p) => ({
            ...p,
            __available: detectAvailability(p),
          }));
          annotated.sort((a, b) =>
            a.__available === b.__available ? 0 : a.__available ? -1 : 1
          );
          setSuggestions(annotated);
          setShowSuggestions(true);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, localProducts]);

  /* ─── Toast timeout ─── */
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(t);
  }, [message]);

  /* ─── Logout ─── */
  const handleLogout = () => {
    (async () => {
      setNotifOpen(false);
      try {
        const a = getAuth();
        await signOut(a);
      } catch { }
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      localStorage.removeItem("ks_user");
      setIsLoggedIn(false);
      setUserEmail("");
      try { window.dispatchEvent(new CustomEvent("ks:user-logout")); } catch { }
      toast.success("You've been logged out. See you soon! 👋", {
        toastId: 'logout',
        icon: '👋',
        style: {
          background: '#1a3a1a',
          color: '#ffffff',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.15)',
          fontFamily: 'inherit',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          minWidth: '280px',
        },
        progressStyle: { background: '#c17a4a' },
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      });
      navigate("/login");
    })();
  };

  useEffect(() => {
    if (!actuallyLoggedIn) {
      setNotifOpen(false);
    }
  }, [actuallyLoggedIn]);

  const goSearch = (q) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/marketplace?q=${encodeURIComponent(trimmed)}`);
    else navigate("/marketplace");
    setQuery("");
    setShowSuggestions(false);
    try {
      if (typeof window !== "undefined")
        window.dispatchEvent(new CustomEvent("ks:search", { detail: trimmed }));
    } catch { }
  };

  /* ─── Add to cart ─── */
  const addToCart = async (product, qty = 1) => {
    if (!product) return;
    if (product.__available === false) {
      setMessage("Item not available");
      return;
    }
    const price = Number(product.price ?? product.mrp ?? product.unit_price ?? 0) || 0;
    const item = {
      productId: product._id || product.id || null,
      name: product.name || product.title || "",
      price,
      quantity: Number(qty || 1),
      total: Math.round(price * Number(qty || 1) * 100) / 100,
    };
    try {
      if (typeof contextAddToCart === "function") {
        await contextAddToCart(item);
      } else {
        const existing = JSON.parse(localStorage.getItem("cart") || "[]");
        const idx = existing.findIndex(
          (c) => String(c.productId) === String(item.productId)
        );
        if (idx >= 0) existing[idx].quantity += item.quantity;
        else existing.push(item);
        localStorage.setItem("cart", JSON.stringify(existing));
        window.dispatchEvent(new Event("cartUpdated"));
      }
      setMessage("Added to cart");
    } catch {
      setMessage("Failed to add to cart");
    }
  };

  const availableItems = suggestions.filter((s) => s.__available !== false);

  /* ════════════════════════════════════════ */
  /*               RENDER                     */
  /* ════════════════════════════════════════ */

  return (
    <div
      style={{
        fontFamily: font,
        width: "100%",
        transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
        background: scrolled
          ? "rgba(255,255,255,0.88)"
          : "linear-gradient(135deg, #1A2E12 0%, #2D4F1E 50%, #3D6B2A 100%)",
        backdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(0,0,0,0.06)"
          : "1px solid rgba(255,255,255,0.1)",
        boxShadow: scrolled
          ? "0 4px 24px rgba(0,0,0,0.06)"
          : "none",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "68px",
          }}
        >
          {/* ── Brand ── */}
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <img
              src="/krishisaathi.png"
              onError={(e) => {
                try {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://cdn-icons-png.flaticon.com/512/2909/2909758.png";
                } catch { }
              }}
              alt="KrishiSaathi"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                boxShadow: scrolled
                  ? "0 2px 8px rgba(0,0,0,0.08)"
                  : "0 2px 8px rgba(0,0,0,0.2)",
              }}
            />
            <span
              style={{
                fontWeight: 800,
                fontSize: "1.15rem",
                letterSpacing: "-0.02em",
                color: scrolled ? "#2D4F1E" : "#ffffff",
                transition: "color 350ms",
              }}
              className="hidden lg:inline"
            >
              KrishiSaathi
            </span>
          </button>

          {/* ── Search (desktop) ── */}
          <div className="flex-1 hidden md:flex justify-center px-6">
            <div style={{ width: "100%", maxWidth: "520px", position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: scrolled
                    ? "#f1f5f9"
                    : "rgba(255,255,255,0.15)",
                  borderRadius: "9999px",
                  border: searchFocused
                    ? scrolled
                      ? "1.5px solid #2D4F1E"
                      : "1.5px solid rgba(255,255,255,0.5)"
                    : scrolled
                      ? "1.5px solid #e2e8f0"
                      : "1.5px solid rgba(255,255,255,0.2)",
                  transition: "all 250ms ease",
                  boxShadow: searchFocused
                    ? scrolled
                      ? "0 0 0 4px rgba(45, 79, 30, 0.08)"
                      : "0 0 0 4px rgba(255,255,255,0.1)"
                    : "none",
                }}
              >
                <span
                  style={{
                    paddingLeft: "16px",
                    color: scrolled ? "#94a3b8" : "rgba(255,255,255,0.6)",
                    display: "flex",
                    transition: "color 250ms",
                  }}
                >
                  <SearchIcon size={17} />
                </span>
                <input
                  ref={inputRef}
                  type="search"
                  value={query}
                  onFocus={() => {
                    setSearchFocused(true);
                    if (suggestions?.length) setShowSuggestions(true);
                  }}
                  onBlur={() => setSearchFocused(false)}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goSearch(query)}
                  placeholder="Search produce..."
                  style={{
                    fontFamily: font,
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "10px 16px",
                    fontSize: "0.9rem",
                    color: scrolled ? "#0f172a" : "#ffffff",
                    transition: "color 250ms",
                  }}
                />
              </div>

              {/* Suggestions dropdown */}
              <div
                ref={suggestionsRef}
                style={{ position: "absolute", left: 0, right: 0, zIndex: 50, marginTop: "8px" }}
              >
                <AnimatePresence>
                  {showSuggestions &&
                    (loadingSuggestions || suggestions.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                          background: "rgba(255,255,255,0.96)",
                          backdropFilter: "blur(20px)",
                          borderRadius: "16px",
                          boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                          border: "1px solid rgba(0,0,0,0.06)",
                          overflow: "hidden",
                          maxHeight: "360px",
                          overflowY: "auto",
                        }}
                      >
                        {loadingSuggestions && (
                          <div
                            style={{
                              padding: "16px",
                              fontSize: "0.85rem",
                              color: "#64748b",
                            }}
                          >
                            Searching...
                          </div>
                        )}
                        {!loadingSuggestions && suggestions.length === 0 && (
                          <div
                            style={{
                              padding: "16px",
                              fontSize: "0.85rem",
                              color: "#94a3b8",
                              textAlign: "center",
                            }}
                          >
                            No results found
                          </div>
                        )}
                        {availableItems.map((p) => (
                          <div
                            key={p._id || p.id || p.name}
                            onClick={() => goSearch(p.name)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "12px",
                              padding: "10px 16px",
                              cursor: "pointer",
                              transition: "background 200ms",
                              borderBottom: "1px solid rgba(0,0,0,0.03)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(45,79,30,0.04)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              <img
                                src={
                                  p.image ||
                                  p.thumb ||
                                  "https://via.placeholder.com/48"
                                }
                                alt={p.name}
                                style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "10px",
                                  objectFit: "cover",
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: "0.9rem",
                                    color: "#0f172a",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {p.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#2D4F1E",
                                    fontWeight: 700,
                                  }}
                                >
                                  ₹{Number(p.price || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p, 1);
                              }}
                              style={{
                                fontFamily: font,
                                background:
                                  "linear-gradient(135deg, #E27D60, #F0A080)",
                                color: "white",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: "8px",
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                transition: "transform 200ms",
                              }}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ── Right Side ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {/* Nav Links (desktop) */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      fontFamily: font,
                      padding: "8px 14px",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "all 250ms",
                      color: scrolled
                        ? active
                          ? "#2D4F1E"
                          : "#475569"
                        : active
                          ? "#ffffff"
                          : "rgba(255,255,255,0.8)",
                      background: active
                        ? scrolled
                          ? "rgba(45,79,30,0.08)"
                          : "rgba(255,255,255,0.15)"
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!active)
                        e.currentTarget.style.background = scrolled
                          ? "rgba(0,0,0,0.04)"
                          : "rgba(255,255,255,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Cart — buyers only */}
            {currentRole !== 'farmer' && (
              <button
                onClick={() => (onOpenCart ? onOpenCart() : navigate("/cart"))}
                aria-label="Open cart"
                style={{
                  position: "relative",
                  padding: "10px",
                  borderRadius: "12px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: scrolled ? "#374151" : "#ffffff",
                  transition: "all 250ms",
                }}
                onMouseEnter={(e) =>
                (e.currentTarget.style.background = scrolled
                  ? "rgba(0,0,0,0.04)"
                  : "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      background: "#ef4444",
                      color: "white",
                      borderRadius: "9999px",
                      minWidth: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      lineHeight: 1,
                      padding: "0 4px",
                    }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Add Product CTA — farmers only */}
            {currentRole === 'farmer' && actuallyLoggedIn && (
              <button
                onClick={() => navigate('/add-product')}
                style={{
                  fontFamily: font,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg,#E27D60,#F0A080)',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 10px rgba(226,125,96,0.35)',
                  transition: 'transform 200ms, box-shadow 200ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(226,125,96,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(226,125,96,0.35)'; }}
                aria-label="Add a new product"
              >
                <Sprout size={15} />
                + Add Product
              </button>
            )}

            {/* Bell */}
            {actuallyLoggedIn ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20
                }}
                style={{ position: 'relative' }}
                ref={notifPanelRef}
              >
                {/* Bell button */}
                <motion.button
                  ref={bellRef}
                  onClick={() =>
                    setNotifOpen(p => !p)
                  }
                  animate={
                    unreadCount > 0 && !notifOpen
                      ? {
                          rotate: [0,-10,10,-10,10,0]
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.5,
                    delay: 1
                  }}
                  aria-label={`Notifications, ${unreadCount} unread`}
                  style={{
                    position: 'relative',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: 'none',
                    background: notifOpen
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    transition: 'background 200ms'
                  }}
                >
                  <Bell size={20} />

                  {/* Unread badge */}
                  <AnimatePresence mode="popLayout">
                    {unreadCount > 0 && (
                      <motion.span
                        key={unreadCount}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          minWidth: 16,
                          height: 16,
                          borderRadius: 999,
                          background: '#E27D60',
                          color: 'white',
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: 'DM Sans',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 3px',
                          border: '1.5px solid #2D4F1E',
                          lineHeight: 1
                        }}
                      >
                        {unreadCount > 9
                          ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Notification Panel */}
                <AnimatePresence>
                  {notifOpen && actuallyLoggedIn && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -10,
                        scale: 0.97
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                        scale: 0.97
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 25
                      }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        right: 0,
                        width: window.innerWidth < 768
                          ? 'calc(100vw - 32px)'
                          : 380,
                        maxHeight: 520,
                        background: '#FDFAF4',
                        borderRadius: 20,
                        border: '1.5px solid #EDD9B0',
                        boxShadow:
                          '0 16px 48px rgba(45,79,30,0.18)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: 300
                      }}
                    >

                      {/* ── PANEL HEADER ── */}
                      <div style={{
                        padding: '16px 20px 12px',
                        borderBottom: '1px solid #EDD9B0',
                        flexShrink: 0
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 10
                        }}>
                          <div>
                            <div style={{
                              fontFamily:
                                'Playfair Display',
                              fontWeight: 700,
                              fontSize: 16,
                              color: '#2D4F1E'
                            }}>
                              Hi {getHeaderName()}! 👋
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 3
                            }}>
                              <span style={{
                                fontSize: 10,
                                fontFamily: 'DM Sans',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 999,
                                background:
                                  notifUser?.role === 'farmer'
                                    ? 'rgba(45,79,30,0.12)'
                                    : 'rgba(226,125,96,0.12)',
                                color:
                                  notifUser?.role === 'farmer'
                                    ? '#2D4F1E'
                                    : '#C96848'
                              }}>
                                {notifUser?.role === 'farmer'
                                  ? '🌾 Farmer'
                                  : '🛒 Buyer'}
                              </span>
                              {unreadCount > 0 && (
                                <span style={{
                                  fontSize: 10,
                                  fontFamily: 'DM Sans',
                                  color: '#7A7A7A'
                                }}>
                                  {unreadCount} unread
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            gap: 6
                          }}>
                            {unreadCount > 0 && (
                              <button
                                onClick={markAllRead}
                                style={{
                                  fontSize: 11,
                                  fontFamily: 'DM Sans',
                                  fontWeight: 600,
                                  color: '#2D4F1E',
                                  background:
                                    'rgba(45,79,30,0.08)',
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '4px 10px',
                                  cursor: 'pointer'
                                }}
                              >
                                Mark all read
                              </button>
                            )}
                            <button
                              onClick={() =>
                                setNotifOpen(false)
                              }
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                border: 'none',
                                background:
                                  'rgba(74,74,74,0.08)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#7A7A7A'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Tabs */}
                        <div style={{
                          display: 'flex',
                          gap: 4
                        }}>
                          {tabs.map(tab => (
                            <button
                              key={tab}
                              onClick={() =>
                                setActiveTab(tab)
                              }
                              style={{
                                fontSize: 11,
                                fontFamily: 'DM Sans',
                                fontWeight: 600,
                                padding: '4px 12px',
                                borderRadius: 999,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 150ms',
                                background:
                                  activeTab === tab
                                    ? '#2D4F1E'
                                    : 'transparent',
                                color:
                                  activeTab === tab
                                    ? 'white'
                                    : '#7A7A7A'
                              }}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ── PANEL BODY ── */}
                      <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        scrollbarWidth: 'thin',
                        scrollbarColor:
                          'rgba(45,79,30,0.3) transparent'
                      }}>
                        {filteredNotifications.length === 0
                          ? (
                          // Empty state
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '48px 24px',
                            gap: 12
                          }}>
                            <div style={{
                              width: 64,
                              height: 64,
                              borderRadius: '50%',
                              background: '#EDD9B0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <BellOff
                                size={28}
                                color="#2D4F1E"
                              />
                            </div>
                            <div style={{
                              fontFamily:
                                'Playfair Display',
                              fontWeight: 600,
                              fontSize: 16,
                              color: '#2D4F1E'
                            }}>
                              All caught up!
                            </div>
                            <div style={{
                              fontFamily: 'DM Sans',
                              fontSize: 13,
                              color: '#7A7A7A',
                              textAlign: 'center'
                            }}>
                              No notifications here yet.
                            </div>
                          </div>
                        ) : (
                          // Date groups
                          groupByDate(
                            filteredNotifications
                          ).map(([label, items]) => (
                            <div key={label}>
                              {/* Group header */}
                              <div style={{
                                position: 'sticky',
                                top: 0,
                                padding: '8px 20px 4px',
                                background: '#F5E6CC',
                                fontSize: 10,
                                fontFamily: 'DM Sans',
                                fontWeight: 700,
                                color: '#B0A898',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                zIndex: 1
                              }}>
                                {label}
                              </div>

                              {/* Notification items */}
                              <AnimatePresence>
                                {items.map(notif => {
                                  const cfg =
                                    NOTIF_CONFIG[
                                      notif.type
                                    ] ||
                                    NOTIF_CONFIG.system;
                                  const Icon = cfg.icon;
                                  return (
                                    <motion.div
                                      key={notif.id}
                                      layout
                                      initial={{
                                        opacity: 0,
                                        x: -10
                                      }}
                                      animate={{
                                        opacity: 1,
                                        x: 0
                                      }}
                                      exit={{
                                        opacity: 0,
                                        x: 10,
                                        height: 0
                                      }}
                                      transition={{
                                        duration: 0.2
                                      }}
                                      onClick={() =>
                                        handleNotifClick(
                                          notif
                                        )
                                      }
                                      style={{
                                        display: 'flex',
                                        gap: 12,
                                        padding:
                                          '12px 20px',
                                        cursor: 'pointer',
                                        position:
                                          'relative',
                                        background:
                                          notif.read
                                            ? 'transparent'
                                            : '#F5F9F3',
                                        borderBottom:
                                          '1px solid #EDD9B0',
                                        transition:
                                          'background 150ms'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget
                                          .style.background
                                          = '#F0F5EE';
                                        const btn =
                                          e.currentTarget
                                            .querySelector(
                                              '.dismiss-x'
                                            );
                                        if (btn)
                                          btn.style.opacity
                                            = '1';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget
                                          .style.background
                                          = notif.read
                                            ? 'transparent'
                                            : '#F5F9F3';
                                        const btn =
                                          e.currentTarget
                                            .querySelector(
                                              '.dismiss-x'
                                            );
                                        if (btn)
                                          btn.style.opacity
                                            = '0';
                                      }}
                                    >
                                      {/* Unread dot */}
                                      {!notif.read && (
                                        <div style={{
                                          position:
                                            'absolute',
                                          left: 8,
                                          top: '50%',
                                          transform:
                                            'translateY(-50%)',
                                          width: 6,
                                          height: 6,
                                          borderRadius:
                                            '50%',
                                          background:
                                            '#E27D60'
                                        }} />
                                      )}

                                      {/* Icon */}
                                      <div style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background:
                                          cfg.color + '18',
                                        display: 'flex',
                                        alignItems:
                                          'center',
                                        justifyContent:
                                          'center',
                                        flexShrink: 0
                                      }}>
                                        <Icon
                                          size={17}
                                          color={cfg.color}
                                        />
                                      </div>

                                      {/* Content */}
                                      <div style={{
                                        flex: 1,
                                        minWidth: 0
                                      }}>
                                        <div style={{
                                          fontFamily:
                                            'DM Sans',
                                          fontWeight:
                                            notif.read
                                              ? 500 : 700,
                                          fontSize: 13,
                                          color: '#2D4F1E',
                                          overflow:
                                            'hidden',
                                          textOverflow:
                                            'ellipsis',
                                          whiteSpace:
                                            'nowrap'
                                        }}>
                                          {notif.title}
                                        </div>
                                        <div style={{
                                          fontFamily:
                                            'DM Sans',
                                          fontSize: 12,
                                          color: '#7A7A7A',
                                          lineHeight: 1.4,
                                          display:
                                            '-webkit-box',
                                          WebkitLineClamp:
                                            2,
                                          WebkitBoxOrient:
                                            'vertical',
                                          overflow:
                                            'hidden'
                                        }}>
                                          {notif.body}
                                        </div>
                                        <div style={{
                                          fontFamily:
                                            'DM Sans',
                                          fontSize: 10,
                                          color: '#B0A898',
                                          marginTop: 3
                                        }}>
                                          {formatNotifDate(
                                            notif.time
                                          )}
                                        </div>
                                      </div>

                                      {/* Dismiss X */}
                                      <button
                                        className="dismiss-x"
                                        onClick={e => {
                                          e.stopPropagation();
                                          dismissNotif(
                                            notif.id
                                          );
                                        }}
                                        style={{
                                          opacity: 0,
                                          width: 24,
                                          height: 24,
                                          borderRadius: 6,
                                          border: 'none',
                                          background:
                                            'rgba(74,74,74,0.1)',
                                          cursor:
                                            'pointer',
                                          display: 'flex',
                                          alignItems:
                                            'center',
                                          justifyContent:
                                            'center',
                                          flexShrink: 0,
                                          color: '#7A7A7A',
                                          transition:
                                            'opacity 150ms',
                                          alignSelf:
                                            'center'
                                        }}
                                      >
                                        <X size={12} />
                                      </button>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          ))
                        )}
                      </div>

                      {/* ── PANEL FOOTER ── */}
                      {filteredNotifications.length > 0 && (
                        <div style={{
                          padding: '10px 20px',
                          borderTop: '1px solid #EDD9B0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FDFAF4',
                          flexShrink: 0
                        }}>
                          <span style={{
                            fontFamily: 'DM Sans',
                            fontSize: 11,
                            color: '#B0A898'
                          }}>
                            {filteredNotifications.length}
                            {' '}notification{filteredNotifications.length !== 1 ? 's' : ''}
                          </span>
                          <div style={{
                            display: 'flex',
                            gap: 12
                          }}>
                            {filteredNotifications
                              .some(n => n.read) && (
                              <button
                                onClick={clearAllRead}
                                style={{
                                  fontSize: 11,
                                  fontFamily: 'DM Sans',
                                  fontWeight: 600,
                                  color: '#E27D60',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: 0
                                }}
                              >
                                Clear read
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                setNotifOpen(false);
                                navigate(notifUser?.role === 'farmer' ? '/farmer-dashboard' : '/buyerprofile');
                              }}
                              style={{
                              fontSize: 11,
                              fontFamily: 'DM Sans',
                              fontWeight: 600,
                              color: '#7A7A7A',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: 0
                            }}>
                              Settings
                            </button>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            ) : null}

            {/* Profile / Login */}
            {actuallyLoggedIn ? (
              <div style={{ position: "relative" }} ref={profileRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setProfileOpen((s) => !s); }}
                  style={{
                    fontFamily: font,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 14px",
                    borderRadius: "12px",
                    background: scrolled
                      ? "rgba(45,79,30,0.08)"
                      : "rgba(255,255,255,0.12)",
                    border: scrolled
                      ? "1.5px solid rgba(45,79,30,0.15)"
                      : "1.5px solid rgba(255,255,255,0.2)",
                    color: scrolled ? "#2D4F1E" : "#ffffff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    transition: "all 250ms",
                  }}
                >
                  <User size={16} />
                  <span className="hidden md:inline">
                    <span style={{
                      fontFamily: 'DM Sans',
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'white'
                    }}>
                      {getHeaderName()}
                    </span>
                  </span>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: "absolute",
                        right: 0,
                        marginTop: "8px",
                        width: "220px",
                        background: "rgba(255,255,255,0.96)",
                        backdropFilter: "blur(20px)",
                        borderRadius: "16px",
                        boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        overflow: "hidden",
                        zIndex: 60,
                      }}
                    >
                      <div
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid rgba(0,0,0,0.04)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {getHeaderName()}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                            marginTop: "2px",
                          }}
                        >
                          {userEmail || notifUser?.email || ""}
                        </div>
                      </div>
                      {(currentRole === 'farmer' ? [
                          { to: "/dashboard/farmer", label: "My Dashboard",    icon: <Sprout size={15} /> },
                          { to: "/add-product",      label: "Add Product",     icon: <Package size={15} /> },
                          { to: "/dashboard/farmer", label: "Profile Settings", icon: <Settings size={15} /> },
                        ] : [
                          { to: "/buyerprofile",  label: "My Profile",  icon: <User size={15} /> },
                          { to: "/orderhistory",  label: "My Orders",   icon: <ShoppingCart size={15} /> },
                      ]).map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setProfileOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "11px 16px",
                            fontSize: "0.85rem",
                            color: "#374151",
                            textDecoration: "none",
                            fontWeight: 500,
                            transition: "background 200ms",
                          }}
                          onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(0,0,0,0.03)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "transparent")
                          }
                        >
                          {item.icon}
                          {item.label}
                          <ChevronRight
                            size={14}
                            style={{ marginLeft: "auto", color: "#cbd5e1" }}
                          />
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        style={{
                          fontFamily: font,
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "11px 16px",
                          fontSize: "0.85rem",
                          color: "#ef4444",
                          fontWeight: 600,
                          background: "transparent",
                          border: "none",
                          borderTop: "1px solid rgba(0,0,0,0.04)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 200ms",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(239,68,68,0.04)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex"
                style={{
                  fontFamily: font,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 20px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  transition: "all 250ms",
                  background: scrolled
                    ? "linear-gradient(135deg, #E27D60, #F0A080)"
                    : "#E27D60",
                  color: "#ffffff",
                  boxShadow: scrolled
                    ? "0 4px 12px rgba(226,125,96,0.3)"
                    : "0 4px 12px rgba(226,125,96,0.3)",
                }}
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileOpen((s) => !s)}
                style={{
                  padding: "10px",
                  borderRadius: "12px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: scrolled ? "#374151" : "#ffffff",
                  transition: "all 250ms",
                }}
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: scrolled
                ? "rgba(255,255,255,0.96)"
                : "rgba(26,46,18,0.95)",
              backdropFilter: "blur(20px)",
              borderTop: scrolled
                ? "1px solid rgba(0,0,0,0.06)"
                : "1px solid rgba(255,255,255,0.1)",
            }}
            className="md:hidden"
          >
            <div style={{ padding: "12px 16px" }}>
              {/* Mobile Search */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: scrolled ? "#f1f5f9" : "rgba(255,255,255,0.12)",
                  borderRadius: "12px",
                  padding: "4px",
                  marginBottom: "12px",
                }}
              >
                <span style={{ padding: "8px", color: scrolled ? "#94a3b8" : "rgba(255,255,255,0.5)" }}>
                  <SearchIcon size={16} />
                </span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      goSearch(query);
                      setMobileOpen(false);
                    }
                  }}
                  placeholder="Search..."
                  style={{
                    fontFamily: font,
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: "8px 12px",
                    fontSize: "0.9rem",
                    color: scrolled ? "#0f172a" : "#ffffff",
                  }}
                />
              </div>

              {/* Mobile Nav links */}
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      fontFamily: font,
                      display: "block",
                      padding: "12px 14px",
                      borderRadius: "10px",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      color: scrolled
                        ? active ? "#2D4F1E" : "#374151"
                        : "#ffffff",
                      background: active
                        ? scrolled ? "rgba(45,79,30,0.08)" : "rgba(255,255,255,0.12)"
                        : "transparent",
                      marginBottom: "2px",
                    }}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* Mobile auth actions */}
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/buyer-dashboard"
                      onClick={() => setMobileOpen(false)}
                      style={{
                        fontFamily: font,
                        display: "block",
                        textAlign: "center",
                        padding: "12px",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        textDecoration: "none",
                        background: scrolled ? "#2D4F1E" : "#ffffff",
                        color: scrolled ? "#ffffff" : "#2D4F1E",
                      }}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      style={{
                        fontFamily: font,
                        display: "block",
                        textAlign: "center",
                        padding: "12px",
                        borderRadius: "12px",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        background: "#fef2f2",
                        color: "#ef4444",
                        border: "none",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    style={{
                      fontFamily: font,
                      display: "block",
                      textAlign: "center",
                      padding: "12px",
                      borderRadius: "12px",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      background: scrolled
                        ? "linear-gradient(135deg, #E27D60, #F0A080)"
                        : "#E27D60",
                      color: "#ffffff",
                    }}
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              background: "rgba(15,23,42,0.92)",
              backdropFilter: "blur(12px)",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              fontSize: "0.85rem",
              fontWeight: 600,
              fontFamily: font,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              zIndex: 9999,
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Wrapper ─── */
const UnifiedHeader = ({ onOpenCart }) => (
  <header style={{ position: "sticky", top: 0, zIndex: 50 }}>
    <Navbar onOpenCart={onOpenCart} />
  </header>
);

export default UnifiedHeader;
