// src/frontend/pages/Register.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "@/frontend/config/firebaseConfig";
import { useToast } from "@/frontend/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  IndianRupee, ShieldCheck, Package, Users,
  Leaf, Tag, Truck, Heart, User, Mail, Lock,
  Eye, EyeOff, Phone, CheckCircle, ArrowRight
} from "lucide-react";
import "./Register.css";
import { updateSEO } from '@/frontend/utils/seo';
import Breadcrumb from '@/frontend/components/ui/Breadcrumb';
import Input from "@/frontend/components/ui/Input";
import Button from "@/frontend/components/ui/Button";

const PHONE_MIN_DIGITS = 10;

/* --- Static Benefit Components (Moved outside to prevent flickering) --- */

const FarmerBenefitsContent = () => (
  <motion.div
    key="farmer-content"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.2 }}
    className="register-dynamic-content"
  >
    <div className="register-role-tag">For Farmers 👨‍🌾</div>
    <h2 className="register-role-heading">Sell directly. Earn more.</h2>
    <p className="register-role-body">Join 500+ farmers already selling fresh produce directly to buyers across India with zero middlemen.</p>

    <div className="register-benefits">
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><IndianRupee size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Fair Earnings</h4>
          <p className="register-benefit-sub">Earn 40% more by selling direct</p>
        </div>
      </div>
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><ShieldCheck size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Secure Payments</h4>
          <p className="register-benefit-sub">Fast settlements directly to your account</p>
        </div>
      </div>
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><Package size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Easy Listing</h4>
          <p className="register-benefit-sub">Simple tools to manage inventory & pricing</p>
        </div>
      </div>
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><Users size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Large Buyer Network</h4>
          <p className="register-benefit-sub">Access thousands of buyers across India</p>
        </div>
      </div>
    </div>

    <div className="register-stats-strip">
      <span className="register-stat-pill">500+ Farmers</span>
      <span className="register-stat-pill">₹0 Joining Fee</span>
      <span className="register-stat-pill">48hr Onboarding</span>
    </div>
  </motion.div>
);

