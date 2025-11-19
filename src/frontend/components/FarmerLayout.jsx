// ✅ src/layouts/FarmerDashboardLayout.jsx (Enhanced v2)
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import Footer from "../components/Footer";
import {
  Home,
  PlusCircle,
  BarChart2,
  LogOut,
  Box,
  User,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const SidebarItem = React.forwardRef(({ to, label, Icon, onClick, active }, ref) => (
  <Link
    to={to}
    onClick={onClick}
    ref={ref}
    className={`flex items-center gap-3 px-3 py-2 rounded-md transition text-sm font-medium ${
      active
        ? "bg-green-100 text-green-700 shadow-sm"
        : "text-gray-700 hover:bg-green-50 hover:text-green-800"
    }`}
    role="menuitem"
  >
    <Icon size={18} className={active ? "text-green-600" : "text-green-500"} />
    <span>{label}</span>
  </Link>
));
SidebarItem.displayName = "SidebarItem";

const FarmerDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const firstLinkRef = useRef(null);

  const userEmail = localStorage.getItem("userEmail") || "Farmer";
  const initials = userEmail.charAt(0).toUpperCase();

  /** 🧩 Compute stats */
  const loadStats = useCallback(() => {
    try {
      const email = localStorage.getItem("userEmail") || "guest";
      const prods = JSON.parse(localStorage.getItem("products") || "[]");
      const ordersMain = JSON.parse(localStorage.getItem("orders") || "[]");
      const ordersByUser = JSON.parse(localStorage.getItem(`orders_${email}`) || "[]");
      const combined = [...ordersMain, ...ordersByUser];

      const completed = combined.filter((o) => o.status === "completed").length;
      const pending = combined.filter((o) => o.status === "pending").length;

      return {
        products: Array.isArray(prods) ? prods.length : 0,
        ordersPending: pending,
        ordersCompleted: completed,
      };
    } catch (e) {
      console.warn("Stats parse error:", e);
      return { products: 0, ordersPending: 0, ordersCompleted: 0 };
    }
  }, []);

  const [stats, setStats] = useState(loadStats);

  /** 📦 Update on events */
  useEffect(() => {
    const update = () => setStats(loadStats());
    update();
    const handler = () => {
      clearTimeout(window.__statTimer);
      window.__statTimer = setTimeout(update, 300);
    };
    window.addEventListener("storage", handler);
    window.addEventListener("order-updated", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("order-updated", handler);
      clearTimeout(window.__statTimer);
    };
  }, [loadStats, location.pathname]);

  /** 🔒 Logout */
  const handleLogout = () => {
    ["isLoggedIn", "userRole", "userEmail", "cart"].forEach((k) =>
      localStorage.removeItem(k)
    );
    window.dispatchEvent(new CustomEvent("cart-cleared"));
    toast.info("👋 Logged out successfully", { autoClose: 1000 });
    setTimeout(() => navigate("/login"), 1000);
  };

  /** 🧭 Breadcrumbs */
  const breadcrumb = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    return parts.map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  }, [location.pathname]);

  /** ♿ Focus management on mobile open */
  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => firstLinkRef.current?.focus?.(), 150);
    }
  }, [mobileOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      {/* 🌾 Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-controls="sidebar-menu"
                aria-label="Toggle sidebar"
                className="p-2 rounded-md hover:bg-gray-100 focus:ring-2 focus:ring-green-200"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div>
                <span
                  onClick={() => navigate("/")}
                  className="text-lg font-bold text-green-700 cursor-pointer"
                >
                  KrishiSaathi
                </span>
                <div className="text-xs text-gray-500 hidden sm:block">
                  Farmer Portal
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/farmer-dashboard/stats")}
                className="hidden sm:inline-flex px-3 py-1 rounded-md bg-green-50 text-green-700 text-sm"
              >
                <BarChart2 size={16} />
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded-md bg-red-50 text-red-600 text-sm hover:bg-red-100"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 💡 Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Overlay */}
              <motion.div
                className="fixed inset-0 bg-black/30 z-40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              {/* Sidebar panel */}
              <motion.aside
                id="sidebar-menu"
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: "spring", stiffness: 250, damping: 30 }}
                className="fixed inset-y-0 left-0 w-72 z-50 bg-white border-r border-gray-100 p-4 space-y-4 shadow-lg md:hidden"
              >
                <SidebarContent
                  stats={stats}
                  userEmail={userEmail}
                  initials={initials}
                  onLogout={handleLogout}
                  onClose={() => setMobileOpen(false)}
                  firstLinkRef={firstLinkRef}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 bg-white border-r border-gray-100 p-4 space-y-4">
          <SidebarContent
            stats={stats}
            userEmail={userEmail}
            initials={initials}
            onLogout={handleLogout}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {/* Breadcrumbs */}
          <div className="mb-4 overflow-x-auto">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap">
                <li>
                  <Link
                    to="/farmer-dashboard"
                    className="flex items-center text-green-700 font-medium"
                  >
                    <Home size={14} className="mr-1" /> Home
                  </Link>
                </li>
                {breadcrumb.map((b, idx) => (
                  <li
                    key={idx}
                    className="before:content-['/'] before:px-2 before:text-gray-300"
                  >
                    <span
                      className={`truncate ${
                        idx === breadcrumb.length - 1
                          ? "text-gray-800 font-semibold"
                          : ""
                      }`}
                    >
                      {b}
                    </span>
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Outlet + Footer */}
          <div className="min-h-[60vh] bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Outlet />
          </div>
          <div className="mt-6">
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

/** 🧱 Sidebar content extracted for reuse */
const SidebarContent = ({
  stats,
  userEmail,
  initials,
  onLogout,
  onClose,
  firstLinkRef,
}) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <>
      {/* User Info */}
      <div className="flex items-center gap-3 px-1">
        <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-lg font-semibold">
          {initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-800 truncate">
            {userEmail}
          </div>
          <div className="text-xs text-gray-500">Verified Seller</div>
        </div>
      </div>

      {/* Nav */}
      <nav role="menu" className="mt-4 flex flex-col gap-1">
        <SidebarItem
          to="/farmer-dashboard"
          label="Dashboard"
          Icon={Home}
          onClick={onClose}
          ref={firstLinkRef}
          active={path === "/farmer-dashboard"}
        />
        <SidebarItem
          to="/farmer-dashboard/add"
          label="Add Product"
          Icon={PlusCircle}
          onClick={onClose}
          active={path.includes("/add")}
        />
        <SidebarItem
          to="/farmer-dashboard/stats"
          label="Dashboard Stats"
          Icon={BarChart2}
          onClick={onClose}
          active={path.includes("/stats")}
        />
        <SidebarItem
          to="/farmer-dashboard/orders"
          label="Orders"
          Icon={Box}
          onClick={onClose}
          active={path.includes("/orders")}
        />
        <SidebarItem
          to="/farmerprofile"
          label="Profile"
          Icon={User}
          onClick={onClose}
          active={path.includes("/profile")}
        />
      </nav>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
        <div className="text-xs text-gray-500 px-1">Quick Stats</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Products</div>
            <div className="text-sm font-semibold text-green-700">
              {stats.products}
            </div>
          </div>
          <div className="bg-yellow-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Pending</div>
            <div className="text-sm font-semibold text-yellow-700">
              {stats.ordersPending}
            </div>
          </div>
          <div className="bg-blue-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Completed</div>
            <div className="text-sm font-semibold text-blue-700">
              {stats.ordersCompleted}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );
};

export default FarmerDashboardLayout;
