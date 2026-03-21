import React, { useEffect, useState, useMemo, useRef } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  ShoppingCart,
  User,
  Sun,
  Moon,
  Home,
  List,
  BarChart2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/frontend/contexts/CartContext";
import { useUser } from "@/frontend/contexts/UserContext";
import { getAuth, signOut } from "firebase/auth";
import { toast } from "react-toastify";

/* 🌿 ModernLayout — Polished Production Version
   - Responsive Sidebar (with backdrop & scroll-lock)
   - OS-aware Dark Mode + Persistent User Preference
   - Reusable CartContext Integration
   - Accessible Buttons and Roles
*/

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("krishi_theme");
      if (saved) return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("krishi_theme", theme);
  }, [theme]);

  // Live sync with system theme
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () =>
      setTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  return [theme, setTheme];
}

export default function ModernLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const navigate = useNavigate();
  const { cart } = useCart();
  const toggleRef = useRef(null);

  const { user, clearUser } = useUser();
  const userEmail = user?.email || localStorage.getItem("userEmail");

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    const fromLS = localStorage.getItem("userName");
    if (fromLS) return fromLS;
    const email = user?.email || localStorage.getItem("userEmail");
    if (email) return email.split("@")[0];
    return null;
  };

  // 🧮 Optimized Cart Count
  const cartCount = useMemo(
    () =>
      Array.isArray(cart)
        ? cart.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
        : 0,
    [cart]
  );

  // 🧠 Scroll Lock + Focus Handling
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
    if (!sidebarOpen && toggleRef.current) toggleRef.current.focus();
    return () => (document.body.style.overflow = "auto");
  }, [sidebarOpen]);

  const handleLogout = async () => {
    ["isLoggedIn", "userRole", "userEmail", "token", "tokenExpiry"].forEach((k) =>
      localStorage.removeItem(k)
    );
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e) {
      // fallback: clear local user state if firebase signOut fails
      try { clearUser(); } catch (err) {}
    }
    toast.success("You've been logged out. See you soon! 👋", {
      toastId: 'logout',
      icon: '👋',
      style: {
        background: '#1a3a1a',
        color: '#ffffff',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.15)',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        minWidth: '280px',
      },
      progressStyle: { background: '#c17a4a' },
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
    });
    navigate("/login", { replace: true });
  };

  const navItems = [
    { label: "Home", to: "/", icon: Home },
    { label: "Marketplace", to: "/marketplace", icon: List },
    { label: "Farmer Dashboard", to: "/farmer-dashboard", icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* ─── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                ref={toggleRef}
                onClick={() => setSidebarOpen((s) => !s)}
                aria-controls="sidebar"
                aria-expanded={sidebarOpen}
                aria-label="Toggle sidebar"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Menu size={20} />
              </button>

              <div
                onClick={() => navigate("/")}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold">
                  KS
                </div>
                <div className="hidden sm:block">
                  <div className="text-lg font-semibold">KrishiSaathi</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Fresh from farmers
                  </div>
                </div>
              </div>
            </div>

            {/* Center Search */}
            <div className="flex-1 px-4">
              <div className="max-w-2xl mx-auto relative">
                <Search
                  className="absolute left-3 top-3 text-green-700"
                  size={18}
                />
                <input
                  aria-label="Search products"
                  placeholder="Search available produce..."
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-green-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.target.value.trim()) {
                      navigate(
                        `/marketplace?q=${encodeURIComponent(e.target.value.trim())}`
                      );
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={() => navigate("/cart")}
                aria-label="Open cart"
                className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
                <User size={16} />
                <span className="text-sm truncate max-w-[140px]">
                  {getDisplayName() || userEmail || "Guest"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Layout ─────────────────────────────── */}
      <div className="flex flex-1 relative">
        {/* Overlay (Mobile Only) */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 lg:hidden z-30"
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          id="sidebar"
          role="navigation"
          className={`bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 w-64 p-4 space-y-4 transform transition-transform duration-300 z-40 fixed lg:relative h-full ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800"
              >
                <Icon size={18} className="text-green-700" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}

            <div className="mt-4 border-t pt-4">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-h-screen p-6 lg:ml-64 transition-all duration-300">
          {children || <Outlet />}
        </main>
      </div>

      {/* Floating Cart */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-cart"))}
          aria-label="Open cart"
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <ShoppingCart size={18} />
          <span className="hidden md:inline">Cart</span>
        </button>
      </div>
    </div>
  );
}
