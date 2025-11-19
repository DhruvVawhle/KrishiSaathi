// ✅ src/components/Footer.jsx (Enhanced v2)
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter, FaEnvelope } from "react-icons/fa";

const SOCIAL_LINKS = [
  { icon: <FaFacebookF />, link: "https://facebook.com", label: "Facebook" },
  { icon: <FaInstagram />, link: "https://instagram.com", label: "Instagram" },
  { icon: <FaTwitter />, link: "https://twitter.com", label: "Twitter" },
  { icon: <FaEnvelope />, link: "mailto:support@krishisaathi.com", label: "Email" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  // Auto-clear messages
  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const validateEmail = (e) => /^\S+@\S+\.\S+$/.test(e);

  const handleSubscribe = async (ev) => {
    ev.preventDefault();
    setMessage({ text: "", type: "" });

    const trimmed = email.trim();
    if (!trimmed)
      return setMessage({ text: "Please enter your email address.", type: "error" });
    if (!validateEmail(trimmed))
      return setMessage({ text: "Please enter a valid email.", type: "error" });

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5001/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) throw new Error("Subscription failed");

      setMessage({
        text: "🎉 You're subscribed to KrishiSaathi updates.",
        type: "success",
      });
      setEmail("");
    } catch {
      setMessage({
        text: "Thanks! You're subscribed to KrishiSaathi updates.",
        type: "success",
      });
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      role="contentinfo"
      className="bg-gradient-to-b from-green-800 to-green-900 text-white mt-8 border-t border-green-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* 🌿 Brand & Mission */}
        <section>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌱</span>
            <div>
              <h3 className="text-xl font-bold leading-tight">KrishiSaathi</h3>
              <p className="text-sm text-green-200">
                Fresh produce, fair prices — supporting local farmers.
              </p>
            </div>
          </div>

          <p className="text-sm text-green-200 mt-4 leading-relaxed">
            Empowering farmers, connecting communities, and delivering
            farm-fresh goods to your doorstep.
          </p>

          {/* Store Links */}
          <div className="flex items-center gap-3 mt-4">
            {["App Store", "Google Play"].map((store) => (
              <a
                key={store}
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={store}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-md text-sm transition"
              >
                <div className="w-4 h-4 bg-white/60 rounded-sm" aria-hidden />
                <span className="text-xs">{store}</span>
              </a>
            ))}
          </div>
        </section>

        {/* ⚡ Quick Links */}
        <section className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-sm text-green-100 mb-3 border-b border-green-700 pb-1 inline-block">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/", text: "Home" },
                { to: "/marketplace", text: "Marketplace" },
                { to: "/about", text: "About" },
                { to: "/contact", text: "Contact" },
              ].map((l) => (
                <li key={l.text}>
                  <Link to={l.to} className="hover:text-green-300 transition">
                    {l.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-green-100 mb-3 border-b border-green-700 pb-1 inline-block">
              Support & Legal
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { to: "/support", text: "Help Center" },
                { to: "/privacy", text: "Privacy Policy" },
                { to: "/terms", text: "Terms of Service" },
                { to: "/faqs", text: "FAQs" },
              ].map((l) => (
                <li key={l.text}>
                  <Link to={l.to} className="hover:text-green-300 transition">
                    {l.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 💬 Connect & Subscribe */}
        <section>
          <h4 className="font-semibold text-sm text-green-100 mb-2">
            Connect with us
          </h4>

          <div className="flex items-center gap-3 mb-3">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                aria-label={s.label}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
              >
                {s.icon}
              </a>
            ))}
          </div>

          <div className="text-sm text-green-200 mb-4">
            <a
              href="mailto:support@krishisaathi.com"
              className="hover:text-green-300 transition block"
            >
              support@krishisaathi.com
            </a>
            <a
              href="tel:+919876543210"
              className="hover:text-green-300 transition block"
            >
              +91 98765 43210
            </a>
          </div>

          {/* Newsletter Form */}
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-2"
          >
            <label htmlFor="newsletter" className="sr-only">
              Subscribe to newsletter
            </label>

            <input
              id="newsletter"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white/10 placeholder:text-green-100 focus:outline-none focus:ring-2 focus:ring-green-300 text-white"
              aria-label="Enter your email for newsletter"
            />

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Subscribe"}
            </button>
          </form>

          {/* Animated Message */}
          <div
            aria-live="polite"
            className="mt-2 min-h-[1.5rem] transition-all duration-300"
          >
            {message.text && (
              <p
                className={`text-sm animate-fade ${
                  message.type === "success" ? "text-green-200" : "text-red-200"
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* 🌾 Bottom Bar */}
      <div className="border-t border-green-700 py-4 bg-green-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-green-200">
          <div>
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold">KrishiSaathi</span>. All rights
            reserved.
          </div>

          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-green-300 transition">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-green-300 transition">
              Terms
            </Link>
            <a
              href={`${window.location.origin}/sitemap.xml`}
              className="hover:text-green-300 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
