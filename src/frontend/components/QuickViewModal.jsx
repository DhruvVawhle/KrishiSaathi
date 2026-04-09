import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { X, ShieldCheck } from "lucide-react";
import QuantityStepper from "./QuantityStepper";

const formatCurrency = (v) =>
    Number(v || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const QuickViewModal = ({ product, onClose, onAddToCart, quantity, onQuantityChange }) => {
    const [imageError, setImageError] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!product) return null;

    const outOfStock = Number(product.quantity || 0) <= 0;
    const maxQty = Math.min(10, Math.max(1, Number(product.quantity || 0)));

    return (
        <motion.div
            className="mp-quickview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(26, 46, 18, 0.4)",
                backdropFilter: "blur(6px)",
                zIndex: 200, // Above everything
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px"
            }}
        >
            <motion.div
                className="mp-quickview-card"
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "#FDFAF4",
                    borderRadius: "24px",
                    width: "100%",
                    maxWidth: "800px",
                    maxHeight: "90vh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "row", // Split pane by default
                    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                    position: "relative"
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "16px",
                        right: "16px",
                        background: "rgba(255,255,255,0.9)",
                        border: "none",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 10,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        color: "#4A4A4A"
                    }}
                    aria-label="Close modal"
                >
                    <X size={20} />
                </button>

                {/* Left: Image Pane */}
                <div style={{
                    width: "45%",
                    background: "#EDD9B0",
                    position: "relative",
                    minHeight: "300px" // For mobile stacking
                }}>
                    {!imageError ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                position: "absolute",
                                inset: 0
                            }}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "linear-gradient(135deg, #2D4F1E, #3D6B2A)",
                            color: "white",
                            fontFamily: "Caveat, cursive",
                            fontSize: "24px",
                            padding: "20px",
                            textAlign: "center"
                        }}>
                            🌿 {product.name}
                        </div>
                    )}
                    {product.badge === "Organic" && (
                        <span style={{
                            position: "absolute",
                            top: "20px",
                            left: "20px",
                            background: "#2D4F1E",
                            padding: "6px 12px",
                            borderRadius: "999px",
                            fontFamily: "Caveat, cursive",
                            color: "white",
                            fontSize: "14px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                        }}>
                            🌱 Certified Organic
                        </span>
                    )}
                </div>

                {/* Right: Details Pane */}
                <div style={{
                    width: "55%",
                    padding: "40px",
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto" // Allow scrolling if description is very long
                }}>
                    <div style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#E27D60",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "8px"
                    }}>
                        {product.category}
                    </div>

                    <h2 style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "#2D4F1E",
                        margin: "0 0 16px 0",
                        lineHeight: 1.2
                    }}>
                        {product.name}
                    </h2>

                    <div style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "8px",
                        marginBottom: "24px"
                    }}>
                        <span style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "28px",
                            fontWeight: 700,
                            color: "#2D4F1E"
                        }}>
                            {formatCurrency(product.price)}
                        </span>
                        <span style={{
                            fontFamily: "DM Sans, sans-serif",
                            fontSize: "15px",
                            color: "#7A7A7A"
                        }}>
                            / {product.unit}
                        </span>
                    </div>

                    <p style={{
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: "16px",
                        color: "#4A4A4A",
                        lineHeight: 1.6,
                        margin: "0 0 32px 0",
                        flexGrow: 1
                    }}>
                        {product.description || "Fresh, local produce sourced directly from farmers."}
                    </p>

                    {/* Guarantees */}
                    <div style={{
                        display: "flex",
                        gap: "16px",
                        marginBottom: "32px",
                        padding: "16px",
                        background: "#F5E6CC",
                        borderRadius: "12px",
                        border: "1px solid #EDD9B0"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2D4F1E", fontSize: "14px", fontFamily: "DM Sans, sans-serif", fontWeight: 500 }}>
                            <ShieldCheck size={18} color="#4CAF50" /> Farm Fresh Guarantee
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontFamily: "DM Sans, sans-serif", fontSize: "14px", fontWeight: 600, color: "#4A4A4A" }}>
                            <span>Quantity</span>
                            <span style={{ color: outOfStock ? "#FF5252" : "#4CAF50" }}>
                                {outOfStock ? "Out of Stock" : `${product.quantity} available`}
                            </span>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            <div style={{ flex: "0 0 120px" }}>
                                <QuantityStepper
                                    value={outOfStock ? 0 : quantity}
                                    onChange={onQuantityChange}
                                    max={maxQty}
                                />
                            </div>

                            <button
                                onClick={() => { if (!outOfStock) onAddToCart(product) }}
                                disabled={outOfStock}
                                style={{
                                    flex: 1,
                                    background: outOfStock ? "#e0e0e0" : "linear-gradient(135deg, #E27D60, #C26347)",
                                    color: outOfStock ? "#9e9e9e" : "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontFamily: "DM Sans, sans-serif",
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    cursor: outOfStock ? "not-allowed" : "pointer",
                                    transition: "all 0.2s",
                                    boxShadow: outOfStock ? "none" : "0 4px 12px rgba(226, 125, 96, 0.3)"
                                }}
                                onMouseEnter={(e) => {
                                    if (!outOfStock) e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    if (!outOfStock) e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                {outOfStock ? "Unavailable" : `Add to Cart — ${formatCurrency((Number(product.price) || 0) * quantity)}`}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Inline responsive style for modal split */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media (max-width: 768px) {
                        .mp-quickview-card {
                            flex-direction: column !important;
                            max-height: 95vh !important;
                        }
                        .mp-quickview-card > div:first-of-type {
                            width: 100% !important;
                            height: 250px !important;
                            min-height: 250px !important;
                        }
                        .mp-quickview-card > div:last-of-type {
                            width: 100% !important;
                            padding: 24px !important;
                        }
                    }
                `}} />
            </motion.div>
        </motion.div>
    );
};

export default QuickViewModal;
