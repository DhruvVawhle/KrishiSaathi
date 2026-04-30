// src/frontend/pages/Login.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth } from "@/frontend/config/firebaseConfig";
import { useUser } from "@/frontend/contexts/UserContext";
import { notifications } from '@mantine/notifications';
import { motion, AnimatePresence } from "motion/react";
import {
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  ArrowRight,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronLeft,
  CreditCard,
  CircleAlert,
} from "lucide-react";

import "./Login.css";
import { updateSEO } from '@/frontend/utils/seo';
import Breadcrumb from '@/frontend/components/ui/Breadcrumb';
import Input from "@/frontend/components/ui/Input";
import Button from "@/frontend/components/ui/Button";

/* ─── Animation Variants ─── */
const leftPanel = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const rightPanel = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2, ease: "easeOut" } },
};

const PHONE_MIN_DIGITS = 10;

/* ─── Responsive hook ─── */
function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 641);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return mobile;
}

/* ─── Google SVG ─── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/* ════════════════════════════════════════ */
/*           LOGIN COMPONENT               */
/* ════════════════════════════════════════ */

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const isMobile = useIsMobile();

  useEffect(() => {
    updateSEO('/login');
  }, []);

  // Form state
  const [role, setRole] = useState(localStorage.getItem("userRole") || "farmer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  // OTP refs
  const otpRefs = useRef([]);
  otpRefs.current = Array(6)
    .fill(0)
    .map((_, i) => otpRefs.current[i] || React.createRef());

  // UI state
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [loginSuccess, setLoginSuccess] = useState(false);

  const verifierRef = useRef(null);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigitsOnly = (s) => (s || "").replace(/\D/g, "");
  const identifierRef = useRef(null);

  const formatE164 = (raw) => {
    const trimmed = (raw || "").trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("+")) return "+" + phoneDigitsOnly(trimmed);
    const digits = phoneDigitsOnly(trimmed);
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length >= PHONE_MIN_DIGITS) return `+${digits}`;
    return trimmed;
  };

  // Is phone input?
  const isPhone = (() => {
    const t = (identifier || "").trim();
    if (!t) return false;
    if (t.startsWith("+")) return true;
    const d = phoneDigitsOnly(t);
    return d.length >= PHONE_MIN_DIGITS && /^[\d+\-() ]+$/.test(t);
  })();

  // ─── reCAPTCHA Setup ───
  const setupRecaptcha = useCallback(async () => {
    if (window.__KS_RECAPTCHA) {
      verifierRef.current = window.__KS_RECAPTCHA;
      return window.__KS_RECAPTCHA;
    }
    try {
      const container = document.getElementById("recaptcha-container");
      if (!container) throw new Error("recaptcha-container not found");
      const v = new RecaptchaVerifier(auth, container, { size: "invisible" });
      await v.render();
      verifierRef.current = v;
      window.__KS_RECAPTCHA = v;
      return v;
    } catch (err) {
      notifications.show({
        title: '❌ reCAPTCHA Failed',
        message: err.message,
        color: 'red', autoClose: 5000,
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #FF5252', borderRadius: 12 } }
      });
      return null;
    }
  }, []);

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // Auto-focus
  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  // ─── Onboard user ───
  const onboardUser = useCallback(
    async (user) => {
      try {
        if (!user) throw new Error("No user");
        let idToken = await user.getIdToken(true);

        const res = await fetch("/api/users/onboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email || "",
            phone: user.phoneNumber || "",
            role,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const localUser = { uid: user.uid, email: user.email || "", phone: user.phoneNumber || "", role };
          try { setUser?.(localUser); } catch { }
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userRole", role);
          localStorage.setItem("userEmail", user.email || "");
          navigate(role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
          return;
        }

        const resolvedRole = data?.user?.role || role;
        const serverUser = data?.user || { uid: user.uid, email: user.email || "", phone: user.phoneNumber || "", role: resolvedRole };
        try { setUser?.(serverUser); } catch { }
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", resolvedRole);
        localStorage.setItem("userEmail", serverUser.email || user.email || "");
        navigate(
          data?.isNewUser
            ? "/onboarding"
            : resolvedRole === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard"
        );
      } catch {
        try { setUser?.({ uid: user?.uid || null, email: user?.email || "", role }); } catch { }
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", user?.email || "");
        navigate(role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
      }
    },
    [role, navigate, setUser]
  );

  // ─── Validation ───
  const validate = () => {
    const errs = {};
    const id = identifier.trim();
    if (!id) {
      errs.identifier = "Enter a valid email or +91 phone number";
    } else if (!emailRegex.test(id) && phoneDigitsOnly(id).length < PHONE_MIN_DIGITS) {
      errs.identifier = "Enter a valid email or +91 phone number";
    }
    if (!isPhone && !password.trim()) {
      errs.password = "Password is required";
    } else if (!isPhone && password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Email login ───
  const handleEmailLogin = async () => {
    const id = notifications.show({
      loading: true,
      title: '⏳ Signing in...',
      message: 'Authenticating your credentials',
      autoClose: false,
      withCloseButton: false,
      styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' } }
    });

    let isOperationActive = true;
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, identifier, password);
      if (!isOperationActive) return;
      await onboardUser(cred.user);
      setLoginSuccess(true);
      notifications.update({
        id,
        title: '✅ Welcome back!',
        message: 'You have successfully signed in.',
        color: 'green',
        loading: false,
        autoClose: 3000,
        styles: {
          root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' },
          title: { fontWeight: 700, color: '#2D4F1E' }
        }
      });
    } catch (err) {
      if (!isOperationActive) return;
      let errorMsg = err.message || 'Email login failed. Please try again.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Invalid email or password.';
        setErrors({ identifier: errorMsg });
      } else if (err.code === 'auth/too-many-requests') {
        errorMsg = 'Too many attempts. Please try again later.';
      }
      notifications.update({
        id,
        title: '❌ Login Failed',
        message: errorMsg,
        color: 'red',
        loading: false,
        autoClose: 5000,
        styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
      });
    } finally {
      isOperationActive = false;
      setLoading(false);
    }
  };

  // ─── Send OTP ───
  const sendOtp = async () => {
    try {
      setLoading(true);
      setInlineError("");
      setStatusMessage("Preparing OTP...");
      const verifier = await setupRecaptcha();
      if (!verifier) throw new Error("reCAPTCHA failed to initialize");
      const phone = formatE164(identifier);
      if (!phone || phoneDigitsOnly(phone).length < PHONE_MIN_DIGITS) {
        setErrors({ identifier: "Enter a valid 10-digit phone number." });
        return;
      }
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
      setResendTimer(60); // Increased to 60s
      setOtp("");
      // Silent success status or minimal feedback
      setStatusMessage(""); 
    } catch (err) {
      console.error("OTP send error:", err);
      // Clear cached recaptcha so resend works fresh
      window.__KS_RECAPTCHA?.clear?.();
      window.__KS_RECAPTCHA = null;
      verifierRef.current = null;
      if (err.code === 'auth/invalid-phone-number') {
        setInlineError("Invalid phone number format. Use +91 followed by 10 digits.");
      } else if (err.code === 'auth/too-many-requests') {
        setInlineError("Too many attempts. Please try again later.");
      } else if (err.code === 'auth/captcha-check-failed') {
        setInlineError("reCAPTCHA check failed. Please refresh and try again.");
      } else {
        setInlineError("Could not send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
      if (!showOtpInput) setStatusMessage("");
    }
  };

  // ─── Verify OTP ───
  const verifyOtp = async () => {
    if (!confirmationResult) {
      notifications.show({
        title: '⚠️ Session Expired',
        message: 'No OTP session. Please send OTP first.',
        color: 'orange'
      });
      return;
    }
    if (!otp.trim() || otp.replace(/\D/g, "").length < 6) {
      notifications.show({
        title: '⌨️ Incomplete OTP',
        message: 'Please enter the complete 6-digit OTP.',
        color: 'orange'
      });
      return;
    }

    const id = notifications.show({
      loading: true,
      title: '⏳ Verifying...',
      message: 'Checking your OTP code',
      autoClose: false,
      withCloseButton: false,
      styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' } }
    });

    let isOperationActive = true;
    try {
      setLoading(true);
      const res = await confirmationResult.confirm(otp.trim());
      if (!isOperationActive) return;
      await onboardUser(res.user);
      setLoginSuccess(true);
      notifications.update({
        id,
        title: '✅ Verified!',
        message: 'Identity confirmed. Welcome back!',
        color: 'green',
        loading: false,
        autoClose: 3000,
        styles: {
          root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' },
          title: { fontWeight: 700, color: '#2D4F1E' }
        }
      });
    } catch (err) {
      if (!isOperationActive) return;
      let errorMsg = 'Verification failed. Please try again.';
      if (err.code === 'auth/invalid-verification-code') {
        errorMsg = 'Wrong OTP. Please check and try again.';
      } else if (err.code === 'auth/code-expired') {
        errorMsg = 'OTP has expired. Please resend.';
        setShowOtpInput(false);
        setConfirmationResult(null);
      }
      notifications.update({
        id,
        title: '❌ Verification Failed',
        message: errorMsg,
        color: 'red',
        loading: false,
        autoClose: 5000,
        styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
      });
    } finally {
      isOperationActive = false;
      setLoading(false);
    }
  };

  // ─── Resend OTP ───
  const resendOtp = async () => {
    if (resendTimer > 0) return;
    window.__KS_RECAPTCHA?.clear?.();
    window.__KS_RECAPTCHA = null;
    verifierRef.current = null;
    await sendOtp();
  };

  // ─── Google Login ───
  const handleGoogleLogin = async () => {
    if (!role) {
      notifications.show({
        title: '⚠️ Role Required',
        message: 'Please choose a role first (Farmer / Buyer).',
        color: 'orange'
      });
      return;
    }

    const id = notifications.show({
      loading: true,
      title: '⏳ Connecting to Google...',
      message: 'Please wait while we sync with your account',
      autoClose: false,
      withCloseButton: false,
      styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' } }
    });

    let isOperationActive = true;
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (!isOperationActive) return;
      await onboardUser(result.user);
      setLoginSuccess(true);
      notifications.update({
        id,
        title: '✅ Auth Success!',
        message: 'Google login successful. Welcome!',
        color: 'green',
        loading: false,
        autoClose: 3000,
        styles: {
          root: { fontFamily: 'DM Sans', borderLeft: '4px solid #2D4F1E' },
          title: { fontWeight: 700, color: '#2D4F1E' }
        }
      });
    } catch (err) {
      if (!isOperationActive) return;
      if (err.code === 'auth/popup-closed-by-user') {
        notifications.hide(id);
      } else {
        notifications.update({
          id,
          title: '❌ Google Auth Error',
          message: err.message || 'Google login failed.',
          color: 'red',
          loading: false,
          autoClose: 5000,
          styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
        });
      }
    } finally {
      isOperationActive = false;
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    notifications.show({
      title: '📘 Coming soon',
      message: 'Facebook login is coming soon — use Google login for now.',
      color: 'blue', autoClose: 4000,
      styles: {
        root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #1877F2', borderRadius: 12 },
        title: { fontWeight: 700, color: '#1877F2' }
      }
    });
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setInlineError("");
    try {
      const { OAuthProvider, signInWithPopup } = await import("firebase/auth");
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');

      const result = await signInWithPopup(auth, provider);
      await onboardUser(result.user);
      setLoginSuccess(true);
    } catch (err) {
      console.error("Apple login error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        // Closed by user
      } else {
        setInlineError(err.message || "Apple login failed");
      }
    } finally {
      if (!loginSuccess) setLoading(false);
    }
  };


  // ─── Submit handler ───
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setInlineError("");
    if (!role) return;
    if (!validate()) return;
    if (showOtpInput) { verifyOtp(); return; }
    if (isPhone) { sendOtp(); } else { handleEmailLogin(); }
  };

  // ─── OTP input handler ───
  const handleOtpDigit = (i, value) => {
    const d = value.replace(/\D/, "").slice(-1);
    const arr = otp.split("");
    arr[i] = d;
    setOtp(arr.join(""));
    if (d && i < 5) {
      otpRefs.current[i + 1]?.current?.focus();
    }
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.current?.focus();
    }
  };

  /* ────────────────────────────────────── */
  /*                 RENDER                 */
  /* ────────────────────────────────────── */

  const features = [
    { icon: <Truck size={22} color="#E27D60" />, label: "Fast Delivery" },
    { icon: <ShieldCheck size={22} color="#E27D60" />, label: "Secure Pay" },
    { icon: <Leaf size={22} color="#E27D60" />, label: "Farm Fresh" },
    { icon: <CreditCard size={22} color="#E27D60" />, label: "Easy Checkout" },
  ];

  return (
    <div className="login-page">
      {/* ═══════ LEFT PANEL ═══════ */}
      {!isMobile && (
        <motion.div
          className="login-left"
          initial="hidden"
          animate="visible"
          variants={leftPanel}
        >
          <div className="login-left__content">
            {/* Brand */}
            <div className="login-left__brand">
              <div className="login-left__brand-icon">
                <Leaf size={22} color="white" />
              </div>
              <span className="login-left__brand-name">KrishiSaathi</span>
            </div>

            {/* Tagline */}
            <p className="login-left__tagline">
              India's trusted farmer ↔ buyer marketplace.
              <br />
              Fresh produce, fair prices — delivered to you.
            </p>

            {/* Feature Cards */}
            <div className="login-left__features">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  className="login-left__feature"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="login-left__feature-icon">
                    {f.icon}
                  </div>
                  <div className="login-left__feature-label">{f.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Trust Badge */}
            <div className="login-left__trust">
              <Sparkles size={16} color="#E27D60" />
              Trusted by 500+ farmers across India
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══════ RIGHT PANEL ═══════ */}
      <motion.div
        className="login-right"
        initial="hidden"
        animate="visible"
        variants={rightPanel}
      >
        {/* Top bar */}
        <div className="login-right__topbar">
          <Link to="/" className="login-right__back">
            <ChevronLeft size={16} /> Home
          </Link>
          <div className="login-right__support">
            <span>Need help?</span>
            <Link to="/support">Support</Link>
          </div>
        </div>

        {/* Form Card */}
        <motion.div className="login-card" variants={cardAnim}>
          <Breadcrumb items={[
            { label: 'Home', path: '/' },
            { label: 'Login' }
          ]} />
          {/* Mobile brand */}
          {isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
              <div className="login-left__brand-icon" style={{ width: 36, height: 36, borderRadius: 10 }}>
                <Leaf size={18} color="white" />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#2D4F1E" }}>KrishiSaathi</span>
            </div>
          )}

          <h1 className="login-card__heading">Welcome Back</h1>
          <p className="login-card__subheading">Sign in to continue to your dashboard</p>

          {/* Role Selector */}
          <div className="login-role__label">I AM A</div>
          <div className="login-role__grid">
            <button
              type="button"
              className={`login-role__btn ${role === "farmer" ? "login-role__btn--farmer-active" : ""}`}
              onClick={() => setRole("farmer")}
            >
              🌾 Farmer
            </button>
            <button
              type="button"
              className={`login-role__btn ${role === "buyer" ? "login-role__btn--buyer-active" : ""}`}
              onClick={() => setRole("buyer")}
            >
              🛒 Buyer
            </button>
          </div>

          {/* Error box */}
          <AnimatePresence>
            {inlineError && (
              <motion.div
                className="login-error-box"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                <CircleAlert size={16} /> {inlineError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate>
            {/* ─── Email / Phone ─── */}
            {!showOtpInput && (
              <>
                <Input
                  label="Email or Phone"
                  type={isPhone ? "tel" : "email"}
                  placeholder="farmer@example.com or +91 98765 43210"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrors((p) => ({ ...p, identifier: "" }));
                  }}
                  icon={isPhone ? Phone : Mail}
                  error={errors.identifier}
                  required
                />

                {!isPhone && (
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: "" }));
                    }}
                    icon={Lock}
                    error={errors.password}
                    required
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
                )}

                {/* Forgot password link */}
                {!isPhone && (
                  <Link to="/forgot-password" className="login-forgot">
                    Forgot password?
                  </Link>
                )}
              </>
            )}

            {/* ─── OTP Input ─── */}
            {showOtpInput && (
              <div style={{ marginBottom: "1rem" }}>
                <label className="login-input__label" style={{ textAlign: "center", marginBottom: 12 }}>
                  Enter the 6-digit OTP sent to {formatE164(identifier)}
                </label>
                <div className="login-otp__row">
                  {Array(6).fill(0).map((_, i) => (
                    <input
                      key={i}
                      ref={otpRefs.current[i]}
                      className="login-otp__input"
                      maxLength={1}
                      inputMode="numeric"
                      value={otp[i] || ""}
                      onChange={(e) => handleOtpDigit(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    />
                  ))}
                </div>
                <div style={{ textAlign: "center", fontSize: "0.82rem", color: "#7A7A7A" }}>
                  {resendTimer > 0 ? (
                    <span>Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOtp}
                      style={{ background: "none", border: "none", color: "#E27D60", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", fontSize: "inherit" }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>
            )}



            {/* Sign In Button */}
            <Button
              type="submit"
              variant={loginSuccess ? "success" : "primary"}
              loading={loading}
              fullWidth
              size="lg"
              icon={!loading && !loginSuccess && <ArrowRight size={18} />}
              iconPosition="right"
              style={{ marginTop: 20 }}
            >
              {loginSuccess ? "Welcome back!" : showOtpInput ? "Verify OTP" : "Sign In"}
            </Button>
          </form>

          {/* Status message */}
          {statusMessage && <p className="login-status">{statusMessage}</p>}

          {/* Divider */}
          {!showOtpInput && (
            <div className="login-divider">
              <div className="login-divider__line" />
              <span className="login-divider__text">OR</span>
              <div className="login-divider__line" />
            </div>
          )}

          {/* Social buttons - brand style */}
          {!showOtpInput && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 10
            }}>

              {/* Google — white brand style */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  background: 'white',
                  border: '1.5px solid #D0D5DD',
                  borderRadius: 8,
                  cursor: loading
                    ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: 15,
                  color: '#344054',
                  transition: 'all 150ms ease',
                  boxShadow:
                    '0 1px 3px rgba(16,24,40,0.08)',
                  opacity: loading ? 0.7 : 1,
                  letterSpacing: '0.01em'
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.boxShadow
                      = '0 4px 10px rgba(16,24,40,0.12)'
                    e.currentTarget.style.borderColor
                      = '#98A2B3'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow
                    = '0 1px 3px rgba(16,24,40,0.08)'
                  e.currentTarget.style.borderColor
                    = '#D0D5DD'
                }}
              >
                {/* Google colored G icon */}
                <svg width="20" height="20"
                  viewBox="0 0 20 20" fill="none"
                  style={{ flexShrink: 0 }}>
                  <path
                    d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.63 4.63 0 01-2 3.04v2.52h3.24c1.9-1.75 3-4.33 3-7.35z"
                    fill="#4285F4"/>
                  <path
                    d="M10 20c2.7 0 4.97-.9 6.62-2.42l-3.24-2.52c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.07v2.6A10 10 0 0010 20z"
                    fill="#34A853"/>
                  <path
                    d="M4.41 11.9A6.03 6.03 0 014.1 10c0-.66.12-1.3.31-1.9V5.5H1.07A10 10 0 000 10c0 1.61.38 3.14 1.07 4.5l3.34-2.6z"
                    fill="#FBBC04"/>
                  <path
                    d="M10 3.96c1.47 0 2.79.5 3.82 1.5l2.86-2.86C14.96.9 12.7 0 10 0A10 10 0 001.07 5.5l3.34 2.6C5.2 5.72 7.4 3.96 10 3.96z"
                    fill="#EA4335"/>
                </svg>
                {loading
                  ? 'Signing in...'
                  : 'Sign in with Google'
                }
              </button>

              {/* Facebook — blue brand style */}
              <button
                type="button"
                onClick={handleFacebookLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  background: '#1877F2',
                  border: '1.5px solid #1877F2',
                  borderRadius: 8,
                  cursor: loading
                    ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'white',
                  transition: 'all 150ms ease',
                  boxShadow:
                    '0 1px 3px rgba(24,119,242,0.30)',
                  opacity: loading ? 0.7 : 1,
                  letterSpacing: '0.01em'
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.background
                      = '#166FE5'
                    e.currentTarget.style.borderColor
                      = '#166FE5'
                    e.currentTarget.style.boxShadow
                      = '0 4px 10px rgba(24,119,242,0.40)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background
                    = '#1877F2'
                  e.currentTarget.style.borderColor
                    = '#1877F2'
                  e.currentTarget.style.boxShadow
                    = '0 1px 3px rgba(24,119,242,0.30)'
                }}
              >
                {/* Facebook F icon */}
                <svg width="22" height="22"
                  viewBox="0 0 24 24" fill="none"
                  style={{ flexShrink: 0 }}>
                  <rect width="24" height="24"
                    rx="6" fill="white"
                    fillOpacity="0.20"/>
                  <path
                    d="M16 8h-2a1 1 0 00-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 014-4h2v3z"
                    fill="white"/>
                </svg>
                Sign in with Facebook
              </button>

              {/* Apple — black brand style */}
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  background: '#000000',
                  border: '1.5px solid #000000',
                  borderRadius: 8,
                  cursor: loading
                    ? 'not-allowed' : 'pointer',
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: 15,
                  color: 'white',
                  transition: 'all 150ms ease',
                  boxShadow:
                    '0 1px 3px rgba(0,0,0,0.25)',
                  opacity: loading ? 0.7 : 1,
                  letterSpacing: '0.01em'
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    e.currentTarget.style.background
                      = '#1A1A1A'
                    e.currentTarget.style.borderColor
                      = '#1A1A1A'
                    e.currentTarget.style.boxShadow
                      = '0 4px 10px rgba(0,0,0,0.35)'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background
                    = '#000000'
                  e.currentTarget.style.borderColor
                    = '#000000'
                  e.currentTarget.style.boxShadow
                    = '0 1px 3px rgba(0,0,0,0.25)'
                }}
              >
                {/* Apple icon */}
                <svg width="18" height="21"
                  viewBox="0 0 22 26"
                  fill="white"
                  style={{ flexShrink: 0 }}>
                  <path d="M18.07 13.77C18.04 10.66 20.64 9.15 20.76 9.08C19.29 6.92 17.01 6.63 16.21 6.61C14.26 6.41 12.37 7.77 11.37 7.77C10.37 7.77 8.83 6.63 7.18 6.67C5.06 6.70 3.09 7.93 2.01 9.83C-0.22 13.68 1.44 19.34 3.57 22.45C4.64 23.97 5.89 25.67 7.54 25.61C9.15 25.54 9.76 24.57 11.71 24.57C13.64 24.57 14.21 25.61 15.90 25.57C17.63 25.54 18.72 24.03 19.75 22.50C20.99 20.76 21.49 19.05 21.51 18.96C21.47 18.95 18.10 17.71 18.07 13.77Z"/>
                  <path d="M14.96 4.49C15.83 3.42 16.42 1.95 16.25 0.46C15.00 0.52 13.45 1.34 12.54 2.39C11.74 3.32 11.03 4.83 11.22 6.28C12.62 6.39 14.05 5.54 14.96 4.49Z"/>
                </svg>
                Sign in with Apple
              </button>

            </div>
          )}


          {/* Bottom links */}
          <div className="login-bottom">
            Don't have an account?
            <Link to="/register">Create account</Link>
          </div>

          {/* reCAPTCHA container */}
          <div id="recaptcha-container" />
        </motion.div>
      </motion.div>
    </div>
  );
}
