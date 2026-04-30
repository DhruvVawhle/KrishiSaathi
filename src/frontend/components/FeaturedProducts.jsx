// ✅ src/components/FeaturedProducts.jsx (Enhanced v2)
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  User,
  Mail,
  Eye,
  Star,
  ShoppingCart,
  CheckCircle,
  X,
} from "lucide-react";
import { useCart } from "@/frontend/contexts/CartContext";
import { toast } from "react-toastify";

const fallbackImage = "https://cdn-icons-png.flaticon.com/512/415/415733.png";

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart?.() || {};
  const [quickProduct, setQuickProduct] = useState(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [products, setProducts] = useState([]);

  /** 🧩 Load products from storage */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("products") || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        const featuredList = [...saved]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 6);
        setProducts(featuredList);
      } else {
        setProducts([
          {
            id: 1,
            name: "Fresh Organic Tomatoes",
            farmer: "Rajesh Kumar",
            location: "Pune",
            price: 40,
            quantity: "500 kg",
            emoji: "🍅",
            email: "rajesh@example.com",
            unit: "kg",
            rating: 4.6,
            verified: true,
            image: "",
          },
          {
            id: 2,
            name: "Premium Basmati Rice",
            farmer: "Suresh Patel",
            location: "Haryana",
            price: 3100,
            quantity: "2 tons",
            emoji: "🍚",
            email: "suresh@example.com",
            unit: "kg",
            rating: 4.8,
            verified: true,
            image: "",
          },
          {
            id: 3,
            name: "Farm Fresh Vegetables",
            farmer: "Lakshmi Devi",
            location: "Karnataka",
            price: 30,
            quantity: "300 kg",
            emoji: "🥦",
            email: "lakshmi@example.com",
            unit: "kg",
            rating: 4.4,
            verified: false,
            image: "",
          },
        ]);
      }
    } catch {
      setProducts([]);
    }
  }, []);

  /** 🛒 Add to Cart + Redirect */
  const handleBuy = useCallback(
    async (product) => {
      try {
        if (typeof addToCart === "function") {
          await addToCart(product, 1);
        } else {
          const cart = JSON.parse(localStorage.getItem("cart") || "[]");
          cart.push({ ...product, quantity: 1 });
          localStorage.setItem("cart", JSON.stringify(cart));
        }

        window.dispatchEvent(new CustomEvent("cart-updated"));
        localStorage.setItem("preselectedProduct", JSON.stringify(product));
        setQuickOpen(false);

        setTimeout(() => navigate("/checkout"), 800);
      } catch (err) {
        console.error("Add to cart failed:", err);
        toast.error("Failed to add item to cart.");
      }
    },
    [addToCart, navigate]
  );

  const handleContact = (product) =>
    (window.location.href = `mailto:${product.email}?subject=Inquiry about ${encodeURIComponent(
      product.name
    )}`);

  const handleQuickView = (product) => {
    setQuickProduct(product);
    setQuickOpen(true);
  };

  return (
    <section className="text-center my-16 px-4 md:px-12">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
          🌾 Featured Products
        </h2>
        <p className="text-gray-600 text-lg mb-8">
          Fresh produce sourced directly from our trusted farmers across India.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <motion.article
              key={product.id}
              whileHover={{ y: -5, scale: 1.01 }}
              className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg p-6 flex flex-col transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="text-6xl shrink-0">{product.emoji || "🌾"}</div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-800 truncate">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <User size={14} className="text-gray-400" />
                    <span className="truncate">{product.farmer}</span>
                    {product.verified && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle size={14} /> Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      <span>{product.location}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">
                        ₹{product.price}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.quantity || "In stock"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 text-sm font-semibold text-yellow-600">
                        <Star size={14} /> {product.rating || "4.5"}
                      </div>
                      <div className="text-xs text-gray-400">
                        • {Math.round((product.rating || 4.5) * 20)}+ reviews
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContact(product)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-sm hover:bg-green-100"
                      >
                        <Mail size={14} /> Contact
                      </button>
                      <button
                        onClick={() => handleQuickView(product)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-gray-200 text-sm hover:shadow-sm"
                      >
                        <Eye size={14} /> View
                      </button>
                      <button
                        onClick={() => handleBuy(product)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
                      >
                        <ShoppingCart size={14} /> Buy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <QuickViewModal
        product={quickProduct}
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onBuy={handleBuy}
      />
    </section>
  );
};

/** ✅ Quick View Modal */
const QuickViewModal = ({ product, open, onClose, onBuy }) => {
  const modalRef = useRef(null);

  /** Focus management */
  useEffect(() => {
    if (open) {
      const prev = document.activeElement;
      modalRef.current?.focus?.();
      return () => prev?.focus?.();
    }
  }, [open]);

  /** ESC key close */
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && open && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-title"
        aria-describedby="product-desc"
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          layout
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.25 }}
          ref={modalRef}
          tabIndex={-1}
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 z-10 overflow-y-auto max-h-[80vh] focus:outline-none"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-green-200"
            aria-label="Close product details"
          >
            <X />
          </button>

          <div className="flex gap-6 flex-col sm:flex-row">
            <img
              src={product.image || fallbackImage}
              alt={product.name}
              className="w-36 h-36 rounded-lg object-cover shadow-sm border border-gray-100"
            />

            <div className="flex-1">
              <h3 id="product-title" className="text-2xl font-bold text-gray-800">
                {product.name}
              </h3>

              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                <User size={16} /> {product.farmer}
                <span className="mx-1">•</span>
                <MapPin size={16} /> {product.location}
                {product.verified && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs rounded px-2 py-0.5 bg-green-50 text-green-700">
                    <CheckCircle size={14} /> Verified
                  </span>
                )}
              </div>

              <p id="product-desc" className="mt-4 text-gray-600 text-sm leading-relaxed">
                Freshly harvested and quality-checked. Perfect for everyday
                cooking and wholesale orders.
                <br />
                <strong>Unit:</strong> {product.unit || "kg"} •{" "}
                <strong>Stock:</strong> {product.quantity || "Available"}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div>
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="text-2xl font-bold text-green-700">
                    ₹{product.price} / {product.unit || "kg"}
                  </div>
                </div>

                <div className="ml-auto flex gap-2">
                  <a
                    href={`mailto:${product.email}?subject=Inquiry about ${encodeURIComponent(
                      product.name
                    )}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                  >
                    <Mail /> Contact
                  </a>

                  <button
                    onClick={() => onBuy(product)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                  >
                    <ShoppingCart /> Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeaturedProducts;
