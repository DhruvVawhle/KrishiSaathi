// src/pages/Support.jsx
import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import Layout from "../components/Layout";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * KrishiSaathi Support Page (Final Version)
 * - Fixed Right Sidebar (Need Technical Help + Feedback)
 * - Floating WhatsApp button
 * - Smooth animations with Framer Motion
 */

const HELPLINE_NUMBER = "+919876543210";
const SUPPORT_EMAIL = "support@krishisaathi.in";
const FORM_ENDPOINT = "https://formsubmit.co/" + SUPPORT_EMAIL;

const faqs = [
  {
    q: "How do I register as a Farmer?",
    a: "Go to Register → choose 'Farmer' role → fill in your details and submit. We verify new farmer accounts and notify you via email.",
  },
  {
    q: "I didn't receive OTP. What should I do?",
    a: "Check your network connection, ensure your number is in international format (+91xxxxxxxxxx), and try resending. If it persists, contact support via WhatsApp or Email.",
  },
  {
    q: "How do I list a product for sale?",
    a: "In Farmer Dashboard → Add Product → add images, price and stock. Save it and the product becomes visible in the marketplace.",
  },
];

const Support = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const formRef = useRef(null);

  const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
  const isNonEmpty = (s) => String(s || "").trim().length > 0;

  const copyHelpline = async () => {
    try {
      await navigator.clipboard.writeText(HELPLINE_NUMBER);
      toast.success("Helpline number copied to clipboard");
    } catch {
      toast.info(`Helpline: ${HELPLINE_NUMBER}`);
    }
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      "Hi KrishiSaathi support, I need help with..."
    );
    window.open(
      `https://wa.me/91${HELPLINE_NUMBER.replace(/\D/g, "").slice(-10)}?text=${text}`,
      "_blank"
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isNonEmpty(form.name)) return toast.error("Please enter your name");
    if (!isEmail(form.email)) return toast.error("Please enter a valid email");
    if (!isNonEmpty(form.message))
      return toast.error("Please write a short message");

    setLoading(true);
    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("email", form.email);
      body.append("message", form.message);

      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        toast.success("Thanks — your message has been sent successfully!");
        setForm({ name: "", email: "", message: "" });
        formRef.current?.reset();
      } else {
        toast.warn("Couldn't send via AJAX — fallback to standard submit.");
        formRef.current?.submit();
      }
    } catch (err) {
      toast.warn("Network issue — fallback to standard submit.");
      formRef.current?.submit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* ToastContainer moved to App root to avoid duplicate toasts */}

      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6"
            >
              <h1 className="text-4xl md:text-5xl font-extrabold text-green-800">
                Customer Support
              </h1>
              <p className="mt-3 text-lg text-gray-700 max-w-3xl">
                Need help using <strong>KrishiSaathi</strong>? Our team is here
                to assist farmers and buyers with quick guidance and solutions.
              </p>
            </motion.div>

            {/* FEATURE CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: "FAQs",
                  subtitle: "Quick answers",
                  desc: "Browse common questions and save time — most issues already solved here.",
                  action: "#faq",
                  icon: "❓",
                },
                {
                  title: "Live Chat",
                  subtitle: "WhatsApp support",
                  desc: "Start a chat with our support agent on WhatsApp.",
                  action: openWhatsApp,
                  icon: "💬",
                },
                {
                  title: "Email Support",
                  subtitle: "Detailed requests",
                  desc: "Send attachments or detailed queries via email.",
                  action: `mailto:${SUPPORT_EMAIL}`,
                  icon: "📧",
                },
                {
                  title: "Helpline",
                  subtitle: "Call us",
                  desc: "Speak directly with our support team.",
                  action: () => (window.location.href = `tel:${HELPLINE_NUMBER}`),
                  icon: "📞",
                },
              ].map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  onClick={() =>
                    typeof c.action === "string"
                      ? (window.location.href = c.action)
                      : c.action()
                  }
                  className="bg-white rounded-2xl p-5 shadow hover:shadow-lg transition cursor-pointer flex gap-4 items-start"
                >
                  <div className="flex-none text-green-600 text-2xl">{c.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {c.title}
                    </h3>
                    <div className="text-sm text-gray-500">{c.subtitle}</div>
                    <p className="mt-2 text-sm text-gray-600">{c.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* FAQ SECTION */}
            <div
              id="faq"
              className="mt-10 bg-gradient-to-b from-white to-green-50 rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold text-green-700 mb-4">
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {faqs.map((f, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                  >
                    <button
                      aria-expanded={openFaq === idx}
                      onClick={() =>
                        setOpenFaq(openFaq === idx ? null : idx)
                      }
                      className="w-full text-left px-4 py-3 flex items-center justify-between"
                    >
                      <div className="font-medium text-gray-800">{f.q}</div>
                      <div className="text-green-600 font-bold">
                        {openFaq === idx ? "−" : "+"}
                      </div>
                    </button>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={
                        openFaq === idx
                          ? { height: "auto", opacity: 1 }
                          : { height: 0, opacity: 0 }
                      }
                      transition={{ duration: 0.25 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="px-4 pb-4 text-sm text-gray-600">
                        {f.a}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (FIXED SIDEBAR) */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* NEED TECHNICAL HELP BOX */}
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="bg-white rounded-2xl p-5 shadow-lg"
              >
                <h3 className="text-lg font-semibold text-green-700">
                  Need Technical Help?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Having login issues, payment errors, or trouble adding
                  products? Our technical support team is ready to assist you.
                </p>

                <div className="mt-4 space-y-3">
                  <button
                    onClick={() =>
                      (window.location.href = `tel:${HELPLINE_NUMBER}`)
                    }
                    className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 px-3 hover:bg-green-50 transition"
                  >
                    📞 <span className="text-green-700 font-medium">Call Helpline</span>
                  </button>

                  <button
                    onClick={openWhatsApp}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white rounded-lg py-2 px-3 hover:bg-green-700 transition"
                  >
                    💬 Chat on WhatsApp
                  </button>

                  <button
                    onClick={copyHelpline}
                    className="w-full flex items-center justify-center gap-2 border rounded-lg py-2 px-3 hover:bg-gray-50 transition"
                  >
                    📋 Copy Number
                  </button>

                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="block text-center text-sm text-gray-600 underline hover:text-gray-800"
                  >
                    Or email: {SUPPORT_EMAIL}
                  </a>
                </div>
              </motion.div>

              {/* SEND FEEDBACK BOX */}
              <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="bg-white rounded-2xl p-6 shadow-lg"
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  📝 Send Feedback
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Share your suggestions or report a bug — we reply within 24 hours.
                </p>

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  action={FORM_ENDPOINT}
                  method="POST"
                  className="space-y-3"
                >
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, name: e.target.value }))
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-300 focus:outline-none"
                    required
                  />

                  <input
                    name="email"
                    type="email"
                    placeholder="Your email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, email: e.target.value }))
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-300 focus:outline-none"
                    required
                  />

                  <textarea
                    name="message"
                    placeholder="Describe the issue or suggestion"
                    rows="4"
                    value={form.message}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, message: e.target.value }))
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-300 focus:outline-none"
                    required
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 py-2 rounded-lg text-white font-medium ${
                        loading
                          ? "bg-green-300 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {loading ? "Sending..." : "Submit Feedback"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setForm({ name: "", email: "", message: "" });
                        formRef.current?.reset();
                      }}
                      className="px-4 py-2 rounded-lg border"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    By submitting, you agree that our team may contact you for
                    follow-up. We never share your data.
                  </div>
                </form>
              </motion.div>
            </div>
          </aside>
        </div>
      </section>

      {/* FLOATING WHATSAPP BUTTON */}
      <div className="fixed right-6 bottom-6 z-50">
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35 }}
          onClick={openWhatsApp}
          aria-label="Chat on WhatsApp"
          title="Chat with support"
          className="bg-gradient-to-br from-green-500 to-green-700 text-white p-4 rounded-full shadow-lg hover:scale-105 transition transform flex items-center gap-2"
        >
          <span className="text-xl">💬</span>
          <span className="hidden sm:inline text-sm font-medium">
            Chat with us
          </span>
        </motion.button>
      </div>
    </Layout>
  );
};

export default Support;
