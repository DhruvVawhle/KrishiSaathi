import React, { useState, useEffect, useRef, memo } from 'react';
import { Eye, Package, ShoppingCart, Check } from "lucide-react";
import QuantityStepper from "./QuantityStepper";
import Button from "./ui/Button";
import { imagePresets } from '@/frontend/utils/imageHelper';

const formatCurrency = (v) =>
    Number(v || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const getCategoryEmoji = (category) => ({
    'Vegetables': '🥦',
    'Fruits': '🍎',
    'Grains': '🌾',
    'Pulses': '🫘',
    'Dairy': '🥛',
    'Herbs': '🌿',
    'Oils': '🫙',
    'Dry Fruits': '🥜',
    'Grocery': '🛒',
    'Organic': '✅',
}[category] || '🌿');

// Price category badge
const getPriceBadge = (product) => {
  const category = product.priceCategory || 'unknown'
  const badges = {
    below_mandi: {
      label: '🟢 Best Deal',
      color: '#4CAF50',
      bg: 'rgba(76,175,80,0.12)'
    },
    at_mandi: {
      label: '🟡 Fair Price',
      color: '#2D4F1E',
      bg: 'rgba(45,79,30,0.08)'
    },
    above_mandi: {
      label: '🟠 Above Mandi',
      color: '#E27D60',
      bg: 'rgba(226,125,96,0.10)'
    },
    premium: {
      label: '💎 Premium',
      color: '#C96848',
      bg: 'rgba(201,104,72,0.10)'
    }
  }
  return badges[category] || null
}

// Grade badge
const getGradeBadge = (grade) => {
  const grades = {
    organic: '🌿 Organic',
    premium: '💎 Premium',
    a_grade: '⭐ A Grade',
    export_quality: '✈️ Export',
    farm_fresh: '🌱 Fresh',
    b_grade: 'B Grade',
    local: 'Local'
  }
  return grades[grade] || grade
}


const ProductImage = ({ src, name, category }) => {
    const [status, setStatus] = useState('loading');

    return (
        <div style={{
            position: 'relative',
            height: '220px',
            background: '#EDD9B0',
            overflow: 'hidden',
            borderRadius: '16px 16px 0 0'
        }}>

            {/* Shimmer skeleton while loading */}
            {status === 'loading' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(90deg, #EDD9B0 0%, #F5E6CC 50%, #EDD9B0 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                }} />
            )}

            {/* Real image */}
            <img
                src={imagePresets.card(src)}
                alt={name}
                loading="lazy"
                style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    opacity: status === 'loaded' ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                    position: 'absolute', inset: 0
                }}
                onLoad={() => setStatus('loaded')}
                onError={(e) => {
                    setStatus('error');
                    console.warn(`❌ Image failed: ${name} → ${src}`);
                }}
            />

            {/* Fallback — only on real error */}
            {status === 'error' && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, #2D4F1E, #1A2E12)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '40px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                        {getCategoryEmoji(category)}
                    </span>
                    <span style={{
                        color: 'white',
                        fontFamily: 'Caveat, cursive',
                        fontSize: '18px',
                        letterSpacing: '0.5px'
                    }}>
                        {name}
                    </span>
                </div>
            )}
        </div>
    );
};