const BuyerBenefitsContent = () => (
  <motion.div
    key="buyer-content"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.2 }}
    className="register-dynamic-content"
  >
    <div className="register-role-tag">For Buyers 🛒</div>
    <h2 className="register-role-heading">Fresh produce. Fair prices.</h2>
    <p className="register-role-body">Shop seasonal produce directly from local farmers. No preservatives, no markup — just fresh food delivered to your door.</p>

    <div className="register-benefits">
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><Leaf size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Farm Fresh Always</h4>
          <p className="register-benefit-sub">Harvested within 24 hours of delivery</p>
        </div>
      </div>
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><Tag size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Best Prices</h4>
          <p className="register-benefit-sub">No middlemen means lower prices for you</p>
        </div>
      </div>
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><Truck size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Free Delivery</h4>
          <p className="register-benefit-sub">Free delivery on orders above ₹299</p>
        </div>
      </div>
      <div className="register-benefit-item">
        <div className="register-benefit-icon"><Heart size={16} /></div>
        <div>
          <h4 className="register-benefit-title">Support Farmers</h4>
          <p className="register-benefit-sub">Every purchase directly supports a family</p>
        </div>
      </div>
    </div>

    <div className="register-stats-strip">
      <span className="register-stat-pill">50k+ Happy Buyers</span>
      <span className="register-stat-pill">Free above ₹299</span>
      <span className="register-stat-pill">2-4 Day Delivery</span>
    </div>
  </motion.div>
);

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    updateSEO('/register');
  }, []);

  // Form state
  const [role, setRole] = useState('buyer');
  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState(""); // email or phone depending on method
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otp, setOtp] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const API_BASE = "/api";
  const [resendTimer, setResendTimer] = useState(0);
  const [inlineError, setInlineError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const errorRef = useRef(null);
  const recaptchaRef = useRef(null);

  // helpers for phone formatting
  const phoneDigitsOnly = useCallback((s) => (s || "").replace(/\D/g, ""), []);
  const formatE164 = useCallback((raw) => {
    const t = (raw || "").trim();
    if (!t) return "";
    if (t.startsWith("+")) return "+" + phoneDigitsOnly(t);
    const digits = phoneDigitsOnly(t);
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length >= PHONE_MIN_DIGITS) return `+${digits}`;
    return t;
  }, [phoneDigitsOnly]);

  // password strength logic
  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    // cap at 4
    return Math.min(score, 4);
  };
  const pwdScore = getPasswordStrength(password);
  const pwdLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const pwdColors = ['', '#E27D60', '#F0A080', '#4CAF50', '#2D4F1E'];

  /* --- reCAPTCHA Setup --- */
  const loadRecaptchaScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.grecaptcha) return resolve(window.grecaptcha);
      const id = "krishi-recaptcha-script";
      if (document.getElementById(id)) {
        let waited = 0;
        const t = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(t);
            return resolve(window.grecaptcha);
          }
          waited += 100;
          if (waited > 15000) {
            clearInterval(t);
            return reject(new Error("reCAPTCHA load timeout"));
          }
        }, 100);
        return;
      }
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => {
        let waited = 0;
        const t = setInterval(() => {
          if (window.grecaptcha) {
            clearInterval(t);
            return resolve(window.grecaptcha);
          }
          waited += 100;
          if (waited > 15000) {
            clearInterval(t);
            return reject(new Error("grecaptcha timeout"));
          }
        }, 100);
      };
      s.onerror = () => reject(new Error("Failed to load reCAPTCHA script"));
      document.head.appendChild(s);
    });
  }, []);

  const setupRecaptcha = useCallback(async () => {
    if (window.__krishiRecaptcha) return window.__krishiRecaptcha;
    try {
      await loadRecaptchaScript();
      const verifier = new RecaptchaVerifier("recaptcha-container-register", { size: "invisible" }, auth);
      if (typeof verifier.render === "function") {
        try { await verifier.render(); } catch (e) { }
      }
      window.__krishiRecaptcha = verifier;
      recaptchaRef.current = verifier;
      return verifier;
    } catch (err) {
      console.warn("recaptcha setup failed", err);
      try {
        const fallback = new RecaptchaVerifier("recaptcha-container-register", { size: "invisible" }, auth);
        window.__krishiRecaptcha = fallback;
        recaptchaRef.current = fallback;
        return fallback;
      } catch (e) {
        return null;
      }
    }
  }, [loadRecaptchaScript]);

  useEffect(() => {
    return () => {
      if (window.__krishiRecaptcha) {
        try { window.__krishiRecaptcha.clear(); } catch (e) { }
        window.__krishiRecaptcha = null;
      }
    };
  }, []);

  /* --- Resend Timer --- */
  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  /* --- Validation --- */
  const validate = useCallback(() => {
    setInlineError("");
    if (!name.trim()) { setInlineError("Please enter your name"); return false; }
    if (!identifier.trim()) { setInlineError(method === 'email' ? "Enter your email" : "Enter your phone"); return false; }

    if (method === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) { setInlineError("Enter a valid email"); return false; }
      if (!password || password.length < 6) { setInlineError("Password must be at least 6 characters"); return false; }
      if (password !== confirmPassword) { setInlineError("Passwords do not match"); return false; }
    } else {
      const digits = phoneDigitsOnly(identifier);
      if (digits.length < PHONE_MIN_DIGITS) { setInlineError("Enter a valid phone number"); return false; }
    }

    if (!termsAccepted) { setInlineError("Please accept terms to continue"); return false; }
    return true;
  }, [name, identifier, password, confirmPassword, method, termsAccepted, phoneDigitsOnly]);

  /* --- Success Flow --- */
  const handleSuccess = (user) => {
    setIsSuccess(true);
    setTimeout(() => {
      onboardUser(user);
    }, 3000);
  };

  /* --- API Onboarding --- */
  const onboardUser = useCallback(async (user) => {
    try {
      if (!user) throw new Error("No user");
      let idToken = null;
      try { idToken = await user.getIdToken(true); } catch (e) {
        if (auth.currentUser) idToken = await auth.currentUser.getIdToken(true);
      }
      const res = await fetch("/api/users/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: idToken ? `Bearer ${idToken}` : "" },
        body: JSON.stringify({ uid: user.uid, name, email: user.email || "", phone: user.phoneNumber || "", role }),
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { }

      if (!res.ok) {
        const msg = (data && data.message) || `HTTP ${res.status}`;
        toast.error(`Onboard failed: ${msg}`);
        return;
      }

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", role);
      if (data?.isNewUser) {
        navigate("/onboarding");
      } else {
        navigate(role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
      }
    } catch (err) {
      console.error("onboard error", err);
      toast.error("Network error during onboarding. Please try again.");
    }
  }, [name, role, navigate]);

  /* --- Handlers --- */
  const handleEmailRegister = async () => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, identifier, password);
      handleSuccess(cred.user);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Registration failed");
      setInlineError(err?.message || "Registration failed");
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    try {
      setLoading(true);
      const phone = formatE164(identifier);
      const verifier = await setupRecaptcha();
      if (!verifier) throw new Error("reCAPTCHA not initialized");
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
      setResendTimer(30);
      toast.info(`OTP sent to ${phone}`);
    } catch (err) {
      console.error("sendOtp error", err);
      toast.error("Failed to send OTP");
      setInlineError("Failed to send OTP - Check formatting or try again");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndRegister = async () => {
    if (!otp.trim() || otp.length < 6) return;
    try {
      setLoading(true);
      const res = await confirmationResult.confirm(otp.trim());
      handleSuccess(res.user);
    } catch (err) {
      console.error(err);
      toast.error("Invalid OTP");
      setInlineError("Invalid OTP. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      handleSuccess(res.user);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Google sign-in failed");
      setInlineError(err?.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (method === 'phone') await sendOtp();
    else await handleEmailRegister();
  };

  const resetForm = () => {
    setName("");
    setIdentifier("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setTermsAccepted(false);
    setInlineError("");
    setShowOtpInput(false);
    setConfirmationResult(null);
  };



  /* --- Render --- */
  return (
    <div className="register-page">
      {/* LEFT PANEL */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="register-left"
      >
        <Leaf className="register-left-leaf" />
        <div className="register-left-dots" />

        <div className="register-left-content">
          <div className="register-logo-container">
            <Leaf size={22} color="#E27D60" />
            <span className="register-logo-text" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2D4F1E' }}>KrishiSaathi</span>
          </div>
          <h1>Create your account</h1>
          <p className="register-tagline">Join our community to buy fresh produce or sell directly as a farmer.</p>

          <div className="register-dynamic-wrapper">
            <AnimatePresence mode="wait">
              {role === 'farmer' ? <FarmerBenefitsContent key="farmer" /> : <BuyerBenefitsContent key="buyer" />}
            </AnimatePresence>
          </div>

          <div className="register-left-bottom">
            <span className="register-signin-text">Already have an account?</span>
            <Link to="/login" className="register-signin-link">Sign in &rarr;</Link>
          </div>
        </div>
      </motion.aside>

      {/* RIGHT PANEL */}
      <motion.main
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="register-right"
      >
        <div className="register-top-nav">
          <Link to="/" className="register-back-link">&larr; Home</Link>
          <div className="register-trust-pills">
            <span className="register-trust-pill">🔒 Secure</span>
            <span className="register-trust-pill">🌿 Local</span>
            <span className="register-trust-pill">✨ Fresh</span>
          </div>
        </div>

        <div className="register-form-wrapper">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="register-card"
          >
            <Breadcrumb items={[
              { label: 'Home', path: '/' },
              { label: 'Register' }
            ]} />
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="register-success"
              >
                <div className="register-success-circle">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <motion.path
                      d="M8 20L16 28L32 12" stroke="#2D4F1E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                  </svg>
                </div>
                <h2 className="register-success-title">Welcome to KrishiSaathi! 🎉</h2>
                <p className="register-success-body">
                  Your {role} account has been created.<br />
                  Redirecting you to your dashboard...
                </p>
                <div className="register-progress-track">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="register-progress-fill"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="register-card-title">Create your account</h2>
                <p className="register-card-sub">Sign up as a Farmer or Buyer — takes less than a minute.</p>

                {/* ROLE SELECTOR */}
                <span className="register-role-label">I am a</span>
                <div className="register-role-toggles">
                  <button
                    type="button"
                    onClick={() => setRole('farmer')}
                    className={`register-role-btn ${role === 'farmer' ? 'active farmer' : ''}`}
                  >
                    <span className="register-role-icon">👨‍🌾</span>
                    <div className="register-role-text">
                      <span className="register-role-name">Farmer</span>
                      <span className="register-role-desc">Sell your produce</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`register-role-btn ${role === 'buyer' ? 'active buyer' : ''}`}
                  >
                    <span className="register-role-icon">🛒</span>
                    <div className="register-role-text">
                      <span className="register-role-name">Buyer</span>
                      <span className="register-role-desc">Buy fresh produce</span>
                    </div>
                  </button>
                </div>

                {/* METHOD TABS */}
                <div className="register-method-tabs">
                  <button
                    type="button"
                    onClick={() => { setMethod('email'); resetForm(); }}
                    className={`register-method-tab ${method === 'email' ? 'active' : ''}`}
                  >
                    📧 Email & Password
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMethod('phone'); resetForm(); }}
                    className={`register-method-tab ${method === 'phone' ? 'active' : ''}`}
                  >
                    📱 Phone & OTP
                  </button>
                </div>

                <form onSubmit={handleFormSubmit} className="register-form" noValidate>

                  {/* Name field (Shared) */}
                  <Input
                    label="Full Name"
                    required
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={User}
                  />

                  {/* EMAIL METHOD FLOW */}
                  {method === 'email' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <Input
                        label="Email"
                        required
                        type="email"
                        placeholder="you@example.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        icon={Mail}
                      />

                      <Input
                        label="Password"
                        required
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={Lock}
                        rightIcon={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B0A898', padding: 0, display: 'flex' }}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        }
                      />
                      
                      {password.length > 0 && (
                        <div className="register-pwd-strength">
                          <div className="register-pwd-segments">
                            {[1, 2, 3, 4].map(num => (
                              <div
                                key={num}
                                className="register-pwd-seg"
                                style={{ backgroundColor: num <= pwdScore ? pwdColors[pwdScore] : 'var(--color-bg-soft)' }}
                              />
                            ))}
                          </div>
                          <div className="register-pwd-label" style={{ color: pwdColors[pwdScore] }}>
                            {pwdLabels[pwdScore]}
                          </div>
                        </div>
                      )}

                      <Input
                        label="Confirm Password"
                        required
                        type="password"
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={Lock}
                        error={confirmPassword && confirmPassword !== password ? "Passwords don't match" : ""}
                        success={confirmPassword && confirmPassword === password}
                      />
                    </motion.div>
                  )}

                  {/* PHONE METHOD FLOW */}
                  {method === 'phone' && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-4"
                    >
                      <Input
                        label="Phone Number"
                        required
                        type="tel"
                        placeholder="98xxxxxxxx"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        icon={Phone}
                        disabled={showOtpInput}
                      />

                      {!showOtpInput ? (
                        <Button
                          type="submit"
                          loading={loading}
                          fullWidth
                          size="lg"
                          icon={<ArrowRight size={18} />}
                          iconPosition="right"
                        >
                          Send OTP
                        </Button>
                      ) : (
                        <div className="register-field mt-2">
                          <label className="register-label text-center mb-3">Enter the 6-digit OTP sent to {formatE164(identifier)}</label>
                          <div className="register-otp-row">
                            <input
                              type="text"
                              value={otp}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setOtp(val);
                              }}
                              placeholder="------"
                              className="w-full h-14 bg-[#F5E6CC] border-2 border-[#EDD9B0] rounded-xl text-center font-bold text-2xl tracking-[0.5em] text-[#2D4F1E] focus:bg-white focus:border-[#2D4F1E] outline-none transition-all"
                            />
                          </div>
                          <div className="flex gap-3 mt-4">
                            <Button
                              variant="primary"
                              onClick={verifyOtpAndRegister}
                              disabled={loading || otp.length < 6}
                              loading={loading}
                              style={{ flex: 1 }}
                            >
                              Verify & Create Account
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={sendOtp}
                              disabled={resendTimer > 0 || loading}
                              style={{ width: 'auto' }}
                            >
                              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TERMS CHECKBOX */}
                  {(!showOtpInput || method === 'email') && (
                    <div className="flex flex-col gap-4 mt-4">
                      <div className="register-terms" onClick={() => setTermsAccepted(!termsAccepted)}>
                        <div className={`register-checkbox-box ${termsAccepted ? 'checked' : ''}`}>
                          {termsAccepted && <CheckCircle size={14} color="#FFF" strokeWidth={3} />}
                        </div>
                        <div className="register-terms-text">
                          I agree to the <span className="register-terms-link">Terms of Service</span> and <span className="register-terms-link">Privacy Policy</span>
                        </div>
                      </div>

                      {inlineError && <div ref={errorRef} className="register-error-msg">{inlineError}</div>}

                      <div className="flex gap-3">
                        <Button
                          type="submit"
                          disabled={loading || !termsAccepted}
                          loading={loading}
                          fullWidth
                          size="lg"
                          icon={<ArrowRight size={18} />}
                          iconPosition="right"
                        >
                          Create Account
                        </Button>
                      </div>

                      <div className="register-divider">
                        <div className="register-divider-line" />
                        <div className="register-divider-text">OR</div>
                        <div className="register-divider-line" />
                      </div>

                      <Button
                        variant="ghost"
                        fullWidth
                        onClick={handleGoogleRegister}
                        disabled={loading}
                        icon={
                          <svg width="20" height="20" viewBox="0 0 533.5 544.3" aria-hidden="true">
                            <path d="M533.5 278.4c0-17.9-1.6-35.1-4.6-51.8H272v98.1h146.9c-6.3 34-25 62.9-53.3 82v68h86.1c50.3-46.5 79.8-114.6 79.8-196.3z" fill="#4285F4" />
                            <path d="M272 544.3c72.6 0 133.6-24 178.2-65.3l-86.1-68c-24 16.1-54.7 25.6-92.1 25.6-70.7 0-130.6-47.7-152-111.6H32.8v70.1C77.3 483.3 169 544.3 272 544.3z" fill="#34A853" />
                            <path d="M119.9 322.7c-10.6-31.7-10.6-65.6 0-97.3V155.3H32.8c-39.4 76.6-39.4 170.5 0 247.1l87.1-79.7z" fill="#FBBC05" />
                            <path d="M272 107.7c38.6 0 73.3 13.3 100.7 39.4l75.5-75.5C405.6 24.9 344.6 0 272 0 169 0 77.3 61 32.8 155.3l87.1 70.1c21.4-63.9 81.3-111.6 152-111.6z" fill="#EA4335" />
                          </svg>
                        }
                        style={{ border: '1.5px solid #EDD9B0' }}
                      >
                        Continue with Google
                      </Button>
                    </div>
                  )}

                  <div id="recaptcha-container-register"></div>
                </form>

                <div className="register-bottom-links">
                  <span className="register-bottom-text">
                    Already have an account? <Link to="/login" className="register-bottom-link" style={{ marginLeft: 4 }}>Sign in</Link>
                  </span>
                  <Link to="/forgot-password" className="register-bottom-link text-xs">Forgot password?</Link>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
