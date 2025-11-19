// ✅ src/components/FarmerHeader.jsx (Enhanced v2)
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  ShoppingCart,
  Menu,
  X,
  PlusCircle,
  BarChart2,
  User,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FarmerHeader = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail") || "Farmer";
  const userRole = localStorage.getItem("userRole") || "farmer";
  const initials = userEmail ? userEmail.trim()[0].toUpperCase() : "F";

  /** 🧮 Read cart count safely */
  const readCartCount = useCallback(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return 0;
      const arr = JSON.parse(raw);
      return Array.isArray(arr)
        ? arr.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
        : 0;
    } catch {
      return 0;
    }
  }, []);

  /** 🔁 Sync cart count with app + localStorage */
  useEffect(() => {
    const update = () => setCartCount(readCartCount());
    update();

    const handler = () => {
      clearTimeout(window.__cartSyncTimer);
      window.__cartSyncTimer = setTimeout(update, 200);
    };

    window.addEventListener("storage", handler);
    window.addEventListener("cart-updated", handler);
    window.addEventListener("cart-cleared", handler);
    window.addEventListener("close-cart", handler);
    return () => {
      ["storage", "cart-updated", "cart-cleared", "close-cart"].forEach((e) =>
        window.removeEventListener(e, handler)
      );
      clearTimeout(window.__cartSyncTimer);
    };
  }, [readCartCount]);

  /** 🧩 Dropdown menu close handlers */
  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setMenuOpen(false);

    if (menuOpen) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  /** 🔒 Logout handler */
  const handleLogout = () => {
    ["userRole", "isLoggedIn", "userEmail", "cart"].forEach((k) =>
      localStorage.removeItem(k)
    );
    window.dispatchEvent(new CustomEvent("cart-cleared"));
    navigate("/login");
  };

  /** 🛒 Open cart sidebar */
  const openCart = () => {
    window.dispatchEvent(new CustomEvent("open-cart"));
    window.dispatchEvent(new CustomEvent("openCartSidebar")); // backward compat
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 🌾 Left: Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/farmer-dashboard")}
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Go to farmer dashboard"
            >
              <span className="text-2xl">🌾</span>
            </button>
            <div className="hidden sm:flex flex-col cursor-pointer select-none">
              <span
                onClick={() => navigate("/")}
                className="text-lg font-bold text-green-700"
              >
                KrishiSaathi
              </span>
              <span className="text-xs text-gray-500">Farmer Portal</span>
            </div>
          </div>

          {/* 🧭 Middle nav (desktop) */}
          <nav className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate("/farmer-dashboard/add")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-green-100 hover:shadow-sm text-sm font-medium focus:ring-2 focus:ring-green-200"
            >
              <PlusCircle size={16} className="text-green-600" /> Add Product
            </button>

            <button
              onClick={() => navigate("/farmer-dashboard/stats")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-green-100 hover:shadow-sm text-sm font-medium focus:ring-2 focus:ring-green-200"
            >
              <BarChart2 size={16} className="text-amber-600" /> Stats
            </button>

            <Link
              to="/marketplace"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-400 text-black font-medium hover:bg-yellow-500 focus:ring-2 focus:ring-yellow-200"
            >
              <ShoppingCart size={16} /> Marketplace
            </Link>
          </nav>

          {/* ⚙️ Right actions */}
          <div className="flex items-center gap-3">
            <button
              className="hidden sm:inline-flex p-2 rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-green-200"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} className="text-gray-600" />
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-green-100 hover:shadow-sm focus:ring-2 focus:ring-green-200"
              aria-label="Open cart"
            >
              <ShoppingCart size={18} className="text-green-700" />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                Cart
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 translate-x-1 translate-y-1 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-green-600 text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                ref={triggerRef}
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="farmer-menu"
                aria-haspopup="true"
                className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-green-200"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                    {userEmail}
                  </span>
                  <span className="text-xs text-gray-400">
                    {userRole === "farmer" ? "Farmer" : "User"}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    id="farmer-menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-md border border-gray-200 py-1 z-30"
                    role="menu"
                  >
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User size={14} /> Profile
                    </Link>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        navigate("/farmer-dashboard");
                      }}
                      role="menuitem"
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Dashboard
                    </button>

                    <div className="border-t my-1" />

                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-1 inline-flex items-center justify-center p-2 rounded-md md:hidden hover:bg-gray-100 focus:ring-2 focus:ring-green-200"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle mobile menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* 📱 Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white border-t border-gray-100 shadow-sm"
          >
            <div className="px-4 py-3 flex flex-col gap-2">
              <Link
                to="/farmer-dashboard/add"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <PlusCircle size={16} /> Add Product
              </Link>
              <Link
                to="/farmer-dashboard/stats"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <BarChart2 size={16} /> Stats
              </Link>
              <Link
                to="/marketplace"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                <ShoppingCart size={16} /> Marketplace
              </Link>

              <div className="border-t my-2" />
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default FarmerHeader;
