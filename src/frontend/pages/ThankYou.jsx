// src/pages/ThankYou.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Download, Grid, ArrowRightCircle, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * ThankYou.jsx — Upgraded UI/UX
 *
 * - Reads lastOrderSnapshot / lastOrderId from localStorage (safe fallbacks)
 * - Confetti + success badge (subtle, respects prefers-reduced-motion)
 * - Order details with thumbnails, collapsible on mobile
 * - Download receipt (generates a nice JSON/pretty TXT receipt blob)
 * - Auto-redirect with progress bar and countdown (cancelable)
 * - CTA buttons: Continue Shopping, View Orders, Track Order (if id present)
 *
 * Tailwind + Framer Motion + lucide-react friendly
 */

const DEFAULT_REDIRECT_SECONDS = 10;

function formatINR(n) {
  if (n == null || Number.isNaN(Number(n))) return "₹0.00";
  return Number(n).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
}

export default function ThankYou() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  // load snapshot from localStorage (safe defaults)
  const rawSnapshot = typeof window !== "undefined" ? localStorage.getItem("lastOrderSnapshot") : null;
  const parsedSnapshot = useMemo(() => {
    try {
      return rawSnapshot ? JSON.parse(rawSnapshot) : null;
    } catch {
      return null;
    }
  }, [rawSnapshot]);

  const lastOrderId = typeof window !== "undefined" ? localStorage.getItem("lastOrderId") : null;

  const snapshot = parsedSnapshot || {
    items: [],
    total: 0,
    customer: { name: "", email: "", phone: "", address: "" },
  };

  const [autoRedirectSecs, setAutoRedirectSecs] = useState(DEFAULT_REDIRECT_SECONDS);
  const [paused, setPaused] = useState(false);
  const [expanded, setExpanded] = useState(true); // expand details by default for desktop

  // countdown timer
  useEffect(() => {
    if (paused) return;
    if (autoRedirectSecs <= 0) {
      navigate("/"); // default redirect
      return;
    }
    const t = setInterval(() => setAutoRedirectSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [autoRedirectSecs, paused, navigate]);

  // small confetti simulation using emojis — non-essential, disabled when reduced motion
  const Confetti = () => {
    if (reduceMotion) return null;
    const pieces = new Array(14).fill(0).map((_, i) => (
      <motion.span
        key={i}
        initial={{ y: -20, opacity: 0, scale: 0.6 }}
        animate={{ y: 120 + Math.random() * 220, opacity: 1, rotate: Math.random() * 360, scale: 1 }}
        transition={{ duration: 1.8 + Math.random(), delay: i * 0.05, ease: "easeOut" }}
        style={{
          position: "absolute",
          left: `${5 + i * 6}%`,
          top: 0,
          pointerEvents: "none",
          fontSize: 18,
        }}
      >
        {["🌿", "🌾", "✨", "🍃", "✅"][i % 5]}
      </motion.span>
    ));
    return <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>{pieces}</div>;
  };

  // nice pretty receipt blob
  const downloadReceipt = () => {
    try {
      const receipt = {
        orderId: lastOrderId || `local_${Date.now()}`,
        createdAt: new Date().toISOString(),
        customer: snapshot.customer || {},
        items: snapshot.items || [],
        total: snapshot.total || 0,
      };
      const pretty = [
        `KrishiSaathi — Receipt`,
        `Order ID: ${receipt.orderId}`,
        `Date: ${new Date(receipt.createdAt).toLocaleString()}`,
        "",
        `Customer: ${receipt.customer.name || "-"}`,
        `Email: ${receipt.customer.email || "-"}`,
        `Phone: ${receipt.customer.phone || "-"}`,
        `Address: ${receipt.customer.address || "-"}`,
        "",
        "Items:",
        ...receipt.items.map((it, idx) => `  ${idx + 1}. ${it.name} — ${it.quantity} × ${formatINR(it.price)} = ${formatINR((it.price || 0) * (it.quantity || 0))}`),
        "",
        `Total: ${formatINR(receipt.total)}`,
        "",
        "Thank you for shopping with KrishiSaathi! 🌾",
      ].join("\n");

      const blob = new Blob([pretty], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `KrishiSaathi_Receipt_${receipt.orderId}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate receipt");
    }
  };

  const handleViewOrders = () => navigate("/orders");
  const handleTrack = () => {
    if (!lastOrderId) {
      toast.info("Order ID not found");
      return;
    }
    navigate(`/orders/${encodeURIComponent(lastOrderId)}`);
  };

  const total = snapshot.total || snapshot.items?.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success card */}
        <section className="relative bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg p-8 overflow-hidden">
          {!reduceMotion && <Confetti />}

          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18 }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-xl text-white"
                aria-hidden
              >
                <CheckCircle size={44} />
              </motion.div>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Thank you — your order is confirmed!</h1>
              <p className="mt-2 text-gray-600">
                We’re packing your fresh produce now. A confirmation has been sent to <strong>{snapshot.customer?.email || "your email"}</strong>.
              </p>

              <div className="mt-3 flex flex-wrap gap-3 items-center">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm">
                  <strong>Order ID:</strong> <span className="ml-2 font-medium">{lastOrderId || "—"}</span>
                </div>

                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                  <strong>Payment:</strong> <span className="ml-1">{snapshot.paymentMethod || "—"}</span>
                </div>

                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                  <strong>Total:</strong> <span className="ml-1 font-semibold">{formatINR(total)}</span>
                </div>
              </div>
            </div>

            {/* CTA column */}
            <div className="flex flex-col gap-3 items-stretch w-full md:w-auto">
              <button
                onClick={downloadReceipt}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white border shadow-sm hover:shadow-md"
              >
                <Download size={16} /> Download Receipt
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-green-600 text-white"
                >
                  Continue Shopping <ArrowRightCircle size={16} />
                </button>

                <button
                  onClick={handleViewOrders}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white border"
                >
                  View Orders <Grid size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* progress / redirect */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                {autoRedirectSecs > 0 ? (
                  <span>You'll be redirected to home in <strong>{autoRedirectSecs}s</strong></span>
                ) : (
                  <span>Redirecting…</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaused((p) => !p)}
                  className="text-sm text-green-700 underline"
                >
                  {paused ? "Resume" : "Pause"}
                </button>
                {lastOrderId && (
                  <button onClick={handleTrack} className="text-sm text-gray-600 underline">
                    Track order
                  </button>
                )}
              </div>
            </div>

            {/* progress bar */}
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <AnimatePresence>
                <motion.div
                  key={autoRedirectSecs} // reset animation when secs changes
                  initial={{ width: `${(autoRedirectSecs / DEFAULT_REDIRECT_SECONDS) * 100}%` }}
                  animate={{ width: `${(autoRedirectSecs / DEFAULT_REDIRECT_SECONDS) * 100}%` }}
                  transition={{ ease: "linear", duration: 0.9 }}
                  style={{ height: "100%", background: "linear-gradient(90deg,#16a34a,#059669)" }}
                />
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Order details */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Order details</h2>

              <button
                onClick={() => setExpanded((s) => !s)}
                className="text-sm text-green-700"
                aria-expanded={expanded}
              >
                {expanded ? "Collapse" : "Expand"}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {snapshot.items && snapshot.items.length ? (
                snapshot.items.map((it, idx) => (
                  <motion.div
                    key={it.id || idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`flex items-center gap-4 p-3 rounded-lg ${expanded ? "bg-gray-50" : ""}`}
                  >
                    <img
                      src={it.image || `https://via.placeholder.com/96x72?text=${encodeURIComponent(it.name?.slice(0,8) || "img")}`}
                      alt={it.name}
                      className="w-20 h-16 object-cover rounded-md border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800 truncate">{it.name}</div>
                        <div className="text-sm text-gray-600">{formatINR((it.price || 0) * (it.quantity || 1))}</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
                        <span>{it.quantity} × {formatINR(it.price)}</span>
                        {it.unit && <span>• {it.unit}</span>}
                        {it.seller && <span>• {it.seller}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">No items found in the order snapshot.</div>
              )}
            </div>

            {/* delivery & customer */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/60 border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700">Delivery</h3>
                <p className="mt-2 text-sm text-gray-600">{snapshot.customer?.address || "Address not available"}</p>
                <p className="mt-1 text-xs text-gray-500">{snapshot.customer?.city || ""} {snapshot.customer?.pincode || ""}</p>
                <p className="mt-2 text-xs text-gray-500">Estimated delivery: 2–4 business days</p>
              </div>

              <div className="bg-white/60 border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700">Customer</h3>
                <p className="mt-2 text-sm text-gray-600">{snapshot.customer?.name || "-"}</p>
                <p className="mt-1 text-xs text-gray-500">{snapshot.customer?.email || "-"}</p>
                <p className="mt-1 text-xs text-gray-500">{snapshot.customer?.phone || "-"}</p>
              </div>
            </div>
          </div>

          {/* right-side summary card */}
          <aside className="bg-white rounded-2xl shadow p-5 h-fit">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
                <p className="text-xs text-gray-500 mt-1">A copy of receipt is available to download.</p>
              </div>
            </div>

            <div className="mt-4 border-t pt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatINR(snapshot.items?.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0))}</strong></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-gray-600">Calculated earlier</span></div>
              <div className="flex justify-between"><span>Tax</span><span className="text-gray-600">Included</span></div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold"><span>Total</span><span className="text-green-700">{formatINR(total)}</span></div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button onClick={downloadReceipt} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border">
                <Download size={16} /> Download receipt
              </button>

              <button onClick={handleViewOrders} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white">
                <Grid size={16} /> View all orders
              </button>

              {lastOrderId && (
                <button onClick={handleTrack} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border">
                  Track order
                </button>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
