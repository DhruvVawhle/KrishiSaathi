// src/components/Footer.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Leaf,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Facebook,
  Instagram,
  Twitter,
} from "lucide-react";

const font = "'DM Sans', system-ui, sans-serif";

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const SOCIAL_LINKS = [
  { icon: <Instagram size={16} />, link: "https://instagram.com", label: "Instagram" },
  { icon: <Twitter size={16} />, link: "https://twitter.com", label: "Twitter" },
  { icon: <Facebook size={16} />, link: "https://facebook.com", label: "Facebook" },
];

const BUYER_QUICK_LINKS = [
  { to: "/",           text: "Home" },
  { to: "/marketplace", text: "Marketplace" },
  { to: "/about",      text: "About Us" },
  { to: "/contact",   text: "Blog" },
];

const FARMER_QUICK_LINKS = [
  { to: "/dashboard/farmer", text: "My Dashboard" },
  { to: "/add-product",      text: "Add Product" },
  { to: "/mandi-rates",      text: "Market Rates" },
  { to: "/about",            text: "About Us" },
];

const BUYER_SUPPORT_LINKS = [
  { to: "/faqs",    text: "FAQ" },
  { to: "/support", text: "Shipping" },
  { to: "/support", text: "Returns" },
  { to: "/contact", text: "Contact Us" },
];

