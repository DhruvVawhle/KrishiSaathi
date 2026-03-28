// ✅ src/components/ProtectedRoute.jsx (Enhanced v2)
import React, { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useToast } from "@/frontend/contexts/ToastContext";

/**
 * 🔒 ProtectedRoute (v2)
 * - Role-based + token-based protection
 * - Cross-tab session sync (isLoggedIn, userRole, token)
 * - Auto-expiry logout
 * - Silent redirect control
 * - Vite-compatible env logging
 */

const isLocalPath = (path) =>
  typeof path === "string" && (path.startsWith("/") || path.startsWith("./"));

const safeRedirectTo = (to, fallback = "/") => (isLocalPath(to) ? to : fallback);

export default function ProtectedRoute({ children, allowedRoles = null, role = null }) {
  const toast = useToast();
  const location = useLocation();
  const [sessionValid, setSessionValid] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const hasNotified = useRef(false);

  const MODE = import.meta.env.MODE || "development";

  const isLoggedIn =
    localStorage.getItem("isLoggedIn") === "true" ||
    !!localStorage.getItem("userEmail") ||
    !!localStorage.getItem("token");

  const userRole = localStorage.getItem("userRole"); // "farmer" | "buyer"
  const tokenExpiry = localStorage.getItem("tokenExpiry");

  /** 🕒 Auto-expire token-based session */
  useEffect(() => {
    if (!tokenExpiry) return;
    const expiry = new Date(tokenExpiry);
    if (expiry <= new Date()) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      toast.info("Your session has expired. Please log in again.");
      setSessionValid(false);
    }
  }, [tokenExpiry]);

  /** 🧩 Cross-tab session sync */
  useEffect(() => {
    const handleStorageChange = (e) => {
      const keys = ["isLoggedIn", "userRole", "token"];
      if (keys.includes(e.key) && e.newValue === null) {
        setSessionValid(false);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /** 🧠 Helper to resolve redirect target */
  const redirectTarget = (role) => {
    if (role === "farmer") return "/farmer-dashboard";
    if (role === "buyer") return "/buyer-dashboard";
    return "/";
  };

  // 🚫 Session invalid (token expired / logged out)
  if (!sessionValid) {
    if (!hasNotified.current) {
      toast.info("Session expired. Please log in again.");
      hasNotified.current = true;
    }
    return <Navigate to="/login" replace />;
  }

  // 🚷 Not logged in
  if (!isLoggedIn) {
    if (!hasNotified.current) {
      toast.warning("Please log in to access this page.", 1500);
      hasNotified.current = true;
    }

    const from = safeRedirectTo(location.pathname, "/");
    if (MODE !== "production") console.warn(`[ProtectedRoute] Redirect → /login (from ${from})`);

    useEffect(() => {
      setRedirecting(true);
    }, []);
    return (
      <>
        {redirecting && (
          <div aria-live="polite" className="sr-only">
            Redirecting to login...
          </div>
        )}
        <Navigate to="/login" replace state={{ from }} />
      </>
    );
  }

  // 🧭 Missing role → choose role
  if (!userRole) {
    if (MODE !== "production")
      console.warn("[ProtectedRoute] No role assigned. Redirecting to /choose-role");
    return <Navigate to="/choose-role" replace state={{ from: location }} />;
  }

  // 🎯 Role-based access enforcement
  const rolesToCheck = allowedRoles || (role ? [role] : null);

  if (Array.isArray(rolesToCheck) && rolesToCheck.length > 0) {
    if (!rolesToCheck.includes(userRole)) {
      if (MODE !== "production") {
        console.warn(
          `[ProtectedRoute] Role mismatch → Allowed: [${rolesToCheck.join(
            ", "
          )}] | Found: ${userRole}`
        );
      }
      return <Navigate to={redirectTarget(userRole)} replace />;
    }
  } else {
    // Default guardrails (auto-correct dashboards)
    if (location.pathname.startsWith("/farmer-dashboard") && userRole !== "farmer") {
      if (MODE !== "production")
        console.warn("[ProtectedRoute] Buyer tried accessing farmer dashboard.");
      return <Navigate to={redirectTarget(userRole)} replace />;
    }

    if (location.pathname.startsWith("/buyer-dashboard") && userRole !== "buyer") {
      if (MODE !== "production")
        console.warn("[ProtectedRoute] Farmer tried accessing buyer dashboard.");
      return <Navigate to={redirectTarget(userRole)} replace />;
    }
  }

  // ✅ Access granted
  return children;
}
