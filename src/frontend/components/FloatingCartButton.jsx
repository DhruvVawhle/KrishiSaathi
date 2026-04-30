// src/frontend/components/FloatingCartButton.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/frontend/contexts/CartContext";
import "./FloatingCartButton.css";

const formatSubtotal = (v) =>
    "₹" +
    Number(v || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
    });

/* ── Pulse‑ring sub‑component ── */
const PulseRings = () => (
    <>
        {[0, 0.15].map((delay, i) => (
            <motion.span
                key={i}
                className="fcb-pulse-ring"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.4 }}
                transition={{ duration: 0.6, ease: "easeOut", delay }}
            />
        ))}
    </>
);

export default function FloatingCartButton({ onOpen }) {
    const cartCtx = useCart?.() ?? {};
    const cart = cartCtx.cart ?? [];
    const total = cartCtx.total ?? 0;

    const itemCount = cart.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
    );
    const isEmpty = itemCount === 0;

    const [isPulsing, setIsPulsing] = useState(false);
    const [isWiggling, setIsWiggling] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const prevCount = useRef(itemCount);

    // Pulse when count INCREASES (item added), not on remove
    useEffect(() => {
        if (itemCount > prevCount.current) {
            setIsPulsing(true);
            const t = setTimeout(() => setIsPulsing(false), 700);
            prevCount.current = itemCount;
            return () => clearTimeout(t);
        }
        prevCount.current = itemCount;
    }, [itemCount]);

    const handleClick = () => {
        if (isEmpty) {
            setIsWiggling(true);
            setTimeout(() => setIsWiggling(false), 400);
        }
        onOpen?.();
    };

    return (
        <motion.button
            layout
            onClick={handleClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={
                isEmpty
                    ? "Your cart is empty"
                    : `Cart: ${itemCount} item${itemCount > 1 ? "s" : ""}, ${formatSubtotal(total)}`
            }
            title=""
            className={`fcb-btn ${isEmpty ? "fcb-btn--empty" : "fcb-btn--has-items"}`}
            animate={{
                rotate: isWiggling ? [-8, 8, -4, 4, 0] : 0,
            }}
            transition={{
                layout: { type: "spring", stiffness: 400, damping: 30, duration: 0.35 },
                rotate: { duration: 0.4, ease: "easeInOut" },
            }}
        >
            {/* ── Pulse rings ── */}
            <AnimatePresence>{isPulsing && <PulseRings />}</AnimatePresence>

            {/* ── Tooltip (desktop, empty only) ── */}
            <AnimatePresence>
                {showTooltip && isEmpty && (
                    <motion.span
                        className="fcb-tooltip"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2 }}
                    >
                        Your cart is empty
                    </motion.span>
                )}
            </AnimatePresence>

            {/* ── Cart icon ── */}
            <motion.div
                className="fcb-icon-wrap"
                animate={{ scale: isPulsing ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3, type: "tween", ease: "easeInOut" }}
            >
                <ShoppingCart size={isEmpty ? 22 : 18} />
            </motion.div>

            {/* ── Text block (only when has items) ── */}
            <AnimatePresence>
                {!isEmpty && (
                    <motion.div
                        className="fcb-text"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.25, delay: 0.1 }}
                    >
                        <span className="fcb-text-count">
                            {itemCount} item{itemCount > 1 ? "s" : ""}
                        </span>
                        <span className="fcb-text-subtotal">{formatSubtotal(total)}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Badge (only when has items) ── */}
            <AnimatePresence>
                {!isEmpty && (
                    <motion.span
                        className="fcb-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                        {itemCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
