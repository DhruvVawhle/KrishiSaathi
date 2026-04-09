// src/frontend/pages/About.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Leaf,
  Users,
  Globe,
  TrendingUp,
  UserPlus,
  ShieldCheck,
  ShoppingCart,
  Truck,
  DollarSign,
  Heart,
  Check
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateSEO } from '@/frontend/utils/seo';
import "./About.css";

// Custom Intersection Observer Hook (bypasses Framer Motion whileInView bugs)
const useInView = (opts = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.1, ...opts });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

const FadeIn = ({ children, delay = 0, y = 30, x = 0, scale = 1, duration = 0.5, className = "", style = {}, ...props }) => {
  const [ref, inView] = useInView();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x, scale: scale !== 1 ? scale : 1 }}
      animate={inView ? { opacity: 1, y: 0, x: 0, scale: 1 } : { opacity: 0, y, x, scale: scale !== 1 ? scale : 1 }}
      transition={{ duration, delay }}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const Counter = ({ end = 0, duration = 2000, className = "" }) => {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();
  const [ref, inView] = useInView();

  useEffect(() => {
    if (!inView) return;
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
  }, [end, duration, reduceMotion, inView]);

  return (
    <span ref={ref} aria-live="polite" className={className}>
      {value.toLocaleString()}
    </span>
  );
};

