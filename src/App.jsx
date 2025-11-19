// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { ProductProvider } from "./frontend/contexts/ProductContext";
import { CartProvider } from "./frontend/contexts/CartContext";

import Home from "./frontend/pages/Home";
import Marketplace from "./frontend/pages/Marketplace";
import FarmerDashboard from "./frontend/pages/FarmerDashboard";
import AddProduct from "./frontend/pages/AddProduct";
import BuyerDashboard from "./frontend/pages/BuyerDashboard";
import Login from "./frontend/pages/Login";
import PaymentForm from "./frontend/components/PaymentForm";
import About from "./frontend/pages/About";
import Contact from "./frontend/pages/Contact";
import Support from "./frontend/pages/Support";
import Register from "./frontend/pages/Register";
import ForgotPassword from "./frontend/pages/ForgotPassword";
import BuyerProfile from "./frontend/pages/BuyerProfile";
import ThankYou from "./frontend/pages/ThankYou";
import CartSidebar from "./frontend/components/CartSidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Checkout from "./frontend/components/Checkout";
import Layout from "./frontend/components/Layout";
import ProtectedRoute from "./frontend/components/ProtectedRoute";
import FarmerDashboardLayout from "./frontend/layouts/FarmerDashboardLayout";
import DashboardStats from "./frontend/components/DashboardStats";

// ✅ Correct import path for OrderHistory (keep consistent inside frontend folder)
import OrderHistory from "./frontend/pages/OrderHistory";

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const openCartHandler = () => setCartOpen(true);
    window.addEventListener("open-cart", openCartHandler);
    return () => window.removeEventListener("open-cart", openCartHandler);
  }, []);

  // Global toast deduper: prevent identical messages shown repeatedly
  useEffect(() => {
    const lastShown = new Map();
    const wrap = (name) => {
      const orig = toast[name];
      if (typeof orig !== "function") return;
      toast[name] = (message, opts) => {
        try {
          const key = `${name}::${String(message)}`;
          const now = Date.now();
          const prev = lastShown.get(key) || 0;
          if (now - prev < 800) return;
          lastShown.set(key, now);
        } catch (e) {
          // ignore
        }
        return orig(message, opts);
      };
    };

    ["success", "info", "warn", "error"].forEach(wrap);
    return () => {
      // no-op: leaving wrapped functions is fine for single-page app lifecycle
    };
  }, []);

  return (
    <Router>
      <ProductProvider>
        <CartProvider>
          <ToastContainer position="top-right" />

          <Routes>
            {/* 🌐 Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/support" element={<Support />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/thankyou" element={<ThankYou />} />

            {/* 👨‍🌾 Farmer Protected Routes */}
            <Route element={<FarmerDashboardLayout />}>
              <Route
                path="/farmer-dashboard"
                element={
                  <ProtectedRoute role="farmer">
                    <FarmerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farmer-dashboard/add"
                element={
                  <ProtectedRoute role="farmer">
                    <AddProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/farmer-dashboard/stats"
                element={
                  <ProtectedRoute role="farmer">
                    <DashboardStats />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 🛍️ Buyer Protected Routes */}
            <Route element={<Layout />}>
              <Route
                path="/buyer-dashboard"
                element={
                  <ProtectedRoute role="buyer">
                    <BuyerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/buyerprofile"
                element={
                  <ProtectedRoute role="buyer">
                    <BuyerProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orderhistory"
                element={
                  <ProtectedRoute role="buyer">
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <ProtectedRoute role="buyer">
                    <PaymentForm />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 🧾 Common Protected Routes */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            {/* Cart is shown as an overlay from Layout; no route-mounted CartSidebar here */}
          </Routes>
        </CartProvider>
      </ProductProvider>
    </Router>
  );
}

export default App;
