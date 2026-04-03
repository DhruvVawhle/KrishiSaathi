import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LazyMotion, domAnimation } from "framer-motion";

import { ProductProvider } from "./frontend/contexts/ProductContext";
import { CartProvider } from "./frontend/contexts/CartContext";
import { ToastProvider } from './frontend/contexts/ToastContext';

// Lazy load pages
const Home = lazy(() => import("./frontend/pages/Home"));
const Marketplace = lazy(() => import("./frontend/pages/Marketplace"));
const FarmerDashboard = lazy(() => import("./frontend/pages/FarmerDashboard"));
const AddProduct = lazy(() => import("./frontend/pages/AddProduct"));
const BuyerDashboard = lazy(() => import("./frontend/pages/BuyerDashboard"));
const Login = lazy(() => import("./frontend/pages/Login"));
const About = lazy(() => import("./frontend/pages/About"));
const Contact = lazy(() => import("./frontend/pages/Contact"));
const Support = lazy(() => import("./frontend/pages/Support"));
const Register = lazy(() => import("./frontend/pages/Register"));
const ForgotPassword = lazy(() => import("./frontend/pages/ForgotPassword"));
const BuyerProfile = lazy(() => import("./frontend/pages/BuyerProfile"));
const ThankYou = lazy(() => import("./frontend/pages/ThankYou"));
const PaymentFailure = lazy(() => import("./frontend/pages/PaymentFailure"));
const OrderHistory = lazy(() => import("./frontend/pages/OrderHistory"));
const Checkout = lazy(() => import("./frontend/components/Checkout"));
const PaymentForm = lazy(() => import("./frontend/components/PaymentForm"));
const ServerStatus = lazy(() => import("./frontend/pages/ServerStatus"));
const EInvoiceForm = lazy(() => import("./frontend/pages/EInvoiceForm"));
const AvatarDemo = lazy(() => import("./frontend/pages/AvatarDemo"));
const NotFound = lazy(() => import("./frontend/pages/NotFound"));

// Lazy load remaining components used in routes
const FarmerDashboardLayout = lazy(() => import("./frontend/layouts/FarmerDashboardLayout"));
const FarmerProfile = lazy(() => import("./frontend/layouts/FarmerProfile"));
const DashboardStats = lazy(() => import("./frontend/components/DashboardStats"));
const AccountSettings = lazy(() => import("./frontend/layouts/AccountSettings"));

// Regular imports for components used in layout or context
import CartSidebar from "./frontend/components/CartSidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Layout from "./frontend/components/Layout";
import ProtectedRoute from "./frontend/components/ProtectedRoute";
import { NotificationProvider } from "./frontend/contexts/NotificationContext";

const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh', 
    backgroundColor: '#F5E6CC',
    flexDirection: 'column',
    gap: '20px'
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      border: '4px solid rgba(45, 79, 30, 0.1)',
      borderTop: '4px solid #2D4F1E',
      borderRadius: '50%',
    }} className="animate-spin" />
    <span style={{ 
      fontWeight: 600, 
      color: '#2D4F1E',
      fontFamily: 'DM Sans, sans-serif'
    }}>
      Loading KrishiSaathi...
    </span>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .animate-spin { animation: spin 1s linear infinite; }
    `}</style>
  </div>
);

function App() {
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const openCartHandler = () => setCartOpen(true);
    window.addEventListener("open-cart", openCartHandler);
    return () => window.removeEventListener("open-cart", openCartHandler);
  }, []);

  // Global toast deduper
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
      // no-op
    };
  }, []);

  return (
    <ToastProvider>
      <Router>
        <ProductProvider>
          <NotificationProvider>
            <CartProvider>
              <ToastContainer position="top-right" />
              <LazyMotion features={domAnimation}>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* 🌐 Public Routes — wrapped in Layout for shared header/footer */}
                    <Route element={<Layout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/home" element={<Home />} />
                      <Route path="/marketplace" element={<Marketplace />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/avatar-demo" element={<AvatarDemo />} />
                    </Route>
                    {/* Standalone routes (own layout) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/thank-you" element={<ThankYou />} />
                    <Route path="/thank-you/:id" element={<ThankYou />} />
                    <Route path="/payment-failure" element={<PaymentFailure />} />
                    <Route path="/einvoice" element={<EInvoiceForm />} />

                    {/* 👨‍🌾 Farmer Dashboard (Custom Layout within component) */}
                    <Route
                      path="/farmer-dashboard/*"
                      element={
                        <ProtectedRoute role="farmer">
                          <Routes>
                            <Route index element={<FarmerDashboard />} />
                          </Routes>
                        </ProtectedRoute>
                      }
                    />

                    {/* 👨‍🌾 Farmer Other Protected Routes (layout + nested children) */}
                    <Route element={<FarmerDashboardLayout />}>
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
                      <Route
                        path="/farmer-dashboard/settings"
                        element={
                          <ProtectedRoute role="farmer">
                            <AccountSettings />
                          </ProtectedRoute>
                        }
                      />
                      {/* Nested profile route — will render at /farmer-dashboard/profile */}
                      <Route
                        path="/farmer-dashboard/profile"
                        element={
                          <ProtectedRoute role="farmer">
                            <FarmerProfile />
                          </ProtectedRoute>
                        }
                      />
                    </Route>

                    {/* Dashboard Protected Route (Custom Layout within component) */}
                    <Route
                      path="/buyer-dashboard/*"
                      element={
                        <ProtectedRoute role="buyer">
                          <Routes>
                            <Route index element={<BuyerDashboard />} />
                          </Routes>
                        </ProtectedRoute>
                      }
                    />

                    {/* 🛍️ Buyer Protected Routes (use main Layout) */}
                    <Route element={<Layout />}>
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
                        path="/order-history"
                        element={
                          <ProtectedRoute role="buyer">
                            <OrderHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute role="buyer">
                            <OrderHistory />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/buyer/orders"
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
                    <Route path="/checkout"
                      element={
                        <ProtectedRoute>
                          <Checkout />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/status" element={<ServerStatus />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </LazyMotion>
              <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
            </CartProvider>
          </NotificationProvider>
        </ProductProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;
