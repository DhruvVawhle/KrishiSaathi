// src/layouts/FarmerDashboardLayout.jsx
import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  User,
  BarChart2,
  PlusSquare,
  Home,
  Search,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/**
 * FarmerDashboardLayout (profile-integrated)
 * - Shows avatar + displayName loaded from localStorage (farmerProfile_v1)
 * - Active state for header & mobile actions
 * - Accessible & responsive
 */

/* Buttons */
const ACTION_BUTTONS = [
  {
    to: "/farmer-dashboard/add",
    label: "Add Product",
    icon: <PlusSquare size={16} />,
    className: "bg-green-600 text-white hover:bg-green-700 shadow-sm",
  },
  {
    to: "/farmer-dashboard/stats",
    label: "Stats",
    icon: <BarChart2 size={16} />,
    className: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
  },
  {
    to: "/marketplace",
    label: "Marketplace",
    icon: <Home size={16} />,
    className: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
  },
];

const MOBILE_ACTIONS = [
  { to: "/farmer-dashboard/add", label: "Add", icon: <PlusSquare size={18} /> },
  { to: "/farmer-dashboard/stats", label: "Stats", icon: <BarChart2 size={18} /> },
  { to: "/marketplace", label: "Market", icon: <Home size={18} /> },
];

const PROFILE_STORAGE_KEY = "farmerProfile_v1";

