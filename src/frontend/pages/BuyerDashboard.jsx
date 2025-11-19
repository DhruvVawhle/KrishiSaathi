// src/frontend/pages/BuyerDashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import "react-toastify/dist/ReactToastify.css";

/**
 * BuyerDashboard — Upgraded UI/UX (Full redesign)
 * - Header: avatar, search, glass effect, better spacing
 * - Quick action cards: consistent visuals + hover micro-interactions
 * - Cart: modern item cards, stepper + inline edit, improved totals
 * - Empty state: illustration + primary CTA
 * - Settings modal: app-like layout with icons & keyboard support
 * - Mobile: floating checkout bar & sticky CTA
 * - Preserves original business logic and functions
 */

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { cart = [], removeFromCart, clearCart, updateQuantity } = useCart();
  const [editingId, setEditingId] = useState(null);
  const [qtyInput, setQtyInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const reduceMotion = useReducedMotion();
  const modalRef = useRef(null);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const userEmail = localStorage.getItem("userEmail") || "";
  const userRole = localStorage.getItem("userRole");
  const userNameStored = localStorage.getItem("userName") || null;
  const { user: ctxUser } = useUser();
  const displayName =
    (ctxUser && (ctxUser.name || ctxUser.displayName || ctxUser.email?.split("@")[0])) ||
    userNameStored ||
    (userEmail ? userEmail.split("@")[0] : "Guest");

  // Search in header (local only to dashboard — helps find cart items or past orders)
  const [query, setQuery] = useState("");

  // 🚫 Redirect unauthorized users (keeps your original behaviour)
  useEffect(() => {
    if (userRole && userRole !== "buyer") {
      toast.warn("Access denied — Redirecting...");
      setTimeout(() => navigate("/"), 1200);
    }
  }, [userRole, navigate]);

  // 🔄 External cart sync (unchanged)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const updated = JSON.parse(localStorage.getItem("cart_local") || "[]");
        if (updated.length === 0 && cart.length > 0) {
          toast.info("Cart updated externally. Refreshing...");
          clearCart();
        }
      } catch {
        console.warn("Invalid cart JSON in localStorage");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [cart, clearCart]);

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    clearCart();
    toast.info("👋 Logged out successfully");
    setTimeout(() => navigate("/login"), 1200);
  };

  // ✅ Checkout flow
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.warn("🛒 Your cart is empty!");
      return;
    }
    localStorage.setItem("checkoutCart", JSON.stringify(cart));
    localStorage.setItem("checkoutTotal", total.toFixed(2));
    toast.success("✅ Redirecting to checkout...");
    setTimeout(() => navigate("/checkout"), 800);
  };

  // ✅ Remove item
  const handleRemove = (id, name) => {
    if (!window.confirm(`Remove "${name}" from cart?`)) return;
    removeFromCart(id);
    toast.success(`Removed "${name}"`);
  };

  // ✅ Clear cart
  const handleClearCart = () => {
    if (!cart.length) return toast.info("Cart already empty.");
    if (window.confirm("Clear your entire cart?")) {
      clearCart();
      toast.success("Cart cleared.");
    }
  };

  // ✅ Quantity editing (supports stepper + typed input)
  const startEdit = (item) => {
    setEditingId(item.id);
    setQtyInput(String(item.quantity));
  };

  const applyQtyChange = (item) => {
    const newQty = Number(qtyInput);
    if (!Number.isFinite(newQty) || newQty < 0)
      return toast.error("Enter a valid quantity (0 or more).");
    if (typeof updateQuantity === "function") {
      updateQuantity(item.id, newQty);
      toast.success(`Updated "${item.name}" → ${newQty}`);
    }
    setEditingId(null);
    setQtyInput("");
  };

  // Stepper helpers
  const changeQtyBy = (item, delta) => {
    const newQty = Math.max(0, Number(item.quantity) + delta);
    if (typeof updateQuantity === "function") {
      updateQuantity(item.id, newQty);
    }
  };

  // Modal accessibility (escape)
  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && setShowSettings(false);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (showSettings && modalRef.current) {
      const firstButton = modalRef.current.querySelector("button");
      firstButton?.focus();
    }
  }, [showSettings]);

  // Filtered cart view by header search (client-side)
  const visibleCart = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return cart;
    return cart.filter(
      (it) =>
        (it.name || "").toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q)
    );
  }, [cart, query]);

  // motion variants (respect reduced motion)
  const fade = reduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 transition-all duration-500">
      {/* HEADER */}
      <motion.header
  initial={reduceMotion ? {} : { opacity: 0, y: -16 }}
  animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
  transition={{ duration: 0.45 }}
  className="
    bg-white/80 backdrop-blur-xl shadow-md border-b border-green-100
    px-8 py-6 rounded-b-3xl
  "
