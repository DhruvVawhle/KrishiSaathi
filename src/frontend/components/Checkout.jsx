// src/pages/Checkout.jsx — Optimized with KrishiSaathi Design System
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/frontend/contexts/CartContext";
import { notifications } from '@mantine/notifications';
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Tag,
  ArrowRight, Check, CheckCircle,
  ShoppingBag, Loader2, ShieldCheck, ChevronRight
} from "lucide-react";
// import { useToast } from "@/frontend/contexts/ToastContext";
import Input from "@/frontend/components/ui/Input";
import Button from "@/frontend/components/ui/Button";
import Card from "@/frontend/components/ui/Card";
import "./Checkout.css";

/* ------------------------
   Constants & Config
   ------------------------ */
const DELIVERY_THRESHOLD = 299;
const DELIVERY_FEE = 40;
const TAX_PERCENT = 5;

const PROMO_CODES = {
  KRISHI10: { type: "percent", value: 10, label: "10% OFF" },
};

export default function Checkout() {
  const { cart = [], clearAllCart, saveOrderHistory } = useCart();
  const navigate = useNavigate();
  // const toast = useToast();

  /* ------------------------
     State Management
     ------------------------ */
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cod");
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
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [orderId] = useState(() => String(Date.now()).slice(-6));

  /* Load existing data only once */
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

  /* ------------------------
     Billing Logic
     ------------------------ */
  const subtotal = useMemo(() => cart.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0), [cart]);

  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percent") return (subtotal * appliedPromo.value) / 100;
    return 0;
  }, [subtotal, appliedPromo]);

  const shipping = useMemo(() => (subtotal >= DELIVERY_THRESHOLD ? 0 : cart.length ? DELIVERY_FEE : 0), [subtotal, cart.length]);
  const tax = useMemo(() => ((subtotal - promoDiscount + shipping) * TAX_PERCENT) / 100, [subtotal, promoDiscount, shipping]);
  const total = useMemo(() => Math.round(subtotal - promoDiscount + shipping + tax), [subtotal, promoDiscount, shipping, tax]);

  /* ------------------------
     Action Handlers
     ------------------------ */
  const validateCustomer = useCallback(() => {
    const errors = {};
    if (!customer.name?.trim()) errors.name = "Name is required";
    if (!customer.email || !/^\S+@\S+\.\S+$/.test(customer.email)) errors.email = "Valid email is required";
    if (!customer.phone || !/^\d{10}$/.test(customer.phone)) errors.phone = "Phone must be 10 digits";
    if (!customer.address?.trim()) errors.address = "Delivery address is required";
    if (!customer.pincode || !/^\d{6}$/.test(customer.pincode)) errors.pincode = "6-digit pincode required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customer]);

  const handleNextStep = () => {
    if (!validateCustomer()) {
      notifications.show({
        title: '❌ Error',
        message: 'Please fix form errors',
        color: 'red',
        autoClose: 5000,
        styles: {
          root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' }
        }
      });
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyPromo = () => {
    const code = (promo || "").trim().toUpperCase();
    if (!code) return toast.info("Enter a promo code");
    const found = PROMO_CODES[code];
    if (!found) {
      notifications.show({
        title: '❌ Invalid Code',
        message: 'Invalid promo code',
        color: 'red',
        autoClose: 3000,
        styles: {
          root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' }
        }
      });
      return;
    }
    setAppliedPromo(found);
    notifications.show({
      title: '✅ Applied!',
      message: `Applied: ${found.label}`,
      color: 'green',
      autoClose: 3000,
      styles: {
        root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' },
        title: { fontWeight: 700, color: '#2D4F1E' }
      }
    });
  };

  /* Placeholder for Razorpay/API scripts */
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        console.log('✅ Razorpay already loaded');
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        console.log('✅ Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        resolve(false);
      };
      script.async = true;
      document.body.appendChild(script);
    });

  const handlePlaceOrder = async () => {
    setLoading(true);
    const id = notifications.show({
      loading: true,
      title: '⏳ Placing order...',
      message: 'Please wait while we process your request',
      autoClose: false,
      withCloseButton: false,
      styles: {
        root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' }
      }
    });

    try {
      const user = JSON.parse(localStorage.getItem('ks_user') || 'null');
      const uid = user?.uid || user?.id || null;

      if (!uid) {
        notifications.update({
          id,
          title: '❌ Login Required',
          message: 'Please login to place order',
          color: 'red',
          loading: false,
          autoClose: 5000,
          styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
        });
        return;
      }

      if (!cart || cart.length === 0) {
        notifications.update({
          id,
          title: '🛒 Cart Empty',
          message: 'Cart is empty',
          color: 'red',
          loading: false,
          autoClose: 3000,
          styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
        });
        return;
      }

      const orderPayload = {
        orderId: 'ORD' + Date.now(),
        buyerId: uid,
        buyerName: user?.name || 'Buyer',
        buyerEmail: user?.email || '',
        buyerPhone: customer?.phone || '',
        items: cart.map(item => ({
          productId: String(item.id || item._id || ''),
          name: String(item.name || ''),
          price: Number(item.price || 0),
          qty: Number(item.qty || item.quantity || 1),
          image: String(item.image || ''),
          farmerId: String(item.farmerId || 'demo'),
          category: String(item.category || ''),
          unit: String(item.unit || 'kg')
        })),
        total: Number(total || 0),
        subtotal: Number(subtotal || 0),
        deliveryFee: Number(shipping || 40),
        discount: Number(promoDiscount || 0),
        deliveryAddress: {
          fullAddress: String(customer?.address || ''),
          city: String(customer?.city || ''),
          pincode: String(customer?.pincode || ''),
          phone: String(customer?.phone || ''),
          name: String(customer?.name || user?.name || '')
        },
        paymentMethod: paymentMethod || 'cod',
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      if (paymentMethod === 'cod') {
        await saveOrder(orderPayload, id);
      } else {
        await processRazorpayPayment(orderPayload, id);
      }

    } catch (err) {
      console.error('Place order error:', err.message);
      notifications.update({
        id,
        title: '❌ Order Failed',
        message: err.message || 'Failed to place order. Try again.',
        color: 'red',
        loading: false,
        autoClose: 5000,
        styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
      });
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = async (orderPayload, notificationId) => {
    let saved = false;
    try {
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../config/firebaseConfig');

      await addDoc(collection(db, 'orders'), {
        ...orderPayload,
        createdAt: serverTimestamp(),
        source: 'web'
      });
      saved = true;
    } catch (fsErr) {
      console.warn('⚠️ Firestore error:', fsErr.message);
    }

    if (saved) {
      await clearAllCart();
      notifications.update({
        id: notificationId,
        title: '🎉 Order Success!',
        message: 'Your order has been placed successfully',
        color: 'green',
        loading: false,
        autoClose: 3000,
        styles: {
          root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' },
          title: { fontWeight: 700, color: '#2D4F1E' }
        }
      });
      navigate('/thank-you', {
        replace: true,
        state: { orderId: orderPayload.orderId, orderData: orderPayload }
      });
    } else {
      throw new Error('Failed to save order to database');
    }
  };

  const processRazorpayPayment = async (orderPayload, notificationId) => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) throw new Error('Failed to load payment gateway');

    const orderRes = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total }),
    });

    if (!orderRes.ok) throw new Error('Payment server error');
    const orderData = await orderRes.json();

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_RXkiOg4W6ACRdc',
      order_id: orderData.id,
      amount: total * 100,
      currency: 'INR',
      name: 'KrishiSaathi',
      handler: async (response) => {
        try {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();

          if (verifyData.status === 'success') {
            await saveOrder({ ...orderPayload, status: 'paid' }, notificationId);
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (err) {
          notifications.update({
            id: notificationId,
            title: '❌ Payment Error',
            message: err.message,
            color: 'red',
            loading: false,
            autoClose: 5000
          });
        }
      },
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      theme: { color: '#2D4F1E' },
      modal: {
        ondismiss: () => {
          setLoading(false);
          notifications.update({
            id: notificationId,
            title: '⚠️ Payment Cancelled',
            message: 'You cancelled the payment process',
            color: 'orange',
            loading: false,
            autoClose: 3000
          });
        }
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };


  const onFieldChange = (key, value) => {
    setCustomer((s) => ({ ...s, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((fe) => { const copy = { ...fe }; delete copy[key]; return copy; });
  };

  return (
    <div className="checkout-page-wrapper">
      {/* Progress Bar */}
      <div className="checkout-progress">
        {['Details', 'Payment', 'Done'].map((label, i) => {
          const stepNum = i + 1;
          const isActive = currentStep === stepNum;
          const isDone = currentStep > stepNum;
          return (
            <React.Fragment key={label}>
              <div className="checkout-progress-item">
                <div className={`checkout-progress-circle ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                  {isDone ? <Check size={16} /> : stepNum}
                </div>
                <span className={`checkout-progress-label ${isActive ? 'active' : 'pending'}`}>{label}</span>
              </div>
              {i < 2 && <div className={`checkout-progress-line ${isDone ? 'done' : ''}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="checkout-container">
        <main>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="checkout-card"
              >
                <div style={{ marginBottom: 28 }}>
                  <span className="checkout-step-tag">Step 1 of 3</span>
                  <h2 className="checkout-title">Delivery Details</h2>
                  <p className="checkout-subtitle">🔒 Safe & secure • Est. delivery: 2–4 days</p>
                </div>

                <div className="checkout-form-grid">
                  <Input
                    label="Full Name"
                    required
                    value={customer.name}
                    onChange={(e) => onFieldChange("name", e.target.value)}
                    placeholder="e.g. Ravi Kumar"
                    icon={User}
                    error={fieldErrors.name}
                  />
                  <Input
                    label="Email Address"
                    required
                    value={customer.email}
                    onChange={(e) => onFieldChange("email", e.target.value)}
                    placeholder="demo@gmail.com"
                    icon={Mail}
                    error={fieldErrors.email}
                  />
                  <Input
                    label="Phone Number"
                    required
                    value={customer.phone}
                    onChange={(e) => onFieldChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit phone"
                    icon={Phone}
                    error={fieldErrors.phone}
                  />
                  <Input
                    label="Pincode"
                    required
                    value={customer.pincode}
                    onChange={(e) => onFieldChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="e.g. 560001"
                    icon={MapPin}
                    error={fieldErrors.pincode}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="checkout-label">Delivery Address *</label>
                  <div className="relative mt-1">
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#b0a898', zIndex: 10 }} />
                    <textarea
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#EDD9B0] bg-[#FDFAF4] focus:ring-2 focus:ring-[#2D4F1E] outline-none min-h-[100px]"
                      value={customer.address}
                      onChange={(e) => onFieldChange("address", e.target.value)}
                      placeholder="House number, street, landmark, city"
                      rows={3}
                    />
                  </div>
                  {fieldErrors.address && <p className="text-red-500 text-xs mt-1">{fieldErrors.address}</p>}
                </div>

                <div className="checkout-promo-box">
                  <div className="checkout-promo-header">
                    <Tag size={15} color="#e27d60" />
                    <span className="checkout-promo-title">Apply Promo Code</span>
                    <span className="checkout-promo-note">Available: KRISHI10</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={promo}
                        onChange={(e) => setPromo(e.target.value)}
                        placeholder="Enter promo code"
                        noMargin
                      />
                    </div>
                    <Button variant="secondary" onClick={handleApplyPromo}>Apply</Button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handleNextStep}
                  icon={<ArrowRight size={18} />}
                  iconPosition="right"
                >
                  Continue to Payment
                </Button>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="checkout-card"
              >
                <div style={{ marginBottom: 24 }}>
                  <span className="checkout-step-tag">Step 2 of 3</span>
                  <h2 className="checkout-title">Payment Method</h2>
                </div>

                {[
                  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
                  { id: 'upi', label: 'UPI Payment', sub: 'GPay, PhonePe, Paytm', icon: '📱' },
                  { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Rupay', icon: '💳' }
                ].map(option => (
                  <div
                    key={option.id}
                    onClick={() => setPaymentMethod(option.id)}
                    className={`payment-option-card ${paymentMethod === option.id ? 'selected' : ''}`}
                  >
                    <span className="payment-icon">{option.icon}</span>
                    <div className="payment-info">
                      <div className="payment-label">{option.label}</div>
                      <div className="payment-sub">{option.sub}</div>
                    </div>
                    <div className={`payment-radio ${paymentMethod === option.id ? 'selected' : ''}`} />
                  </div>
                ))}

                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  loading={loading}
                  icon={!loading && <ShoppingBag size={18} />}
                >
                  Place Order
                </Button>

                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setCurrentStep(1)}
                  style={{ marginTop: 12 }}
                >
                  ← Back to Details
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        <aside>
          {currentStep < 3 && (
            <div className="summary-card">
              <div className="summary-header">
                <h3 className="summary-title">Order Summary</h3>
                <span className="summary-order-id">#{orderId}</span>
              </div>

              <div className="summary-items-list">
                {cart.map(item => (
                  <div key={item.id} className="summary-item">
                    <div className="summary-item-info">
                      <img className="summary-item-img" src={item.image || "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=100"} alt={item.name} />
                      <div>
                        <div className="summary-item-name">{item.name}</div>
                        <div className="summary-item-qty">{item.quantity} × ₹{item.price}</div>
                      </div>
                    </div>
                    <span className="summary-item-price">₹{item.quantity * item.price}</span>
                  </div>
                ))}
              </div>

              <div className="summary-details">
                <div className="summary-row">
                  <span className="summary-row-label">Subtotal</span>
                  <span className="summary-row-value">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedPromo && (
                  <div className="summary-row">
                    <span className="summary-row-label">Discount</span>
                    <span className="summary-row-value" style={{ color: '#4caf50' }}>-₹{promoDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span className="summary-row-label">Shipping</span>
                  <span className="summary-row-value">{shipping === 0 ? <span style={{ color: '#4caf50' }}>FREE</span> : `₹${shipping}`}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-row-label">Tax (5%)</span>
                  <span className="summary-row-value">₹{tax.toFixed(2)}</span>
                </div>

                <div className="summary-separator" />

                <div className="summary-total">
                  <span className="summary-total-label">Total</span>
                  <span className="summary-total-value">₹{total}</span>
                </div>
              </div>

              {subtotal < DELIVERY_THRESHOLD && (
                <div className="delivery-free-info">
                  <div className="delivery-free-text">Add ₹{DELIVERY_THRESHOLD - subtotal} more for FREE delivery</div>
                  <div className="delivery-bar-bg">
                    <div className="delivery-bar-fill" style={{ width: `${Math.min((subtotal / DELIVERY_THRESHOLD) * 100, 100)}%` }} />
                  </div>
                </div>
              )}

              <div className="summary-actions">
                <Button variant="ghost" size="sm" fullWidth onClick={() => { setCurrentStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}>✏️ Edit Details</Button>
                <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/support')} style={{ marginTop: 8 }}>💬 Need Help?</Button>
              </div>

              <div className="summary-badges">
                <span>🔒 Secure</span>
                <span>🚚 Fast</span>
                <span>✅ Verified</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
