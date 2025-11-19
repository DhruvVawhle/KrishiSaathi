// ✅ src/components/Layout.jsx (Enhanced v2)
import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import UnifiedHeader from "./UnifiedHeader";
import Footer from "./Footer";
import CartSidebar from "./CartSidebar";
import { useCart } from "../contexts/CartContext";

const Layout = ({ children }) => {
  const location = useLocation();
  const { cart: rawCart = [] } = useCart() || {};
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState(rawCart);
  const prevActiveEl = useRef(null);
  const topProgressRef = useRef(null);
  const liveRef = useRef(null);
  const progressTimer = useRef(null);

  // ✅ Handle cart clear
  useEffect(() => {
    const handleCleared = () => setCart([]);
    window.addEventListener("cart-cleared", handleCleared);
    return () => window.removeEventListener("cart-cleared", handleCleared);
  }, []);

  // ✅ Sync cart context
  useEffect(() => {
    if (Array.isArray(rawCart)) setCart(rawCart);
  }, [rawCart]);

  const cartCount = Array.isArray(cart)
    ? cart.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    : 0;

  // ✅ Progress bar on route change
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

  // ✅ Global cart triggers
  useEffect(() => {
    const open = () => setCartOpen(true);
    window.addEventListener("open-cart", open);
    window.addEventListener("openCartSidebar", open);
    return () => {
      window.removeEventListener("open-cart", open);
      window.removeEventListener("openCartSidebar", open);
    };
  }, []);

  // ✅ Scroll lock helper
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
      } catch {}
    }
  };

  // ✅ Manage scroll + focus
  useLayoutEffect(() => {
    lockBodyScroll(cartOpen);
    if (liveRef.current) {
      liveRef.current.textContent = cartOpen ? "Cart opened" : "Cart closed";
    }
  }, [cartOpen]);

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (["input", "textarea"].includes(activeTag)) return;
      if (e.key === "Escape" && cartOpen) return setCartOpen(false);
      if (e.key.toLowerCase() === "c") setCartOpen((s) => !s);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen]);

  const handleCartToggle = () => setCartOpen((s) => !s);
  const handleCloseCart = () => setCartOpen(false);

  // ✅ Hide floating cart on specific routes
  const hideFloatingCart = ["/checkout", "/login", "/payment", "/thankyou"].some(
    (r) => location.pathname.startsWith(r)
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100 text-gray-800 transition-colors duration-300">
      {/* ✅ Progress Bar */}
      <div
        ref={topProgressRef}
        aria-hidden="true"
        className="origin-left fixed left-0 top-0 h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400 opacity-0 pointer-events-none transform scale-x-0 transition-all"
        style={{ transformOrigin: "left" }}
      />

      {/* ✅ SR Announcements */}
      <div ref={liveRef} aria-live="polite" className="sr-only" />

      {/* ✅ Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-white text-green-700 px-3 py-2 rounded shadow"
      >
        Skip to content
      </a>

      {/* ✅ Header (UnifiedHeader includes its own header element) */}
      <UnifiedHeader onOpenCart={() => setCartOpen(true)} cartCount={cartCount} />

      {/* ✅ Main Content */}
      <main
        id="main-content"
        className="flex-grow w-full px-4 sm:px-6 lg:px-10 py-6 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
          {children && <div className="mt-6">{children}</div>}
        </div>
      </main>

      {/* ✅ Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <Footer />
      </footer>

      {/* ✅ Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={handleCloseCart} />

      {/* ✅ Floating Cart Buttons */}
      {!hideFloatingCart && (
        <>
          {/* Mobile */}
          <button
            onClick={handleCartToggle}
            aria-label="Open shopping cart"
            title="Open cart"
            className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 z-40 sm:hidden bg-green-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-700 transition-transform duration-200 active:scale-95"
          >
            <span className="text-lg">🛒</span>
            <span className="text-sm font-semibold">Cart</span>
            {cartCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-white text-green-700 font-semibold text-xs px-1">
                {cartCount}
              </span>
            )}
          </button>

          {/* Desktop */}
          <button
            onClick={handleCartToggle}
            aria-label="Open shopping cart"
            title="Open cart"
            className="hidden sm:flex fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] right-8 z-40 bg-white rounded-full shadow-2xl p-3 items-center gap-3 hover:scale-105 transform transition-transform duration-200 active:scale-95"
          >
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-lg">
              🛒
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500">Your Cart</div>
              <div className="text-sm font-semibold text-green-700">
                {cartCount} item{cartCount !== 1 ? "s" : ""}
              </div>
            </div>
          </button>
        </>
      )}

      {/* Keyboard Helper (hidden for SRs) */}
      <div className="sr-only" aria-hidden="true">
        Shortcut: Press “C” to toggle cart.
      </div>
    </div>
  );
};

export default Layout;
