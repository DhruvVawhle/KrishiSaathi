// src/frontend/pages/BuyerDashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "@/frontend/contexts/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/frontend/contexts/CartContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { auth } from "@/frontend/config/firebaseConfig";
import {
  Bell, ShoppingCart, LogOut, ChevronDown, Search,
  ShoppingBag, IndianRupee, Star, ChevronRight,
  Package, Clock, Copy, UserCheck, CheckCircle,
  Settings, UserCircle, ClipboardList, ShoppingBasket,
  XCircle, Plus
} from "lucide-react";
import RecommendedProducts from "@/frontend/components/ui/RecommendedProducts";
import { updateSEO } from '@/frontend/utils/seo';
import Breadcrumb from '@/frontend/components/ui/Breadcrumb';
import NotificationCenter from '@/frontend/components/NotificationCenter';

import "./BuyerDashboard.css";
import { imagePresets } from '@/frontend/utils/imageHelper';
import StatusBadge from '@/frontend/components/ui/StatusBadge';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user: ctxUser } = useUser();
  const { cart = [], removeFromCart: _removeFromCart, clearCart, updateQuantity: _updateQuantity } = useCart();
  const reduceMotion = useReducedMotion();

  // 1. All State Hooks
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [_recommendations, setRecommendations] = useState([
    { name: "Tomato", cat: "Vegetables", price: "₹60/kg", img: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=100&auto=format&fit=crop" },
    { name: "Apple", cat: "Fruits", price: "₹180/kg", img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=100&auto=format&fit=crop" },
    { name: "Spinach", cat: "Vegetables", price: "₹20/250g", img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&auto=format&fit=crop" }
  ]);
  const [_recLabel, setRecLabel] = useState("Fresh Picks");
  const [counts, setCounts] = useState({ orders: 0, spent: 0, points: 0 });
  const [copied, setCopied] = useState(false);

  // 2. All Ref Hooks
  const dropdownRef = useRef(null);

  // 3. All Memo Hooks
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole");
  const userNameStored = localStorage.getItem("userName") || null;
  const displayName =
    (ctxUser && (ctxUser.name || ctxUser.displayName || ctxUser.email?.split("@")[0])) ||
    userNameStored ||
    (userEmail ? userEmail.split("@")[0] : "Guest");

  const visibleCart = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return cart;
    return cart.filter((it) => (it.name || "").toLowerCase().includes(q));
  }, [cart, query]);

  const loyaltyPoints = useMemo(() => {
    const spent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    return Math.floor(spent / 10);
  }, [orders]);

  const tierInfo = useMemo(() => {
    const pts = loyaltyPoints;
    if (pts >= 3000) return { tier: "Platinum", next: 0, progress: 100, color: "#E5E4E2" };
    if (pts >= 1500) return { tier: "Gold", next: 3000 - pts, progress: ((pts - 1500) / 1500) * 100, color: "#D4AF37" };
    if (pts >= 500) return { tier: "Silver", next: 1500 - pts, progress: ((pts - 500) / 1000) * 100, color: "#C0C0C0" };
    return { tier: "Bronze", next: 500 - pts, progress: (pts / 500) * 100, color: "#CD7F32" };
  }, [loyaltyPoints]);

  const monthStats = useMemo(() => {
    const now = new Date();
    const thisMonth = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      count: thisMonth.length,
      spent: Math.floor(thisMonth.reduce((sum, o) => sum + (o.total || 0), 0)),
      items: thisMonth.reduce((sum, o) => sum + (o.items?.length || 0), 0)
    };
  }, [orders]);

  const activityFeed = useMemo(() => {
    if (orders.length === 0) {
      return [
        { type: "Welcome", title: `Welcome, ${displayName}!`, time: "Just now", sub: "Glad to have you here.", icon: UserCheck, color: "#4CAF50" },
        { type: "Profile", title: "Profile setup", time: "Today", sub: "Account created successfully", icon: CheckCircle, color: "#2D4F1E" }
      ];
    }
    return orders.slice(0, 5).map(o => {
      const date = new Date(o.createdAt);
      const diffDays = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
      const timeStr = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : `${diffDays} days ago`;
      return {
        type: "Order",
        title: `Order #${o.orderId || (o._id || '').slice(-6).toUpperCase()} ${o.status || 'placed'}`,
        time: timeStr,
        sub: `${(o.items || []).length} items \u2022 ₹${o.total || 0}`,
        icon: Package,
        color: o.status === 'delivered' ? "#4CAF50" : "#E27D60"
      };
    });
  }, [orders, displayName]);

  const recentOrders = useMemo(() => orders.slice(0, 3).map(ord => ({
    id: ord.orderId || `#${(ord._id || '').slice(-6).toUpperCase()}`,
    date: new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    itemsSummary: `${(ord.items || []).length} items`,
    total: `₹${ord.total || 0}`,
    status: (ord.status || 'confirmed').toLowerCase(),
    icon: Package
  })), [orders]);

  // 4. All Effect Hooks
  useEffect(() => {
    if (userRole && userRole !== "buyer") {
      toast.warn("Access denied — Redirecting...");
      setTimeout(() => navigate("/"), 1200);
    }
  }, [userRole, navigate]);

  useEffect(() => { updateSEO('/buyer-dashboard'); }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      const uid = ctxUser?.uid || ctxUser?.id || auth.currentUser?.uid;
      if (!uid) return;
      setLoadingOrders(true);
      try {
        const token = localStorage.getItem('idToken') || localStorage.getItem('ks_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`/api/orders/user/${uid}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const fetched = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
          setOrders(fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
      } catch (err) { console.error("Dashboard orders fetch failed:", err); }
      finally { setLoadingOrders(false); }
    };
    fetchOrders();
  }, [ctxUser]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await fetch(`/api/users/${encodeURIComponent(user.uid)}/recommendations`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (data.type === 'popular' || !data.categories?.length) {
          setRecLabel("Popular Picks");
        } else {
          setRecLabel("Personalized for You");
          const catSet = new Set((data.categories || []).map(c => c?.toLowerCase()));
          const allItems = [
            { name: "Tomato", cat: "Vegetables", price: "₹60/kg", img: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=100&auto=format&fit=crop" },
            { name: "Apple", cat: "Fruits", price: "₹180/kg", img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=100&auto=format&fit=crop" },
            { name: "Spinach", cat: "Vegetables", price: "₹20/250g", img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&auto=format&fit=crop" },
            { name: "Wheat", cat: "Grains", price: "₹45/kg", img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=100&auto=format&fit=crop" },
            { name: "Mango", cat: "Fruits", price: "₹80/kg", img: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=100&auto=format&fit=crop" },
            { name: "Onion", cat: "Vegetables", price: "₹30/kg", img: "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=100&auto=format&fit=crop" },
          ];
          const matched = allItems.filter(it => catSet.has(it.cat.toLowerCase()));
          if (matched.length > 0) setRecommendations(matched.slice(0, 3));
        }
      } catch (err) { console.warn("Recommendations fetch failed:", err.message); }
    };
    fetchRecommendations();
  }, []);

  useEffect(() => {
    const duration = 1500;
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;
    const targetOrders = orders.length || 0;
    const targetSpent = Math.floor(orders.reduce((sum, o) => sum + (o.total || 0), 0));
    const targetPoints = loyaltyPoints;
    const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts({ orders: targetOrders, spent: targetSpent, points: targetPoints });
        return;
      }
      const progress = easeOutCubic(currentStep / steps);
      setCounts({
        orders: Math.floor(targetOrders * progress),
        spent: Math.floor(targetSpent * progress),
        points: Math.floor(targetPoints * progress)
      });
    }, stepTime);
    return () => clearInterval(timer);
  }, [orders, loyaltyPoints]);

  /* --- Handlers --- */
  const handleLogout = () => {
    localStorage.clear();
    clearCart();
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
    setTimeout(() => navigate("/login"), 1200);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      const q = query.trim();
      navigate(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) { toast.warn("🛒 Your cart is empty!"); return; }
    localStorage.setItem("checkoutCart", JSON.stringify(cart));
    localStorage.setItem("checkoutTotal", total.toFixed(2));
    toast.success("✅ Redirecting to checkout...");
    setTimeout(() => navigate("/checkout"), 800);
  };

  const handleCopyPromo = () => {
    navigator.clipboard.writeText("FRESH15");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning 🌅";
    if (h < 17) return "Good afternoon ☀️";
    return "Good evening 🌙";
  };

  const anim = reduceMotion ? {} : {
    fadeUp: { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } },
    fadeRight: { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 } },
    fadeLeft: { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 } },
    scaleIn: { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 } }
  };

  return (
    <div className="bd-container">

      {/* 1. TOP BAR */}
      <motion.header
        className="bd-top-bar"
        initial={reduceMotion ? {} : { opacity: 0, y: -60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bd-logo-row" onClick={() => navigate("/")}>
          <div className="bd-logo-leaf-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22l1-2.3A13.89,13.89 0 0,0 20.25,10.05C21.5,7.45 21.54,4.74 20.5,2C19.22,2.44 17.65,3.62 16.42,5.19C15.11,6.87 14,9.27 14,12C14,14.62 15.03,16.71 16.27,18.06L17.52,16.81C16.48,15.68 15.65,13.93 15.65,12C15.65,9.66 16.63,7.5 17.84,6C18.84,4.72 20.14,3.77 21.14,3.34C20.69,5 19.82,6.96 17,8M6.28,15.68L4.39,15C5.9,11.23 8.35,9.08 11.29,7.67L12.35,9.3C10,10.45 8.16,12.23 6.28,15.68Z" />
            </svg>
          </div>
          <span className="bd-logo-text">KrishiSaathi</span>
        </div>

        <span className="bd-role-pill">Buyer Dashboard</span>

        <div className="bd-search-wrapper">
          <div className="bd-search-inner">
            <Search className="bd-search-icon" size={15} />
            <input
              className="bd-search"
              placeholder="Search marketplace, cart, or orders..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>

        <div className="bd-top-actions">
          <NotificationCenter />

          <button className="bd-icon-btn" aria-label="View cart" onClick={() => window.dispatchEvent(new CustomEvent("open-cart"))}>
            <ShoppingCart size={17} strokeWidth={2.5} />
            {cart.length > 0 && <span className="bd-badge-count">{cart.length}</span>}
          </button>

          <div className="bd-tb-divider" />

          <button className="bd-btn-browse" onClick={() => navigate('/marketplace')}>
            Browse Marketplace
          </button>

          <div className="bd-user-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)} ref={dropdownRef}>
            <div className="bd-avatar">{displayName?.[0]?.toUpperCase() || 'U'}</div>
            <span className="bd-user-name">{displayName}</span>
            <ChevronDown size={13} strokeWidth={3} style={{ color: "rgba(255,255,255,0.4)" }} />

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="bd-dropdown-menu"
                >
                  <Link to="/buyerprofile" className="bd-dropdown-item">Profile</Link>
                  <Link to="/buyerprofile" className="bd-dropdown-item">Settings</Link>
                  <button onClick={handleLogout} className="bd-dropdown-item" style={{ color: '#E27D60' }}>Logout</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="bd-icon-btn" aria-label="Log out" onClick={handleLogout} style={{ background: 'transparent' }}>
            <LogOut size={17} strokeWidth={2.5} />
          </button>
        </div>
      </motion.header>

      {/* 2. HERO BANNER */}
      <motion.section
        className="bd-hero"
        initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto 1.5rem', padding: '0 20px' }}>
          <Breadcrumb items={[
            { label: 'Home', path: '/' },
            { label: 'Buyer Dashboard' }
          ]} />
        </div>
        <div className="bd-hero-glow" />
        <div className="bd-hero-dots" />
        <svg className="bd-hero-leaves" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>

        <div className="bd-hero-content">
          <div className="bd-hero-left">
            <span className="bd-hero-tag">{getGreeting()}</span>
            <h1 className="bd-hero-title">Hello, {displayName}!</h1>
            <p className="bd-hero-sub">
              You have {cart.length} item{cart.length !== 1 ? 's' : ''} in your cart and {orders.length} past order{orders.length !== 1 ? 's' : ''}. Browse today's fresh picks.
            </p>
            <div className="bd-hero-actions">
              <button className="bd-btn-primary" onClick={() => navigate('/marketplace')}><ShoppingBag size={16} /> Continue Shopping</button>
              <Link to="/buyerprofile" className="bd-btn-outline"><ClipboardList size={16} /> View Orders</Link>
            </div>
          </div>

          <div className="bd-hero-right">
            <div className="bd-stat-pill">
              <div className="bd-pill-icon" style={{ backgroundColor: 'rgba(226,125,96,0.25)', color: '#E27D60' }}>
                <ShoppingBag size={18} />
              </div>
              <div>
                <div className="bd-pill-val">{counts.orders}</div>
                <div className="bd-pill-lbl">Total Orders</div>
              </div>
            </div>
            <div className="bd-stat-pill">
              <div className="bd-pill-icon" style={{ backgroundColor: 'rgba(76,175,80,0.2)', color: '#4CAF50' }}>
                <IndianRupee size={18} />
              </div>
              <div>
                <div className="bd-pill-val">₹{counts.spent}</div>
                <div className="bd-pill-lbl">Total Spent</div>
              </div>
            </div>
            <div className="bd-stat-pill">
              <div className="bd-pill-icon" style={{ backgroundColor: 'rgba(240,160,128,0.2)', color: '#F0A080' }}>
                <Star size={18} />
              </div>
              <div>
                <div className="bd-pill-val">{counts.points}</div>
                <div className="bd-pill-lbl">Loyalty Points</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bd-hero-wave">
          <svg viewBox="0 0 1440 32" preserveAspectRatio="none">
            <path d="M0,32L1440,32L1440,0C1186.666,32 720,32 0,0Z" />
          </svg>
        </div>
      </motion.section>

      {/* 3. STATS STRIP */}
      <motion.section
        className="bd-stats-strip"
        initial={reduceMotion ? {} : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="bd-strip-item">
          <div className="bd-strip-val">{counts.orders}</div>
          <div className="bd-strip-lbl">ORDERS PLACED</div>
        </div>
        <div className="bd-strip-item">
          <div className="bd-strip-val">₹{counts.spent}</div>
          <div className="bd-strip-lbl">TOTAL SPENT</div>
        </div>
        <div className="bd-strip-item">
          <div className="bd-strip-val accent">{counts.points}</div>
          <div className="bd-strip-lbl">LOYALTY POINTS</div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.5 }} className="bd-strip-item">
          <div className="bd-strip-val accent">{tierInfo.tier}</div>
          <div className="bd-strip-lbl">MEMBER TIER</div>
        </motion.div>
      </motion.section>

      {/* 4. QUICK NAV */}
      <section className="bd-quick-nav-section">
        <div className="bd-section-header">
          <span className="bd-section-tag">Quick Access</span>
        </div>

        <div className="bd-quick-nav">
          {[
            { tag: 'Marketplace', icon: ShoppingBasket, col: '#2D4F1E', sub: 'Explore fresh produce', to: '/marketplace' },
            { tag: 'Order History', icon: ClipboardList, col: '#E27D60', sub: 'View past orders', to: '/buyerprofile' },
            { tag: 'Profile', icon: UserCircle, col: '#4A7A35', sub: 'Manage account', to: '/buyerprofile' },
            { tag: 'Settings', icon: Settings, col: '#7A7A7A', sub: 'Preferences & help', to: '/buyerprofile' },
          ].map((item, idx) => (
            <motion.div {...anim.scaleIn} transition={{ delay: 0.3 + (0.07 * idx) }} key={idx}>
              <Link to={item.to} className="bd-qn-card" style={{ borderColor: `${item.col}20` }}>
                <div className="bd-qn-top">
                  <div className="bd-qn-icon-box" style={{ backgroundColor: `${item.col}1E` }}>
                    <item.icon size={22} color={item.col} className="bd-qn-icon-svg" />
                  </div>
                  <ChevronRight size={16} className="bd-qn-arrow" />
                </div>
                <h3 className="bd-qn-title">{item.tag}</h3>
                <p className="bd-qn-sub">{item.sub}</p>
                <div className="bd-qn-bottom-bar" style={{ backgroundColor: item.col }} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. MAIN CONTENT GRID */}
      <motion.section
        className="bd-main-grid"
        initial={reduceMotion ? {} : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {/* LEFT COLUMN */}
        <div className="bd-col-main">

          {/* CART WIDGET */}
          <div className="bd-cart-widget">
            <div className="bd-cart-header">
              <div className="bd-cart-title">
                <ShoppingCart size={18} /> Your Cart
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className="bd-cart-count">{cart.length} items</span>
                {cart.length > 0 && (
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent("open-cart"))} 
                    className="bd-cart-view"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    View Full Cart →
                  </button>
                )}
              </div>
            </div>

            {cart.length === 0 ? (
              <div className="bd-cart-empty">
                <div className="bd-empty-illo">
                  <div className="bd-empty-ring">
                    <div className="bd-empty-inner">
                      <ShoppingCart size={28} color="#2D4F1E" />
                    </div>
                  </div>
                  <div className="bd-empty-leaf"><span style={{ color: "#4CAF50" }}><ShoppingCart size={18} /></span></div>
                </div>
                <h3 className="bd-empty-title">Your cart is empty</h3>
                <p className="bd-empty-sub">Browse fresh produce from local farmers and add items to your cart.</p>
                <div className="bd-empty-actions">
                  <Link to="/marketplace" className="bd-btn-browse-empty">Browse Marketplace</Link>
                  <Link to="/" className="bd-btn-home-empty">Go Home</Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="bd-cart-filled">
                  {visibleCart.slice(0, 3).map((item) => (
                    <div key={item.id} className="bd-cart-row">
                      <img 
                        src={imagePresets.thumbnail(item.image)} 
                        alt={item.name} 
                        className="bd-cart-img" 
                        fetchPriority="high"
                      />
                      <div className="bd-cart-info">
                        <div className="bd-cart-item-name">{item.name}</div>
                        <div className="bd-cart-item-sub">Sold by Local Farm</div>
                      </div>
                      <div className="bd-cart-price-col">
                        <span className="bd-cart-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                        <span className="bd-cart-qty">×{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  {visibleCart.length > 3 && (
                    <div className="bd-cart-row" style={{ justifyContent: 'center' }}>
                      <span className="bd-cart-item-sub">+ {visibleCart.length - 3} more items in cart</span>
                    </div>
                  )}
                </div>
                <div className="bd-cart-footer">
                  <span className="bd-cart-subtotal">Subtotal: ₹{total.toFixed(2)}</span>
                  <button onClick={handleCheckout} className="bd-btn-checkout">Checkout →</button>
                </div>
              </div>
            )}
          </div>

          {/* RECENT ORDERS */}
          <div className="bd-ro-card">
            <div className="bd-ro-header">
              <div>
                <span className="bd-ro-tag">Activity</span>
                <h3 className="bd-ro-title">Recent Orders</h3>
              </div>
              <Link to="/buyerprofile" className="bd-ro-link">View all →</Link>
            </div>

            <div className="bd-ro-list">
              {loadingOrders ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#B0A898' }}>Loading recent orders...</div>
              ) : recentOrders.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#B0A898', fontWeight: 500 }}>No orders yet</div>
              ) : recentOrders.map((ord, i) => (
                <Link to="/order-history" key={i} className="bd-ro-row">
                  <div className={`bd-ro-icon ${ord.status}`}>
                    <ord.icon size={18} />
                  </div>
                  <div className="bd-ro-center">
                    <div className="bd-ro-id">{ord.id}</div>
                    <div className="bd-ro-meta">{ord.date} • {ord.itemsSummary}</div>
                  </div>
                  <div className="bd-ro-right">
                    <div className="bd-ro-amt">{ord.total}</div>
                    <StatusBadge status={ord.status} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ACTIVITY FEED */}
          <div className="bd-activity-sec">
            <div className="bd-af-header">
              <span className="bd-ro-tag">Timeline</span>
              <h3 className="bd-ro-title">Recent Activity</h3>
            </div>

            <div className="bd-tl-wrap">
              <div className="bd-tl-line"></div>

              {activityFeed.map((act, i) => (
                <motion.div {...anim.fadeUp} transition={{ delay: 0.1 * i }} key={i} className="bd-tl-item">
                  <div className="bd-tl-dot" style={{ borderColor: act.color }}>
                    <act.icon size={16} color={act.color} />
                  </div>
                  <div className="bd-tl-card">
                    <div>
                      <div className="bd-tl-act">{act.title}</div>
                      <div className="bd-tl-sub">{act.sub}</div>
                    </div>
                    <div className="bd-tl-time">{act.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="bd-col-sidebar">

          {/* PROMO BANNER */}
          <motion.div {...anim.fadeLeft} transition={{ delay: 0.5 }} className="bd-promo-card">
            <div className="bd-promo-bg-circle" />
            <div className="bd-promo-bg-sm" />
            <span className="bd-promo-tag">Limited Time 🎉</span>
            <h3 className="bd-promo-title">Summer Fresh Sale</h3>
            <p className="bd-promo-sub">Get 15% off on all vegetables this week. Use code:</p>

            <div className="bd-promo-bx">
              <span className="bd-promo-code">{copied ? "COPIED" : "FRESH15"}</span>
              <button className={`bd-btn-copy ${copied ? 'success' : ''}`} onClick={handleCopyPromo}>
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <button className="bd-promo-cta" onClick={() => navigate('/marketplace')}>Shop Now →</button>
          </motion.div>

          {/* LOYALTY CARD */}
          <motion.div {...anim.fadeLeft} transition={{ delay: 0.6 }} className="bd-loyalty-card">
            <span className="bd-ly-tag">Rewards</span>
            <div className="bd-ly-title">🌾 Loyalty Points</div>

            <div className="bd-ly-pts-row">
              <span className="bd-ly-pts">{counts.points}</span>
              <span className="bd-ly-sub">points available</span>
            </div>

            <div className="bd-ly-trw">
              <span className="bd-ly-tlbl">{tierInfo.tier} Member</span>
              {tierInfo.next > 0 && <span className="bd-ly-tsub">{tierInfo.next} pts to next tier</span>}
            </div>

            <div className="bd-ly-track">
              <div className="bd-ly-fill" style={{ width: `${tierInfo.progress}%` }}>
                <div className="bd-ly-thumb"></div>
              </div>
            </div>

            <div className="bd-ly-badges">
              <span className={`bd-ly-badge ${tierInfo.tier === 'Bronze' ? 'bd-ly-b-active' : 'bd-ly-b-inactive'}`}>Bronze {tierInfo.tier === 'Bronze' ? '✓' : ''}</span>
              <span className={`bd-ly-badge ${tierInfo.tier === 'Silver' ? 'bd-ly-b-active' : 'bd-ly-b-inactive'}`}>Silver {tierInfo.tier === 'Silver' ? '✓' : ''}</span>
              <span className={`bd-ly-badge ${tierInfo.tier === 'Gold' ? 'bd-ly-b-active' : 'bd-ly-b-inactive'}`}>Gold {tierInfo.tier === 'Gold' ? '✓' : ''}</span>
              <span className={`bd-ly-badge ${tierInfo.tier === 'Platinum' ? 'bd-ly-b-active' : 'bd-ly-b-inactive'}`}>Platinum {tierInfo.tier === 'Platinum' ? '✓' : ''}</span>
            </div>

            <div className="bd-ly-actions">
              <button className="bd-btn-ly-pri">Redeem</button>
              <button className="bd-btn-ly-sec">History</button>
            </div>
          </motion.div>

          {/* QUICK STATS */}
          <motion.div {...anim.fadeLeft} transition={{ delay: 0.7 }} className="bd-month-card">
            <div className="bd-mc-title">THIS MONTH</div>
            <div className="bd-mc-row">
              <div className="bd-mc-left"><div className="bd-mc-icon-bg" style={{ background: 'rgba(45,79,30,0.1)' }}><ShoppingBag size={14} color="#2D4F1E" /></div><span className="bd-mc-lbl">Orders</span></div>
              <div className="bd-mc-val">{monthStats.count}</div>
            </div>
            <div className="bd-mc-row">
              <div className="bd-mc-left"><div className="bd-mc-icon-bg" style={{ background: 'rgba(226,125,96,0.1)' }}><IndianRupee size={14} color="#E27D60" /></div><span className="bd-mc-lbl">Spent</span></div>
              <div className="bd-mc-val">₹{monthStats.spent}</div>
            </div>
            <div className="bd-mc-row">
              <div className="bd-mc-left"><div className="bd-mc-icon-bg" style={{ background: 'rgba(74,122,53,0.1)' }}><Package size={14} color="#4A7A35" /></div><span className="bd-mc-lbl">Items bought</span></div>
              <div className="bd-mc-val">{monthStats.items}</div>
            </div>
          </motion.div>

        </div>
      </motion.section>

      <RecommendedProducts />

      {/* 6. MINI FOOTER */}
      <footer className="bd-mini-footer">
        <div className="bd-mf-left">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22l1-2.3A13.89,13.89 0 0,0 20.25,10.05C21.5,7.45 21.54,4.74 20.5,2C19.22,2.44 17.65,3.62 16.42,5.19C15.11,6.87 14,9.27 14,12C14,14.62 15.03,16.71 16.27,18.06L17.52,16.81C16.48,15.68 15.65,13.93 15.65,12C15.65,9.66 16.63,7.5 17.84,6C18.84,4.72 20.14,3.77 21.14,3.34C20.69,5 19.82,6.96 17,8M6.28,15.68L4.39,15C5.9,11.23 8.35,9.08 11.29,7.67L12.35,9.3C10,10.45 8.16,12.23 6.28,15.68Z" />
          </svg>
          © 2026 KrishiSaathi — Empowering Farmers
        </div>
        <div className="bd-mf-right">
          <Link to="/about" className="bd-mf-link">Privacy</Link>
          <Link to="/about" className="bd-mf-link">Terms</Link>
          <Link to="/support" className="bd-mf-link">Support</Link>
        </div>
      </footer>

    </div>
  );
};

export default BuyerDashboard;
