// src/layouts/FarmerDashboardLayout.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import {
  ChevronDown,
  LogOut,
  User,
  BarChart2,
  PlusSquare,
  Home,
  Search,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

/**
 * 🌾 Premium Hybrid Farmer Dashboard Layout (Glass + Green + Modern)
 * - Upgraded App-like UI
 * - Soft shadows, glass surfaces, improved buttons
 * - Better mobile toolbar
 * - Enhanced search bar + breadcrumb
 */

const FarmerDashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [farmName, setFarmName] = useState("My Farm");

  /* Load user info */
  useEffect(() => {
    setUserEmail(localStorage.getItem("userEmail") || "");
    setUserRole(localStorage.getItem("userRole") || "");
    setFarmName(localStorage.getItem("farmName") || "My Farm");
  }, []);

  /* Close dropdown on outside click / ESC */
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setProfileOpen(false);

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const handleLogout = () => {
    if (!window.confirm("Logout from KrishiSaathi?")) return;
    localStorage.clear();
    navigate("/login");
  };

  /* Compute Breadcrumb */
  const breadcrumbItems = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const base = [{ label: "Dashboard", to: "/farmer-dashboard" }];

    if (!parts.includes("farmer-dashboard")) return base;

    const sub = parts.slice(parts.indexOf("farmer-dashboard") + 1);
    let url = "/farmer-dashboard";
    sub.forEach((p) => {
      url += `/${p}`;
      base.push({
        label: p.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        to: url,
      });
    });

    return base;
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100">
      {/* ======================= HEADER ======================= */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 border-b shadow-sm supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">

            {/* LEFT — Brand */}
            <button
              onClick={() => navigate("/farmer-dashboard")}
              className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-green-300 rounded-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-600/10 border border-green-100 flex items-center justify-center text-green-700 shadow-sm text-2xl">
                🌾
              </div>

              <div>
                <h1 className="text-lg font-bold text-gray-800 tracking-tight">
                  KrishiSaathi — Farmer
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                    {farmName}
                  </span>
                  {userRole && (
                    <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                      {userRole}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* MIDDLE — Breadcrumb + Search */}
            <div className="flex-1 hidden md:flex justify-center">
              <div className="w-full max-w-3xl space-y-2">

                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
                  <ol className="flex items-center gap-2 flex-wrap">
                    {breadcrumbItems.map((b, idx) => (
                      <li
                        key={b.to}
                        className="flex items-center gap-2"
                        aria-current={
                          idx === breadcrumbItems.length - 1 ? "page" : undefined
                        }
                      >
                        {idx !== 0 && <span className="text-gray-300">›</span>}

                        <Link
                          to={b.to}
                          className={`truncate hover:underline ${
                            idx === breadcrumbItems.length - 1
                              ? "font-semibold text-green-700"
                              : "text-gray-600"
                          }`}
                        >
                          {b.label}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-4 top-2.5 text-gray-400" size={16} />
                  <input
                    placeholder="Search your products, orders or stats..."
                    className="w-full pl-12 pr-4 py-2 rounded-full bg-white/80 border border-gray-200 shadow-sm focus:ring-2 focus:ring-green-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const q = e.currentTarget.value.trim();
                        if (q)
                          navigate(
                            `/farmer-dashboard?search=${encodeURIComponent(q)}`
                          );
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT — Action Buttons + Profile */}
            <div className="flex items-center gap-3">

              {/* Action Buttons (Desktop Only) */}
              <div className="hidden sm:flex items-center gap-2">
                {[
                  {
                    to: "/farmer-dashboard/add",
                    label: "Add Product",
                    icon: <PlusSquare size={16} />,
                    class:
                      "bg-green-600 text-white hover:bg-green-700 shadow-sm",
                  },
                  {
                    to: "/farmer-dashboard/stats",
                    label: "Stats",
                    icon: <BarChart2 size={16} />,
                    class:
                      "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
                  },
                  {
                    to: "/marketplace",
                    label: "Marketplace",
                    icon: <Home size={16} />,
                    class:
                      "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
                  },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => navigate(btn.to)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:-translate-y-0.5 ${btn.class}`}
                  >
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 text-gray-800 focus-visible:ring-2 focus-visible:ring-green-200"
                >
                  <User size={16} />
                  <span className="hidden sm:inline text-sm truncate">
                    {userEmail ? userEmail.split("@")[0] : "Account"}
                  </span>
                  <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={reduceMotion ? {} : { opacity: 0, y: -6 }}
                      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? {} : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      <Link
                        to="/farmer-dashboard/profile"
                        className="block px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        Profile
                      </Link>

                      <Link
                        to="/farmer-dashboard/settings"
                        className="block px-4 py-3 text-sm hover:bg-gray-50"
                      >
                        Settings
                      </Link>

                      <div className="border-t" />

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* ======================= MOBILE TOOLBAR ======================= */}
        <div className="sm:hidden border-t bg-white/95 backdrop-blur-md shadow-lg sticky">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">

            {[
              { to: "/farmer-dashboard/add", label: "Add", icon: <PlusSquare size={16} /> },
              { to: "/farmer-dashboard/stats", label: "Stats", icon: <BarChart2 size={16} /> },
              { to: "/marketplace", label: "Market", icon: <Home size={16} /> },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={() => navigate(btn.to)}
                className="flex flex-col items-center text-xs text-gray-700 px-4 py-1 focus-visible:ring-2 focus-visible:ring-green-200"
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ======================= MAIN CONTENT ======================= */}
      <main
        className="flex-grow container mx-auto px-4 sm:px-6 py-8"
      >
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 6 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 min-h-[65vh]"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* ======================= FOOTER ======================= */}
      <Footer />
    </div>
  );
};

export default FarmerDashboardLayout;
