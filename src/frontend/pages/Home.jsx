// src/pages/Home.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Leaf,
  CreditCard,
  Search,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Check,
  Star,
  Smartphone,
  ChevronLeft,
} from "lucide-react";

import { useProducts } from "@/frontend/contexts/ProductContext";
import { useUser } from "@/frontend/contexts/UserContext";
import RecommendedProducts from "@/frontend/components/ui/RecommendedProducts";

import { updateSEO } from '@/frontend/utils/seo';
import { imagePresets } from '@/frontend/utils/imageHelper';
import appStoreBadge from '../../assets/app-store-badge.png';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Home.css";

/* ─── Hooks ─── */
const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const useCountUp = (end, duration = 2000, inView = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, inView]);
  return count;
};

const useInView = (opts = {}) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.2, ...opts });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
};

/* ─── Framer Motion helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

/* ─── Carousel Variants ─── */
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 1.1,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.9,
  }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  },
};

/* ═══════════════════════════════════════════
                DATA
   ═══════════════════════════════════════════ */
const FEATURES = [
  { icon: Truck, title: "Free Delivery", sub: "On all orders above ₹299" },
  { icon: ShieldCheck, title: "Secure Payment", sub: "100% safe checkout" },
  { icon: Leaf, title: "Farm Fresh", sub: "Locally sourced daily" },
  { icon: CreditCard, title: "Easy Payment", sub: "UPI, Cards & COD" },
];