const FARMER_SUPPORT_LINKS = [
  { to: "/support", text: "Payout Help" },
  { to: "/faqs",    text: "Seller FAQ" },
  { to: "/support", text: "Dispute Centre" },
  { to: "/contact", text: "Contact Us" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);

  // Read role for role-aware content
  const [role, setRole] = useState('buyer');
  useEffect(() => {
    try {
      const ksUser = JSON.parse(localStorage.getItem('ks_user') || 'null');
      setRole(ksUser?.role || 'buyer');
    } catch {}
  }, []);

  const isFarmer = role === 'farmer';
  const QUICK_LINKS  = isFarmer ? FARMER_QUICK_LINKS  : BUYER_QUICK_LINKS;
  const SUPPORT_LINKS = isFarmer ? FARMER_SUPPORT_LINKS : BUYER_SUPPORT_LINKS;

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleSubscribe = async (ev) => {
    ev.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setMessage({ text: "Please enter a valid email.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
    } catch { }
    setMessage({ text: "🎉 You're subscribed!", type: "success" });
    setEmail("");
    setSubmitting(false);
  };

  const linkStyle = {
    color: "#94a3b8",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 500,
    transition: "all 200ms",
    display: "block",
    paddingBottom: "8px",
  };

  const linkHover = (e) => {
    e.currentTarget.style.color = "#E27D60";
    e.currentTarget.style.paddingLeft = "4px";
  };

  const linkLeave = (e) => {
    e.currentTarget.style.color = "#94a3b8";
    e.currentTarget.style.paddingLeft = "0";
  };

  return (
    <footer
      role="contentinfo"
      style={{
        fontFamily: font,
        background: "#0F1F0A",
        color: "#e2e8f0",
        position: "relative",
        overflow: "hidden",
        borderTop: "3px solid #E27D60",
        marginTop: "2rem",
        boxShadow: "0 -8px 30px rgba(0,0,0,0.25)",
      }}
    >
      {/* ── Main 4-column grid ── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={containerVariants}
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "4rem 1.5rem 2.5rem",
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr",
          gap: "2.5rem",
        }}
      >
        {/* Col 1: Brand */}
        <motion.div variants={itemVariants}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #E27D60, #F0A080)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 16px rgba(226, 125, 96, 0.3)",
              }}
            >
              <Leaf size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff", letterSpacing: "-0.02em" }}>
                KrishiSaathi
              </div>
            </div>
          </div>

          <p style={{ fontSize: "0.88rem", color: "#F5E6CC", opacity: 0.7, lineHeight: 1.7, marginBottom: "1.25rem" }}>
            {isFarmer
              ? "Empowering Indian farmers to sell directly — better prices, faster payments, zero middlemen."
              : "Connecting farmers to families since 2024 — delivering farm-fresh goods straight to your doorstep."
            }
          </p>

          {/* Social Icons */}
          <div style={{ display: "flex", gap: "8px" }}>
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                aria-label={s.label}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  textDecoration: "none",
                  transition: "all 250ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(226,125,96,0.15)";
                  e.currentTarget.style.borderColor = "rgba(226,125,96,0.3)";
                  e.currentTarget.style.color = "#E27D60";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Col 2: Quick Links */}
        <motion.div variants={itemVariants}>
          <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            {isFarmer ? "Seller Links" : "Quick Links"}
          </h4>
          {QUICK_LINKS.map((l) => (
            <Link
              key={l.text}
              to={l.to}
              style={linkStyle}
              onMouseEnter={linkHover}
              onMouseLeave={linkLeave}
            >
              {l.text}
            </Link>
          ))}
        </motion.div>

        {/* Col 3: Support */}
        <motion.div variants={itemVariants}>
          <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            {isFarmer ? "Farmer Support" : "Support"}
          </h4>
          {SUPPORT_LINKS.map((l) => (
            <Link
              key={l.text}
              to={l.to}
              style={linkStyle}
              onMouseEnter={linkHover}
              onMouseLeave={linkLeave}
            >
              {l.text}
            </Link>
          ))}
        </motion.div>

        {/* Col 4: Contact + Newsletter */}
        <motion.div variants={itemVariants}>
          <h4 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
            Contact
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.25rem" }}>
            {[
              { icon: <Mail size={14} />, text: "hello@krishisaathi.com" },
              { icon: <Phone size={14} />, text: "+91 98765 43210" },
              { icon: <MapPin size={14} />, text: "Pune, Maharashtra" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "#94a3b8" }}>
                <span style={{ color: "#E27D60", display: "flex", flexShrink: 0 }}>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <form onSubmit={handleSubscribe}>
            <div
              style={{
                display: "flex",
                borderRadius: "12px",
                overflow: "hidden",
                border: focused ? "1.5px solid rgba(226,125,96,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                transition: "all 250ms",
              }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-label="Email for newsletter"
                style={{
                  fontFamily: font,
                  flex: 1,
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e2e8f0",
                  fontSize: "0.85rem",
                  minWidth: 0,
                }}
              />
              <button
                type="submit"
                disabled={submitting}
                style={{
                  fontFamily: font,
                  padding: "10px 16px",
                  background: "linear-gradient(135deg, #E27D60, #F0A080)",
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  whiteSpace: "nowrap",
                }}
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {message.text && (
            <p style={{ fontSize: "0.78rem", fontWeight: 500, marginTop: "6px", color: message.type === "success" ? "#E27D60" : "#f87171" }}>
              {message.text}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* ── Bottom Bar ── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "#0F1F0A",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "1.25rem 1.5rem",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            fontSize: "0.78rem",
            color: "#64748b",
          }}
        >
          <div>
            © {new Date().getFullYear()}{" "}
            <span style={{ fontWeight: 700, color: "#94a3b8" }}>KrishiSaathi</span>
            . All rights reserved.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {[
              { to: "/privacy", text: "Privacy" },
              { to: "/terms", text: "Terms" },
            ].map((l) => (
              <Link
                key={l.text}
                to={l.to}
                style={{ color: "#64748b", textDecoration: "none", fontWeight: 500, transition: "color 200ms" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E27D60")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                {l.text}
              </Link>
            ))}
            <span>Sitemap</span>
          </div>
        </div>
      </div>

      {/* Responsive override for mobile */}
      <style>{`
        @media (max-width: 768px) {
          footer > div:first-child > div {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          footer > div:first-child > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer >
  );
};

export default Footer;
