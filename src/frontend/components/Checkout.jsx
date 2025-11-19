// src/pages/Checkout.jsx — Upgraded UI/UX (preserves original business logic)
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Loader2, ShieldCheck, CreditCard, Truck, Tag, Percent } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

/* ------------------------
   Constants (kept same)
   ------------------------ */
const DELIVERY_THRESHOLD = 299;
const DELIVERY_FEE = 40;
const TAX_PERCENT = 5;

const PROMO_CODES = {
  KRISHI10: { type: "percent", value: 10, label: "10% OFF" },
};

/* ------------------------
   Helper utilities
   ------------------------ */
const formatINR = (value) =>
  Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

/* ------------------------
   Main Component
   ------------------------ */
export default function Checkout() {
  const { cart = [], clearAllCart, saveOrderHistory } = useCart();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  const [promo, setPromo] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  /* load existing checkout/buyer data from localStorage */
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    const storedName = localStorage.getItem("userName");
    const savedData = JSON.parse(localStorage.getItem("checkoutData") || "null");
    const buyerProfile = JSON.parse(localStorage.getItem("buyerProfile") || "null");

    const profileSource = buyerProfile
      ? {
          name: buyerProfile.fullName || storedName || (savedData && savedData.name),
          phone: buyerProfile.phone || (savedData && savedData.phone),
          address: buyerProfile.address || (savedData && savedData.address),
          city: buyerProfile.city || (savedData && savedData.city),
          pincode: buyerProfile.pincode || (savedData && savedData.pincode),
          email: storedEmail || (savedData && savedData.email),
        }
      : savedData || {};

    setCustomer((c) => ({
      ...c,
      ...(storedEmail ? { email: storedEmail } : {}),
      ...(storedName ? { name: storedName } : {}),
      ...profileSource,
    }));
  }, []);

  /* Billing calculations */
  const subtotal = useMemo(() => cart.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0), [cart]);

  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percent") return (subtotal * appliedPromo.value) / 100;
    return 0;
  }, [subtotal, appliedPromo]);

  const shipping = useMemo(() => (subtotal >= DELIVERY_THRESHOLD ? 0 : cart.length ? DELIVERY_FEE : 0), [subtotal, cart.length]);
  const tax = useMemo(() => ((subtotal - promoDiscount + shipping) * TAX_PERCENT) / 100, [subtotal, promoDiscount, shipping]);

  const total = useMemo(() => subtotal - promoDiscount + shipping + tax, [subtotal, promoDiscount, shipping, tax]);

  /* Validation */
  const validateCustomer = useCallback(() => {
    const errors = {};
    if (!customer.name || !customer.name.trim()) errors.name = "Name is required";
    if (!customer.email || !/^\S+@\S+\.\S+$/.test(customer.email)) errors.email = "Valid email is required";
    if (!customer.phone || !/^\d{10}$/.test(customer.phone)) errors.phone = "Phone must be 10 digits";
    if (!customer.address || !customer.address.trim()) errors.address = "Delivery address is required";
    setFieldErrors(errors);
    if (Object.keys(errors).length) return Object.values(errors)[0];
    return null;
  }, [customer]);

  /* Razorpay script loader (unchanged) */
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  /* Create order on server (unchanged) */
  const createOrder = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total }),
      });
      if (!res.ok) throw new Error("Order creation failed");
      return await res.json();
    } catch (e) {
      toast.error("Server error while creating order");
      return null;
    }
  };

  /* Verify payment (unchanged) */
  const verifyPayment = async (paymentData) => {
    try {
      const res = await fetch("http://localhost:4000/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (!res.ok) throw new Error("Verification failed");
      return await res.json();
    } catch {
      return { status: "failed" };
    }
  };

  /* Apply promo */
  const handleApplyPromo = () => {
    setLocalError("");
    const code = (promo || "").trim().toUpperCase();
    if (!code) return toast.info("Enter a promo code");
    const found = PROMO_CODES[code];
    if (!found) {
      toast.error("Invalid promo code");
      return;
    }
    setAppliedPromo(found);
    toast.success(`Applied: ${found.label}`);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromo("");
    toast.info("Promo removed");
  };

  /* Save small order snapshot helper */
  const saveLocalSnapshot = async (savedOrderId = null) => {
    try {
      localStorage.setItem("lastOrderSnapshot", JSON.stringify({ items: cart, total, customer }));
      if (savedOrderId) localStorage.setItem("lastOrderId", savedOrderId);
    } catch (e) {
      console.warn("Could not save snapshot", e);
    }
  };

  /* Create payment & open Razorpay (preserves original flow) */
  const handlePayOnline = async () => {
    setLocalError("");
    const err = validateCustomer();
    if (err) {
      setLocalError(err);
      return;
    }
    if (!verified) return toast.info("Please verify before proceeding");
    if (!cart.length) return setLocalError("Your cart is empty");

    setLoading(true);
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      toast.error("Failed to load payment SDK");
      setLoading(false);
      return;
    }

    const order = await createOrder();
    if (!order || !order.id) {
      toast.error("Could not create payment order");
      setLoading(false);
      return;
    }

    const options = {
      key: "rzp_test_RXkiOg4W6ACRdc",
      amount: order.amount,
      currency: "INR",
      name: "KrishiSaathi",
      description: "Order Payment",
      order_id: order.id,
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone,
      },
      handler: async (res) => {
        let verification;
        try {
          verification = await verifyPayment(res);
        } catch (e) {
          verification = { status: "failed" };
        }

        if (verification.status !== "success") {
          toast.warn("Payment processed — verification pending. Proceeding to Thank You.");
        } else {
          toast.success("Payment successful!");
        }

        await saveLocalSnapshot();

        // attempt to persist order via saveOrderHistory
        let savedOrder = { id: `local_${Date.now()}` };
        try {
          const result = await saveOrderHistory(
            customer.email,
            cart,
            {
              method: "razorpay",
              transaction_id: res.razorpay_payment_id,
              total,
              verificationStatus: verification.status,
            }
          );
          if (result && (result.id || result._id)) savedOrder = { id: result.id || result._id };
        } catch (saveErr) {
          console.warn("saveOrderHistory failed:", saveErr);
        }

        try {
          await clearAllCart(savedOrder.id);
        } catch (e) {
          console.warn("clearAllCart failed:", e);
        }

        try {
          localStorage.setItem("lastOrderId", savedOrder.id);
        } catch (e) {}

        setLoading(false);
        navigate("/thankyou");
      },
      theme: { color: "#0f9d58" },
    };

    new window.Razorpay(options).open();
    setLoading(false);
  };

  /* Cash on delivery handler (preserves logic) */
  const handleCOD = async () => {
    setLocalError("");
    const err = validateCustomer();
    if (err) {
      setLocalError(err);
      return;
    }
    if (!verified) return toast.info("Please verify before COD");

    setLoading(true);
    await saveLocalSnapshot();

    let savedOrder = { id: `local_${Date.now()}` };
    try {
      const result = await saveOrderHistory(customer.email, cart, {
        method: "cod",
        total,
      });
      if (result && (result.id || result._id)) savedOrder = { id: result.id || result._id };
    } catch (e) {
      console.warn("saveOrderHistory failed:", e);
    }

    try {
      await clearAllCart(savedOrder.id);
    } catch (e) {
      console.warn("clearAllCart post-cod failed:", e);
    }

    try {
      localStorage.setItem("lastOrderId", savedOrder.id);
    } catch (e) {}

    setLoading(false);
    navigate("/thankyou");
  };

  /* Inline field change handler with error clear */
  const onFieldChange = (key, value) => {
    setCustomer((s) => ({ ...s, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((fe) => { const copy = { ...fe }; delete copy[key]; return copy; });
    setLocalError("");
  };

  /* Small progress stepper state for UI (1=Details,2=Payment,3=Complete) */
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-10 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Stepper */}
        <div className="mb-6">
          <div className="bg-white/60 backdrop-blur rounded-full p-1 flex items-center justify-between shadow-sm border">
            <div className="flex items-center w-full">
              <div className={`flex-1 px-4 py-2 text-xs text-center ${step >= 1 ? "text-green-700 font-semibold" : "text-gray-400"}`}>
                1 • Details
              </div>
              <div className={`flex-1 px-4 py-2 text-xs text-center ${step >= 2 ? "text-green-700 font-semibold" : "text-gray-400"}`}>
                2 • Payment
              </div>
              <div className={`flex-1 px-4 py-2 text-xs text-center ${step >= 3 ? "text-green-700 font-semibold" : "text-gray-400"}`}>
                3 • Done
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Checkout form */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
            className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-md"
          >
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-bold text-green-700">Checkout</h1>
              <div className="text-sm text-gray-500">Safe & secure • Est. delivery: 2–4 days</div>
            </div>

            {localError && (
              <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md">{localError}</div>
            )}

            {/* Customer details */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Full name</label>
                <input
                  value={customer.name}
                  onChange={(e) => onFieldChange("name", e.target.value)}
                  className={`mt-1 w-full p-3 rounded-lg border ${fieldErrors.name ? "border-red-300" : "border-gray-200"} focus:ring-2 focus:ring-green-100`}
                  placeholder="e.g. Ravi Kumar"
                />
                {fieldErrors.name && <div className="text-xs text-red-600 mt-1">{fieldErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => onFieldChange("email", e.target.value)}
                  className={`mt-1 w-full p-3 rounded-lg border ${fieldErrors.email ? "border-red-300" : "border-gray-200"} focus:ring-2 focus:ring-green-100`}
                  placeholder="you@example.com"
                />
                {fieldErrors.email && <div className="text-xs text-red-600 mt-1">{fieldErrors.email}</div>}
              </div>

              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <input
                  value={customer.phone}
                  onChange={(e) => onFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className={`mt-1 w-full p-3 rounded-lg border ${fieldErrors.phone ? "border-red-300" : "border-gray-200"} focus:ring-2 focus:ring-green-100`}
                  placeholder="10-digit phone"
                />
                {fieldErrors.phone && <div className="text-xs text-red-600 mt-1">{fieldErrors.phone}</div>}
              </div>

              <div className="form-group">
                <label className="text-sm font-medium text-gray-700">Pincode</label>
                <input
                  value={customer.pincode}
                  onChange={(e) => onFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="mt-1 w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-100"
                  placeholder="e.g. 560001"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                <textarea
                  rows={3}
                  value={customer.address}
                  onChange={(e) => onFieldChange("address", e.target.value)}
                  className={`mt-1 w-full p-3 rounded-lg border ${fieldErrors.address ? "border-red-300" : "border-gray-200"} focus:ring-2 focus:ring-green-100`}
                  placeholder="House number, street, landmark"
                />
                {fieldErrors.address && <div className="text-xs text-red-600 mt-1">{fieldErrors.address}</div>}
              </div>
            </div>

            {/* Promo code row */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Tag size={16}/> Apply Promo</h3>
                <div className="text-xs text-gray-400">Available: KRISHI10</div>
              </div>

              <div className="mt-3 flex gap-3">
                <input
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="Enter promo code"
                  className="flex-1 p-3 rounded-lg border border-gray-200"
                />
                <button onClick={handleApplyPromo} className="px-4 py-3 rounded-lg bg-green-600 text-white">Apply</button>
                {appliedPromo && (
                  <button onClick={removePromo} className="px-3 py-3 rounded-lg border text-sm">
                    Remove
                  </button>
                )}
              </div>

              {appliedPromo && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg flex items-center gap-3 text-sm text-green-700">
                  <Percent size={16} />
                  <div>
                    <div className="font-semibold">{appliedPromo.label}</div>
                    <div className="text-xs text-green-700/80">Applied to your subtotal</div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification & Payment */}
            <div className="mt-6 border-t pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${verified ? "bg-green-100 text-green-700" : "bg-white border"}`}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Confirm delivery details</div>
                    <div className="text-xs text-gray-500">Verify to proceed with payment</div>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => {
                      const err = validateCustomer();
                      if (err) {
                        setLocalError(err);
                        return;
                      }
                      setVerified(true);
                      toast.success("Details verified");
                      setStep(2);
                    }}
                    disabled={verified}
                    className={`px-4 py-2 rounded-lg ${verified ? "bg-green-100 text-green-700" : "bg-white border"}`}
                  >
                    {verified ? "Verified ✓" : "Verify"}
                  </button>
                </div>
              </div>

              {/* Payment CTAs */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handlePayOnline}
                  disabled={!verified || loading}
                  className={`flex items-center justify-center gap-3 p-3 rounded-full text-white ${!verified ? "opacity-60 cursor-not-allowed bg-green-300" : "bg-gradient-to-r from-green-600 to-green-700 shadow-lg"}`}
                >
                  {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={16} />} Pay Online
                </button>

                <button
                  onClick={handleCOD}
                  disabled={!verified || loading}
                  className={`flex items-center justify-center gap-3 p-3 rounded-full ${!verified ? "opacity-60 cursor-not-allowed bg-gray-200" : "bg-white border"}`}
                >
                  🪙 Cash on Delivery
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                By continuing, you agree to our Terms & Privacy. Payments handled securely.
              </div>
            </div>
          </motion.section>

          {/* Right: Order Summary */}
          <aside className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.35 }}
              className="bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl p-5 shadow sticky top-8"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                <div className="text-xs text-gray-500">#{String(Date.now()).slice(-6)}</div>
              </div>

              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="font-medium text-gray-700 truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.quantity} × {formatINR(item.price)}</div>
                    </div>
                    <div className="font-semibold">{formatINR(item.price * item.quantity)}</div>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 text-sm space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="text-green-700">-{formatINR(promoDiscount)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Truck size={14} />
                    <span>Shipping</span>
                  </div>
                  <div>{shipping ? formatINR(shipping) : <span className="text-green-700">Free</span>}</div>
                </div>

                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatINR(tax)}</span>
                </div>

                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-700">{formatINR(total)}</span>
                </div>

                {promoDiscount > 0 && (
                  <div className="mt-2 text-sm text-green-700">You saved {formatINR(promoDiscount)}!</div>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="w-full py-2 rounded-lg border"
                >
                  Edit details
                </button>

                <button
                  onClick={() => { if (!verified) setLocalError("Please verify details before checkout"); else goToPayment(); }}
                  className="w-full py-2 rounded-lg bg-white text-gray-700 border"
                >
                  Need help?
                </button>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  );

  /* helper used by the 'Need help?' button — navigates to payment or shows message */
  function goToPayment() {
    if (!verified) {
      setLocalError("Please verify your details before proceeding to payment.");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
