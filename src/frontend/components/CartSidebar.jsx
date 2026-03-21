import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/frontend/contexts/CartContext";
import "./CartSidebar.css";

const IMAGE_FALLBACK = "https://via.placeholder.com/320x240?text=No+image";
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_FEE = 40;

export default function CartSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const itemsEndRef = useRef(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isClearing, setIsClearing] = useState(false);
  const [clearJustHappened, setClearJustHappened] = useState(false);
  const countdownRef = useRef(null);

  const cartCtx = useCart();
  const cartItems = cartCtx?.cart || [];
  const updateQuantity = cartCtx?.updateQuantity || (() => { });
  const removeFromCart = cartCtx?.removeFromCart || (() => { });
  const clearCart = cartCtx?.clearCart || (() => { });

  /* Computed values */
  const itemCount = cartItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );
  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const deliveryProgress = Math.min(
    (subtotal / FREE_DELIVERY_THRESHOLD) * 100,
    100
  );

  /* Lock body scroll */
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* Clear All handlers */
  const handleClearClick = () => {
    setShowConfirm(true);
    setCountdown(5);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setShowConfirm(false);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConfirmClear = () => {
    clearInterval(countdownRef.current);
    setShowConfirm(false);
    setIsClearing(true);
    setClearJustHappened(true);

    setTimeout(() => {
      clearCart();
      setIsClearing(false);
    }, cartItems.length * 40 + 300);

    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleCancelClear = () => {
    clearInterval(countdownRef.current);
    setShowConfirm(false);
    setCountdown(5);
  };

  /* Cleanup interval */
  useEffect(() => {
    return () => clearInterval(countdownRef.current);
  }, []);

  /* Reset clearJustHappened when new items added */
  useEffect(() => {
    if (cartItems.length > 0) {
      setClearJustHappened(false);
    }
  }, [cartItems.length]);

  /* Scroll to bottom on new item */
  useEffect(() => {
    if (cartItems.length > 0 && !isClearing) {
      itemsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [cartItems.length, isClearing]);

  /* Action Helpers */
  const handleIncrement = (item) => {
    updateQuantity(item.id, (Number(item.quantity) || 0) + 1);
  };
  const handleDecrement = (item) => {
    updateQuantity(item.id, Math.max(1, (Number(item.quantity) || 0) - 1));
  };
  const handleRemove = (item) => {
    removeFromCart(item.id);
  };

  const goToCheckout = () => {
    window.dispatchEvent(new CustomEvent("close-cart"));
    onClose?.();
    setTimeout(() => navigate("/checkout"), 350);
  };

  if (!open) return null;

  return (
    <div className="cs-wrapper">
      <div className="cs-backdrop" onClick={() => { window.dispatchEvent(new CustomEvent("close-cart")); onClose?.(); }} />
      <aside className="cs-drawer">
            {/* SECTION 1 - HEADER */}
            <header className="cs-header">
              <AnimatePresence mode="wait">
                {!showConfirm ? (
                  <motion.div
                    key="header-default"
                    className="cs-header-content"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="cs-header-left">
                      <ShoppingCart size={20} color="white" />
                      <span className="cs-header-title">Cart</span>
                      {itemCount > 0 && (
                        <span className="cs-header-badge">{itemCount}</span>
                      )}
                    </div>
                    <div className="cs-header-right">
                      {cartItems.length > 0 && (
                        <button
                          className="cs-clear-all-btn"
                          onClick={handleClearClick}
                        >
                          <Trash2 size={13} color="#E27D60" />
                          <span>Clear All</span>
                        </button>
                      )}
                      <button className="cs-close-btn" onClick={() => { window.dispatchEvent(new CustomEvent("close-cart")); onClose?.(); }}>
                        <X size={16} color="white" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="header-confirm"
                    className="cs-header-content cs-header-confirm"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="cs-header-left">
                      <span className="cs-confirm-text">Remove all items?</span>
                    </div>
                    <div className="cs-header-right">
                      <button
                        className="cs-confirm-yes-btn"
                        onClick={handleConfirmClear}
                      >
                        Yes, clear ({countdown})
                      </button>
                      <button
                        className="cs-confirm-cancel-btn"
                        onClick={handleCancelClear}
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {/* SECTION 2 - DELIVERY BAR */}
            <div className="cs-delivery-bar">
              <span className="cs-delivery-icon">🚚</span>
              <span className="cs-delivery-text">
                {subtotal < FREE_DELIVERY_THRESHOLD
                  ? `₹${Math.ceil(
                    FREE_DELIVERY_THRESHOLD - subtotal
                  )} away from free delivery`
                  : "🎉 Free delivery unlocked!"}
              </span>
              <div className="cs-delivery-progress-bg">
                <div
                  className="cs-delivery-progress-fill"
                  style={{
                    width: `${Math.min(deliveryProgress, 100)}%`,
                    background:
                      subtotal >= FREE_DELIVERY_THRESHOLD
                        ? "#4CAF50"
                        : "#E27D60",
                  }}
                />
              </div>
            </div>

            {/* SECTION 3 - ITEMS LIST */}
            <div className="cs-items-area">
              {cartItems.length === 0 ? (
                <div className="cs-empty-state">
                  <span className="cs-empty-emoji">🛒</span>
                  <h3 className="cs-empty-heading">
                    {clearJustHappened
                      ? "Looks like you cleared everything"
                      : "Your cart is empty"}
                  </h3>
                  <p className="cs-empty-subtext">
                    {clearJustHappened
                      ? "Add fresh produce from marketplace"
                      : "Add items from the marketplace"}
                  </p>
                  <button
                    className="cs-empty-browse-btn"
                    onClick={() => {
                      onClose?.();
                      navigate("/marketplace");
                    }}
                  >
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                <div className="cs-items-list">
                  {cartItems.map((item, index) => {
                    const qty = Number(item.quantity) || 0;
                    const price = Number(item.price) || 0;
                    const lineTotal = price * qty;

                    return (
                      <div key={item.id} className="cs-item-card">
                        <img
                          src={item.image || IMAGE_FALLBACK}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = IMAGE_FALLBACK;
                          }}
                          alt={item.name}
                          className="cs-item-image"
                        />

                        <div className="cs-item-info">
                          <div className="cs-item-name">{item.name}</div>
                          <div className="cs-item-unit-price">
                            {item.unit || "unit"} · ₹{price}/
                            {item.unit || "unit"}
                          </div>
                        </div>

                        <div className="cs-qty-stepper">
                          <button
                            className="cs-qty-btn cs-qty-minus"
                            onClick={() => handleDecrement(item)}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="cs-qty-count">{qty}</span>
                          <button
                            className="cs-qty-btn cs-qty-plus"
                            onClick={() => handleIncrement(item)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="cs-item-actions">
                          <div className="cs-item-line-total">₹{lineTotal}</div>
                          <button
                            className="cs-remove-btn"
                            onClick={() => handleRemove(item)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={itemsEndRef} />
                </div>
              )}
            </div>

            {/* SECTION 4 - SUMMARY */}
            {cartItems.length > 0 && (
              <div className="cs-summary">
                <div className="cs-summary-row">
                  <span className="cs-summary-label">Subtotal</span>
                  <span className="cs-summary-value-sub">₹{subtotal}</span>
                </div>

                <div className="cs-summary-row">
                  <span className="cs-summary-label">Delivery</span>
                  {subtotal >= FREE_DELIVERY_THRESHOLD ? (
                    <span className="cs-summary-free">FREE 🎉</span>
                  ) : (
                    <span className="cs-summary-value-del">₹{DELIVERY_FEE}</span>
                  )}
                </div>

                <div className="cs-divider" />

                <div className="cs-summary-row-total">
                  <span className="cs-total-label">Total</span>
                  <span className="cs-total-value">₹{total}</span>
                </div>

                <button className="cs-checkout-btn" onClick={goToCheckout}>
                  Checkout →
                </button>
              </div>
            )}
      </aside>
    </div>
  );
}