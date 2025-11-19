// ✅ src/components/Navbar.jsx (Enhanced v2)
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  User,
  Search as SearchIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../contexts/CartContext";

const navLinks = [
  { name: "Home", path: "/home" },
  { name: "Marketplace", path: "/marketplace" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
  { name: "Support", path: "/support" },
];

export default function Navbar({ onOpenCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart = [] } = useCart() || {};

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState("");

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const profileMenuId = "navbar-profile-menu";

  const cartItemCount = useMemo(
    () =>
      Array.isArray(cart)
        ? cart.reduce((s, it) => s + (Number(it?.quantity) || 0), 0)
        : 0,
    [cart]
  );

  // 🔒 Body scroll lock helper
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  // ✅ Sync login
  useEffect(() => {
    const updateLogin = () =>
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    updateLogin();
    const onStorage = (e) => e.key === "isLoggedIn" && updateLogin();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ Keep search from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q");
    if (q) setSearch(q);
  }, [location.search]);

  // ✅ Scroll state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (["input", "textarea"].includes(activeTag)) return;

      if (e.shiftKey && ["C", "c"].includes(e.key)) {
        e.preventDefault();
        typeof onOpenCart === "function"
          ? onOpenCart()
          : window.dispatchEvent(new CustomEvent("open-cart"));
      }

      if (e.shiftKey && ["K", "k"].includes(e.key)) {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (e.key === "Escape") {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenCart]);

  // ✅ Click outside profile
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cart-cleared"));
    setIsLoggedIn(false);
    setProfileOpen(false);
    navigate("/login");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = (search || "").trim();
    navigate(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
    setMenuOpen(false);
  };

  const headerClasses = scrolled
    ? "bg-white/95 backdrop-blur-sm shadow-md py-2 transition-colors duration-200"
    : "bg-gradient-to-r from-green-700/90 to-emerald-700/90 py-3 transition-colors duration-200";

  return (
    <motion.nav
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 left-0 w-full z-50 ${headerClasses}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* 🔗 Logo */}
          <Link
            to="/home"
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-green-300 rounded"
            aria-label="Go to home"
          >
            <div
              className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center ${
                scrolled ? "bg-white" : "bg-white/90"
              }`}
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/2909/2909758.png"
                alt="KrishiSaathi"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div
              className={`hidden sm:flex flex-col leading-tight ${
                scrolled ? "text-green-800" : "text-white"
              }`}
            >
              <span className="font-bold">KrishiSaathi</span>
              <span className="text-xs font-medium opacity-80">
                Farmers' Marketplace
              </span>
            </div>
          </Link>

          {/* 🧭 Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path} className="relative">
                  <div
                    className={`px-4 py-2 rounded-full font-medium text-sm transition ${
                      isActive
                        ? scrolled
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-white/20 text-white"
                        : scrolled
                        ? "text-green-800 hover:bg-green-50"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.name}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ⚙️ Right Controls */}
          <div className="flex items-center gap-2">
            {/* 🔍 Search */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden sm:flex items-center gap-2"
            >
              <label htmlFor="nav-search" className="sr-only">
                Search products
              </label>
              <div
                role="search"
                className={`flex items-center gap-2 px-3 py-2 rounded-full border ${
                  scrolled ? "bg-white" : "bg-white/10"
                } border-transparent focus-within:ring-2 focus-within:ring-green-300`}
              >
                <SearchIcon
                  className={`${scrolled ? "text-green-600" : "text-white/90"}`}
                />
                <input
                  id="nav-search"
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search produce, e.g. tomatoes"
                  className={`min-w-[180px] bg-transparent outline-none text-sm ${
                    scrolled ? "text-gray-800" : "text-white/90"
                  }`}
                />
              </div>
            </form>

            {/* 🛒 Cart */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                typeof onOpenCart === "function"
                  ? onOpenCart()
                  : window.dispatchEvent(new CustomEvent("open-cart"))
              }
              aria-label="Open cart"
              className={`relative p-2 rounded-full focus:outline-none focus:ring-2 ${
                scrolled
                  ? "hover:bg-green-50 text-green-800"
                  : "hover:bg-white/10 text-white"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <motion.span
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow"
                >
                  {cartItemCount > 9 ? "9+" : cartItemCount}
                </motion.span>
              )}
            </motion.button>

            {/* 👤 Profile */}
            <div className="relative" ref={profileRef}>
              {isLoggedIn ? (
                <button
                  onClick={() => setProfileOpen((s) => !s)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full focus:outline-none focus:ring-2 ${
                    scrolled
                      ? "bg-white/90 text-green-700"
                      : "bg-white/20 text-white"
                  }`}
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                  aria-controls={profileMenuId}
                >
                  <User size={16} />
                  <span className="hidden lg:inline text-sm font-medium truncate max-w-[120px]">
                    {localStorage.getItem("userEmail") || "User"}
                  </span>
                </button>
              ) : (
                <Link to="/login" className="hidden sm:inline">
                  <button
                    className={`px-3 py-1 rounded-full font-semibold text-sm focus:outline-none focus:ring-2 ${
                      scrolled
                        ? "bg-green-600 text-white"
                        : "bg-white text-green-700"
                    }`}
                  >
                    Login
                  </button>
                </Link>
              )}

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    id={profileMenuId}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-gray-100 z-40"
                    role="menu"
                  >
                    <Link
                      to="/buyerprofile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/buyerprofile/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      Settings
                    </Link>
                    <div className="border-t" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 📱 Mobile Menu Toggle */}
            <button
              aria-label="Toggle mobile menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              onClick={() => setMenuOpen((s) => !s)}
              className={`md:hidden p-2 rounded-full focus:outline-none focus:ring-2 ${
                scrolled
                  ? "text-green-800 hover:bg-green-50"
                  : "text-white hover:bg-white/10"
              }`}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* 📱 Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav-menu"
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className={`${
              scrolled
                ? "bg-white text-gray-800"
                : "bg-green-900/95 text-white"
            } md:hidden border-t`}
          >
            <div className="px-4 py-4 space-y-3">
              {/* Search */}
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white text-gray-700 flex-grow">
                  <SearchIcon className="text-gray-700" />
                  <input
                    aria-label="Search products"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search produce (e.g. tomatoes)"
                    className="bg-transparent outline-none w-full text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 bg-green-600 rounded-md text-white text-sm"
                >
                  Go
                </button>
              </form>

              {/* Links */}
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div
                      className={`px-4 py-3 rounded-xl font-medium ${
                        isActive
                          ? "bg-green-600 text-white"
                          : scrolled
                          ? "text-green-800 hover:bg-green-50"
                          : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      {link.name}
                    </div>
                  </Link>
                );
              })}

              <div className="pt-2 border-t">
                {isLoggedIn ? (
                  <button
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-red-500 text-white font-semibold"
                  >
                    Logout
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setMenuOpen(false)}>
                    <div className="w-full px-4 py-3 rounded-xl bg-white text-green-700 text-center font-semibold">
                      Login
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
