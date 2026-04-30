// ✅ src/components/Sidebar.jsx (Enhanced v2)
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ChartBar,
  PlusSquare,
  Store,
  BarChart2,
  Search,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-toastify";
import { flushSync } from "react-dom";

const MODE = import.meta.env.MODE || "development";

export default function Sidebar({ productCount = 0, orderCount = 0 }) {
  const navigate = useNavigate();
  const toggleBtnRef = useRef(null);

  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true"
  );

  const userEmail = localStorage.getItem("userEmail");
  const initials = userEmail
    ? userEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "KS";

  /** 🧠 Persist collapse state */
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  /** 🧩 Auto close on back/forward navigation */
  useEffect(() => {
    const handleRouteChange = () => setIsOpenMobile(false);
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  /** 🪟 Responsive behavior */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpenMobile(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /** 🎯 Link style */
  const linkClass = ({ isActive }) =>
    `flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
      isActive
        ? "bg-green-600 text-white shadow-md"
        : "text-gray-700 hover:bg-green-50 hover:text-green-700"
    }`;

  /** 📋 Nav links */
  const links = [
    { to: "/farmer-dashboard", label: "Overview", icon: <ChartBar size={18} /> },
    { to: "/farmer-dashboard/add", label: "Add Product", icon: <PlusSquare size={18} /> },
    {
      to: "/farmer-dashboard/marketplace",
      label: "My Marketplace",
      icon: <Store size={18} />,
      badge: productCount || null,
    },
    {
      to: "/farmer-dashboard/sales",
      label: "Sales Report",
      icon: <BarChart2 size={18} />,
      badge: orderCount || null,
    },
    { to: "/marketplace", label: "Public Marketplace", icon: <Search size={18} /> },
  ];

  /** 🚪 Secure logout */
  const handleLogout = () => {
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
    setTimeout(() => {
      flushSync(() => {
        [
          "isLoggedIn",
          "userRole",
          "userEmail",
          "token",
          "tokenExpiry",
        ].forEach((key) => localStorage.removeItem(key));
      });
      navigate("/login", { replace: true });
    }, 1000);
  };

  return (
    <>
      {/* 📱 Mobile Toggle */}
      <button
        ref={toggleBtnRef}
        onClick={() => setIsOpenMobile((s) => !s)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-green-600 text-white p-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-400"
        aria-expanded={isOpenMobile}
        aria-controls="sidebar"
        title={isOpenMobile ? "Close menu" : "Open menu"}
      >
        {isOpenMobile ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 💻 Desktop Collapse Toggle */}
      <div className="hidden lg:flex fixed left-4 top-20 z-40">
        <button
          onClick={() => setIsCollapsed((s) => !s)}
          className="bg-white/90 border border-green-100 p-2 rounded-full shadow hover:scale-105 transition focus:outline-none focus:ring-2 focus:ring-green-300"
          aria-pressed={isCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu size={18} className="text-green-700" />
          ) : (
            <X size={18} className="text-green-700" />
          )}
        </button>
      </div>

      {/* 🧭 Sidebar Drawer */}
      <AnimatePresence>
        {(isOpenMobile || typeof window !== "undefined") && (
          <motion.aside
            id="sidebar"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={`fixed lg:static top-0 left-0 h-screen z-40 
              ${isCollapsed ? "lg:w-20" : "lg:w-64"}
              w-72 bg-white/95 lg:backdrop-blur-md 
              lg:border-r shadow-xl border-green-100 flex flex-col
              ${isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
            role="navigation"
            aria-label="Sidebar"
          >
            {/* Header */}
            <div className="px-5 py-5 border-b bg-gradient-to-r from-green-600 to-green-700 text-white flex items-center gap-3">
              <div
                className={`flex items-center justify-center rounded-md bg-white/10 font-bold ${
                  isCollapsed ? "w-10 h-10 text-sm" : "w-12 h-12 text-lg"
                }`}
                title={userEmail || "KrishiSaathi Farmer"}
              >
                {initials}
              </div>

              {!isCollapsed && (
                <div className="flex-1">
                  <div className="text-lg font-semibold">KrishiSaathi</div>
                  <div className="text-xs opacity-90 mt-0.5 truncate max-w-[160px]">
                    {userEmail || "Farmer Account"}
                  </div>
                </div>
              )}

              {/* Mobile Close */}
              <button
                onClick={() => {
                  setIsOpenMobile(false);
                  toggleBtnRef.current?.focus();
                }}
                className="lg:hidden p-1 rounded-md bg-white/10 hover:bg-white/20"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="p-4 flex-1 overflow-y-auto" aria-label="Main navigation">
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      className={linkClass}
                      onClick={() => setIsOpenMobile(false)}
                      end
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">{link.icon}</span>
                        {!isCollapsed && <span>{link.label}</span>}
                      </div>
                      {link.badge && (
                        <span
                          className={`ml-auto inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isCollapsed ? "hidden" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer Actions */}
            <div className="border-t p-4 bg-green-50 flex items-center justify-between">
              {!isCollapsed ? (
                <button
                  onClick={() => navigate("/farmer-dashboard/add")}
                  className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-semibold shadow-sm transition"
                >
                  <PlusSquare size={16} className="inline mr-1" /> Add Product
                </button>
              ) : (
                <button
                  onClick={() => navigate("/farmer-dashboard/add")}
                  className="w-10 h-10 bg-green-600 rounded-md flex items-center justify-center text-white shadow-sm"
                  title="Add Product"
                  aria-label="Add Product"
                >
                  <PlusSquare size={16} />
                </button>
              )}

              <button
                onClick={handleLogout}
                className={`ml-2 ${
                  isCollapsed ? "w-10 h-10" : "px-3 py-2"
                } bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition`}
                aria-label="Logout"
              >
                <LogOut size={16} />
                {!isCollapsed && (
                  <span className="text-sm font-semibold">Logout</span>
                )}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
