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
import { auth } from "../config/firebaseConfig";
import { useUser } from "../contexts/UserContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion } from "framer-motion";
import { Truck, Leaf } from "lucide-react";

const PHONE_MIN_DIGITS = 10;

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  // Form state
  const [role, setRole] = useState(localStorage.getItem("userRole") || "");
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

  // =======================
  // reCAPTCHA Setup
  // =======================
  const setupRecaptcha = useCallback(async () => {
    if (window.__KS_RECAPTCHA) {
      verifierRef.current = window.__KS_RECAPTCHA;
      return window.__KS_RECAPTCHA;
    }
    try {
      const verifier = new RecaptchaVerifier(
        "recaptcha-container",
        { size: "invisible" },
        auth
      );
      await verifier.render();
      window.__KS_RECAPTCHA = verifier;
      verifierRef.current = verifier;
      return verifier;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        if (window.__KS_RECAPTCHA) {
          window.__KS_RECAPTCHA.clear?.();
          window.__KS_RECAPTCHA = null;
        }
      } catch {}
    };
  }, []);

  // =======================
  // Onboarding (unchanged)
  // =======================
  const onboardUser = useCallback(
    async (user) => {
      try {
        if (!user) throw new Error("No user");
        let idToken = await user.getIdToken(true);

        const res = await fetch("http://localhost:5002/api/users/onboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            email: user.email || "",
            phone: user.phoneNumber || "",
            role,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          toast.warn(
            data?.message ||
              "Onboarding server unavailable — continuing offline"
          );

          const localUser = {
            uid: user.uid,
            email: user.email || "",
            phone: user.phoneNumber || "",
            role,
          };

          try {
            setUser?.(localUser);
          } catch {}

          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userRole", role);
          localStorage.setItem("userEmail", user.email || "");

          navigate(
            role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard"
          );
          return;
        }

        const serverUser =
          data?.user || {
            uid: user.uid,
            email: user.email || "",
            phone: user.phoneNumber || "",
            role,
          };

        try {
          setUser?.(serverUser);
        } catch {}

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", role);
        localStorage.setItem(
          "userEmail",
          serverUser.email || user.email || ""
        );

        navigate(
          data?.isNewUser ? "/onboarding" : role === "farmer"
            ? "/farmer-dashboard"
            : "/buyer-dashboard"
        );
      } catch {
        toast.warn("Onboarding error — continuing offline");

        try {
          setUser?.({
            uid: user?.uid || null,
            email: user?.email || "",
            role,
          });
        } catch {}

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", role);
        localStorage.setItem("userEmail", user?.email || "");

        navigate(
          role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard"
        );
      }
    },
    [role, navigate, setUser]
  );

  // =======================
  // Validation
  // =======================
  const validate = () => {
    setInlineError("");

    if (!role) {
      toast.warn("Select Farmer or Buyer");
      return false;
    }

    if (!identifier) {
      setInlineError("Enter email or phone");
      return false;
    }

    const digits = phoneDigitsOnly(identifier);
    const isPhone = digits.length >= PHONE_MIN_DIGITS;

    if (!isPhone) {
      if (!emailRegex.test(identifier)) {
        setInlineError("Invalid email");
        return false;
      }
      if (!password || password.length < 6) {
        setInlineError("Password must be at least 6 characters");
        return false;
      }
    }

    return true;
  };

  // =======================
  // Email login
  // =======================
  const handleEmailLogin = async () => {
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(
        auth,
        identifier,
        password
      );

      toast.success("Login successful");

      try {
        setUser?.({
          uid: cred.user?.uid || null,
          email: cred.user?.email || "",
          role,
        });
      } catch {}

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", role);
      localStorage.setItem("userEmail", cred.user?.email || "");

      navigate(
        role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard"
      );

      onboardUser(cred.user).catch(() => {});
    } catch (err) {
      toast.error(err.message || "Email login failed");
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // Send OTP
  // =======================
  const sendOtp = async () => {
    try {
      setLoading(true);
      setStatusMessage("Preparing OTP...");

      const verifier = await setupRecaptcha();
      if (!verifier) throw new Error("reCAPTCHA failed to initialize");

      const phone = formatE164(identifier);
      const result = await signInWithPhoneNumber(auth, phone, verifier);

      setConfirmationResult(result);
      setShowOtpInput(true);
      setResendTimer(30);
      setOtp("");

      toast.info(`OTP sent to ${phone}`);
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  // =======================
  // Verify OTP
  // =======================
  const verifyOtp = async () => {
    if (!confirmationResult) {
      setInlineError("No OTP session");
      return;
    }

    try {
      setLoading(true);
      const res = await confirmationResult.confirm(otp.trim());

      toast.success("OTP verified");

      try {
        setUser?.({
          uid: res.user?.uid,
          email: res.user?.email || "",
          role,
        });
      } catch {}

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", role);
      localStorage.setItem(
        "userEmail",
        res.user?.email || ""
      );

      navigate(
        role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard"
      );

      onboardUser(res.user).catch(() => {});
    } catch {
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // Resend OTP
  // =======================
  const resendOtp = async () => {
    if (resendTimer > 0) return;

    window.__KS_RECAPTCHA?.clear?.();
    window.__KS_RECAPTCHA = null;
    verifierRef.current = null;

    await sendOtp();
  };

  // =======================
  // Google Login
  // =======================
  const handleGoogleLogin = async () => {
    if (!role) return toast.warn("Choose a role first");

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);

      toast.success("Google login successful");

      try {
        setUser?.({
          uid: result.user?.uid,
          email: result.user?.email || "",
          role,
        });
      } catch {}

      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userRole", role);
      localStorage.setItem(
        "userEmail",
        result.user?.email || ""
      );

      navigate(
        role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard"
      );

      onboardUser(result.user).catch(() => {});
    } catch {
      toast.error("Google login error");
    } finally {
      setLoading(false);
    }
  };

  // =======================
  // Submit Handler
  // =======================
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const digits = phoneDigitsOnly(identifier);
    const isPhone = digits.length >= PHONE_MIN_DIGITS;

    if (isPhone) await sendOtp();
    else await handleEmailLogin();
  };

  // Resend timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const isLikelyPhone = () => phoneDigitsOnly(identifier).length >= 6;

  // Mask phone
  const maskedPhone = () => {
    try {
      const phone = formatE164(identifier);
      const digits = phoneDigitsOnly(phone);

      if (digits.length <= 4) return phone;

      const last3 = digits.slice(-3);
      const prefix = phone.slice(0, phone.length - 3);

      return `${prefix}***${last3}`;
    } catch {
      return formatE164(identifier);
    }
  };

  // OTP focus behavior
  useEffect(() => {
    if (showOtpInput) {
      setTimeout(() => otpRefs.current[0].current?.focus(), 150);
    }
  }, [showOtpInput]);

  const handleOtpBoxChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;

    const digits = (otp || "").split("");
    digits[idx] = val ? val[val.length - 1] : "";
    const output = digits.join("").slice(0, 6);

    setOtp(output);

    if (val && idx < 5) otpRefs.current[idx + 1].current?.focus();
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRefs.current[idx - 1].current?.focus();

    if (e.key === "ArrowLeft" && idx > 0)
      otpRefs.current[idx - 1].current?.focus();

    if (e.key === "ArrowRight" && idx < 5)
      otpRefs.current[idx + 1].current?.focus();
  };

  // ======================================================
  // UI Rendering
  // ======================================================
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-green-50 to-green-100">
      
      {/* LEFT SIDE */}
      <aside className="md:w-1/2 bg-gradient-to-b from-green-700 to-green-600 flex items-center justify-center p-8 text-white">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-lg text-center">
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <Truck className="text-white" size={20} />
            </div>
            <h1 className="text-3xl font-extrabold">KrishiSaathi</h1>
          </div>

          <p className="opacity-90 text-lg">
            Farmer ↔ Buyer marketplace — fresh produce, fair prices.
          </p>

          <div className="mt-8 bg-white/5 rounded-xl p-4 text-left">
            <h3 className="font-semibold">Why KrishiSaathi?</h3>
            <ul className="mt-2 text-sm opacity-90 space-y-1">
              <li>• Direct sourcing from farmers</li>
              <li>• Secure & easy payments</li>
              <li>• Fast doorstep delivery</li>
            </ul>
          </div>

          <div className="mt-8 flex items-center gap-2 justify-center text-sm">
            <Leaf size={16} /> Safe • Local • Fresh
          </div>

        </motion.div>
      </aside>

      {/* RIGHT SIDE */}
      <main className="md:w-1/2 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 8 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md bg-white rounded-xl shadow-[0_8px_30px_rgba(2,6,23,0.08)] p-6"
        >

          <div className="flex items-center justify-between">
            <Link to="/" className="text-green-600 text-sm hover:underline">← Back to Home</Link>
            <div className="text-xs text-gray-400">
              Need help? <a href="/support" className="text-green-600">Support</a>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mt-3">Welcome Back</h2>
          <p className="text-center text-sm text-gray-500">Sign in to continue</p>

          {/* ROLE SELECTION */}
          <div className="mt-5">
            <div className="text-sm text-gray-600 mb-2">I am a</div>
            <div className="flex gap-2">
              
              <button
                onClick={() => setRole("farmer")}
                className={`flex-1 flex items-center gap-2 justify-center px-4 py-2 rounded-full transition 
                ${role === "farmer" ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200"}`}
              >
                👨‍🌾 <span className="text-sm">Farmer</span>
              </button>

              <button
                onClick={() => setRole("buyer")}
                className={`flex-1 flex items-center gap-2 justify-center px-4 py-2 rounded-full transition 
                ${role === "buyer" ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-200"}`}
              >
                🛒 <span className="text-sm">Buyer</span>
              </button>

            </div>

            <p className="text-xs text-gray-400 mt-1">Select your role to continue.</p>
          </div>

          {/* STEP INDICATOR */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className={`w-8 h-1 rounded ${showOtpInput ? "bg-green-300" : "bg-green-600"}`} />
            <div className="text-xs text-gray-400">
              {showOtpInput ? "OTP Verification" : "Credentials"}
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4 mt-4">

            <label className="block text-sm font-medium text-gray-700">
              Email or Phone
            </label>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">📧</span>
              <input
                ref={identifierRef}
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or +91 phone"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400"
              />
            </div>

            {/* EMAIL PASSWORD FIELD */}
            {!isLikelyPhone() && !showOtpInput && (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-20 py-2 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-2 text-sm text-green-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </>
            )}

            {/* reCAPTCHA */}
            <div id="recaptcha-container" />

            {inlineError && (
              <div className="text-sm text-red-600">{inlineError}</div>
            )}

            {/* ====== MAIN AUTH BUTTONS ====== */}
            {!showOtpInput ? (
              <div className="space-y-3">

                {/* PRIMARY SUBMIT */}
                <div className="flex gap-3">

  <button
    type="submit"
    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 transition"
  >
    {loading ? "Processing…" : isLikelyPhone() ? "Send OTP" : "Sign In"}
  </button>

  <button
    type="button"
    onClick={() => {
      setIdentifier("");
      setPassword("");
      setInlineError("");
    }}
    className="px-4 py-3 border rounded-lg text-sm whitespace-nowrap hover:bg-gray-50 transition"
  >
    Reset
  </button>

</div>

              </div>
            ) : (
              /* ====== OTP MODE ====== */
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  We sent a 6-digit code to <strong>{maskedPhone()}</strong>
                </div>

                <div className="flex gap-2 justify-center mt-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs.current[idx]}
                      value={otp[idx] || ""}
                      onChange={(e) => handleOtpBoxChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      inputMode="numeric"
                      maxLength={1}
                      className="w-10 h-10 text-center border rounded-lg focus:ring-2 focus:ring-green-200"
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={verifyOtp}
                    type="button"
                    className="flex-1 py-2 bg-green-600 text-white rounded-lg"
                    disabled={otp.length < 6}
                  >
                    Verify OTP
                  </button>

                  <button
                    onClick={resendOtp}
                    type="button"
                    disabled={resendTimer > 0}
                    className="px-4 py-2 border rounded-lg"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            )}

          </form>

          {/* DIVIDER */}
          <div className="mt-5 flex items-center">
            <div className="flex-grow h-px bg-gray-200" />
            <span className="mx-2 text-gray-400 text-sm">OR</span>
            <div className="flex-grow h-px bg-gray-200" />
          </div>

          {/* GOOGLE LOGIN */}
          <button
            onClick={handleGoogleLogin}
            disabled={!role}
            className={`w-full py-2 mt-3 border rounded-lg flex items-center justify-center gap-3 ${
              !role ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 533.5 544.3">
              <path
                d="M533.5 278.4c0-17.9-1.6-35.1-4.6-51.8H272v98.1h146.9c-6.3 34-25 62.9-53.3 82v68h86.1c50.3-46.5 79.8-114.6 79.8-196.3z"
                fill="#4285F4"
              />
              <path
                d="M272 544.3c72.6 0 133.6-24 178.2-65.3l-86.1-68c-24 16.1-54.7 25.6-92.1 25.6-70.7 0-130.6-47.7-152-111.6H32.8v70.1C77.3 483.3 169 544.3 272 544.3z"
                fill="#34A853"
              />
              <path
                d="M119.9 322.7c-10.6-31.7-10.6-65.6 0-97.3V155.3H32.8c-39.4 76.6-39.4 170.5 0 247.1l87.1-79.7z"
                fill="#FBBC05"
              />
              <path
                d="M272 107.7c38.6 0 73.3 13.3 100.7 39.4l75.5-75.5C405.6 24.9 344.6 0 272 0 169 0 77.3 61 32.8 155.3l87.1 70.1c21.4-63.9 81.3-111.6 152-111.6z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="flex justify-between mt-4 text-sm">
            <Link to="/forgot-password" className="text-green-600">
              Forgot password?
            </Link>
            <Link to="/register" className="text-green-600">
              Register
            </Link>
          </div>

          <p className="mt-3 text-xs text-gray-500">{statusMessage}</p>

        </motion.div>
      </main>
    </div>
  );
}
