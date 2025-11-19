// src/components/CartSidebar.jsx
import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
// Adjust this import path to your project's cart context
import { useCart } from "../contexts/CartContext";

/**
 * CartSidebar (final upgraded)
 *
 * - Glassmorphic floating drawer
 * - Premium item cards with hover lift and subtle shadows
 * - Accessible controls and focus states
 * - Respect prefers-reduced-motion
 * - Safe fallbacks for missing cart API methods (no-op + toast)
 *
 * Props:
 *   open (bool) - whether drawer is visible
 *   onClose (fn)  - close callback
 */

const IMAGE_FALLBACK = "https://via.placeholder.com/320x240?text=No+image";

export default function CartSidebar({ open, onClose }) {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();

  // Cart context (expected shape)
  const cartCtx = useCart?.() ?? {};
  const cart = cartCtx.cart ?? [];
  const updateQuantity = cartCtx.updateQuantity ?? (() => toast.info("updateQuantity not implemented"));
  const removeFromCart = cartCtx.removeFromCart ?? (() => toast.info("removeFromCart not implemented"));
  const clearCart = cartCtx.clearCart ?? (() => toast.info("clearCart not implemented"));
  const addToCart = cartCtx.addToCart ?? (() => toast.info("addToCart not implemented"));

  // Derived values
  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0),
    [cart]
  );
  const itemCount = useMemo(() => cart.reduce((s, it) => s + (Number(it.quantity || 0) || 0), 0), [cart]);

  // lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Helpers
  const safeUpdateQty = (id, qty) => {
    const next = Math.max(0, Math.floor(Number(qty) || 0));
    try {
      updateQuantity(id, next);
    } catch (e) {
      toast.error("Unable to update quantity");
    }
  };

  const handleIncrement = (item) => safeUpdateQty(item.id, (Number(item.quantity || 0) + 1));
  const handleDecrement = (item) => safeUpdateQty(item.id, (Number(item.quantity || 0) - 1));
  const handleRemove = (item) => {
    if (!window.confirm(`Remove "${item.name}" from cart?`)) return;
    try {
      removeFromCart(item.id);
      toast.success(`${item.name} removed`);
    } catch (e) {
      toast.error("Could not remove item");
    }
  };
  const handleClear = () => {
    if (!cart.length) return toast.info("Cart already empty");
    if (!window.confirm("Clear your cart?")) return;
    try {
      clearCart();
      toast.success("Cart cleared");
    } catch (e) {
      toast.error("Could not clear cart");
    }
  };

  const goToCheckout = () => {
    if (!cart.length) {
      toast.warn("Your cart is empty");
      return;
    }
    onClose?.();
    navigate("/checkout");
  };

  // Motion variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  const panelVariants = {
    hidden: { x: "100%", opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 240, damping: 28 } },
    exit: { x: "100%", opacity: 0, transition: { duration: 0.18 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8, transition: { duration: 0.12 } },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={reduceMotion ? {} : backdropVariants}
            onClick={() => onClose?.()}
            aria-hidden
          />

          {/* Drawer */}
          <motion.aside
            role="dialog"
            aria-label="Shopping cart"
            className="fixed right-0 top-0 bottom-0 z-60 w-full sm:w-[460px] p-4"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={reduceMotion ? {} : panelVariants}
          >
            <div
              className="h-full rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.72))",
                backdropFilter: "blur(14px)",
                border: "1px solid rgba(255,255,255,0.65)",
                boxShadow: "0 12px 40px rgba(2,6,23,0.12)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* Header */}
              <header className="flex items-center justify-between px-5 py-4 border-b border-green-50">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-green-700 text-xl shadow-sm">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Your Cart</div>
                    <div className="text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? "s" : ""}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClear}
                    className="text-sm px-3 py-2 rounded-md hover:bg-gray-100 text-gray-600"
                    title="Clear cart"
                  >
                    Clear
                  </button>

                  <button
                    onClick={() => onClose?.()}
                    aria-label="Close cart"
                    className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-gray-100"
                  >
                    <X size={18} />
                  </button>
                </div>
              </header>

              {/* Progress Tag */}
              <div className="px-5 py-3 border-b border-green-50">
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-[11px]">1</div>
                    <div>Items</div>
                  </div>
                  <div className="text-gray-300">→</div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px]">2</div>
                    <div>Review</div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-gray-400 ml-auto">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px]">3</div>
                    <div>Payment</div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 overflow-y-auto" style={{ flex: "1 1 auto" }}>
                {cart.length === 0 ? (
                  <div className="min-h-[260px] flex flex-col items-center justify-center gap-4 text-center px-4">
                    <div className="w-28 h-28 rounded-full bg-green-50 flex items-center justify-center text-green-700 text-3xl">🧺</div>
                    <div className="text-lg font-semibold text-gray-800">Your cart is empty</div>
                    <p className="text-sm text-gray-500 max-w-[60%]">Add fresh produce from the marketplace to see your items here.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onClose?.(); navigate("/marketplace"); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white shadow-sm"
                      >
                        Browse Marketplace <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() => { onClose?.(); navigate("/"); }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md border"
                      >
                        Home
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <motion.article
                        key={item.id}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={reduceMotion ? {} : itemVariants}
                        className="flex gap-3 items-start p-3 bg-white rounded-2xl shadow-[0_6px_18px_rgba(2,6,23,0.04)]"
                      >
                        <img
                          src={item.image || IMAGE_FALLBACK}
                          onError={(e) => { e.target.onerror = null; e.target.src = IMAGE_FALLBACK; }}
                          alt={item.name}
                          className="w-24 h-20 rounded-lg object-cover border"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 truncate">{item.name}</div>
                              <div className="text-sm text-gray-500 truncate mt-0.5">{item.description || ""}</div>
                              {item.quantity && Number(item.quantity) <= 5 && Number(item.quantity) > 0 && (
                                <div className="mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-xs font-semibold">Low stock</span>
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <div className="text-green-700 font-bold">₹{Number(item.price || 0).toLocaleString()}</div>
                              <div className="text-xs text-gray-400">/ {item.unit || "unit"}</div>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            {/* Quantity control */}
                            <div className="flex items-center gap-2 bg-white rounded-lg border px-2 py-1">
                              <button
                                onClick={() => handleDecrement(item)}
                                aria-label={`Decrease quantity of ${item.name}`}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <Minus size={14} />
                              </button>

                              <div className="w-12 text-center font-medium">{item.quantity}</div>

                              <button
                                onClick={() => handleIncrement(item)}
                                aria-label={`Increase quantity of ${item.name}`}
                                className="p-1 rounded hover:bg-gray-100"
                              >
                                <Plus size={14} />
                              </button>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRemove(item)}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} /> Remove
                              </button>

                              <button
                                onClick={() => { addToCart(item, 1); toast.success("Added one more"); }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-md border text-sm"
                              >
                                + Add
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="px-5 py-4 border-t" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.8))" }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-gray-500">Subtotal</div>
                    <div className="text-lg font-bold text-green-700">₹{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <div>Est. delivery</div>
                    <div className="font-medium">2–4 days</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={goToCheckout}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold shadow-sm"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={() => { onClose?.(); navigate("/cart"); }}
                    className="w-full py-2 rounded-md border border-gray-200 bg-white text-gray-700"
                  >
                    View full cart
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} />
                    <span>Secure payments</span>
                  </div>
                  <div>Free delivery over ₹499</div>
                </div>
              </footer>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
