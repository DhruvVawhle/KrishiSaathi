// ✅ src/components/PaymentForm.jsx (Enhanced v2)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaGooglePay,
  FaUniversity,
  FaSpinner,
} from "react-icons/fa";
import { toast } from "react-toastify";

const API_BASE = "/api/payment";

export default function PaymentForm() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [bank, setBank] = useState("");

  // ✅ Load cart
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const localCart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (localCart.length) return setCart(localCart);
        const res = await axios.get(`${API_BASE}/cart`);
        Array.isArray(res.data) && setCart(res.data);
      } catch (err) {
        console.warn("Cart fallback:", err);
        setCart(JSON.parse(localStorage.getItem("cart") || "[]"));
      }
    };
    fetchCart();
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  // ✅ Validators
  const validators = {
    upi: (v) => /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(v.trim()),
    cardNumber: (v) => /^\d{12,19}$/.test(v.replace(/\s+/g, "")),
    expiry: (v) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v.trim()),
    cvv: (v) => /^[0-9]{3,4}$/.test(v.trim()),
  };

  const formatCard = (val) => val.replace(/\D/g, "").replace(/(\d{4})/g, "$1 ").trim();
  const formatExpiry = (v) => v.replace(/^(\d{2})(\d{0,2})$/, "$1/$2");

  const validate = () => {
    setError("");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      toast.warn("Please login first to proceed with payment.");
      navigate("/login");
      return false;
    }
    if (!cart.length) return setError("Your cart is empty."), false;

    switch (paymentMethod) {
      case "upi":
        if (!validators.upi(upiId)) return setError("Invalid UPI ID."), false;
        break;
      case "card":
        if (!validators.cardNumber(card.number)) return setError("Invalid card number."), false;
        if (!card.name.trim()) return setError("Name required."), false;
        if (!validators.expiry(card.expiry)) return setError("Invalid expiry (MM/YY)."), false;
        if (!validators.cvv(card.cvv)) return setError("Invalid CVV."), false;
        break;
      case "netbanking":
        if (!bank.trim()) return setError("Select your bank."), false;
        break;
      default:
        break;
    }
    return true;
  };

  // ✅ Payment handler
  const handlePaymentSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        items: cart,
        total,
        method: paymentMethod,
        user: localStorage.getItem("userEmail") || "guest",
        details:
          paymentMethod === "upi"
            ? { upi_id: upiId }
            : paymentMethod === "card"
            ? card
            : paymentMethod === "netbanking"
            ? { bank }
            : {},
      };

      const res = await axios.post(`${API_BASE}/checkout`, payload);

      if (res?.data?.status === "success" || res.status === 200) {
        setSuccessMsg("✅ Payment successful! Your order has been placed.");

        const userEmail = localStorage.getItem("userEmail") || "guest";
        const order = {
          id: `order_${Date.now()}`,
          items: cart,
          total,
          method: paymentMethod,
          date: new Date().toISOString(),
        };

        try {
          await axios.post(`${API_BASE}/api/orders/save`, { email: userEmail, order });
        } catch {
          const key = `orders_${userEmail}`;
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          localStorage.setItem(key, JSON.stringify([order, ...existing]));
        }

        localStorage.removeItem("cart");
        window.dispatchEvent(new CustomEvent("cart-cleared"));
        toast.success("Order placed successfully!");
        setTimeout(() => navigate("/thankyou"), 1200);
      } else {
        setError(res?.data?.message || "Payment failed — try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An error occurred during payment. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-10"
      aria-busy={loading}
    >
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 🧾 Order Summary */}
        <aside className="md:col-span-5 bg-green-50 rounded-xl p-4 flex flex-col gap-4 shadow-inner">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-green-800">Order Summary</h3>
            <span className="text-sm text-gray-600">
              {cart.length} item{cart.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="divide-y divide-green-100 overflow-y-auto max-h-72">
            {cart.length === 0 ? (
              <p className="text-gray-600 py-6 text-center">Your cart is empty.</p>
            ) : (
              cart.map((it, idx) => (
                <div key={it._id || idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={it.image || "https://via.placeholder.com/64?text=Img"}
                      alt={it.name}
                      className="w-12 h-12 rounded-md object-cover border"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-800">{it.name}</div>
                      <div className="text-xs text-gray-500">
                        Qty: {it.quantity} • {it.unit || "unit"}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-700">
                    ₹{(it.price * it.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-green-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-800">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 border-t pt-2">
              <span>Shipping</span>
              <span className="font-medium text-gray-800">FREE</span>
            </div>
            <div className="flex justify-between items-center text-lg font-semibold pt-3">
              <span>Total</span>
              <span className="text-green-700">₹{total.toFixed(2)}</span>
            </div>
          </div>
        </aside>

        {/* 💳 Payment Section */}
        <section className="md:col-span-7 rounded-xl p-4">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Secure Payment</h2>

          <div aria-live="polite" className="mb-3">
            {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-md">{error}</div>}
            {successMsg && (
              <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md">{successMsg}</div>
            )}
          </div>

          {/* Methods */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              ["cod", "Cash on Delivery", <FaMoneyBillWave key="cod" />],
              ["upi", "UPI", <FaGooglePay key="upi" />],
              ["card", "Card", <FaCreditCard key="card" />],
              ["netbanking", "Net Banking", <FaUniversity key="net" />],
            ].map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => setPaymentMethod(key)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                  paymentMethod === key
                    ? "bg-green-600 text-white border-green-700 shadow-md"
                    : "bg-white border-green-100 hover:shadow-sm"
                }`}
              >
                {icon} <span className="font-semibold text-sm">{label}</span>
              </button>
            ))}
          </div>

          {/* Conditional Inputs */}
          {paymentMethod === "upi" && (
            <div className="mb-4">
              <label htmlFor="upi" className="text-sm font-medium text-gray-700">
                UPI ID
              </label>
              <input
                id="upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@okaxis"
                className={`w-full px-3 py-2 rounded-md border ${
                  error.includes("UPI") ? "border-red-400" : "border-green-100"
                } focus:ring-2 focus:ring-green-200`}
              />
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="grid gap-3 mb-4">
              <input
                value={card.number}
                onChange={(e) =>
                  setCard((c) => ({ ...c, number: formatCard(e.target.value) }))
                }
                placeholder="Card Number"
                inputMode="numeric"
                className={`px-3 py-2 rounded-md border ${
                  error.includes("card") ? "border-red-400" : "border-green-100"
                } focus:ring-2 focus:ring-green-200`}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={card.expiry}
                  onChange={(e) =>
                    setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))
                  }
                  placeholder="MM/YY"
                  className="px-3 py-2 rounded-md border border-green-100 focus:ring-2 focus:ring-green-200"
                />
                <input
                  type="password"
                  value={card.cvv}
                  onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value }))}
                  placeholder="CVV"
                  inputMode="numeric"
                  className="px-3 py-2 rounded-md border border-green-100 focus:ring-2 focus:ring-green-200"
                />
              </div>
              <input
                value={card.name}
                onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))}
                placeholder="Name on Card"
                className="px-3 py-2 rounded-md border border-green-100 focus:ring-2 focus:ring-green-200"
              />
            </div>
          )}

          {paymentMethod === "netbanking" && (
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-green-100 focus:ring-2 focus:ring-green-200 mb-4"
            >
              <option value="">Select Bank</option>
              <option>State Bank of India</option>
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>Axis Bank</option>
            </select>
          )}

          {/* Confirm */}
          <div className="mt-6 flex flex-col md:flex-row gap-3">
            <button
              onClick={handlePaymentSubmit}
              disabled={loading || !cart.length}
              className={`flex-1 py-3 rounded-xl font-semibold transition ${
                loading
                  ? "bg-green-300 text-white cursor-wait"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-md"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" /> Processing...
                </span>
              ) : (
                <>Confirm &amp; Pay ₹{total.toFixed(2)}</>
              )}
            </button>

            <button
              onClick={() => navigate("/marketplace")}
              className="flex-1 py-3 rounded-xl font-semibold border border-green-200 hover:bg-green-50 transition"
            >
              Continue Shopping
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
