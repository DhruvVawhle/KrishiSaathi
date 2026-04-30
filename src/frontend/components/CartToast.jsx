// src/frontend/components/CartToast.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, X } from "lucide-react";
import "./CartSidebar.css";

/**
 * CartToast — Fires when an item is added to cart.
 * Listens for the custom "cart-toast" event on window.
 * Auto-dismisses after 3 seconds.
 * Prevents duplicate toasts by replacing existing toast immediately.
 * Hides completely when the cart sidebar is open.
 */
const CartToast = () => {
    const [toast, setToast] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const toastTimerRef = useRef(null);

    // Track cart open/close state via custom events
    useEffect(() => {
        const handleCartOpen = () => setIsCartOpen(true);
        const handleCartClose = () => setIsCartOpen(false);

        window.addEventListener("open-cart", handleCartOpen);
        // CartSidebar fires close via onClose which calls setCartOpen(false) in App.jsx
        // We listen for a "close-cart" event dispatched when backdrop/X is clicked
        window.addEventListener("close-cart", handleCartClose);
        return () => {
            window.removeEventListener("open-cart", handleCartOpen);
            window.removeEventListener("close-cart", handleCartClose);
        };
    }, []);

    const dismissToast = useCallback(() => {
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
            toastTimerRef.current = null;
        }
        setToast(null);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            const { productName, productImage, qty } = e.detail || {};

            // Clear any existing timer
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
                toastTimerRef.current = null;
            }

            // Replace toast immediately (no stacking)
            setToast({
                productName: productName || "Item",
                productImage: productImage || null,
                qty: qty || 1,
                id: Date.now()
            });

            // Set auto-dismiss timer
            toastTimerRef.current = setTimeout(() => {
                dismissToast();
            }, 3000);
        };

        window.addEventListener("cart-toast", handler);
        return () => window.removeEventListener("cart-toast", handler);
    }, [dismissToast]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    // Don't render toast if cart sidebar is open
    if (isCartOpen) return null;

    return (
        <AnimatePresence mode="wait">
            {toast && (
                <motion.div
                    className="cs-toast"
                    initial={{ x: 320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 320, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="cs-toast-card">
                        <div className="cs-toast-icon">
                            <CheckCircle size={20} />
                        </div>
                        <div className="cs-toast-content">
                            <div className="cs-toast-title">Added to cart!</div>
                            <div className="cs-toast-product">
                                {toast.productName}
                                {toast.qty > 1 && ` (×${toast.qty})`}
                            </div>
                        </div>
                        <button className="cs-toast-close" onClick={dismissToast} aria-label="Dismiss">
                            <X size={14} />
                        </button>
                        <div className="cs-toast-progress">
                            <div className="cs-toast-progress-fill" />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CartToast;
