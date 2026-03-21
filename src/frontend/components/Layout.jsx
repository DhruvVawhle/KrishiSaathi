import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UnifiedHeader from "./UnifiedHeader";
import Footer from "./Footer";
import CartSidebar from "./CartSidebar";
import CartToast from "./CartToast";
import FloatingCartButton from "./FloatingCartButton";
import { useCart } from "@/frontend/contexts/CartContext";
import BottomNav from "./ui/BottomNav";

const Layout = ({ children }) => {
  const location = useLocation();
  const { cart: rawCart = [] } = useCart() || {};
  const [cart, setCart] = useState(rawCart);
  const prevActiveEl = useRef(null);
  const topProgressRef = useRef(null);
  const liveRef = useRef(null);
  const progressTimer = useRef(null);

  // Handle cart clear
  useEffect(() => {
    const handleCleared = () => setCart([]);
    window.addEventListener("cart-cleared", handleCleared);
    return () => window.removeEventListener("cart-cleared", handleCleared);
  }, []);

  // Sync cart context
  useEffect(() => {
    if (Array.isArray(rawCart)) setCart(rawCart);
  }, [rawCart]);

  const cartCount = Array.isArray(cart)
    ? cart.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    : 0;

  // Progress bar on route change
  useEffect(() => {
    const el = topProgressRef.current;
    if (!el) return;

    el.style.transition = "none";
    el.style.transform = "scaleX(0)";
    el.style.opacity = "1";

    requestAnimationFrame(() => {
      el.style.transition = "transform 400ms ease, opacity 400ms ease";
      el.style.transform = "scaleX(0.7)";
    });

    window.scrollTo({ top: 0, behavior: "smooth" });

    clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      el.style.transform = "scaleX(1)";
      setTimeout(() => (el.style.opacity = "0"), 300);
    }, 350);

    return () => clearTimeout(progressTimer.current);
  }, [location.pathname]);

  // No local event listeners needed here anymore as App.jsx handles it now.

  // Scroll lock helper
  const lockBodyScroll = (shouldLock) => {
    const body = document.body;
    if (shouldLock) {
      prevActiveEl.current = document.activeElement;
      const scrollY = window.scrollY;
      body.style.position = "fixed";
      body.style.top = `-${scrollY}px`;
      body.style.width = "100%";
    } else {
      const scrollY = body.style.top;
      body.style.position = "";
      body.style.top = "";
      body.style.width = "";
      if (scrollY) window.scrollTo(0, parseInt(scrollY || "0") * -1);
      try {
        prevActiveEl.current?.focus?.();
      } catch { }
    }
  };

  // Manage scroll + focus
  useLayoutEffect(() => {
    // Body scroll lock is now handled inside CartSidebar.jsx itself centrally.
    // Layout.jsx just provides the container.
  }, []);

  // Keyboard shortcuts (handled by App.jsx or individually if needed, but 'C' is global)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "c") {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (["input", "textarea"].includes(activeTag)) return;
        window.dispatchEvent(new CustomEvent("open-cart"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleCartToggle = () => window.dispatchEvent(new CustomEvent("open-cart"));
  const handleCloseCart = () => { /* No longer used locally */ };

  // Hide floating cart on specific routes
  const hideFloatingCart = ["/checkout", "/login", "/payment", "/thank-you"].some(
    (r) => location.pathname.startsWith(r)
  );

  // Detect full-bleed pages (Home) no padding/max-width constraints
  const isFullBleed = ["/", "/home"].includes(location.pathname);

  return (
    <div className={`flex flex-col min-h-screen pb-16 sm:pb-0 transition-colors duration-300 ${isFullBleed ? "" : "bg-gradient-to-br from-green-50 via-white to-gray-100 text-gray-800"}`}>
      <div
        ref={topProgressRef}
        aria-hidden="true"
        className="origin-left fixed left-0 top-0 h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400 opacity-0 pointer-events-none transform scale-x-0 transition-all"
        style={{ transformOrigin: "left", zIndex: 9999 }}
      />

      <div ref={liveRef} aria-live="polite" className="sr-only" />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-white text-green-700 px-3 py-2 rounded shadow"
      >
        Skip to content
      </a>

      <UnifiedHeader onOpenCart={handleCartToggle} cartCount={cartCount} />

      <main
        id="main-content"
        className={isFullBleed
          ? "flex-grow w-full relative"
          : "flex-grow w-full px-4 sm:px-6 lg:px-10 py-6 transition-all duration-300 relative"
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full"
          >
            {isFullBleed ? (
              <>
                <Outlet />
                {children}
              </>
            ) : (
              <div className="max-w-7xl mx-auto w-full">
                <Outlet />
                {children && <div className="mt-6">{children}</div>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="mt-auto">
        <Footer />
      </div>

      <CartToast />

      {!hideFloatingCart && (
        <div className="hidden sm:block">
          <FloatingCartButton onOpen={handleCartToggle} />
        </div>
      )}

      <BottomNav />

      <div className="sr-only" aria-hidden="true">
        Shortcut: Press "C" to toggle cart.
      </div>
    </div>
  );
};

export default Layout;