const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    updateSEO('/about');
  }, []);

  const go = (to) => {
    try {
      navigate(to);
    } catch {
      window.location.href = to;
    }
  };

  const stats = [
    { icon: <UserPlus size={24} color="#2D4F1E" />, end: 1200, label: "Farmers Onboarded", emoji: "👨‍🌾" },
    { icon: <ShoppingCart size={24} color="#2D4F1E" />, end: 84000, label: "Orders Processed", emoji: "📦" },
    { icon: <Leaf size={24} color="#2D4F1E" />, end: 320, label: "Tons of Produce", emoji: "🌿" },
  ];

  const missionPoints = [
    "Fair prices directly from farmers",
    "Zero unnecessary middlemen",
    "Supporting 500+ rural families",
    "Certified organic options available"
  ];

  const values = [
    {
      icon: <Leaf size={26} color="white" />,
      bg: "#2D4F1E",
      title: "Sustainability",
      body: "Encouraging eco-friendly and organic farming practices that protect the land for future generations."
    },
    {
      icon: <TrendingUp size={26} color="white" />,
      bg: "#E27D60",
      title: "Market Insights",
      body: "Real-time market trends and pricing to help farmers get fair value for their produce every season."
    },
    {
      icon: <Users size={26} color="white" />,
      bg: "#4A7A35",
      title: "Community",
      body: "Connecting local farmers and buyers directly — building a trustworthy and transparent food ecosystem."
    },
    {
      icon: <Globe size={26} color="white" />,
      bg: "#2D4F1E",
      title: "Digital Reach",
      body: "Technology-driven tools to expand market access and increase earnings for every farmer we partner with."
    }
  ];

  const howItWorks = [
    {
      icon: <UserPlus size={24} color="white" />,
      title: "Register & List",
      body: "Create your farmer account and list produce with quantity, unit, and price."
    },
    {
      icon: <ShieldCheck size={24} color="white" />,
      title: "Quality & Trust",
      body: "We verify listings and encourage good agricultural practices for trustworthy produce."
    },
    {
      icon: <ShoppingCart size={24} color="white" />,
      title: "Direct Orders",
      body: "Buyers place orders directly — you set availability and receive them in your dashboard."
    },
    {
      icon: <Truck size={24} color="white" />,
      title: "Fast Delivery",
      body: "Streamlined pickup and delivery options to get produce to customers quickly."
    }
  ];

  const visionPillars = [
    {
      icon: <DollarSign size={18} color="#E27D60" />,
      title: "Fair Compensation",
      body: "Farmers earn 40% more by selling direct"
    },
    {
      icon: <Leaf size={18} color="#E27D60" />,
      title: "Sustainable Farming",
      body: "Promoting chemical-free organic practices"
    },
    {
      icon: <Heart size={18} color="#E27D60" />,
      title: "Rural Prosperity",
      body: "Supporting 500+ families across India"
    }
  ];

  const team = [
    {
      bg: "linear-gradient(135deg, #2D4F1E, #3D6B2A)",
      initials: "AK",
      name: "Arjun Kumar",
      role: "Founder & CEO",
      bio: "10 years in AgriTech. Passionate about farmer welfare."
    },
    {
      bg: "linear-gradient(135deg, #E27D60, #F0A080)",
      initials: "PM",
      name: "Priya Mehta",
      role: "Head of Operations",
      bio: "Connects 500+ farmers with buyers across Maharashtra."
    },
    {
      bg: "linear-gradient(135deg, #4A7A35, #5A9A45)",
      initials: "RS",
      name: "Rahul Sharma",
      role: "Lead Engineer",
      bio: "Building technology that works for rural India."
    }
  ];

  const Wave = () => (
    <div className="about-hero-wave">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 45C840 60 960 90 1080 90C1200 90 1320 60 1380 45L1440 30V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F5E6CC" />
      </svg>
    </div>
  );

  return (
    <div className="about-page">
      {/* SECTION 1 - HERO */}
      <section className="about-hero">
        <Leaf className="about-hero-leaf" />
        <div className="about-hero-dots" />

        <div className="about-hero-content">
          <FadeIn y={-20} duration={0.4} className="about-hero-tag">
            🌾 Our Story
          </FadeIn>
          <FadeIn y={30} delay={0.1} className="about-hero-title">
            <h1 style={{ margin: 0, fontSize: 'inherit', fontWeight: 'inherit' }}>About <span className="about-hero-title-accent">KrishiSaathi</span></h1>
          </FadeIn>
          <FadeIn y={30} delay={0.2} className="about-hero-body">
            KrishiSaathi connects farmers and buyers directly
            through a transparent, easy-to-use marketplace.
            We help farmers get fair prices and consumers
            receive fresh produce — while promoting
            sustainable practices.
          </FadeIn>
          <FadeIn y={30} delay={0.3} className="about-hero-cta-row">
            <button className="about-btn-primary" onClick={() => go("/marketplace")}>Start Shopping</button>
            <button className="about-btn-secondary" onClick={() => go("/register")}>Join as Farmer</button>
          </FadeIn>
        </div>
        <Wave />
      </section>

      {/* SECTION 2 - STATS */}
      <section className="about-stats">
        <div className="about-section-tag">By the numbers</div>
        <div className="about-stats-grid">
          {stats.map((stat, i) => (
            <FadeIn key={i} y={40} delay={i * 0.1} className="about-stat-card">
              <div className="about-stat-icon-wrap">{stat.icon}</div>
              <span className="about-stat-number"><Counter end={stat.end} duration={2000} />+</span>
              <div className="about-stat-label">{stat.emoji} {stat.label}</div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SECTION 3 - MISSION */}
      <section className="about-mission">
        <div className="about-mission-container">
          <FadeIn y={30} duration={0.6} className="about-mission-image-wrap">
            <img src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&auto=format" alt="Farmer in field" className="about-mission-img" />
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8 }}
              className="about-mission-float-card-1"
            >
              <span className="about-mission-float-num">500+</span>
              <span className="about-mission-float-label">Farmers Partnered</span>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.0 }}
              className="about-mission-float-card-2"
            >
              <Leaf size={18} color="#2D4F1E" />
              <span className="about-mission-float-2-text">Certified Organic</span>
            </motion.div>
          </FadeIn>

          <FadeIn y={30} delay={0.2} duration={0.6} className="about-mission-content">
            <div className="about-section-tag">Our Mission</div>
            <h2 className="about-mission-title">Empowering Farmers, Feeding Families</h2>
            <p className="about-mission-body">
              We believe every farmer deserves fair
              compensation for their hard work. By removing
              middlemen and connecting directly with consumers,
              KrishiSaathi ensures that the people who grow
              our food are the ones who benefit most.
            </p>
            <div className="about-mission-checklist">
              {missionPoints.map((pt, i) => (
                <div key={i} className="about-mission-check-row">
                  <div className="about-check-icon"><Check size={14} /></div>
                  <span className="about-check-text">{pt}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION 4 - VALUES */}
      <section className="about-values">
        <div className="about-section-tag">What We Stand For</div>
        <h2 className="about-values-title">Our Core Values</h2>
        <div className="about-values-grid">
          {values.map((v, i) => (
            <FadeIn
              key={i}
              y={30}
              delay={i * 0.1}
              className="about-value-card"
              style={{ '--hover-border': v.bg }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = v.bg}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div className="about-value-icon-wrap" style={{ background: v.bg }}>
                {v.icon}
              </div>
              <h3 className="about-value-title">{v.title}</h3>
              <p className="about-value-body">{v.body}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SECTION 5 - HOW IT WORKS */}
      <section className="about-how">
        <div className="about-section-tag">Simple Process</div>
        <h2 className="about-how-title">How KrishiSaathi Works</h2>
        <div className="about-how-grid">
          <FadeIn
            y={0}
            delay={0.3}
            duration={0.8}
            className="about-how-line-wrap"
            style={{ position: "absolute", top: 28, left: 80, width: "calc(100% - 160px)", height: 2, zIndex: 0 }}
          >
            <motion.div
              style={{ width: "100%", height: "100%", borderTop: "2px dashed rgba(45, 79, 30, 0.2)" }}
            />
          </FadeIn>
          {howItWorks.map((step, i) => (
            <FadeIn key={i} y={40} delay={i * 0.15} className="about-how-step">
              <div className="about-how-icon-container">
                <div className="about-how-badge">{i + 1}</div>
                {step.icon}
              </div>
              <h4 className="about-how-step-title">{step.title}</h4>
              <p className="about-how-step-body">{step.body}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SECTION 6 - VISION */}
      <section className="about-vision">
        <div className="about-vision-circle" />
        <div className="about-vision-dots" />
        <div className="about-vision-container">
          <FadeIn x={-40} duration={0.6} className="about-vision-left">
            <div className="about-vision-quote-mark">“</div>
            <div className="about-section-tag">Our Vision</div>
            <h2 className="about-vision-title">A future where every farmer thrives</h2>
            <p className="about-vision-body">
              We envision a future where farmers can thrive
              in a digital-first economy — with fair prices,
              sustainable practices, and direct access to
              markets. Our platform reduces middlemen,
              improves transparency, and supports rural
              livelihoods across India.
            </p>
          </FadeIn>
          <div className="about-vision-right">
            {visionPillars.map((p, i) => (
              <FadeIn key={i} x={40} delay={i * 0.1} className="about-vision-pillar">
                <div className="about-vision-pillar-icon">{p.icon}</div>
                <div>
                  <h4 className="about-vision-pillar-title">{p.title}</h4>
                  <p className="about-vision-pillar-body">{p.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 - TEAM */}
      <section className="about-team">
        <div className="about-section-tag">The People</div>
        <h2 className="about-team-title">Built by people who care</h2>
        <p className="about-team-sub">
          Our team combines agricultural expertise with
          technology to build India's most trusted
          farm-to-table marketplace.
        </p>
        <div className="about-team-grid">
          {team.map((mbr, i) => (
            <FadeIn key={i} scale={0.95} y={20} delay={i * 0.1} duration={0.4} className="about-team-card">
              <div className="about-team-avatar" style={{ background: mbr.bg }}>
                {mbr.initials}
              </div>
              <h4 className="about-team-name">{mbr.name}</h4>
              <p className="about-team-role">{mbr.role}</p>
              <p className="about-team-bio">{mbr.bio}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SECTION 8 - CTA BANNER */}
      <div className="about-cta-wrapper">
        <FadeIn y={40} scale={0.98} className="about-cta-banner">
          <Leaf className="about-cta-leaf top-right" />
          <Leaf className="about-cta-leaf bottom-left" />
          <div className="about-cta-container">
            <div className="about-cta-left">
              <div className="about-section-tag">Join the Movement</div>
              <h2 className="about-cta-title">Grow with KrishiSaathi</h2>
              <p className="about-cta-body">
                If you're a farmer or an organisation,
                join us to reach more buyers and increase
                your earnings with minimal commission.
              </p>
              <div className="about-cta-badges">
                <span className="about-cta-badge">✓ Free to Join</span>
                <span className="about-cta-badge">✓ Low Commission</span>
                <span className="about-cta-badge">✓ Instant Payouts</span>
              </div>
            </div>
            <div className="about-cta-right">
              <button className="about-btn-cta-primary" onClick={() => go("/register")}>
                Register as Farmer
              </button>
              <button className="about-btn-cta-secondary" onClick={() => go("/marketplace")}>
                Browse Marketplace
              </button>
            </div>
          </div>
        </FadeIn>
      </div>

    </div>
  );
};

export default About;
