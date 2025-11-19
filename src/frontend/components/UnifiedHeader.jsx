import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  User,
  Search as SearchIcon,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getAuth, signOut } from "firebase/auth";
import { useCart } from "../contexts/CartContext"; // optional

// ---------------------------------------------------------------------------
// ✅ UnifiedHeader: Single header for all KrishiSaathi pages
// - Dynamic search (local + API)
// - Cart integration
// - Profile dropdown
// - Mobile menu + accessible keyboard controls
// ---------------------------------------------------------------------------

const navLinks = [
  { name: "Home", to: "/home" },
  { name: "Marketplace", to: "/marketplace" },
  { name: "About", to: "/about" },
  { name: "Contact", to: "/contact" },
  { name: "Support", to: "/support" },
];

const PRODUCTS_SEARCH_URL = import.meta.env.VITE_PRODUCTS_API || "/api/products/search";
const USER_SERVER_BASE = import.meta.env.VITE_USER_SERVER_URL || "";

/* --------------------------------------------------------------------------- */
/* 🔍 Product availability helper */
const detectAvailability = (p = {}) => {
  if (typeof p.available === "boolean") return p.available;
  if (typeof p.isAvailable === "boolean") return p.isAvailable;
  if (typeof p.available === "string") {
    const v = p.available.toLowerCase();
    if (["true", "yes"].includes(v)) return true;
    if (["false", "no"].includes(v)) return false;
  }

  const stockFields = [
    "inStock",
    "stock",
    "countInStock",
    "qty",
    "quantity",
    "availableQty",
    "availableQuantity",
    "quantityAvailable",
  ];
  for (const f of stockFields) {
    if (p[f] !== undefined && p[f] !== null) {
      const n = Number(p[f]);
      if (!Number.isNaN(n)) return n > 0;
    }
  }

  if (p.status && typeof p.status === "string") {
    const st = p.status.toLowerCase();
    if (st.includes("out") || st.includes("sold")) return false;
    if (st.includes("in") || st.includes("available")) return true;
  }

  return true;
};

