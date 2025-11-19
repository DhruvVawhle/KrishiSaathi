// src/pages/Home.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import {
  Truck,
  ShieldCheck,
  Leaf,
  CreditCard,
  Search,
  ShoppingBag,
} from "lucide-react";

import Layout from "../components/Layout";
import HeroSlider from "../components/HeroSlider";
import { useProducts } from "../contexts/ProductContext";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

/* --- Debounce Hook --- */
const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

/* --- Hero Title Motion --- */
const HeroTitle = ({ children }) => (
  <motion.h1
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-white drop-shadow-xl"
  >
    {children}
  </motion.h1>
);

/* --- Image with Fallback --- */
const ImageWithFallback = ({ src, alt, className }) => {
  const fallback = "https://placehold.co/800x500?text=Image+Unavailable";
  return (
    <img
      src={src || fallback}
      alt={alt || "Product image"}
      loading="lazy"
      onError={(e) => {
        if (e.target.src !== fallback) e.target.src = fallback;
      }}
      className={className}
    />
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { products = [] } = useProducts();

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 300);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);

  /* --- Filtered Products --- */
  const availableProducts = useMemo(
    () => products.filter((p) => Number(p.quantity) > 0),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return availableProducts.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [availableProducts, debouncedQuery]);

  /* --- Handle Outside Click --- */
  useEffect(() => {
    const onDocClick = (e) => {
      if (!suggestionsRef.current?.contains(e.target) && e.target !== inputRef.current) {
        setOpenSuggestions(false);
        setHighlightIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* --- Navigate with Query --- */
  const navigateToMarketplace = useCallback(
    (q = "", opts = {}) => {
      const search = q.trim() ? `?q=${encodeURIComponent(q)}` : "";
      navigate(`/marketplace${search}`, { state: opts.state || {} });
      setOpenSuggestions(false);
    },
    [navigate]
  );

  /* --- Slider Settings --- */
  const sliderSettings = useMemo(
    () => ({
      dots: true,
      infinite: true,
      autoplay: true,
      autoplaySpeed: window.innerWidth < 640 ? 5000 : 3500,
      lazyLoad: "ondemand",
      pauseOnHover: true,
      slidesToShow: 3,
      responsive: [
        { breakpoint: 1024, settings: { slidesToShow: 2 } },
        { breakpoint: 640, settings: { slidesToShow: 1 } },
      ],
    }),
    []
  );

  /* --- Static Data --- */
  const features = [
    { icon: <Truck size={28} />, title: "Free Delivery", desc: "On all orders above ₹299" },
    { icon: <ShieldCheck size={28} />, title: "Secure Payment", desc: "100% safe checkout" },
    { icon: <Leaf size={28} />, title: "Fresh from Farmers", desc: "Locally sourced daily" },
    { icon: <CreditCard size={28} />, title: "Easy Payment", desc: "UPI, Cards & COD" },
  ];

  const categoriesStatic = [
    { name: "Leafy Greens", icon: "🥬" },
    { name: "Lentils & Grains", icon: "🌾" },
    { name: "Root Veggies", icon: "🥕" },
    { name: "Fruits", icon: "🍎" },
    { name: "Dairy", icon: "🥛" },
  ];

  return (
    <Layout>

      {/* 🔥 HERO SECTION WITH GRADIENT OVERLAY */}
      <section className="hero relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <HeroSlider />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50 z-[1]" />

        {/* Foreground Content */}
        <div className="container relative z-[2] text-center text-white py-20">
          <HeroTitle>Buy Fresh from Farmers — Fast, Fair & Local</HeroTitle>
          <p className="mt-4 text-gray-200 max-w-2xl mx-auto text-base sm:text-lg">
            Pure, seasonal produce — delivered to your doorstep. Support local farmers while enjoying the freshest ingredients.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <motion.button whileHover={{ scale: 1.03 }} className="btn btn-primary" onClick={() => navigate("/marketplace")}>
              Order Now
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} className="btn btn-secondary" onClick={() => inputRef.current?.focus()}>
              Search Produce
            </motion.button>
          </div>
        </div>
      </section>

      {/* 🌿 SEARCH */}
      <section className="py-8 bg-green-50 flex justify-center">
        <div className="w-full max-w-2xl px-4 relative">
          <Search className="absolute left-4 top-3.5 text-green-700" size={18} />

          <div role="combobox" aria-expanded={openSuggestions} aria-owns="product-suggestions">
            <input
              ref={inputRef}
              type="search"
              placeholder="Search fresh produce..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenSuggestions(true);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-green-200 shadow-lg 
              focus:ring-2 focus:ring-green-600 bg-green-50/70 backdrop-blur-sm"
            />

            {/* Dropdown */}
            <AnimatePresence>
              {openSuggestions && debouncedQuery && (
                <motion.div
                  ref={suggestionsRef}
                  id="product-suggestions"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-2 bg-white shadow-xl rounded-xl border max-h-72 overflow-auto"
                >
                  <div className="px-4 py-3 border-b text-sm text-gray-600 bg-gray-50">
                    {filteredProducts.length} result{filteredProducts.length !== 1 ? "s" : ""} for{" "}
                    <strong>"{debouncedQuery}"</strong>
                  </div>

                  <div className="p-1">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center text-gray-500 py-6">No products found.</div>
                    ) : (
                      filteredProducts.slice(0, 8).map((p, idx) => (
                        <button
                          key={p.id ?? idx}
                          onClick={() => navigateToMarketplace(p.name)}
                          className="flex w-full items-center gap-3 p-3 hover:bg-green-100/60 rounded-lg transition-all"
                        >
                          <ImageWithFallback src={p.image} alt={p.name} className="w-12 h-12 rounded-md object-cover" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{p.name}</div>
                            <div className="text-sm text-gray-500">₹{p.price} / {p.unit}</div>
                            <div className="text-xs text-gray-400">{p.category}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ⭐ FEATURES */}
      <section className="py-12 bg-white">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-green-50 rounded-2xl shadow-md hover:shadow-lg transition"
            >
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 text-green-700">
                {f.icon}
              </div>
              <h3 className="font-bold text-lg">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🛒 CATEGORIES */}
      <section className="py-12 bg-gradient-to-r from-green-50 to-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-green-700 mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {categoriesStatic.map((cat) => (
              <motion.button
                key={cat.name}
                whileHover={{ scale: 1.06, rotate: 1 }}
                onClick={() => navigate("/marketplace", { state: { category: cat.name } })}
                className="bg-white border border-green-100 rounded-2xl py-6 flex flex-col items-center shadow-md hover:bg-green-50 transition"
              >
                <span className="text-4xl mb-2">{cat.icon}</span>
                <h4 className="font-semibold text-green-700">{cat.name}</h4>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* 🎁 OFFER SLIDER */}
{/* 🎁 OFFER SLIDER */}
<section className="py-12 bg-white">
  <div className="container">
    <h2 className="text-3xl font-bold text-green-700 mb-6 text-center">
      Today’s Bumper Offers
    </h2>

    {availableProducts.length === 0 ? (
      <div className="text-center text-gray-500 py-8">
        No products available right now.
      </div>
    ) : (
      <Slider {...sliderSettings}>
        {availableProducts
          .sort((a, b) => a.price - b.price)   // 🔥 Best Price First
          .slice(0, 12)                        // 🔥 Top 12 Offers
          .map((p) => (
            <motion.div key={p.id} whileHover={{ scale: 1.03 }} className="p-3 relative">

              {/* 🔥 Ribbon */}
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded shadow">
                Best Price
              </div>

              <div className="bg-white shadow-md rounded-2xl overflow-hidden">
                <ImageWithFallback
                  src={p.image}
                  alt={p.name}
                  className="h-56 w-full object-cover"
                />

                <div className="p-4 text-center">
                  <h4 className="font-semibold text-lg">{p.name}</h4>
                  <p className="text-green-700 font-bold">
                    ₹{p.price} / {p.unit}
                  </p>

                  <button
                    onClick={() =>
                      navigate("/marketplace", { state: { productId: p.id } })
                    }
                    className="mt-3 btn btn-primary"
                  >
                    View in Marketplace
                  </button>
                </div>
              </div>

            </motion.div>
          ))}
      </Slider>
    )}
  </div>
</section>


      {/* 🌱 FOOTER CTA */}
      <footer className="bg-gradient-to-r from-green-700 to-green-600 text-white py-16 text-center">
        <div className="flex justify-center items-center gap-3 mb-6">
          <Leaf className="text-lime-200" />
          <h2 className="text-2xl font-bold">Why Shop from KrishiSaathi?</h2>
        </div>

        <p className="max-w-2xl mx-auto text-gray-100 text-lg mb-6">
          Empowering local farmers, ensuring fair trade, and delivering the freshest produce straight to your kitchen.
        </p>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/marketplace")}
            className="bg-lime-400 hover:bg-lime-300 text-green-900 px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition"
          >
            <ShoppingBag size={18} /> Start Shopping
          </button>
        </div>
      </footer>

    </Layout>
  );
};

export default Home;