const MarketProductCard = memo(({
    product,
    quantity = 1,
    onQuantityChange,
    onAddToCart,
    onQuickView,
    isAdded = false,
    isOwner = false,
    editState = {},
    onStartEdit,
    onCancelEdit,
    onEditField,
    onSaveEdit,
    onIncrementStock,
    index = 0,
}) => {
    const cardRef = useRef(null);

    useEffect(() => {
        let timer;
        const handleMouseEnter = () => {
            timer = setTimeout(() => {
                try {
                    const uid = JSON.parse(localStorage.getItem('ks_user'))?.uid;
                    if (!uid) return;

                    const key = `ks_browsed_${uid}`;
                    const existing = JSON.parse(localStorage.getItem(key) || '[]');
                    const updated = [
                        product.category,
                        ...existing.filter(c => c !== product.category)
                    ].slice(0, 5); // keep last 5 categories

                    localStorage.setItem(key, JSON.stringify(updated));
                } catch { }
            }, 3000); // 3 seconds hover = interested
        };

        const handleMouseLeave = () => {
            clearTimeout(timer);
        };

        const card = cardRef.current;
        if (card) {
            card.addEventListener('mouseenter', handleMouseEnter);
            card.addEventListener('mouseleave', handleMouseLeave);
        }

        return () => {
            clearTimeout(timer);
            if (card) {
                card.removeEventListener('mouseenter', handleMouseEnter);
                card.removeEventListener('mouseleave', handleMouseLeave);
            }
        };
    }, [product.category]);

    const outOfStock = Number(product.quantity || 0) <= 0;
    const lowStock = Number(product.quantity || 0) > 0 && Number(product.quantity || 0) < 20;
    const totalPrice = (Number(product.price) || 0) * (quantity || 1);
    const maxQty = Math.min(10, Math.max(1, Number(product.quantity || 0)));

    // Local added flash state — resets after 1.5s
    const [added, setAdded] = useState(false);
    const handleAddToCart = () => {
        if (outOfStock || added) return;
        onAddToCart(product);
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
    };

    return (
        <article ref={cardRef} className={`mp-card ${outOfStock ? 'out-of-stock' : ''}`}>
            {/* Image Area */}
            <div className="mp-card-image-wrap">
                <ProductImage src={product.image} name={product.name} category={product.category} />

                {/* Organic badge */}
                {product.badge === "Organic" && (
                    <span style={{
                        position: "absolute", top: 12, right: 12,
                        background: "#2D4F1E", padding: "4px 10px",
                        borderRadius: 999, fontSize: 11, fontFamily: "Caveat, cursive",
                        color: "white", zIndex: 10,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                    }}>
                        🌱 Organic
                    </span>
                )}

                {/* Stock badge */}
                <span className="mp-card-stock-badge">
                    {outOfStock ? "Out of stock" : `${product.quantity} ${product.unit ?? "unit"}`}
                </span>

                {/* Quick view eye (Hover triggered by CSS) */}
                <button
                    className="mp-card-quickview"
                    onClick={(e) => { e.stopPropagation(); onQuickView?.(product); }}
                    aria-label={`Quick view ${product.name}`}
                >
                    <Eye size={18} strokeWidth={2.5} />
                </button>

                {/* Owner badge */}
                {isOwner && (
                    <span style={{
                        position: "absolute", bottom: 12, left: 12,
                        background: "rgba(253, 250, 244, 0.95)", padding: "4px 10px",
                        borderRadius: 999, fontSize: 11, fontWeight: 700,
                        color: "#2D4F1E", boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                        fontFamily: "DM Sans, sans-serif"
                    }}>
                        Your product
                    </span>
                )}
            </div>

            {/* Body Area */}
            <div className="mp-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 className="mp-card-name" title={product.name}>{product.name}</h3>
                </div>

                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                    {/* Grade badge */}
                    {product.grade && product.grade !== 'local' && (
                        <span style={{
                            fontFamily: 'DM Sans', fontSize: 10, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 999,
                            background: '#F5E6CC', color: '#2D4F1E', border: '1px solid #EDD9B0'
                        }}>
                            {getGradeBadge(product.grade)}
                        </span>
                    )}

                    {/* Price category badge */}
                    {(() => {
                        const badge = getPriceBadge(product)
                        return badge ? (
                            <span style={{
                                fontFamily: 'DM Sans', fontSize: 10, fontWeight: 700,
                                padding: '2px 8px', borderRadius: 999,
                                background: badge.bg, color: badge.color
                            }}>
                                {badge.label}
                            </span>
                        ) : null
                    })()}
                </div>

                <p className="mp-card-desc">{product.description || ""}</p>


                {/* Price Row */}
                <div className="mp-card-price-row">
                    <span className="mp-card-price">{formatCurrency(totalPrice)}</span>
                    <span className="mp-card-price-unit">/ {quantity > 1 ? `${quantity} × ` : ""}{product.unit || "unit"}</span>
                </div>

                {/* Mandi comparison */}
                {product.mandiRate && (
                    <div style={{
                        fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A',
                        marginTop: 2, marginBottom: 8
                    }}>
                        Mandi: ₹{product.mandiRate}/kg
                        {product.priceDiffPercent !== 0 && (
                            <span style={{
                                marginLeft: 4,
                                color: product.priceDiffPercent < 0 ? '#4CAF50' : '#E27D60',
                                fontWeight: 700
                            }}>
                                ({product.priceDiffPercent > 0 ? '+' : ''}{product.priceDiffPercent}%)
                            </span>
                        )}
                    </div>
                )}


                {/* Owner Edit Mode */}
                {isOwner && editState.editing ? (
                    <div className="mp-edit-grid">
                        <span className="mp-edit-label">Price</span>
                        <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editState.price}
                            onChange={(e) => onEditField(product.id, "price", e.target.value)}
                            className="mp-edit-input"
                        />
                        <span className="mp-edit-label">Qty</span>
                        <input
                            type="number"
                            min="0"
                            value={editState.quantity}
                            onChange={(e) => onEditField(product.id, "quantity", e.target.value)}
                            className="mp-edit-input"
                        />
                    </div>
                ) : (
                    <>
                        {/* Stock status inline */}
                        <div className="mp-stock-qty-wrapper">
                            <div className={`mp-card-stock-info ${outOfStock ? "out" : lowStock ? "low" : ""}`}>
                                <Package size={14} />
                                <span>
                                    {outOfStock
                                        ? "Currently unavailable"
                                        : lowStock
                                            ? `Only ${product.quantity} ${product.unit || "unit"} left!`
                                            : `In Stock: ${product.quantity} ${product.unit || "unit"}`
                                    }
                                </span>
                            </div>

                            {/* Qty stepper (non-owner only) */}
                            {!isOwner && !outOfStock && (
                                <div className="mp-qty-row">
                                    <span className="mp-qty-label">Qty</span>
                                    <QuantityStepper
                                        value={quantity}
                                        onChange={onQuantityChange}
                                        max={maxQty}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Actions Row */}
                {isOwner ? (
                    editState.editing ? (
                        <div className="flex flex-col gap-2 mt-2">
                            <Button
                                size="sm"
                                fullWidth
                                variant="primary"
                                onClick={() => onSaveEdit(product.id)}
                                loading={editState.saving}
                            >
                                Save Changes
                            </Button>
                            <Button
                                size="sm"
                                fullWidth
                                variant="ghost"
                                onClick={() => onCancelEdit(product.id)}
                                style={{ border: '1px solid #EDD9B0' }}
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2 mt-2">
                            <Button
                                size="sm"
                                className="flex-1"
                                variant="ghost"
                                onClick={() => onStartEdit(product)}
                                style={{ border: '1px solid #EDD9B0' }}
                            >
                                Edit Product
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => onIncrementStock(product)}
                                title="Quick Add +1 Stock"
                            >
                                +1
                            </Button>
                        </div>
                    )
                ) : (
                    <Button
                        fullWidth
                        variant={outOfStock ? "ghost" : added ? "success" : "primary"}
                        onClick={handleAddToCart}
                        disabled={outOfStock || added}
                        loading={added}
                        icon={outOfStock ? null : added ? <Check size={16} /> : <ShoppingCart size={16} />}
                        className={outOfStock ? "opacity-50 grayscale cursor-not-allowed" : ""}
                    >
                        {outOfStock ? "Out of Stock" : added ? "Added!" : "Add to Cart"}
                    </Button>
                )}
            </div>
        </article>
    );
});

MarketProductCard.displayName = "MarketProductCard";

export default MarketProductCard;