function humanizeLabel(str = "") {
  return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FarmerDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const profileButtonRef = useRef(null);

  const [profile, setProfile] = useState({
    displayName: "",
    farmName: "",
    avatarBase64: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  // helper to load current profile from storage
  const refreshProfileFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setProfile({
          displayName:
            parsed.displayName ||
            (localStorage.getItem("userEmail") || "").split("@")[0] ||
            "",
          farmName: parsed.farmName || localStorage.getItem("farmName") || "My Farm",
          avatarBase64: parsed.avatarBase64 || "",
        });
      } else {
        setProfile({
          displayName: (localStorage.getItem("userEmail") || "").split("@")[0] || "",
          farmName: localStorage.getItem("farmName") || "My Farm",
          avatarBase64: "",
        });
      }
    } catch {
      // fallback
      setProfile({
        displayName: (localStorage.getItem("userEmail") || "").split("@")[0] || "",
        farmName: localStorage.getItem("farmName") || "My Farm",
        avatarBase64: "",
      });
    }
  }, []);

  useEffect(() => {
    // initial load
    refreshProfileFromStorage();
  }, [refreshProfileFromStorage]);

  /* Close dropdown on outside click / ESC */
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    const handleKey = (e) => e.key === "Escape" && setProfileOpen(false);

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Listen for profile updates (dispatched by FarmerProfile / AccountSettings)
  useEffect(() => {
    const onProfileUpdated = () => {
      refreshProfileFromStorage();
    };

    window.addEventListener("profile-updated", onProfileUpdated);
    // also refresh when window gains focus (other tab may have changed storage)
    window.addEventListener("focus", onProfileUpdated);

    return () => {
      window.removeEventListener("profile-updated", onProfileUpdated);
      window.removeEventListener("focus", onProfileUpdated);
    };
  }, [refreshProfileFromStorage]);

  const handleLogout = useCallback(() => {
    if (!window.confirm("Logout from KrishiSaathi?")) return;
    localStorage.clear();
    navigate("/login");
  }, [navigate]);

  /* Breadcrumb */
  const breadcrumbItems = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    const base = [{ label: "Dashboard", to: "/farmer-dashboard" }];

    if (!parts.includes("farmer-dashboard")) return base;

    const sub = parts.slice(parts.indexOf("farmer-dashboard") + 1);
    let url = "/farmer-dashboard";
    sub.forEach((p) => {
      url += `/${p}`;
      base.push({ label: humanizeLabel(p), to: url });
    });

    return base;
  }, [location.pathname]);

  const doSearch = useCallback(
    (q) => {
      const query = (q || searchTerm).trim();
      if (!query) return;
      navigate(`/farmer-dashboard?search=${encodeURIComponent(query)}`);
    },
    [navigate, searchTerm]
  );

  const handleSearchKey = (e) => {
    if (e.key === "Enter") doSearch(e.target.value);
  };

  /* helpers */
  const isActive = (to) => {
    if (to === "/farmer-dashboard") return location.pathname === "/farmer-dashboard";
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-green-100 text-gray-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-3 py-2 rounded shadow ring-2 ring-green-200 z-50"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/85 border-b shadow-sm supports-[backdrop-filter]:bg-white/70" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* LEFT — Brand */}
            <button
              onClick={() => navigate("/farmer-dashboard")}
              className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-300 rounded-md"
              aria-label="Go to dashboard home"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-600/10 border border-green-100 flex items-center justify-center text-green-700 shadow-sm text-2xl">
                🌾
              </div>

              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-800 tracking-tight">KrishiSaathi — Farmer</h1>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                    {profile.farmName}
                  </span>
                </div>
              </div>

              <div className="sm:hidden text-sm text-gray-700 font-semibold">{profile.farmName}</div>
            </button>

            {/* MIDDLE — Breadcrumb + Search */}
            <div className="flex-1 hidden md:flex justify-center">
              <div className="w-full max-w-3xl space-y-2">
                <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
                  <ol className="flex items-center gap-2 flex-wrap">
                    {breadcrumbItems.map((b, idx) => (
                      <li key={b.to} className="flex items-center gap-2">
                        {idx !== 0 && <span className="text-gray-300" aria-hidden>›</span>}
                        <Link
                          to={b.to}
                          className={`truncate hover:underline ${idx === breadcrumbItems.length - 1 ? "font-semibold text-green-700" : "text-gray-600"
                            }`}
                          aria-current={idx === breadcrumbItems.length - 1 ? "page" : undefined}
                        >
                          {b.label}
                        </Link>
                      </li>
                    ))}
                  </ol>
                </nav>

                <div className="relative" role="search" aria-label="Search farmer dashboard">
                  <Search className="absolute left-4 top-2.5 text-gray-400" size={16} />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearchKey}
                    placeholder="Search products, orders or stats..."
                    aria-label="Search products, orders or stats"
                    className="w-full pl-12 pr-12 py-2 rounded-full bg-white/90 border border-gray-200 shadow-sm focus:ring-2 focus:ring-green-200"
                  />
                  <button
                    onClick={() => doSearch(searchTerm)}
                    aria-label="Execute search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-green-600 text-white text-sm hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-200"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT — Action Buttons + Profile */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {ACTION_BUTTONS.map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => navigate(btn.to)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:-translate-y-0.5 ${isActive(btn.to) ? "ring-2 ring-green-200" : ""
                      } ${btn.className}`}
                    aria-pressed={isActive(btn.to)}
                    aria-label={btn.label}
                  >
                    {btn.icon}
                    <span className="hidden md:inline">{btn.label}</span>
                  </button>
                ))}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  ref={profileButtonRef}
                  onClick={() => setProfileOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 text-gray-800 focus-visible:ring-2 focus-visible:ring-green-200"
                  aria-haspopup="true"
                  aria-expanded={profileOpen}
                >
                  {/* show avatar if available */}
                  {profile.avatarBase64 ? (
                    <img
                      src={profile.avatarBase64}
                      alt={`${profile.displayName || "Farmer"} avatar`}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-medium">
                      {profile.displayName ? profile.displayName[0].toUpperCase() : <User size={14} />}
                    </div>
                  )}

                  <span className="hidden sm:inline text-sm truncate" title={profile.displayName}>
                    {profile.displayName || "Account"}
                  </span>
                  <ChevronDown size={14} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={reduceMotion ? {} : { opacity: 0, y: -6 }}
                      animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
                      exit={reduceMotion ? {} : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-64 bg-white border rounded-lg shadow-xl overflow-hidden z-50"
                    >
                      {/* compact profile preview */}
                      <div className="p-4 flex items-center gap-3">
                        {profile.avatarBase64 ? (
                          <img src={profile.avatarBase64} alt="avatar" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-semibold">
                            {profile.displayName ? profile.displayName[0].toUpperCase() : "F"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{profile.displayName || "Farmer"}</div>
                          <div className="text-xs text-gray-500 truncate">{profile.farmName}</div>
                        </div>
                      </div>

                      <div className="border-t" />
                      <Link to="/farmer-dashboard/profile" className="block px-4 py-3 text-sm hover:bg-gray-50">
                        Profile & settings
                      </Link>
                      <button onClick={() => navigate("/farmer-dashboard/settings")} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50">
                        Account settings
                      </button>
                      <div className="border-t" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <LogOut size={14} /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE TOOLBAR */}
        <div className="sm:hidden border-t bg-white/95 backdrop-blur-md shadow-lg sticky">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
            {MOBILE_ACTIONS.map((btn) => (
              <button
                key={btn.label}
                onClick={() => navigate(btn.to)}
                className={`flex flex-col items-center text-xs text-gray-700 px-4 py-2 focus-visible:ring-2 focus-visible:ring-green-200 ${isActive(btn.to) ? "bg-green-50 rounded-lg" : ""
                  }`}
                aria-pressed={isActive(btn.to)}
                aria-label={btn.label}
              >
                {btn.icon}
                <span className="mt-1 text-[11px]">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main id="main-content" className="flex-grow container mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: 6 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md p-6 min-h-[65vh]"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
