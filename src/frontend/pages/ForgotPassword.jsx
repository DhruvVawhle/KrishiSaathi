// src/frontend/pages/ForgotPassword.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [inlineError, setInlineError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOnline = useMemo(() => navigator.onLine, []);
  const [onlineStatus, setOnlineStatus] = useState(isOnline);

  // watch network changes
  const handleOnline = () => setOnlineStatus(true);
  const handleOffline = () => setOnlineStatus(false);

  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const validateEmail = useCallback((val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setInlineError("");

    if (!email.trim()) {
      return setInlineError("Please enter your email");
    }
    if (!validateEmail(email)) {
      return setInlineError("Enter a valid email");
    }

    if (!onlineStatus) {
      return setInlineError("You are offline — please check your connection.");
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error(err);
      setInlineError("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl p-8 rounded-3xl">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl">
              🌱
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-800">
                Reset your password
              </h1>
              <p className="text-sm text-gray-600">
                A reset link will be sent to your email.
              </p>
            </div>
          </div>

          {/* Offline banner */}
          {!onlineStatus && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm">
              You are currently offline. Reconnect to continue.
            </div>
          )}

          {/* Success State */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="text-center space-y-4"
              >
                <motion.div
                  initial={{ scale: 0.7 }}
                  animate={{ scale: 1 }}
                  className="text-green-600 text-6xl"
                >
                  ✔️
                </motion.div>

                <h2 className="text-xl font-semibold text-gray-800">
                  Reset link sent!
                </h2>

                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  If {email} is registered, you will receive a link shortly.
                </p>

                <Link
                  to="/login"
                  className="inline-block mt-4 px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                >
                  Return to Login
                </Link>
              </motion.div>
            ) : (
              /* Form */
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Email field */}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-400">
                      ✉️
                    </span>
                    <input
                      type="email"
                      value={email}
                      disabled={!onlineStatus}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-green-200 focus:border-green-500 transition disabled:bg-gray-50"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {inlineError && (
                  <div className="text-sm text-red-600">{inlineError}</div>
                )}

                {/* CTA buttons */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading || !onlineStatus}
                    className={`w-full py-3 rounded-lg font-semibold transition ${
                      loading || !onlineStatus
                        ? "bg-green-300 text-white"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>

                  <Link
                    to="/login"
                    className="block text-center py-3 border rounded-lg bg-white text-green-700 hover:bg-gray-50 font-medium"
                  >
                    Back to Login
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Need help?{" "}
          <Link to="/support" className="underline text-green-700">
            Contact Support
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