/* --------------------------------------------------------------------------- */
/* 🌿 Navbar main component */
const Navbar = ({ onOpenCart }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Safe cart hook
  let cartContext = {};
  try {
    cartContext = useCart?.() || {};
  } catch {
    cartContext = {};
  }
  const { cart = [], addItem: contextAddItem } = cartContext;
  const cartCount = Array.isArray(cart)
    ? cart.reduce((s, i) => s + (Number(i.quantity) || 0), 0)
    : 0;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [message, setMessage] = useState(null);
  const [localProducts, setLocalProducts] = useState([]);

  const mobileRef = useRef(null);
  const profileRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  /* --------------------------------------------------------------------------- */
  // 📡 Listen for products broadcast from Marketplace.jsx
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (Array.isArray(window.__KS_PRODUCTS))
        setLocalProducts(window.__KS_PRODUCTS);

      const onProducts = (e) => {
        const payload = e?.detail ?? window.__KS_PRODUCTS ?? null;
        if (Array.isArray(payload)) setLocalProducts(payload);
      };

      window.addEventListener("ks:products", onProducts);
      return () => window.removeEventListener("ks:products", onProducts);
    }
  }, []);

  /* --------------------------------------------------------------------------- */
  // 👤 Auth state from localStorage
  useEffect(() => {
    const logged = localStorage.getItem("isLoggedIn") === "true";
    const email = localStorage.getItem("userEmail") || "";
    setIsLoggedIn(logged);
    setUserEmail(email);

    const onStorage = (e) => {
      if (["isLoggedIn", "userEmail"].includes(e.key)) {
        setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
        setUserEmail(localStorage.getItem("userEmail") || "");
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* --------------------------------------------------------------------------- */
  // 🔒 Close dropdowns on click outside or Esc key
  useEffect(() => {
    const onDocClick = (e) => {
      if (mobileRef.current && !mobileRef.current.contains(e.target))
        setMobileOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        e.target !== inputRef.current
      ) {
        setShowSuggestions(false);
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  /* --------------------------------------------------------------------------- */
  // 🔎 Search: local first → backend fallback
  useEffect(() => {
    if (!query?.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const q = query.trim().toLowerCase();
    let cancelled = false;
    setLoadingSuggestions(true);

    const timer = setTimeout(async () => {
      try {
        if (Array.isArray(localProducts) && localProducts.length > 0) {
          const matches = localProducts
            .map((p) => ({ ...p, __available: detectAvailability(p) }))
            .filter((p) => {
              const name = (p.name || p.title || "").toLowerCase();
              const cat = (p.category || p.subcategory || "").toLowerCase();
              return (
                name.includes(q) ||
                cat.includes(q) ||
                String(p._id || p.id || "").includes(q)
              );
            })
            .sort((a, b) =>
              a.__available === b.__available ? 0 : a.__available ? -1 : 1
            );

          if (!cancelled) {
            setSuggestions(matches);
            setShowSuggestions(true);
          }
          return;
        }

        const resp = await axios.get(
          `${PRODUCTS_SEARCH_URL}?q=${encodeURIComponent(q)}`
        );
        if (!cancelled) {
          const payload = Array.isArray(resp.data)
            ? resp.data
            : resp.data?.results || [];
          const annotated = payload.map((p) => ({
            ...p,
            __available: detectAvailability(p),
          }));
          annotated.sort((a, b) =>
            a.__available === b.__available ? 0 : a.__available ? -1 : 1
          );
          setSuggestions(annotated);
          setShowSuggestions(true);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, localProducts]);

  /* --------------------------------------------------------------------------- */
  // 🕒 Toast message timeout
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(t);
  }, [message]);

  /* --------------------------------------------------------------------------- */
  // 🚪 Logout
  const handleLogout = () => {
    (async () => {
      try {
        const auth = getAuth();
        await signOut(auth);
      } catch (err) {
        console.warn("signOut failed", err);
      }
      // Clear fallback/local pieces immediately
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      setIsLoggedIn(false);
      setUserEmail("");
      try { window.dispatchEvent(new CustomEvent("ks:user-logout")); } catch (e) {}
      navigate("/login");
    })();
  };

  const goSearch = (q) => {
    const trimmed = q.trim();
    if (trimmed) navigate(`/marketplace?q=${encodeURIComponent(trimmed)}`);
    else navigate("/marketplace");
    setQuery("");
    setShowSuggestions(false);
    try {
      // Notify marketplace page (if open) to apply the search immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("ks:search", { detail: trimmed }));
      }
    } catch (e) {
      // non-fatal
    }
  };

  /* --------------------------------------------------------------------------- */
  // 🛒 Add to cart (local + backend sync)
  const addToCart = async (product, qty = 1) => {
    if (!product) return;
    if (product.__available === false) {
      setMessage("Item not available");
      return;
    }

    const price =
      Number(product.price ?? product.mrp ?? product.unit_price ?? 0) || 0;
    const item = {
      productId: product._id || product.id || null,
      name: product.name || product.title || "",
      price,
      quantity: Number(qty || 1),
      total: Math.round(price * Number(qty || 1) * 100) / 100,
    };

    try {
      if (typeof contextAddItem === "function") {
        await contextAddItem(item);
      } else {
        const existing = JSON.parse(localStorage.getItem("cart") || "[]");
        const idx = existing.findIndex(
          (c) => String(c.productId) === String(item.productId)
        );
        if (idx >= 0) existing[idx].quantity += item.quantity;
        else existing.push(item);
        localStorage.setItem("cart", JSON.stringify(existing));
        window.dispatchEvent(new Event("cartUpdated"));
      }
      setMessage("Added to cart");
    } catch (err) {
      console.error("Add to cart failed:", err);
      setMessage("Failed to add to cart");
    }
  };

  /* --------------------------------------------------------------------------- */
  // ✨ Render UI
  const availableItems = suggestions.filter((s) => s.__available !== false);
  const unavailableItems = suggestions.filter((s) => s.__available === false);

  return (
    <div className="w-full bg-green-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 focus:ring-2 focus:ring-white/30 rounded"
            >
              {/* Prefer local project icon at `/krishisaathi.png` (place your image in `public/krishisaathi.png`) */}
              <img
                src="/krishisaathi.png"
                onError={(e) => {
                  // Fallback to CDN if local image not present
                  try {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2909/2909758.png";
                  } catch (err) {}
                }}
                alt="KrishiSaathi"
                className="w-8 h-8 rounded"
              />
              <span className="hidden sm:inline font-bold text-lg">KrishiSaathi</span>
            </button>
          </div>

          {/* Search (desktop) */}
          <div className="flex-1 hidden md:flex justify-center px-4 relative">
            <div className="w-full max-w-2xl relative">
              <SearchIcon
                className="absolute left-3 top-3 text-green-700 bg-white/0"
                size={18}
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onFocus={() => suggestions?.length && setShowSuggestions(true)}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goSearch(query)}
                placeholder="Search available produce..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-green-200 text-gray-800 focus:ring-2 focus:ring-white/30 bg-white text-sm"
              />
              <div ref={suggestionsRef} className="absolute left-0 right-0 z-50 mt-2">
                <AnimatePresence>
                  {showSuggestions &&
                    (loadingSuggestions || suggestions.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.12 }}
                        className="bg-white text-gray-800 rounded-lg shadow-lg ring-1 ring-black/5 overflow-hidden"
                      >
                        {loadingSuggestions && (
                          <div className="p-3 text-sm">Searching...</div>
                        )}
                        {!loadingSuggestions &&
                          availableItems.length === 0 &&
                          unavailableItems.length === 0 && (
                            <div className="p-3 text-sm">No results</div>
                          )}

                        {availableItems.map((p) => (
                          <div
                            key={p._id || p.id || p.name}
                            className="ks-suggestion-item flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => goSearch(p.name)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <img
                                src={
                                  p.image || p.thumb || "https://via.placeholder.com/48"
                                }
                                alt={p.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                              <div className="text-sm">
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-gray-500">
                                  ₹{Number(p.price || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (typeof addToCart === "function") addToCart(p, 1);
                                }}
                                className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                              >
                                Add
                              </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition ${
                      active
                        ? "bg-white/20 text-white"
                        : "hover:bg-white/10 text-white/90"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {/* Cart Button */}
            <button
              onClick={() =>
                onOpenCart ? onOpenCart() : navigate("/cart")
              }
              className="relative p-2 rounded-full hover:bg-white/10"
              aria-label="Open cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            <button
              className="p-2 rounded-full hover:bg-white/10 hidden sm:inline-flex"
              aria-label="Notifications"
            >
              <Bell size={18} />
            </button>

            {/* Profile / Login */}
            {isLoggedIn ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((s) => !s)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20"
                >
                  <User size={16} />
                  <span className="hidden sm:inline text-sm">
                    {userEmail.split("@")[0]}
                  </span>
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg ring-1 ring-black/5"
                    >
                      <Link
                        to="/buyerprofile"
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/buyer-dashboard"
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <LogOut size={14} /> Logout
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden sm:inline-block bg-yellow-400 text-black font-semibold px-4 py-2 rounded-full hover:bg-yellow-500"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileOpen((s) => !s)}
                className="p-2 rounded-full hover:bg-white/10"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            ref={mobileRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-green-600/95 border-t border-green-600"
          >
            <div className="px-4 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-md text-white font-medium ${
                    location.pathname === link.to ? "bg-white/20" : ""
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="mt-3">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/buyer-dashboard"
                      className="block w-full bg-white text-green-700 px-3 py-2 rounded-md text-center font-semibold mb-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      My Orders
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="block w-full bg-red-500 text-white px-3 py-2 rounded-md text-center font-semibold"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block w-full bg-yellow-400 text-black px-3 py-2 rounded-md text-center font-semibold"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {message && (
        <div className="fixed bottom-6 right-6 bg-gray-800 text-white px-4 py-2 rounded-md shadow z-50">
          {message}
        </div>
      )}
    </div>
  );
};

/* --------------------------------------------------------------------------- */
const UnifiedHeader = ({ onOpenCart }) => (
  <header className="sticky top-0 z-50">
    <Navbar onOpenCart={onOpenCart} />
  </header>
);

export default UnifiedHeader;