>
  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

    {/* Left Section — Avatar + Text */}
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
        {displayName ? displayName[0].toUpperCase() : "U"}
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-green-800 tracking-tight">
          Buyer Dashboard
        </h1>
        <p className="text-sm text-green-700/70 -mt-1">
          Welcome back, <span className="font-semibold">{displayName}</span>
        </p>
      </div>
    </div>

    {/* Middle Section — Search */}
    <div className="flex-1 max-w-xl mx-auto w-full">
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items in cart or orders..."
          className="
            w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-200
            shadow-sm focus:ring-2 focus:ring-green-400 text-gray-700
          "
        />
      </div>
    </div>

    {/* Right Section — Buttons */}
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('/marketplace')}
        className="
          bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg
          shadow-sm transition
        "
      >
        Browse Marketplace
      </button>

      <button
        onClick={handleLogout}
        className="
          bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg
          shadow-sm transition
        "
      >
        Logout
      </button>
    </div>

  </div>
</motion.header>



      {/* QUICK ACTIONS */}
      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Marketplace", desc: "Explore fresh produce", emoji: "🛒", onClick: () => navigate("/marketplace") },
            { label: "Order History", desc: "View past orders", emoji: "📜", onClick: () => navigate("/orderhistory") },
            { label: "Profile", desc: "Manage account", emoji: "👤", onClick: () => navigate("/buyerprofile") },
            { label: "Settings", desc: "Preferences & help", emoji: "⚙️", onClick: () => setShowSettings(true) },
          ].map((card, i) => (
            <motion.button
              key={card.label}
              onClick={card.onClick}
              whileHover={reduceMotion ? {} : { scale: 1.03 }}
              className="flex items-start gap-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition text-left"
              aria-label={card.label}
            >
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-2xl">{card.emoji}</div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">{card.label}</div>
                <div className="text-lg font-semibold mt-1 text-gray-800">{card.desc}</div>
              </div>
              <div className="text-green-600 self-start">→</div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* CART */}
      <main className="max-w-5xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-700">🧺 Your Cart</h2>
          <div className="text-sm text-gray-600">{cart.length} item{cart.length !== 1 ? "s" : ""}</div>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <img src="https://via.placeholder.com/300x180?text=Your+cart+is+empty" alt="Empty cart" className="mx-auto mb-6 opacity-80" />
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Your cart is empty</h3>
            <p className="text-gray-500 mb-4">Browse fresh produce from local farmers and add items to your cart.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate("/marketplace")} className="px-4 py-2 bg-green-600 text-white rounded-lg shadow">Browse Marketplace</button>
              <button onClick={() => navigate("/")} className="px-4 py-2 border rounded-lg">Go Home</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Items in your cart</div>
              <div className="flex items-center gap-3">
                <button onClick={handleClearCart} className="text-sm text-red-500 hover:underline">Clear Cart</button>
                <button onClick={() => { localStorage.setItem("savedCart", JSON.stringify(cart)); toast.success("Cart saved locally"); }} className="text-sm px-3 py-2 border rounded">Save Cart</button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {visibleCart.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    <img src={item.image || "https://via.placeholder.com/96"} alt={item.name} className="w-20 h-20 rounded-md object-cover border" />
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{item.name}</div>
                      <div className="text-sm text-gray-500 truncate mt-1">{item.description || ""}</div>
                      <div className="mt-2 text-sm text-gray-600">₹{item.price.toLocaleString()} each</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-end">
                    {/* Stepper or inline edit */}
                    {editingId === item.id ? (
                      <>
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          value={qtyInput}
                          onChange={(e) => setQtyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") applyQtyChange(item);
                            if (e.key === "Escape") { setEditingId(null); setQtyInput(""); }
                          }}
                          className="w-20 px-2 py-1 border rounded text-center"
                          aria-label={`Edit quantity for ${item.name}`}
                        />
                        <button onClick={() => applyQtyChange(item)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Save</button>
                        <button onClick={() => { setEditingId(null); setQtyInput(""); }} className="px-3 py-1 border rounded text-sm">Cancel</button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 bg-gray-50 border rounded px-2 py-1">
                          <button onClick={() => changeQtyBy(item, -1)} aria-label={`Decrease ${item.name}`} className="px-2 py-1 rounded hover:bg-gray-100">-</button>
                          <div className="w-12 text-center font-medium">{item.quantity}</div>
                          <button onClick={() => changeQtyBy(item, 1)} aria-label={`Increase ${item.name}`} className="px-2 py-1 rounded hover:bg-gray-100">+</button>
                        </div>

                        <button onClick={() => startEdit(item)} className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                      </>
                    )}

                    <div className="text-right">
                      <div className="font-semibold text-green-700">
                        ₹{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex gap-3 mt-1 justify-end">
                        <button onClick={() => handleRemove(item.id, item.name)} className="text-sm text-red-500 hover:underline">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Checkout */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="text-sm text-gray-500">Estimated total</div>
                <div className="text-2xl font-bold text-green-700">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button onClick={() => { localStorage.setItem("savedCart", JSON.stringify(cart)); toast.success("Cart saved locally"); }} className="px-4 py-2 border rounded bg-white text-gray-700 hover:shadow">Save Cart</button>
                <button onClick={handleCheckout} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded shadow">Proceed to Checkout</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MOBILE floating checkout bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden z-50">
          <div className="bg-white rounded-xl shadow-lg p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-gray-500">{cart.length} items</div>
              <div className="font-bold text-green-700">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate("/cart")} className="px-4 py-2 border rounded">View Cart</button>
              <button onClick={handleCheckout} className="px-4 py-2 bg-green-600 text-white rounded">Checkout</button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            {...fade}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              ref={modalRef}
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? {} : { scale: 0.96, y: 8 }}
              animate={reduceMotion ? {} : { scale: 1, y: 0 }}
              exit={reduceMotion ? {} : { scale: 0.96, y: 8 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 focus:outline-none"
            >
              <h2 className="text-2xl font-semibold text-green-700 mb-4">⚙️ Settings & Support</h2>
              <div className="space-y-2 text-gray-700">
                <button onClick={() => { navigate("/orderhistory"); setShowSettings(false); }} className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-green-50 flex items-center justify-center">📜</span>
                  <div>
                    <div className="font-medium">Order History</div>
                    <div className="text-sm text-gray-500">View past orders</div>
                  </div>
                </button>

                <button onClick={() => { navigate("/buyerprofile"); setShowSettings(false); }} className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-green-50 flex items-center justify-center">👤</span>
                  <div>
                    <div className="font-medium">Manage Profile</div>
                    <div className="text-sm text-gray-500">Update your details</div>
                  </div>
                </button>

                <button onClick={() => { navigate("/support"); setShowSettings(false); }} className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-green-50 flex items-center justify-center">🧩</span>
                  <div>
                    <div className="font-medium">Help & FAQs</div>
                    <div className="text-sm text-gray-500">Get help & support</div>
                  </div>
                </button>

                <button onClick={() => toast.info("Password reset feature coming soon!")} className="w-full text-left px-4 py-3 rounded hover:bg-gray-50 flex items-center gap-3">
                  <span className="w-8 h-8 rounded bg-green-50 flex items-center justify-center">🔐</span>
                  <div>
                    <div className="font-medium">Change Password</div>
                    <div className="text-sm text-gray-500">Secure your account</div>
                  </div>
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 border rounded">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="text-center py-6 text-gray-500 text-sm border-t border-gray-200">
        © {new Date().getFullYear()} <strong>KrishiSaathi</strong> — Empowering Farmers 🌾
      </footer>
    </div>
  );
};

export default BuyerDashboard;
