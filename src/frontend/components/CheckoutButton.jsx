// ✅ src/frontend/components/CheckoutButton.jsx (Enhanced & Tested)
import React, { useState } from "react";
import { useCart } from "@/frontend/contexts/CartContext";
import { useToast } from "@/frontend/contexts/ToastContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * 🛒 CheckoutButton v2
 * - Handles login validation
 * - Saves cart snapshot
 * - Persists order to server or local
 * - Clears cart safely
 * - Redirects to checkout with feedback
 * Fully React + Vite compatible
 */
const CheckoutButton = ({
  className = "",
  children = "Checkout",
  variant = "green", // 'green' | 'blue' | 'gray'
}) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { cart = [], clearAllCart, saveOrderHistory } = useCart();
  const [loading, setLoading] = useState(false);

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const userEmail = localStorage.getItem("userEmail") || "guest@krishi";
  const userName = localStorage.getItem("userName") || "Guest";

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      // 🧠 1. Verify login
      if (!isLoggedIn) {
        toast.warning("🔒 Please login first. Redirecting...", 1500);
        setTimeout(() => {
          navigate(`/login?redirect=${encodeURIComponent("/checkout")}`);
        }, 1600);
        return;
      }

      // 🛍️ 2. Verify cart contents
      if (!cart.length) {
        toast.info("🛒 Your cart is empty.");
        return;
      }

      // 🧾 3. Compute total & snapshot
      const total = cart.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 0),
        0
      );
      const order = {
        id: `local_${Date.now()}`,
        items: cart,
        total,
        customer: { email: userEmail, name: userName },
        createdAt: new Date().toISOString(),
      };

      // 💾 4. Batch localStorage writes
      try {
        const batch = {
          lastOrderSnapshot: order,
          cartItems: cart,
          cartTotal: total,
        };
        for (const [key, value] of Object.entries(batch)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (err) {
        console.warn("localStorage write failed:", err);
      }

      // 📦 5. Save to order history
      try {
        if (typeof saveOrderHistory === "function") {
          await saveOrderHistory(userEmail, cart);
        } else {
          const key = `orders_${userEmail}`;
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          const limited = [order, ...existing].slice(0, 10);
          localStorage.setItem(key, JSON.stringify(limited));
        }
      } catch (e) {
        console.error("Failed to save order history:", e);
      }

      // 🧹 6. Clear cart safely
      try {
        if (typeof clearAllCart === "function") await clearAllCart(order.id);
      } catch (e) {
        console.warn("clearAllCart failed:", e);
      }

      toast.success("✅ Order saved! Redirecting to checkout...");
      setTimeout(() => navigate("/checkout"), 1000);
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("❌ Could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const colorVariants = {
    green:
      "bg-green-600 hover:bg-green-700 focus:ring-green-400 text-white border border-green-700",
    blue:
      "bg-blue-600 hover:bg-blue-700 focus:ring-blue-400 text-white border border-blue-700",
    gray:
      "bg-gray-500 hover:bg-gray-600 focus:ring-gray-300 text-white border border-gray-700",
  };

  return (
    <button
      aria-label="Proceed to checkout"
      aria-busy={loading}
      disabled={loading}
      onClick={handleCheckout}
      className={`
        flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg 
        transition-all duration-200 focus:outline-none focus:ring-2 
        disabled:opacity-60 disabled:cursor-wait 
        ${colorVariants[variant]} ${className}
      `}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin w-5 h-5" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default CheckoutButton;
