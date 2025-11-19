// ✅ src/components/ProductCard.jsx (Enhanced v2)
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShoppingCart, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function ProductCard({ product, refreshProducts = () => {} }) {
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const id = product?._id ?? product?.id;

  // ✅ Ensure valid quantity
  useEffect(() => {
    if (product?.quantity && selectedQty > product.quantity)
      setSelectedQty(product.quantity);
  }, [product, selectedQty]);

  /** 🔄 Local Cart Update Utility */
  const updateLocalCart = (addedProduct, qty) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const pid = addedProduct._id || addedProduct.id;
    const updatedCart = cart.some((item) => item.id === pid)
      ? cart.map((item) =>
          item.id === pid
            ? { ...item, quantity: (item.quantity || 0) + qty }
            : item
        )
      : [
          ...cart,
          {
            id: pid,
            name: addedProduct.name,
            price: addedProduct.price,
            unit: addedProduct.unit,
            quantity: qty,
            image: addedProduct.image,
          },
        ];
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent("cart-updated"));
  };

  /** 🛒 Add to Cart */
  const handleAddToCart = async () => {
    if (adding) return;
    if (!id) return toast.error("Invalid product.");
    if (product.quantity <= 0) return toast.error("Out of stock.");
    if (selectedQty <= 0) return toast.error("Select a valid quantity.");
    if (selectedQty > product.quantity)
      return toast.error("Quantity exceeds available stock.");

    // ✅ Login check
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      toast.warn("Please login first to add items to cart.");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }

    setAdding(true);
    const toastId = toast.loading(`Adding ${selectedQty} × ${product.name}...`);

    try {
      await axios.post(`${API_BASE}/cart/add`, {
        product_id: id,
        quantity: selectedQty,
      });

      updateLocalCart(product, selectedQty);

      toast.update(toastId, {
        render: `✅ ${selectedQty} × ${product.name} added to cart`,
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      await refreshProducts?.();
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.update(toastId, {
        render:
          err?.response?.data?.message ||
          "⚠️ Failed to add item. Please try again.",
        type: "error",
        isLoading: false,
        autoClose: 2500,
      });
    } finally {
      setAdding(false);
    }
  };

  /** 💳 Buy Now */
  const handleBuyNow = () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      toast.warn("Please login before purchasing.");
      setTimeout(() => navigate("/login"), 1200);
      return;
    }

    const singleItem = {
      id: product._id || product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: selectedQty,
      image: product.image,
    };

    localStorage.setItem("cart", JSON.stringify([singleItem]));
    window.dispatchEvent(new CustomEvent("cart-updated"));
    navigate("/checkout");
  };

  return (
    <article
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm
                 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col relative"
      aria-labelledby={`product-${id}-title`}
    >
      {/* 🖼 Image Container */}
      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
        )}
        <img
          src={product.image || "https://via.placeholder.com/240"}
          alt={product.name}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/240?text=No+Image";
            setImgLoaded(true);
          }}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            imgLoaded ? "scale-100" : "scale-95 opacity-80"
          }`}
        />
      </div>

      {/* 📋 Info Section */}
      <div className="mt-3 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2">
          <h3
            id={`product-${id}-title`}
            className="text-lg font-semibold text-gray-800 line-clamp-2"
          >
            {product.name}
          </h3>

          {product.quantity <= 0 ? (
            <span className="text-xs font-semibold bg-gray-300 text-white px-2 py-0.5 rounded-full">
              Out
            </span>
          ) : product.quantity <= 5 ? (
            <span className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
              Low stock
            </span>
          ) : null}
        </div>

        {/* 💰 Price */}
        <div className="mt-2 flex justify-between">
          <div>
            <p className="text-green-700 font-bold text-lg">₹{product.price}</p>
            <p className="text-xs text-gray-500">per {product.unit || "unit"}</p>
          </div>
          {product.farmer && (
            <div className="text-sm text-gray-600 text-right">
              <div className="font-medium text-gray-700">{product.farmer}</div>
              <div className="text-xs">Seller</div>
            </div>
          )}
        </div>

        {/* 🔢 Quantity */}
        <div className="mt-3 flex items-center gap-3">
          <input
            id={`qty-${id}`}
            type="number"
            min="1"
            max={product.quantity || 99}
            value={selectedQty}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (isNaN(v) || v <= 0) return setSelectedQty(1);
              setSelectedQty(Math.min(v, product.quantity || 99));
            }}
            className="w-20 px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-green-200"
            disabled={product.quantity === 0 || adding}
          />
          <div className="text-sm text-gray-600">
            Available:{" "}
            <span
              className={
                product.quantity <= 5 ? "text-red-600" : "text-green-600"
              }
            >
              {product.quantity}
            </span>
          </div>
        </div>

        {/* 🛍 Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3" aria-live="polite">
          <button
            onClick={handleAddToCart}
            disabled={adding || product.quantity === 0}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-white transition-all ${
              product.quantity === 0
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 active:scale-95 shadow-md"
            }`}
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold border border-green-600 text-green-700 bg-white hover:bg-green-50 transition"
          >
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}
