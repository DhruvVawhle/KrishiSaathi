// src/pages/Checkout.jsx — Optimized with KrishiSaathi Design System
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/frontend/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Tag,
  ArrowRight, Check, CheckCircle,
  ShoppingBag, Loader2, ShieldCheck, ChevronRight
} from "lucide-react";
import { useToast } from "@/frontend/contexts/ToastContext";
import { Steps, ConfigProvider } from "antd";
import { useForm, Controller } from "react-hook-form";
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
  const toast = useToast();

  /* ------------------------
     State Management
     ------------------------ */
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed for Ant Design Steps
  const [paymentMethod, setPaymentMethod] = useState("cod");
  
  const { control, handleSubmit, setValue, watch, formState: { errors: formErrors } } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      pincode: "",
    }
  });

  const customer = watch();

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

    Object.entries(profileSource).forEach(([key, value]) => {
      if (value) setValue(key, value);
    });
    if (storedEmail) setValue("email", storedEmail);
    if (storedName) setValue("name", storedName);
  }, [setValue]);

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
  const onSubmitDetails = (data) => {
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextStep = handleSubmit(onSubmitDetails);

  const handleApplyPromo = () => {
    const code = (promo || "").trim().toUpperCase();
    if (!code) return toast.info("Enter a promo code");
    const found = PROMO_CODES[code];
    if (!found) return toast.error("Invalid promo code");
    setAppliedPromo(found);
    toast.success(`Applied: ${found.label}`);
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

  const createOrder = async () => {
    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total }),
      });
      if (!res.ok) throw new Error("Order creation failed");
      return await res.json();
    } catch (e) {
      toast.error("Server error while creating payment order");
      return null;
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);

    try {
      const user = JSON.parse(
        localStorage.getItem('ks_user')
        || 'null'
      )
      const uid = user?.uid
        || user?.id
        || null

      if (!uid) {
        toast.error('Please login to place order')
        return
      }

      if (!cart || cart.length === 0) {
        toast.error('Cart is empty')
        return
      }

      const orderId = 'ORD' + Date.now()

      const orderPayload = {
        orderId,
        buyerId: uid,
        buyerName: user?.name || 'Buyer',
        buyerEmail: user?.email || '',
        buyerPhone: customer?.phone || '',
        items: cart.map(item => ({
          productId: String(
            item.id || item._id || ''
          ),
          name: String(item.name || ''),
          price: Number(item.price || 0),
          qty: Number(
            item.qty || item.quantity || 1
          ),
          image: String(item.image || ''),
          farmerId: String(
            item.farmerId || 'demo'
          ),
          category: String(
            item.category || ''
          ),
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
      }

      // Handle payment based on method
      if (paymentMethod === 'cod') {
        // Direct COD order
        await saveOrder(orderPayload);
      } else if (paymentMethod === 'upi' || paymentMethod === 'card') {
        // Process payment through Razorpay
        await processRazorpayPayment(orderPayload);
      } else {
        throw new Error('Invalid payment method');
      }

    } catch (err) {
      console.error('Place order error:', err.message)
      toast.error(err.message || 'Failed to place order. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveOrder = async (orderPayload) => {
    // PRIMARY — Save to Firestore
    // Works on Vercel without backend
    let firestoreSaved = false;
    try {
      const {
        collection,
        addDoc,
        serverTimestamp
      } = await import('firebase/firestore');
      const { db } = await import('../config/firebaseConfig');

      const docRef = await addDoc(
        collection(db, 'orders'),
        {
          ...orderPayload,
          createdAt: serverTimestamp(),
          source: 'web'
        }
      );

      firestoreSaved = true;
      console.log('✅ Order → Firestore:', docRef.id);
    } catch (fsErr) {
      console.warn('⚠️ Firestore order:', fsErr.message);
    }

    // SECONDARY — Save to MongoDB
    // Works only on localhost
    let mongoSaved = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload),
        signal: controller.signal
      });

      clearTimeout(timeout);

      const contentType = res.headers.get('content-type');

      if (res.ok && contentType?.includes('application/json')) {
        mongoSaved = true;
        console.log('✅ Order → MongoDB');
      }
    } catch (mongoErr) {
      // MongoDB not available on Vercel — This is expected
      console.warn('⚠️ MongoDB not available:', mongoErr.message);
    }

    // If saved to at least one DB, consider it success
    if (firestoreSaved || mongoSaved) {
      await clearAllCart();
      navigate('/thank-you', {
        replace: true,
        state: { orderId: orderPayload.orderId, orderData: orderPayload }
      });
    } else {
      throw new Error('Failed to save order to any database. Please try again.');
    }
  }

  const processRazorpayPayment = async (orderPayload) => {
    try {
      console.log('🔵 Starting Razorpay payment for method:', paymentMethod);

      // Step 1: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }
      console.log('✅ Razorpay script loaded');

      if (!window.Razorpay) {
        throw new Error('Razorpay not available');
      }

      // Step 2: Create order on backend
      console.log('📝 Creating order with amount:', total);
      const orderRes = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total }),
      });

      if (!orderRes.ok) {
        let errorMsg = 'Failed to create payment order';
        try {
          const errorData = await orderRes.json();
          errorMsg = errorData.error || errorMsg;
        } catch {
          // Response body is empty or not JSON
          errorMsg = `Payment server error (${orderRes.status}). Please try again or use Cash on Delivery.`;
        }
        throw new Error(errorMsg);
      }

      const orderData = await orderRes.json();
      console.log('✅ Razorpay Order Created:', orderData.id);

      // Step 3: Build payment methods object
      // Enable all methods that should be available in Razorpay
      let methodsObj = {
        card: true,
        netbanking: true,
        wallet: false,
        upi: true,
        emandate: false,
      };

      console.log('💳 Payment methods enabled:', methodsObj);

      // Step 4: Open Razorpay checkout
      const razorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_RXkiOg4W6ACRdc',
        order_id: orderData.id,
        amount: total * 100,
        currency: 'INR',
        name: 'KrishiSaathi',
        description: `Order #${orderPayload.orderId}`,
        image: 'https://krishisaathi.vercel.app/krishisaathi-logo.png',
        handler: async (response) => {
          try {
            setLoading(false);
            console.log('✅ Payment response received:', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });

            // Step 5: Verify payment
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
              console.log('✅ Payment Verified:', response.razorpay_payment_id);
              
              // Update order payload with payment info
              const updatedPayload = {
                ...orderPayload,
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                status: 'paid'
              };

              // Save order with payment details
              await saveOrder(updatedPayload);
              toast.success('Payment successful! Order placed.');
            } else {
              navigate('/payment-failure', {
                replace: true,
                state: { error: 'Payment verification failed. Please try again.', orderId: orderPayload.orderId, method: paymentMethod }
              });
              return;
            }
          } catch (err) {
            console.error('❌ Payment verification error:', err.message);
            navigate('/payment-failure', {
              replace: true,
              state: { error: err.message || 'Payment verification failed. Contact support.', orderId: orderPayload.orderId, method: paymentMethod }
            });
          }
        },
        prefill: {
          name: customer.name || '',
          email: customer.email || '',
          contact: customer.phone || '',
        },
        method: methodsObj,
        theme: {
          color: '#2D4F1E',
        },
        display: {
          blocks: {
            utib: 'hide',
            emi: 'hide',
            emandate: 'hide',
          },
          hide: [],
          preferences: {
            parent_window: 'window',
          },
        },
        modal: {
          ondismiss: () => {
            console.log('⚠️ User dismissed payment modal');
            setLoading(false);
            navigate('/payment-failure', {
              replace: true,
              state: { error: 'Payment was cancelled. You can retry anytime.', orderId: orderPayload.orderId, method: paymentMethod }
            });
          }
        },
        readonly: {
          contact: !!customer.phone,
          email: !!customer.email,
        }
      };

      console.log('🔓 Opening Razorpay checkout with options:', razorpayOptions);
      
      const razorpayInstance = new window.Razorpay(razorpayOptions);
      razorpayInstance.open();
      
    } catch (err) {
      console.error('❌ Razorpay payment error:', err.message);
      setLoading(false);
      navigate('/payment-failure', {
        replace: true,
        state: { error: err.message || 'Payment processing failed. Please try again.', orderId: orderPayload.orderId, method: paymentMethod }
      });
    }
  }

  const onFieldChange = (key, value) => {
    setValue(key, value);
  };

  return (
    <div className="checkout-page-wrapper">
      {/* Progress Bar */}
      <div className="checkout-progress" style={{ maxWidth: 800, margin: '0 auto 40px' }}>
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#2D4F1E',
              fontFamily: 'DM Sans',
            }
          }}
        >
          <Steps
            current={currentStep}
            items={[
              { title: 'Details', icon: <User size={18} /> },
              { title: 'Payment', icon: <ShoppingBag size={18} /> },
              { title: 'Confirmation', icon: <CheckCircle size={18} /> },
            ]}
          />
        </ConfigProvider>
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
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: "Name is required" }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Full Name"
                        required
                        placeholder="e.g. Ravi Kumar"
                        icon={User}
                        error={formErrors.name?.message}
                      />
                    )}
                  />
                  <Controller
                    name="email"
                    control={control}
                    rules={{ 
                      required: "Email is required",
                      pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email address" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Email Address"
                        required
                        placeholder="demo@gmail.com"
                        icon={Mail}
                        error={formErrors.email?.message}
                      />
                    )}
                  />
                  <Controller
                    name="phone"
                    control={control}
                    rules={{ 
                      required: "Phone is required",
                      pattern: { value: /^\d{10}$/, message: "Must be 10 digits" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Phone Number"
                        required
                        placeholder="10-digit phone"
                        icon={Phone}
                        error={formErrors.phone?.message}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      />
                    )}
                  />
                  <Controller
                    name="pincode"
                    control={control}
                    rules={{ 
                      required: "Pincode is required",
                      pattern: { value: /^\d{6}$/, message: "Must be 6 digits" }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Pincode"
                        required
                        placeholder="e.g. 560001"
                        icon={MapPin}
                        error={formErrors.pincode?.message}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      />
                    )}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <label className="checkout-label">Delivery Address *</label>
                  <div className="relative mt-1">
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: 14, color: '#b0a898', zIndex: 10 }} />
                    <Controller
                      name="address"
                      control={control}
                      rules={{ required: "Delivery address is required" }}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          className={`w-full pl-12 pr-4 py-3 rounded-xl border border-[#EDD9B0] bg-[#FDFAF4] focus:ring-2 focus:ring-[#2D4F1E] outline-none min-h-[100px] ${formErrors.address ? 'border-red-500' : ''}`}
                          placeholder="House number, street, landmark, city"
                          rows={3}
                        />
                      )}
                    />
                  </div>
                  {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address.message}</p>}
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

            {currentStep === 1 && (
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
          {currentStep < 2 && (
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
                <Button variant="ghost" size="sm" fullWidth onClick={() => { setCurrentStep(0); window.scrollTo({ top: 0, behavior: "smooth" }); }}>✏️ Edit Details</Button>
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
