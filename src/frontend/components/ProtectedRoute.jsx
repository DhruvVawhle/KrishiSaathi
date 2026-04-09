// ✅ src/components/ProtectedRoute.jsx (Refactored for Stability)
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * 🔒 ProtectedRoute (Simplified)
 * - Role-based + token-based protection
 * - Directly checks localStorage to avoid state update warnings during render
 */
export default function ProtectedRoute({ children, allowedRoles = null, role = null }) {
  const location = useLocation();

  // 🧠 Direct storage checks (synchronous to avoid state-update-during-render warning)
  const isLoggedIn =
    localStorage.getItem("isLoggedIn") === "true" ||
    !!localStorage.getItem("userEmail") ||
    !!localStorage.getItem("token");

  const userRole = localStorage.getItem("userRole"); // "farmer" | "buyer"
  const tokenExpiry = localStorage.getItem("tokenExpiry");

  // 🕒 Check expiry (pure check with validation)
  if (tokenExpiry) {
    const expiry = new Date(tokenExpiry);
    const isInvalid = isNaN(expiry.getTime());

    if (isInvalid || expiry <= new Date()) {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("tokenExpiry");
      localStorage.removeItem("ks_user");
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  }

  // 🚷 Not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 🧭 Missing role
  if (!userRole) {
    return <Navigate to="/choose-role" replace state={{ from: location }} />;
  }

  // 🎯 Role-based access enforcement
  const rolesToCheck = allowedRoles || (role ? [role] : null);

  if (Array.isArray(rolesToCheck) && rolesToCheck.length > 0) {
    if (!rolesToCheck.includes(userRole)) {
      const redirectTarget = userRole === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard";
      return <Navigate to={redirectTarget} replace />;
    }
  } else {
    // Default dashboard guardrails
    if (location.pathname.startsWith("/farmer-dashboard") && userRole !== "farmer") {
      return <Navigate to="/buyer-dashboard" replace />;
    }
    if (location.pathname.startsWith("/buyer-dashboard") && userRole !== "buyer") {
      return <Navigate to="/farmer-dashboard" replace />;
    }
  }

  // ✅ Access granted
  return children;
}