const CATEGORIES = [
  { name: "Vegetables", emoji: "🥦", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop" },
  { name: "Fruits", emoji: "🍎", img: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&fit=crop" },
  { name: "Grains", emoji: "🌾", img: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop" },
  { name: "Dairy", emoji: "🥛", img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop" },
  { name: "Herbs", emoji: "🌿", img: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=200&h=200&fit=crop" },
  { name: "Eggs", emoji: "🥚", img: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&h=200&fit=crop" },
];

const FARMER_CHECKLIST = [
  "Harvested within 24 hours of delivery",
  "Zero middlemen — farmers earn 40% more",
  "Seasonal & naturally grown options",
  "Supporting 500+ local farmers across India",
];

const PRODUCTS = [
  { id: "p1", name: "Potato", unit: "1 kg", price: 25, priceLabel: "₹25/kg", category: "Vegetables", image: "https://images.unsplash.com/photo-1518977676601-b53f82ber633?w=400&h=300&fit=crop" },
  { id: "p2", name: "Banana", unit: "1 dozen", price: 50, priceLabel: "₹50/dozen", category: "Fruits", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop" },
  { id: "p3", name: "Tomatoes", unit: "1 kg", price: 60, priceLabel: "₹60/kg", category: "Vegetables", image: "https://images.unsplash.com/photo-1546470427-e26264be0b11?w=400&h=300&fit=crop" },
  { id: "p4", name: "Spinach", unit: "500 g", price: 30, priceLabel: "₹30/bundle", category: "Vegetables", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&h=300&fit=crop" },
  { id: "p5", name: "Alphonso Mango", unit: "1 kg", price: 120, priceLabel: "₹120/kg", category: "Fruits", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&h=300&fit=crop" },
  { id: "p6", name: "Onion", unit: "1 kg", price: 35, priceLabel: "₹35/kg", category: "Vegetables", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&h=300&fit=crop" },
];

const TESTIMONIALS = [
  {
    id: 1,
    quote: "Real-time mandi rates and direct-to-consumer reach have boosted my monthly income by 30%. Very easy to use.",
    name: "Amit Patel",
    role: "Dairy Farmer",
    location: "Anand, Gujarat",
    avatar: "AP",
    color: "#2D4F1E",
    rating: 5,
    crop: "🥛 Dairy"
  },
  {
    id: 2,
    quote: "As a woman in agriculture, this platform gave me the digital tools to scale my herbal farm globally.",
    name: "Priyanka Sharma",
    role: "Agri-Entrepreneur",
    location: "Bhopal, MP",
    avatar: "PS",
    color: "#E27D60",
    rating: 5,
    crop: "🌿 Herbs"
  },
  {
    id: 3,
    quote: "The logistics support is seamless. My coffee beans reach cafes in Bangalore within 24 hours of harvest.",
    name: "Suresh Hegde",
    role: "Coffee Farmer",
    location: "Coorg, Karnataka",
    avatar: "SH",
    color: "#1A2E12",
    rating: 5,
    crop: "☕ Coffee"
  },
  {
    id: 4,
    quote: "KrishiSaathi has revolutionized how I sell my grapes. No more middleman headaches, and I get paid instantly!",
    name: "Rajesh Kumar",
    role: "Grape Farmer",
    location: "Nashik, Maharashtra",
    avatar: "RK",
    color: "#2D4F1E",
    rating: 5,
    crop: "🍇 Grapes"
  },
  {
    id: 5,
    quote: "The platform's focus on quality helps me get the premium my organic produce deserves. Truly a blessing for us.",
    name: "Sunita Deshmukh",
    role: "Organic Farmer",
    location: "Pune, Maharashtra",
    avatar: "SD",
    color: "#C96848",
    rating: 5,
    crop: "🥬 Organic"
  },
  {
    id: 6,
    quote: "KrishiSaathi's price intelligence told me the right time to sell. I made 40% more profit than last season.",
    name: "Vikram Singh",
    role: "Wheat Farmer",
    location: "Ludhiana, Punjab",
    avatar: "VS",
    color: "#2D4F1E",
    rating: 5,
    crop: "🌾 Wheat"
  }
];

const SLIDES = [
  {
    id: 0,
    title: "Fresh from Farmers,",
    accent: "Fair & Local",
    subtitle: "Order farm-fresh vegetables, fruits, grains and dairy — harvested within 24 hours and delivered straight to your doorstep.",
    badge: "🌾 Farm-to-Doorstep Marketplace",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80",
  },
  {
    id: 1,
    title: "Direct Sourcing,",
    accent: "Better Earnings",
    subtitle: "By cutting out middlemen, we ensure farmers get 40% more for their produce while you get the best prices.",
    badge: "👨‍🌾 Supporting Local Farmers",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1600&q=80",
  },
  {
    id: 2,
    title: "Organic & Seasonal",
    accent: "Handpicked Daily",
    subtitle: "Discover the taste of nature with our handpicked selection of organic and seasonal harvest, delivered fresh.",
    badge: "🍃 100% Natural & Organic",
    image: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1600&q=80",
  }
];

/* ═══════════════════════════════════════════
             PRODUCT CARD
   ═══════════════════════════════════════════ */
const ProductCard = ({ product, index }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      className="product-card"
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="product-card__img-wrap">
        {!imgError ? (
          <img
            src={imagePresets.card(product.image)}
            alt={`Fresh ${product.name} — ${product.priceLabel} | KrishiSaathi`}
            className="product-card__img"
            onError={() => setImgError(true)}
            loading={index < 3 ? "eager" : "lazy"}
            {...(index < 3 ? { fetchPriority: "high" } : {})}
          />
        ) : (
          <div className="product-card__fallback">
            <span className="product-card__fallback-emoji">🌿</span>
            <span className="product-card__fallback-text">Image Coming Soon</span>
          </div>
        )}
        <span className="product-card__badge">🔥 Best Price</span>
        <span className="product-card__price">{product.priceLabel}</span>
      </div>
      <div className="product-card__body">
        <h3 className="product-card__name">{product.name}</h3>
        <div className="product-card__category">{product.category}</div>
        <button className="product-card__cta">View in Marketplace</button>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
             HOME COMPONENT
   ═══════════════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();
  const { products: contextProducts } = useProducts?.() || {};
  const { user } = useUser() || {};
  const isFarmer = user?.role === 'farmer';

  useEffect(() => {
    updateSEO('/');
  }, []);

  // Testimonials hover
  const [activeCard, setActiveCard] = useState(null);

  // Search
  const [query, setQuery] = useState("");
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const debouncedQuery = useDebounced(query, 250);
  const suggestionsRef = useRef(null);

  const products = useMemo(() => {
    return contextProducts?.length ? contextProducts : PRODUCTS;
  }, [contextProducts]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    return products.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    ).slice(0, 5);
  }, [debouncedQuery, products]);

  useEffect(() => {
    setOpenSuggestions(filtered.length > 0 && query.length > 0);
  }, [filtered, query]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setOpenSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navigateToMarketplace = useCallback((q) => {
    setOpenSuggestions(false);
    setQuery("");
    navigate(q ? `/marketplace?search=${encodeURIComponent(q)}` : "/marketplace");
  }, [navigate]);

  // App banner counters
  const [bannerRef, bannerInView] = useInView();
  const farmerCount = useCountUp(500, 2000, bannerInView);
  const customerCount = useCountUp(50, 2000, bannerInView);

  // Carousel Logic
  const [[slideIndex, direction], setSlide] = useState([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const slideCount = SLIDES.length;

  const paginate = useCallback((newDirection) => {
    setSlide(([prevIdx]) => {
      const nextIdx = (prevIdx + newDirection + slideCount) % slideCount;
      return [nextIdx, newDirection];
    });
  }, [slideCount]);

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveCard(id);
    }
  };

  useEffect(() => {
    if (isFarmer || isPaused) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(timer);
  }, [isFarmer, isPaused, paginate]);

  const goToSlide = (idx) => {
    setSlide((prev) => {
      const dir = idx > prev[0] ? 1 : -1;
      return [idx, dir];
    });
  };

  return (
    <div className="home-page">

      {/* ═══════ 1. HERO ═══════ */}
      <section 
        className="hero" 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={isFarmer ? {
          background:
            'linear-gradient(160deg,' +
            '#1A2E12 0%,' +
            '#2D4F1E 35%,' +
            '#3D6B2A 65%,' +
            '#4A7C30 100%)',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        } : {}}
      >
        
        {isFarmer && (
          <>
            <div style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.08,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }} />
            <svg
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                opacity: 0.20
              }}
              viewBox="0 0 1440 200"
              preserveAspectRatio="none"
            >
              {Array.from({length: 36}).map(
                (_, i) => (
                  <g key={i}
                    transform={`translate(${
                      i * 40
                    }, 0)`}
                  >
                    <line
                      x1="20" y1="200"
                      x2="20" y2="80"
                      stroke="#EDD9B0"
                      strokeWidth="1.5"
                    />
                    <ellipse
                      cx="20" cy="70"
                      rx="6" ry="14"
                      fill="#EDD9B0"
                      transform="rotate(-10 20 70)"
                    />
                    <ellipse
                      cx="14" cy="90"
                      rx="4" ry="10"
                      fill="#EDD9B0"
                      opacity="0.7"
                      transform="rotate(-25 14 90)"
                    />
                    <ellipse
                      cx="26" cy="90"
                      rx="4" ry="10"
                      fill="#EDD9B0"
                      opacity="0.7"
                      transform="rotate(25 26 90)"
                    />
                  </g>
                )
              )}
            </svg>
            <div style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 500,
              height: 500,
              borderRadius: '50%',
              background:
                'radial-gradient(circle,' +
                'rgba(237,217,176,0.12) 0%,' +
                'transparent 70%)',
              pointerEvents: 'none'
            }} />
          </>
        )}

        {!isFarmer && (
          <>
            <div className="hero__container">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={slideIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.3 },
                  }}
                  className="hero__slide"
                  style={{ backgroundImage: `url(${SLIDES[slideIndex].image})` }}
                >
                  <div className="hero__slide-overlay" />
                  
                  <motion.div
                    className="hero__content"
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={contentVariants} className="hero__badge">
                      <Sparkles size={16} /> {SLIDES[slideIndex].badge}
                    </motion.div>
                    
                    <motion.h1 variants={contentVariants} className="hero__title">
                      {SLIDES[slideIndex].title}
                      <br />
                      <span className="hero__accent">{SLIDES[slideIndex].accent}</span>
                    </motion.h1>
                    
                    <motion.p variants={contentVariants} className="hero__subtitle">
                      {SLIDES[slideIndex].subtitle}
                    </motion.p>
                    
                    <motion.div variants={contentVariants} className="hero__actions">
                      <button
                        className="hero__btn-primary"
                        onClick={() => navigate("/marketplace")}
                      >
                        Order Now <ArrowRight size={18} />
                      </button>
                      <button
                        className="hero__btn-ghost"
                        onClick={() => document.querySelector('.search-float__input')?.focus()}
                      >
                        <Search size={18} /> Search Produce
                      </button>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Controls */}
            <button className="hero__arrow hero__arrow--prev" onClick={() => paginate(-1)}>
              <ChevronLeft size={24} />
            </button>
            <button className="hero__arrow hero__arrow--next" onClick={() => paginate(1)}>
              <ChevronRight size={24} />
            </button>

            <div className="hero__nav-dots">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero__dot ${slideIndex === idx ? 'hero__dot--active' : ''}`}
                  onClick={() => goToSlide(idx)}
                >
                   {slideIndex === idx && (
                     <motion.div 
                        className="hero__dot-progress"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        key={slideIndex}
                     />
                   )}
                </button>
              ))}
            </div>

            <div className="hero__blob hero__blob--1" />
            <div className="hero__blob hero__blob--2" />
          </>
        )}

        {isFarmer && (
          <motion.div
            className="hero__content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ zIndex: 10 }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 999,
                background:
                  'rgba(237,217,176,0.15)',
                border:
                  '1px solid rgba(237,217,176,0.30)',
                fontFamily: 'DM Sans',
                fontSize: 12,
                color: '#EDD9B0',
                marginBottom: 20
              }}>
                🌾 Farmer Dashboard Portal
              </div>

              <h1 style={{
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                fontSize: 'clamp(36px,5vw,64px)',
                color: 'white',
                lineHeight: 1.15,
                margin: '0 0 12px',
                letterSpacing: '-0.02em'
              }}>
                Welcome back,
                <br />
                <span style={{
                  color: '#EDD9B0'
                }}>
                  {user?.name?.split(' ')[0]
                    || 'Farmer'}! 🌾
                </span>
              </h1>

              <p style={{
                fontFamily: 'DM Sans',
                fontSize: 18,
                color: 'rgba(255,255,255,0.75)',
                maxWidth: 480,
                margin: '0 auto 32px',
                lineHeight: 1.6
              }}>
                Check today's mandi rates,
                manage your listings, and
                track your sales.
              </p>

              {/* Farmer CTAs */}
              <div style={{
                display: 'flex',
                gap: 14,
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() =>
                    navigate('/farmer-dashboard')
                  }
                  style={{
                    padding: '14px 28px',
                    background:
                      'linear-gradient(135deg,' +
                      '#E27D60,#C96848)',
                    border: 'none',
                    borderRadius: 14,
                    color: 'white',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    boxShadow:
                      '0 4px 16px rgba(226,125,96,0.45)'
                  }}
                >
                  📊 Go to Dashboard →
                </button>
                <button
                  onClick={() => {
                    navigate('/farmer-dashboard')
                    setTimeout(() => {
                      window.dispatchEvent(
                          new CustomEvent(
                              'farmer-nav',
                              { detail: 'mandi' }
                          )
                      )
                    }, 100)
                  }}
                  style={{
                    padding: '14px 28px',
                    background:
                      'rgba(255,255,255,0.12)',
                    border:
                      '1.5px solid rgba(255,255,255,0.25)',
                    borderRadius: 14,
                    color: 'white',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer'
                  }}
                >
                  📈 Check Mandi Rates
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* ═══════ 2. FLOATING SEARCH ═══════ */}
      <div className="search-float" ref={suggestionsRef}>
        <div className="search-float__inner">
          <span className="search-float__icon"><Search size={20} /></span>
          <input
            className="search-float__input"
            type="text"
            placeholder="Search fresh vegetables, fruits, grains..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && navigateToMarketplace(query)}
            onFocus={() => { if (filtered.length > 0) setOpenSuggestions(true); }}
          />
          {query && (
            <button
              className="search-float__btn"
              onClick={() => navigateToMarketplace(query)}
            >
              Search
            </button>
          )}
        </div>

        <AnimatePresence>
          {openSuggestions && (
            <motion.div
              className="search-float__suggestions"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {filtered.map((p) => (
                <div
                  key={p.id || p.name}
                  className="search-float__result-item"
                  onClick={() => navigateToMarketplace(p.name)}
                >
                  <span style={{ fontSize: "1.2rem" }}>🌿</span>
                  <div>
                    <div style={{ fontWeight: 600, color: "#4A4A4A" }}>{p.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "#7A7A7A" }}>{p.category}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "#2D4F1E", fontSize: "0.85rem" }}>
                    {p.priceLabel || `₹${p.price}`}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══════ 3. FEATURES STRIP ═══════ */}
      <section className="features-strip">
        <motion.div
          className="features-strip__grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {FEATURES.map((f, i) => (
            <motion.div 
              className="feature-card" 
              key={f.title} 
              variants={fadeUp} 
              custom={i}
              tabIndex={0}
            >
              <div className="feature-card__icon">
                <f.icon size={24} />
              </div>
              <div className="feature-card__title">{f.title}</div>
              <div className="feature-card__sub">{f.sub}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════ 4. CATEGORIES ═══════ */}
      <section className="categories">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.div className="section-tag" variants={fadeUp}>Browse by Category</motion.div>
          <h2 className="section-heading" variants={fadeUp}>
            Shop by Category
          </h2>
        </motion.div>

        <motion.div
          className="categories__grid"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {CATEGORIES.map((c, i) => (
            <motion.div
              className="category-card"
              key={c.name}
              variants={fadeUp}
              custom={i}
              onClick={() => navigate(`/marketplace?category=${c.name}`)}
            >
              <img
                className="category-card__img"
                src={c.img}
                alt={c.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                  e.target.nextSibling && (e.target.nextSibling.style.display = "block");
                }}
              />
              <span className="category-card__label">{c.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>


      {/* ═══════ 6. FEATURED PRODUCTS ═══════ */}
      <section className="products">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
          variants={stagger}
        >
          <motion.div className="section-tag" variants={fadeUp}>Just Picked</motion.div>
          <h2 className="section-heading" variants={fadeUp}>
            Featured Products
          </h2>
          <motion.p className="section-subtitle" variants={fadeUp}>
            Freshest produce available right now
          </motion.p>
        </motion.div>

        <div className="products__grid">
          {(products.length > 0 ? products.slice(0, 6) : PRODUCTS).map((p, i) => (
            <ProductCard key={p.id || p.name} product={p} index={i} />
          ))}
        </div>

        <motion.button
          className="products__view-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/marketplace")}
        >
          View All Products <ArrowRight size={18} />
        </motion.button>
      </section>

      <RecommendedProducts />

      {/* ═══════ 7. TESTIMONIALS ═══════ */}
      <section style={{
        background:
          'linear-gradient(180deg,' +
          '#F5E6CC 0%,' +
          '#FAF0DC 50%,' +
          '#F5E6CC 100%)',
        padding: '88px 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle bg pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025,
          backgroundImage:
            'radial-gradient(' +
            '#2D4F1E 1px,' +
            'transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none'
        }} />
        {/* Top wave decoration */}
        <div style={{
          position: 'absolute',
          top: -1,
          left: 0,
          right: 0,
          height: 60,
          background:
            'linear-gradient(180deg,' +
            '#F5E6CC,transparent)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* ── Section Header ── */}
          <div style={{
            textAlign: 'center',
            marginBottom: 56,
            padding: '0 24px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14
            }}>
              <div style={{
                width: 32,
                height: 1.5,
                background:
                  'linear-gradient(90deg,' +
                  'transparent,#E27D60)',
                borderRadius: 999
              }} />
              <span style={{
                fontFamily: 'Caveat',
                fontSize: 18,
                color: '#E27D60',
                fontWeight: 600,
                letterSpacing: '0.02em'
              }}>
                Success Stories
              </span>
              <div style={{
                width: 32,
                height: 1.5,
                background:
                  'linear-gradient(90deg,' +
                  '#E27D60,transparent)',
                borderRadius: 999
              }} />
            </div>

            <h2 style={{
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              fontSize: 'clamp(28px,4vw,44px)',
              color: '#2D4F1E',
              margin: '0 0 14px',
              letterSpacing: '-0.02em',
              lineHeight: 1.2
            }}>
              Trusted by Thousands of
              <br />
              <span style={{
                color: '#E27D60',
                fontStyle: 'italic'
              }}>
                Farming Families
              </span>
            </h2>

            <p style={{
              fontFamily: 'DM Sans',
              fontSize: 16,
              color: '#7A7A7A',
              maxWidth: 520,
              margin: '0 auto',
              lineHeight: 1.7
            }}>
              Hear directly from the farmers
              transforming Indian agriculture
              with KrishiSaathi.
            </p>

            {/* Stats row */}
            <div style={{
              display: 'flex',
              gap: 32,
              justifyContent: 'center',
              marginTop: 28,
              flexWrap: 'wrap'
            }}>
              {[
                { num: '500+', label: 'Farmers' },
                { num: '4.9★', label: 'Rating' },
                { num: '₹2Cr+', label: 'Revenue' },
                { num: '18', label: 'States' }
              ].map(s => (
                <div key={s.label}
                  style={{ textAlign: 'center' }}
                >
                  <div style={{
                    fontFamily: 'Playfair Display',
                    fontWeight: 700,
                    fontSize: 22,
                    color: '#2D4F1E',
                    lineHeight: 1
                  }}>
                    {s.num}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans',
                    fontSize: 11,
                    color: '#7A7A7A',
                    marginTop: 3,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Cards Grid ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(320px,1fr))',
            gap: 24,
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 24px'
          }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{
                  opacity: 1, y: 0
                }}
                viewport={{
                  once: true,
                  margin: '-50px'
                }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: 'easeOut'
                }}
                onMouseEnter={() =>
                  setActiveCard(t.id)
                }
                onMouseLeave={() =>
                  setActiveCard(null)
                }
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, t.id)}
                style={{
                  background: activeCard === t.id
                    ? '#FDFAF4'
                    : 'white',
                  borderRadius: 20,
                  border: activeCard === t.id
                    ? `1.5px solid ${t.color}40`
                    : '1.5px solid #EDD9B0',
                  padding: '28px 28px 24px',
                  cursor: 'default',
                  transition: 'all 280ms ease',
                  transform:
                    activeCard === t.id
                      ? 'translateY(-6px)'
                      : 'none',
                  boxShadow:
                    activeCard === t.id
                      ? '0 16px 40px rgba(45,79,30,0.12)'
                      : '0 2px 12px rgba(45,79,30,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}
              >
                {/* Decorative quote mark */}
                <div style={{
                  position: 'absolute',
                  top: 16,
                  right: 20,
                  fontFamily: 'Georgia',
                  fontSize: 72,
                  color: t.color,
                  opacity: activeCard === t.id
                    ? 0.08 : 0.04,
                  lineHeight: 1,
                  transition: 'opacity 280ms',
                  userSelect: 'none',
                  pointerEvents: 'none'
                }}>
                  &ldquo;
                </div>

                {/* Top row: crop tag + stars */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: `${t.color}12`,
                    border: `1px solid ${t.color}25`,
                    fontFamily: 'DM Sans',
                    fontSize: 11,
                    fontWeight: 600,
                    color: t.color
                  }}>
                    {t.crop}
                  </span>
                  <div style={{
                    display: 'flex',
                    gap: 2
                  }}>
                    {Array(t.rating).fill(0)
                      .map((_, si) => (
                      <span key={si} style={{
                        fontSize: 12,
                        color: '#FFB800'
                      }}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quote text */}
                <blockquote style={{
                  fontFamily: 'DM Sans',
                  fontSize: 15,
                  lineHeight: 1.75,
                  color: '#4A4A4A',
                  margin: 0,
                  fontStyle: 'italic',
                  flex: 1,
                  position: 'relative',
                  zIndex: 1
                }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Divider */}
                <div style={{
                  height: 1,
                  background:
                    activeCard === t.id
                      ? `linear-gradient(90deg,${t.color}30,transparent)`
                      : '#EDD9B0',
                  transition: 'background 280ms'
                }} />

                {/* Author row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background:
                      `linear-gradient(135deg,${t.color},${t.color}CC)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 14,
                    color: 'white',
                    flexShrink: 0,
                    border:
                      activeCard === t.id
                        ? `2.5px solid ${t.color}60`
                        : '2px solid #EDD9B0',
                    transition: 'border 280ms',
                    boxShadow:
                      activeCard === t.id
                        ? `0 4px 12px ${t.color}30`
                        : 'none'
                  }}>
                    {t.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'DM Sans',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#2D4F1E',
                      lineHeight: 1.3
                    }}>
                      {t.name}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans',
                      fontSize: 12,
                      color: '#7A7A7A',
                      marginTop: 1
                    }}>
                      {t.role}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans',
                    fontSize: 11,
                    color: '#B0A898',
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    <span style={{ fontSize: 10 }}>
                      📍
                    </span>
                    {t.location}
                  </div>
                </div>

                {/* Bottom accent line on hover */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 3,
                  width: activeCard === t.id
                    ? '100%' : '0%',
                  background:
                    `linear-gradient(90deg,${t.color},transparent)`,
                  borderRadius: '0 0 20px 20px',
                  transition: 'width 350ms ease'
                }} />
              </motion.div>
            ))}
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{
            textAlign: 'center',
            marginTop: 52,
            padding: '0 24px'
          }}>
            <p style={{
              fontFamily: 'DM Sans',
              fontSize: 15,
              color: '#7A7A7A',
              marginBottom: 20
            }}>
              Join 500+ farmers already earning
              more with KrishiSaathi
            </p>
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() =>
                  navigate('/register')
                }
                style={{
                  padding: '13px 28px',
                  background:
                    'linear-gradient(135deg,' +
                    '#2D4F1E,#3D6B2A)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow:
                    '0 4px 16px rgba(45,79,30,0.30)',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform
                    = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow
                    = '0 8px 24px rgba(45,79,30,0.40)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform
                    = 'none'
                  e.currentTarget.style.boxShadow
                    = '0 4px 16px rgba(45,79,30,0.30)'
                }}
              >
                🌾 Start Selling Today
              </button>
              <button
                onClick={() =>
                  navigate('/marketplace')
                }
                style={{
                  padding: '13px 28px',
                  background: 'transparent',
                  border: '1.5px solid #EDD9B0',
                  borderRadius: 12,
                  color: '#4A4A4A',
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor
                    = '#2D4F1E'
                  e.currentTarget.style.color
                    = '#2D4F1E'
                  e.currentTarget.style.background
                    = 'rgba(45,79,30,0.04)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor
                    = '#EDD9B0'
                  e.currentTarget.style.color
                    = '#4A4A4A'
                  e.currentTarget.style.background
                    = 'transparent'
                }}
              >
                🛒 Browse Products
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ 5. FARMER STORY ═══════ */}
      <section className="farmer-story">
        <div className="farmer-story__grid">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            <motion.div className="section-tag" variants={fadeUp}>Our Promise</motion.div>
            <motion.h2 className="farmer-story__title" variants={fadeUp}>
              From Our Farms,<br />To Your Family
            </motion.h2>
            <motion.p className="farmer-story__body" variants={fadeUp}>
              We work directly with 500+ local farmers across India, cutting
              out middlemen to bring you produce that's fresher, fairer, and
              full of flavour.
            </motion.p>
            <motion.ul className="farmer-story__checklist" variants={fadeUp}>
              {FARMER_CHECKLIST.map((item) => (
                <li key={item}>
                  <span className="farmer-story__check"><Check size={13} strokeWidth={3} /></span>
                  {item}
                </li>
              ))}
            </motion.ul>
            <motion.button
              className="farmer-story__cta"
              variants={fadeUp}
              onClick={() => navigate("/about")}
            >
              Meet Our Farmers <ArrowRight size={16} />
            </motion.button>
          </motion.div>

          <motion.div
            className="farmer-story__visual"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <div className="farmer-story__img farmer-story__img--main">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&h=400&fit=crop"
                alt="Indian farmer in field"
                fetchPriority="high"
              />
            </div>
            <div className="farmer-story__img farmer-story__img--secondary">
              <img
                src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=500&h=400&fit=crop"
                alt="Fresh farm produce"
                fetchPriority="high"
              />
            </div>
            <div className="farmer-story__stat">
              <strong>500+</strong>
              <span>Farmers Partnered</span>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ═══════ 8. APP DOWNLOAD BANNER ═══════ */}
      <section className="app-banner" ref={bannerRef}>
        {/* CHANGE 1 — Background glows & dots */}
        <div style={{
          position: 'absolute', top: -80, left: -80,
          width: 350, height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(226,125,96,0.18) 0%,transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: 200,
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(45,79,30,0.40) 0%,transparent 70%)',
          pointerEvents: 'none', zIndex: 0
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          opacity: 0.04,
          backgroundImage: 'radial-gradient(circle,#ffffff 1px,transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none', zIndex: 0
        }} />

        {/* Wave top */}
        <div className="app-banner__wave">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 80L60 68C120 56 240 32 360 24C480 16 600 24 720 36C840 48 960 64 1080 64C1200 64 1320 48 1380 40L1440 32V0H0Z" fill="#2D4F1E" />
          </svg>
        </div>

        <div className="app-banner__grid">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            style={{ position: 'relative', zIndex: 1 }}
          >
            {/* CHANGE 2 — Now on Mobile tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 16
            }}>
              <style>{`
                @keyframes ks-ping {
                  0% { transform:scale(1); opacity:0.7; }
                  100% { transform:scale(2.8); opacity:0; }
                }
              `}</style>
              <div style={{
                position: 'relative',
                width: 8, height: 8, flexShrink: 0
              }}>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: '#E27D60',
                  position: 'absolute'
                }} />
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: '#E27D60',
                  position: 'absolute',
                  animation: 'ks-ping 1.5s ease-out infinite'
                }} />
              </div>
              <span style={{
                fontFamily: 'Caveat',
                fontSize: 20,
                color: '#E27D60',
                fontWeight: 600
              }}>
                Now on Mobile
              </span>
            </div>

            <motion.h2 className="app-banner__title" variants={fadeUp}>
              Order Fresh,<br />Anytime, Anywhere
            </motion.h2>
            <motion.p className="app-banner__subtitle" variants={fadeUp}>
              Download the KrishiSaathi app for exclusive deals and real-time
              farm updates.
            </motion.p>

            {/* CHANGE 3 — Store Buttons */}
            <motion.div
              variants={fadeUp}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                marginTop: '32px'
              }}
            >
              {/* App Store Button */}
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 20px',
                  background: '#000',
                  border: '1.5px solid rgba(255,255,255,0.20)',
                  borderRadius: 14,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 220ms ease',
                  minWidth: 158,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.40)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.55)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.40)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'
                }}
              >
                <svg width="24" height="28"
                  viewBox="0 0 22 26" fill="white"
                  style={{ flexShrink: 0 }}>
                  <path d="M18.07 13.77C18.04 10.66 20.64 9.15 20.76 9.08C19.29 6.92 17.01 6.63 16.21 6.61C14.26 6.41 12.37 7.77 11.37 7.77C10.37 7.77 8.83 6.63 7.18 6.67C5.06 6.70 3.09 7.93 2.01 9.83C-0.22 13.68 1.44 19.34 3.57 22.45C4.64 23.97 5.89 25.67 7.54 25.61C9.15 25.54 9.76 24.57 11.71 24.57C13.64 24.57 14.21 25.61 15.90 25.57C17.63 25.54 18.72 24.03 19.75 22.50C20.99 20.76 21.49 19.05 21.51 18.96C21.47 18.95 18.10 17.71 18.07 13.77Z" />
                  <path d="M14.96 4.49C15.83 3.42 16.42 1.95 16.25 0.46C15.00 0.52 13.45 1.34 12.54 2.39C11.74 3.32 11.03 4.83 11.22 6.28C12.62 6.39 14.05 5.54 14.96 4.49Z" />
                </svg>
                <div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                    Available on the
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, color: 'white', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                    App Store
                  </div>
                </div>
              </a>

              {/* Google Play Button */}
              <a
                href="https://play.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 20px',
                  background: '#000',
                  border: '1.5px solid rgba(255,255,255,0.20)',
                  borderRadius: 14,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: 'all 220ms ease',
                  minWidth: 158,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.40)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.55)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.40)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.40)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.20)'
                }}
              >
                <svg width="24" height="24"
                  viewBox="0 0 24 24" fill="none"
                  style={{ flexShrink: 0 }}>
                  <path d="M3.18 23.76C3.07 23.52 3 23.23 3 22.87V1.13C3 0.77 3.07 0.48 3.19 0.24L3.27 0.16L14.44 11.33V11.67L3.27 22.84Z" fill="url(#gpa)" />
                  <path d="M18.12 15.26L14.44 11.58V11.24L18.12 7.56L22.57 10.09C23.8 10.79 23.8 11.93 22.57 12.63L18.22 15.1Z" fill="url(#gpb)" />
                  <path d="M18.22 15.1L14.44 11.32L3.18 22.58C3.59 23.01 4.27 23.07 5.04 22.64Z" fill="url(#gpc)" />
                  <path d="M18.22 7.54L5.04 0.02C4.27 -0.41 3.59 -0.35 3.18 0.08L14.44 11.32L18.22 7.54Z" fill="url(#gpd)" />
                  <defs>
                    <linearGradient id="gpa" x1="13.47" y1="1.16" x2="5.05" y2="22.96" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00A0FF" />
                      <stop offset="1" stopColor="#00E3FF" />
                    </linearGradient>
                    <linearGradient id="gpb" x1="24.83" y1="11.5" x2="2.74" y2="11.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFE000" />
                      <stop offset="1" stopColor="#FF9C00" />
                    </linearGradient>
                    <linearGradient id="gpc" x1="16.13" y1="13.41" x2="-0.48" y2="30.89" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FF3A44" />
                      <stop offset="1" stopColor="#C31162" />
                    </linearGradient>
                    <linearGradient id="gpd" x1="1.08" y1="-5.84" x2="8.78" y2="2.47" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#32A071" />
                      <stop offset="1" stopColor="#00F076" />
                    </linearGradient>
                  </defs>
                </svg>
                <div>
                  <div style={{ fontFamily: 'DM Sans', fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>
                    Get it on
                  </div>
                  <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, color: 'white', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                    Google Play
                  </div>
                </div>
              </a>
            </motion.div>

            {/* CHANGE 4 — Stats row */}
            <div style={{
              display: 'flex',
              gap: 28,
              marginTop: 24,
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {[
                { num: `${farmerCount}+`, label: 'Local Farmers', icon: '🌾' },
                { num: `${customerCount}k+`, label: 'Happy Customers', icon: '😊' },
                { num: '4.8★', label: 'App Rating', icon: '⭐', gold: true }
              ].map((s, i) => (
                <React.Fragment key={s.label}>
                  {i > 0 && (
                    <div style={{
                      width: 1, height: 32,
                      background: 'rgba(255,255,255,0.12)'
                    }} />
                  )}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5, marginBottom: 3
                    }}>
                      <span style={{ fontSize: 14 }}>
                        {s.icon}
                      </span>
                      <span style={{
                        fontFamily: 'Playfair Display',
                        fontWeight: 700,
                        fontSize: 26,
                        color: s.gold
                          ? '#FFD700' : '#EDD9B0',
                        lineHeight: 1
                      }}>
                        {s.num}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans',
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.50)',
                      fontWeight: 500
                    }}>
                      {s.label}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="app-banner__phone"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* CHANGE 6 — Glow behind phone */}
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Glow */}
              <div style={{
                position: 'absolute',
                width: '140%', height: '75%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse,rgba(45,79,30,0.55) 0%,transparent 70%)',
                filter: 'blur(28px)',
                zIndex: 0
              }} />

              {/* CHANGE 5 — Rich Phone frame content */}
              <div className="app-banner__phone-frame" style={{ position: 'relative', zIndex: 1 }}>
                <div className="app-banner__phone-notch" />
                
                {/* Status bar */}
                <div style={{
                  padding: '10px 14px 4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  marginTop: '12px'
                }}>
                  <span style={{
                    fontFamily: 'DM Sans', fontSize: 10,
                    fontWeight: 700, color: 'white'
                  }}>9:41</span>
                  <div style={{
                    width: 16, height: 9,
                    borderRadius: 2,
                    border: '1.5px solid rgba(255,255,255,0.60)',
                    position: 'relative', overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '80%', height: '100%',
                      background: '#4CAF50', borderRadius: 1
                    }} />
                  </div>
                </div>

                {/* App header */}
                <div style={{
                  padding: '4px 14px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center', gap: 6
                  }}>
                    <div style={{
                      width: 22, height: 22,
                      borderRadius: 6,
                      background: '#E27D60',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11
                    }}>🌾</div>
                    <span style={{
                      fontFamily: 'Playfair Display',
                      fontWeight: 700, fontSize: 12,
                      color: 'white'
                    }}>KrishiSaathi</span>
                  </div>
                  <span style={{ fontSize: 12 }}>🔔</span>
                </div>

                {/* Mandi rate card */}
                <div style={{
                  margin: '0 10px 7px',
                  background: 'linear-gradient(135deg,rgba(45,79,30,0.85),rgba(26,46,18,0.95))',
                  borderRadius: 11,
                  padding: '9px 11px',
                  border: '1px solid rgba(237,217,176,0.20)',
                  width: 'calc(100% - 20px)'
                }}>
                  <div style={{
                    fontFamily: 'DM Sans', fontSize: 8,
                    color: 'rgba(255,255,255,0.55)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 3
                  }}>🍅 Tomato · Today</div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                  }}>
                    <div>
                      <span style={{
                        fontFamily: 'Playfair Display',
                        fontWeight: 700, fontSize: 20,
                        color: 'white'
                      }}>₹13.14</span>
                      <span style={{
                        fontFamily: 'DM Sans', fontSize: 9,
                        color: 'rgba(255,255,255,0.50)',
                        marginLeft: 2
                      }}>/kg</span>
                    </div>
                    <div style={{
                      background: 'rgba(76,175,80,0.28)',
                      borderRadius: 6, padding: '2px 7px',
                      fontFamily: 'DM Sans', fontSize: 9,
                      fontWeight: 700, color: '#81C784'
                    }}>↑ 2.1%</div>
                  </div>
                </div>

                {/* Forecast bars */}
                <div style={{
                  margin: '0 10px 7px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10, padding: '8px 10px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  width: 'calc(100% - 20px)'
                }}>
                  <div style={{
                    fontFamily: 'DM Sans', fontSize: 7,
                    color: 'rgba(255,255,255,0.40)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 5
                  }}>7-Day ML Forecast</div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 3, height: 32
                  }}>
                    {[55, 65, 58, 72, 80, 76, 90].map((h, i) => (
                      <div key={i} style={{
                        flex: 1,
                        height: `${h}%`,
                        borderRadius: '3px 3px 0 0',
                        background: i === 6
                          ? '#E27D60'
                          : i >= 4
                            ? 'rgba(76,175,80,0.55)'
                            : 'rgba(237,217,176,0.22)'
                      }} />
                    ))}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 3
                  }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S']
                      .map((d, i) => (
                        <span key={i} style={{
                          flex: 1, textAlign: 'center',
                          fontFamily: 'DM Sans', fontSize: 7,
                          color: i === 6
                            ? '#E27D60'
                            : 'rgba(255,255,255,0.25)'
                        }}>{d}</span>
                      ))}
                  </div>
                </div>

                {/* Action grid */}
                <div style={{
                  margin: '0 10px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 5,
                  width: 'calc(100% - 20px)'
                }}>
                  {[
                    {
                      icon: '🌿', label: 'Products',
                      bg: 'rgba(45,79,30,0.55)'
                    },
                    {
                      icon: '📈', label: 'Mandi',
                      bg: 'rgba(226,125,96,0.32)'
                    },
                    {
                      icon: '💰', label: 'Sales',
                      bg: 'rgba(76,175,80,0.28)'
                    },
                    {
                      icon: '🤖', label: 'AI Price',
                      bg: 'rgba(100,100,255,0.22)'
                    }
                  ].map(item => (
                    <div key={item.label} style={{
                      background: item.bg,
                      borderRadius: 9,
                      padding: '7px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      <span style={{ fontSize: 12 }}>
                        {item.icon}
                      </span>
                      <span style={{
                        fontFamily: 'DM Sans',
                        fontSize: 9, fontWeight: 600,
                        color: 'rgba(255,255,255,0.85)'
                      }}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Home;
