// src/pages/About.jsx
import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Leaf,
  Users,
  Globe,
  TrendingUp,
  UserPlus,
  CheckCircle,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

/**
 * Counter — time-based, requestAnimationFrame driven
 * - uses easing for smooth increment
 * - respects prefers-reduced-motion (renders final value immediately)
 */
const Counter = ({ end = 0, duration = 1200, className = "" }) => {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!end || end <= 0) {
      setValue(0);
      return;
    }
    if (reduceMotion) {
      setValue(end);
      return;
    }

    let rafId = null;
    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const next = Math.round(eased * end);
      setValue(next);
      if (t < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [end, duration, reduceMotion]);

  return (
    <span aria-live="polite" className={`font-bold ${className}`}>
      {value.toLocaleString()}
    </span>
  );
};

const About = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const features = [
    {
      icon: <Leaf className="w-10 h-10 text-green-600 mx-auto mb-4" aria-hidden="true" />,
      title: "Sustainability",
      desc: "Encouraging eco-friendly and organic farming practices that protect the land.",
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-4" aria-hidden="true" />,
      title: "Market Insights",
      desc: "Real-time market trends and pricing to help farmers get fair value.",
    },
    {
      icon: <Users className="w-10 h-10 text-green-600 mx-auto mb-4" aria-hidden="true" />,
      title: "Community",
      desc: "Connecting local farmers and buyers directly — trustworthy & transparent.",
    },
    {
      icon: <Globe className="w-10 h-10 text-green-600 mx-auto mb-4" aria-hidden="true" />,
      title: "Digital Reach",
      desc: "Technology-driven tools to expand market access and earnings.",
    },
  ];

  const howItWorks = [
    {
      id: 1,
      icon: <UserPlus size={28} className="text-green-600" aria-hidden="true" />,
      title: "Register & List",
      desc: "Create your farmer account and list produce with quantity, unit, and price.",
    },
    {
      id: 2,
      icon: <CheckCircle size={28} className="text-green-600" aria-hidden="true" />,
      title: "Quality & Trust",
      desc: "We help verify listings and encourage good agricultural practices for trustable produce.",
    },
    {
      id: 3,
      icon: <ShoppingCart size={28} className="text-green-600" aria-hidden="true" />,
      title: "Direct Orders",
      desc: "Buyers place orders directly — you set availability and receive them in your dashboard.",
    },
    {
      id: 4,
      icon: <Truck size={28} className="text-green-600" aria-hidden="true" />,
      title: "Fast Delivery",
      desc: "Streamlined pickup and delivery options to get produce to customers quickly.",
    },
  ];

  // small defensive nav wrappers
  const go = (to) => {
    try {
      navigate(to);
    } catch {
      window.location.href = to;
    }
  };

  return (
    <Layout>
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-white focus:text-green-700 focus:px-3 focus:py-2 rounded"
      >
        Skip to content
      </a>

      <section id="main-content" className="container mx-auto px-6 py-16">
        {/* HERO */}
        <motion.div
          initial={reduceMotion ? {} : { opacity: 0, y: -12 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold text-green-800 mb-4">
            About <span className="text-green-600">KrishiSaathi</span>
          </h1>

          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
            <span aria-hidden="true">🌾</span>{" "}
            <strong>KrishiSaathi</strong> connects farmers and buyers directly
            through a transparent, easy-to-use marketplace. We help farmers get fair prices
            and consumers receive fresh produce — while promoting sustainable practices.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => go("/marketplace")}
              aria-label="Start shopping — go to marketplace"
              title="Start Shopping"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold shadow-md transition focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              Start Shopping
            </button>

            <button
              onClick={() => go("/register")}
              aria-label="Join as a farmer"
              title="Join as Farmer"
              className="bg-white border border-green-200 text-green-700 px-5 py-3 rounded-full font-medium hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-green-200"
            >
              Join as Farmer
            </button>
          </div>
        </motion.div>

        {/* STATS */}
        <div className="mt-12 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Farmers onboarded", end: 1200 },
            { label: "Orders processed", end: 84000 },
            { label: "Tons of produce", end: 320 },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 shadow-sm text-center border border-gray-100"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <Counter
                end={stat.end}
                duration={1400 + i * 200}
                className="text-3xl text-green-700"
              />
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              whileHover={reduceMotion ? {} : { scale: 1.03 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center"
              aria-labelledby={`feature-${i}-title`}
            >
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-50">
                {f.icon}
              </div>
              <h3 id={`feature-${i}-title`} className="text-lg font-semibold text-green-700 mt-4">
                {f.title}
              </h3>
              <p className="text-sm text-gray-600 mt-2">{f.desc}</p>
            </motion.article>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <section className="mt-16 max-w-6xl mx-auto" aria-labelledby="how-it-works-title">
          <h3 id="how-it-works-title" className="text-2xl font-semibold text-green-700 text-center mb-6">
            How KrishiSaathi Works
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <motion.div
                key={step.id}
                whileHover={reduceMotion ? {} : { y: -6 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
                role="article"
                aria-labelledby={`how-step-${step.id}-title`}
              >
                <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-green-50 mb-3">
                  {step.icon}
                </div>
                <h4 id={`how-step-${step.id}-title`} className="font-semibold text-gray-800">{step.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* VISION / MISSION */}
        <div className="mt-16 max-w-4xl mx-auto bg-green-50 p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-bold text-green-800 mb-3">
            Our Vision
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We envision a future where farmers can thrive in a digital-first economy —
            with fair prices, sustainable practices, and direct access to markets. Our
            platform reduces middlemen, improves transparency, and supports rural livelihoods.
          </p>
        </div>

        {/* CTA SECTION */}
        <div className="mt-16 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xl font-bold">Grow with KrishiSaathi</h4>
              <p className="mt-1 text-sm opacity-95 max-w-xl">
                If you're a farmer or an organisation, join us to reach more buyers and
                increase your earnings with minimal commission.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => go("/register")}
                aria-label="Register as Farmer"
                className="bg-white text-green-700 px-5 py-3 rounded-full font-semibold shadow hover:scale-[1.02] transition focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                Register as Farmer
              </button>
              <button
                onClick={() => go("/marketplace")}
                aria-label="Browse marketplace"
                className="border border-white/30 px-5 py-3 rounded-full font-semibold hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/20"
              >
                Browse Marketplace
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
