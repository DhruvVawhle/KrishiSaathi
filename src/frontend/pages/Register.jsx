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
import { auth } from "../config/firebaseConfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";

const PHONE_MIN_DIGITS = 10;

export default function Register() {
  const navigate = useNavigate();

  // Form state
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [inlineError, setInlineError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const errorRef = useRef(null);
  const recaptchaRef = useRef(null);

  // helpers
  const phoneDigitsOnly = useCallback((s) => (s || "").replace(/\D/g, ""), []);
  const isLikelyPhone = useCallback(() => {
    const d = phoneDigitsOnly(identifier);
    return d.length >= 6 && /^[\d+]/.test(identifier);
  }, [identifier, phoneDigitsOnly]);

  const formatE164 = useCallback((raw) => {
    const t = (raw || "").trim();
    if (!t) return "";
    if (t.startsWith("+")) return "+" + phoneDigitsOnly(t);
    const digits = phoneDigitsOnly(t);
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length >= PHONE_MIN_DIGITS) return `+${digits}`;
    return t;
  }, [phoneDigitsOnly]);

  /* reCAPTCHA loader & setup (keeps original approach but integrated) */
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
            return reject(new Error("grecaptcha not available after script load"));
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
        try { await verifier.render(); } catch (e) { /* ignore render errors gracefully */ }
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
        console.error("fallback recaptcha failed", e);
        return null;
      }
    }
  }, [loadRecaptchaScript]);

  /* Validation (keeps original rules) */
  const validate = useCallback(() => {
    setInlineError("");
    if (!role) {
      setInlineError("Please select a role");
      errorRef.current?.focus?.();
      return false;
    }
    if (!name.trim()) {
      setInlineError("Please enter your name");
      errorRef.current?.focus?.();
      return false;
    }
    if (!identifier) {
      setInlineError("Enter email or phone");
      errorRef.current?.focus?.();
      return false;
    }

    const digits = phoneDigitsOnly(identifier);
    const isPhone = digits.length >= 6 && /^[\d+]/.test(identifier);

    if (!isPhone) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        setInlineError("Enter a valid email");
        errorRef.current?.focus?.();
        return false;
      }
      if (!password || password.length < 6) {
        setInlineError("Password must be at least 6 characters");
        errorRef.current?.focus?.();
        return false;
      }
      if (password !== confirmPassword) {
        setInlineError("Passwords do not match");
        errorRef.current?.focus?.();
        return false;
      }
    } else {
      if (digits.length < PHONE_MIN_DIGITS) {
        setInlineError("Enter a valid phone number");
        errorRef.current?.focus?.();
        return false;
      }
    }
    return true;
  }, [role, name, identifier, password, confirmPassword, phoneDigitsOnly]);

  /* Onboard server logic (unchanged behavior) */
  const onboardUser = useCallback(async (user) => {
    try {
      if (!user) throw new Error("No user");
      let idToken = null;
      try { idToken = await user.getIdToken(true); } catch (e) {
        if (auth.currentUser) idToken = await auth.currentUser.getIdToken(true);
      }
      const res = await fetch("http://localhost:5002/api/users/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: idToken ? `Bearer ${idToken}` : "" },
        body: JSON.stringify({ name, email: user.email || "", phone: user.phoneNumber || "", role }),
      });
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { /* ignore parse error */ }
      if (!res.ok) {
        const msg = (data && data.message) || text || `HTTP ${res.status}`;
        toast.error(`Onboard failed: ${msg}`);
        return;
      }
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", role);
      if (data?.isNewUser) {
        toast.success("Account created — complete profile");
        navigate("/onboarding");
      } else {
        navigate(role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
      }
    } catch (err) {
      console.error("onboard error", err);
      toast.error("Onboard error — check console");
    }
  }, [name, role, navigate]);

  /* Email registration (keeps your logic) */
  const handleEmailRegister = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, identifier, password);
      toast.success("Account created");
      await onboardUser(cred.user);
    } catch (err) {
      console.error("email register", err);
      toast.error(err?.message || "Registration failed");
      setInlineError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  /* Phone registration (OTP) */
  const sendOtp = async () => {
    if (loading) return;
    try {
      setLoading(true);
      setStatusMessage("Requesting OTP…");
      const phone = formatE164(identifier);
      const verifier = await setupRecaptcha();
      if (!verifier) throw new Error("reCAPTCHA not initialized");
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
      setResendTimer(30);
      setStatusMessage("");
      toast.info(`OTP sent to ${phone}`);
    } catch (err) {
      console.error("sendOtp", err);
      toast.error(err?.message || "Failed to send OTP");
      setInlineError(err?.message || "Failed to send OTP");
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (loading) return;
    if (!confirmationResult) { setInlineError("No OTP session found"); return; }
    if (!otp.trim()) { setInlineError("Enter the OTP"); return; }
    try {
      setLoading(true);
      const res = await confirmationResult.confirm(otp.trim());
      toast.success("Phone verified");
      await onboardUser(res.user);
    } catch (err) {
      console.error("verifyOtp", err);
      toast.error("OTP verification failed");
      setInlineError("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* Google register (keeps your logic) */
  const handleGoogleRegister = async () => {
    if (!role) return toast.warn("Select role first");
    if (loading) return;
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      toast.success("Signed in with Google");
      await onboardUser(res.user);
    } catch (err) {
      console.error("google register", err);
      toast.error(err?.message || "Google sign-in failed");
      setInlineError(err?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  /* Submit handler chooses path (phone vs email) */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setInlineError("");
    setStatusMessage("");
    if (!validate()) return;
    const digits = phoneDigitsOnly(identifier);
    const isPhone = digits.length >= 6 && /^[\d+]/.test(identifier);
    if (isPhone) await sendOtp();
    else await handleEmailRegister();
  };

  /* resend timer countdown */
  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      if (window.__krishiRecaptcha) {
        try { window.__krishiRecaptcha.clear(); } catch (e) {}
        window.__krishiRecaptcha = null;
      }
    };
  }, []);

  /* Small helpers */
  const resendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      if (window.__krishiRecaptcha) {
        try { window.__krishiRecaptcha.clear(); } catch (e) {}
        window.__krishiRecaptcha = null;
      }
    } catch {}
    await sendOtp();
  };

  const resetForm = () => {
    setName("");
    setIdentifier("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setInlineError("");
    setShowOtpInput(false);
    setConfirmationResult(null);
  };

  /* UI variants */
  const container = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-green-50 to-green-100">
      {/* Left glassy panel */}
      <aside className="md:w-1/2 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-lg bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 text-green-700 flex items-center justify-center text-2xl font-bold">🌾</div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800">KrishiSaathi</h1>
              <p className="text-sm text-gray-600 mt-1">Create an account to buy fresh produce or sell directly as a farmer.</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm font-semibold text-green-700">Why join?</div>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Direct access to customers</li>
                <li>• Secure payments & fast settlements</li>
                <li>• Simple listing & inventory tools</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border">
              <div className="text-sm text-gray-500">Have an account?</div>
              <Link to="/login" className="text-sm text-green-600 font-medium hover:underline">Sign in</Link>
            </div>
          </div>
        </motion.div>
      </aside>

      {/* Right form */}
      <main className="md:w-1/2 flex items-center justify-center p-8">
        <motion.div initial="hidden" animate="show" variants={container} className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <Link to="/" className="text-sm text-green-600 hover:underline">← Home</Link>
            <div className="text-xs text-gray-400">Secure • Local • Fresh</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-800 text-center">Create your account</h2>
          <p className="text-sm text-gray-500 text-center mt-1 mb-4">Sign up as a Farmer or Buyer — takes less than a minute.</p>

          {/* Role selector (combined styles) */}
          <div className="flex items-center justify-center gap-3 mb-5" role="tablist" aria-label="Select role">
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setRole("farmer")} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-shadow ${role === "farmer" ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-700"}`} aria-pressed={role==="farmer"}>
              <span className="text-lg">👨‍🌾</span>
              <span className="text-sm font-medium">Farmer</span>
            </motion.button>

            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setRole("buyer")} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-shadow ${role === "buyer" ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-700"}`} aria-pressed={role==="buyer"}>
              <span className="text-lg">🛒</span>
              <span className="text-sm font-medium">Buyer</span>
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" aria-live="polite">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300" placeholder="Your full name" aria-label="Full name" />
            </div>

            {/* Identifier */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email or Phone</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-gray-400">✉️</span>
                <input value={identifier} onChange={(e) => { setIdentifier(e.target.value); setInlineError(""); }} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300" placeholder="Email or +91 phone" aria-label="Email or phone" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Use email for password signup, or phone for OTP-based signup.</p>
            </div>

            {/* Password group (hidden if phone) */}
            {!isLikelyPhone() && !showOtpInput && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="relative mt-1">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300" placeholder="Create a strong password" aria-label="Password" />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-2 text-sm text-green-600">
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Use at least 6 characters — mix letters & numbers for a stronger password.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-300" placeholder="Re-enter password" aria-label="Confirm password" />
                </div>
              </div>
            )}

            { /* reCAPTCHA container (keeps original id) */ }
            <div id="recaptcha-container-register" />

            {inlineError && (
              <div ref={errorRef} className="text-sm text-red-600" role="alert" tabIndex={-1}>
                {inlineError}
              </div>
            )}

            {statusMessage && (
              <div className="text-sm text-gray-600">{statusMessage}</div>
            )}

            {/* Actions area (Sign / OTP) */}
            {!showOtpInput ? (
              <div className="flex gap-3 items-center">
                <button type="submit" disabled={loading} className={`flex-1 py-3 rounded-lg font-semibold ${loading ? "bg-green-300 text-white" : "bg-green-600 text-white hover:bg-green-700"}`}>
                  {loading ? "Processing…" : isLikelyPhone() ? "Send OTP" : "Create account"}
                </button>

                <button type="button" onClick={resetForm} className="px-4 py-3 rounded-lg border bg-white text-sm hover:bg-gray-50">
                  Reset
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">Enter the 6-digit code sent to <strong>{formatE164(identifier)}</strong></div>
                <div className="flex gap-2">
                  <input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} inputMode="numeric" maxLength={6} className="flex-1 px-3 py-2 border rounded-lg text-center tracking-widest text-lg" placeholder="------" aria-label="OTP" />
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={verifyOtp} disabled={loading} className="flex-1 py-2 rounded-lg bg-green-600 text-white">
                    {loading ? "Verifying…" : "Verify OTP"}
                  </button>
                  <button type="button" onClick={resendOtp} disabled={resendTimer > 0 || loading} className="px-4 py-2 rounded-lg border text-green-600">
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}

          </form>

          {/* OR divider */}
          <div className="mt-4 flex items-center">
            <div className="flex-grow h-px bg-gray-200" />
            <div className="mx-3 text-gray-400 text-sm">OR</div>
            <div className="flex-grow h-px bg-gray-200" />
          </div>

          {/* Google Sign-in */}
          <div className="mt-4">
            <button onClick={handleGoogleRegister} disabled={loading || !role} className={`w-full py-2 rounded-lg border flex items-center justify-center gap-3 ${(!role || loading) ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50"}`} aria-label="Continue with Google">
              <svg width="18" height="18" viewBox="0 0 533.5 544.3" className="inline-block" aria-hidden>
                <path d="M533.5 278.4c0-17.9-1.6-35.1-4.6-51.8H272v98.1h146.9c-6.3 34-25 62.9-53.3 82v68h86.1c50.3-46.5 79.8-114.6 79.8-196.3z" fill="#4285F4"/>
                <path d="M272 544.3c72.6 0 133.6-24 178.2-65.3l-86.1-68c-24 16.1-54.7 25.6-92.1 25.6-70.7 0-130.6-47.7-152-111.6H32.8v70.1C77.3 483.3 169 544.3 272 544.3z" fill="#34A853"/>
                <path d="M119.9 322.7c-10.6-31.7-10.6-65.6 0-97.3V155.3H32.8c-39.4 76.6-39.4 170.5 0 247.1l87.1-79.7z" fill="#FBBC05"/>
                <path d="M272 107.7c38.6 0 73.3 13.3 100.7 39.4l75.5-75.5C405.6 24.9 344.6 0 272 0 169 0 77.3 61 32.8 155.3l87.1 70.1c21.4-63.9 81.3-111.6 152-111.6z" fill="#EA4335"/>
              </svg>
              <span className="text-sm">Continue with Google</span>
            </button>
          </div>

          <div className="mt-4 flex justify-between text-sm text-gray-600">
            <Link to="/login" className="hover:underline">Already have an account?</Link>
            <Link to="/forgot-password" className="hover:underline">Forgot password?</Link>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-center">
            By creating an account you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
          </div>
        </motion.div>
      </main>
    </div>
  );
}
