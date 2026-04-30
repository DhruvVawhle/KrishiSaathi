// src/frontend/pages/Contact.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Phone, MapPin, User, MessageSquare, Send,
  ChevronDown, Instagram, Twitter, Facebook, MessageCircle,
  Clock, Check, Leaf
} from "lucide-react";
import { updateSEO } from '@/frontend/utils/seo';
import Breadcrumb from '@/frontend/components/ui/Breadcrumb';
import "./Contact.css";
import Input from "@/frontend/components/ui/Input";
import Button from "@/frontend/components/ui/Button";



const FadeIn = ({ children, delay = 0, y = 30, duration = 0.5, className = "", style = {}, ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration, delay }}
      className={className}
      style={style}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const TOPICS = [
  "🛒 Order Issue",
  "👨‍🌾 Farmer Support",
  "🤝 Partnership",
  "💡 Feedback",
  "❓ General"
];

const FAQS = [
  {
    q: "How do I place an order?",
    a: "Browse our marketplace, add items to cart, and proceed to checkout. We accept UPI, cards, and cash on delivery."
  },
  {
    q: "How long does delivery take?",
    a: "Most orders are delivered within 2-4 business days. Same-day delivery is available in select areas of Pune."
  },
  {
    q: "How can I become a seller/farmer?",
    a: "Click 'Join as Farmer' on our website, fill in your details, and our team will verify and onboard you within 48 hours."
  },
  {
    q: "What is your return policy?",
    a: "We have a 24-hour freshness guarantee. If you're not satisfied with the quality, contact us within 24 hours of delivery for a full refund or replacement."
  }
];

const Contact = () => {
  useEffect(() => {
    updateSEO('/contact');
  }, []);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', message: ''
  });
  const [selectedTopic, setSelectedTopic] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const timerRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Business hours check
    const checkOpen = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, 6=Sat
      const hour = now.getHours();

      if (day === 0) return false; // Sunday
      if (day === 6) return hour >= 10 && hour < 16;
      return hour >= 9 && hour < 18;
    };

    setIsOpen(checkOpen());
    const interval = setInterval(() => setIsOpen(checkOpen()), 60000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'message') {
      setCharCount(value.length);
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.message.trim() || formData.message.length < 20) {
      newErrors.message = "Message must be at least 20 characters";
    } else if (formData.message.length > 1000) {
      newErrors.message = "Message exceeds 1000 characters limit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 1500);
    }
  };

  const handleClear = () => {
    setFormData({ name: '', email: '', phone: '', message: '' });
    setSelectedTopic('');
    setErrors({});
    setCharCount(0);
  };

  const resetForm = () => {
    setIsSuccess(false);
    // Clear any existing timer before starting a new one
    if (timerRef.current) clearTimeout(timerRef.current);
    // Delay clearing data so AnimatePresence exit animation has the data
    timerRef.current = setTimeout(handleClear, 500); 
  };

  const getCharCountColor = () => {
    if (charCount > 900) return '#D4313F';
    if (charCount > 700) return '#E27D60';
    return '#7A7A7A';
  };

  const Wave = () => (
    <div className="contact-hero-wave">
      <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 45C840 60 960 90 1080 90C1200 90 1320 60 1380 45L1440 30V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#F5E6CC" />
      </svg>
    </div>
  );

  return (
    <div className="contact-page">
      {/* SECTION 1 - HERO */}
      <section className="contact-hero">
        <Leaf className="contact-hero-leaf" />
        <div className="contact-hero-dots" />

        <div className="contact-hero-content">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="contact-hero-tag"
          >
            📬 We're here to help
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="contact-hero-title"
          >
            Contact <span className="contact-hero-title-accent">KrishiSaathi</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="contact-hero-body"
          >
            We'd love to hear from you — questions, feedback, or partnership ideas. We typically respond within 24 hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="contact-hero-pills"
          >
            <span className="contact-hero-pill">⚡ 24hr Response</span>
            <span className="contact-hero-pill">📞 Mon–Sat Support</span>
            <span className="contact-hero-pill">🌿 Farmer Helpline</span>
          </motion.div>
        </div>

        <Wave />
      </section>

      {/* SECTION 2 - MAIN CONTENT */}
      <section className="contact-main">
        <div className="contact-container" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <Breadcrumb items={[
            { label: 'Home', path: '/' },
            { label: 'Contact' }
          ]} />
        </div>
        <div className="contact-grid">

          {/* LEFT: FORM CARD */}
          <FadeIn y={30} duration={0.6} className="contact-form-card">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="contact-form-header">
                    <span className="contact-form-tag">Drop us a line</span>
                    <h2 className="contact-form-title">Send us a message</h2>
                    <p className="contact-form-sub">Fill in the form and we'll get back to you within 24 hours.</p>
                  </div>

                  <form onSubmit={handleSubmit} noValidate>
                    {/* Topic Selector */}
                    <div className="contact-topic-group">
                      <label className="contact-label">I want to talk about</label>
                      <div className="contact-topic-pills">
                        {TOPICS.map(topic => (
                          <button
                            key={topic}
                            type="button"
                            className={`contact-topic-btn ${selectedTopic === topic ? 'active' : ''}`}
                            onClick={() => setSelectedTopic(topic)}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name and Email Row */}
                    <div className="contact-form-row">
                      <Input
                        label="Your Name"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, name: e.target.value }));
                          if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                        }}
                        icon={User}
                        error={errors.name}
                      />

                      <Input
                        label="Email"
                        required
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, email: e.target.value }));
                          if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                        }}
                        icon={Mail}
                        error={errors.email}
                      />
                    </div>

                    {/* Phone (full width) */}
                    <Input
                      label="Phone"
                      hint="(optional)"
                      type="tel"
                      placeholder="+91 98xxxxxxxx"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      icon={Phone}
                    />

                    {/* Message Area */}
                    <div className="contact-form-group">
                      <label className="contact-label">Message <span className="contact-asterisk">*</span></label>
                      <div className="contact-input-wrap contact-textarea-wrap">
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us how we can help..."
                          className={`contact-textarea ${errors.message ? 'error' : ''}`}
                        />
                        <MessageSquare size={16} className="contact-input-icon" />
                      </div>
                      <div className="contact-char-count" style={{ color: getCharCountColor() }}>
                        {charCount} / 1000
                      </div>
                      {errors.message && <div className="contact-error-msg">⚠ {errors.message}</div>}
                    </div>

                    {/* Actions */}
                    <div className="contact-form-actions">
                      <div className="contact-action-left">
                        <Clock size={14} /> We respond within 24 hours
                      </div>

                      <div className="contact-action-right">
                        <Button
                          variant="ghost"
                          onClick={handleClear}
                          disabled={isSubmitting}
                        >
                          Clear
                        </Button>
                        <Button
                          type="submit"
                          loading={isSubmitting}
                          icon={<Send size={15} />}
                          iconPosition="right"
                        >
                          Send Message
                        </Button>
                      </div>
                    </div>

                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="contact-success"
                >
                  <div className="contact-success-circle">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <motion.path
                        d="M8 20L16 28L32 12"
                        stroke="#2D4F1E"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      />
                    </svg>
                  </div>
                  <h3 className="contact-success-title">Message Sent! 🎉</h3>
                  <p className="contact-success-body">
                    Thanks {formData.name || 'there'}! We'll get back to you at {formData.email || 'your email'} within 24 hours.
                  </p>
                  <Button onClick={resetForm} variant="primary" style={{ marginTop: 20 }}>
                    Send Another Message
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </FadeIn>

          {/* RIGHT: INFO PANELS */}
          <div className="contact-info-panel">

            {/* 1. Get in Touch */}
            <FadeIn y={20} delay={0.1} className="contact-card-dark">
              <span className="contact-section-tag">Reach us directly</span>
              <h3 className="contact-card-dark-title">Get in touch</h3>

              <a href="mailto:support@krishisaathi.in" className="contact-item">
                <div className="contact-item-icon"><Mail size={18} /></div>
                <div>
                  <span className="contact-item-label">EMAIL</span>
                  <span className="contact-item-value">support@krishisaathi.in</span>
                  <span className="contact-item-sub">Click to compose &rarr;</span>
                </div>
              </a>

              <a href="tel:+919876543210" className="contact-item">
                <div className="contact-item-icon"><Phone size={18} /></div>
                <div>
                  <span className="contact-item-label">PHONE</span>
                  <span className="contact-item-value">+91 98765 43210</span>
                  <span className="contact-item-sub">Mon–Sat, 9am–6pm IST</span>
                </div>
              </a>

              <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="contact-item">
                <div className="contact-item-icon"><MapPin size={18} /></div>
                <div>
                  <span className="contact-item-label">ADDRESS</span>
                  <span className="contact-item-value">Pune, Maharashtra, India</span>
                  <span className="contact-item-sub">Open in Google Maps &rarr;</span>
                </div>
              </a>
            </FadeIn>

            {/* 2. Business Hours */}
            <FadeIn y={20} delay={0.2} className="contact-card-light">
              <h3 className="contact-card-title"><Clock size={16} color="#4A4A4A" /> Business Hours</h3>

              <div className="contact-hour-row">
                <span className="contact-hour-day">Monday &ndash; Friday</span>
                <span className="contact-hour-time">9:00 AM &ndash; 6:00 PM</span>
              </div>
              <div className="contact-hour-row">
                <span className="contact-hour-day">Saturday</span>
                <span className="contact-hour-time">10:00 AM &ndash; 4:00 PM</span>
              </div>
              <div className="contact-hour-row">
                <span className="contact-hour-day">Sunday</span>
                <span className="contact-hour-time contact-hour-closed">Closed</span>
              </div>

              <div className="contact-status">
                <div className={`contact-status-dot ${isOpen ? 'open' : 'closed'}`} />
                <span className="contact-status-text">
                  Currently {isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </FadeIn>

            {/* 3. Connect on Social */}
            <FadeIn y={20} delay={0.3} className="contact-card-tan">
              <h3 className="contact-card-title" style={{ marginTop: 0 }}>Connect with us</h3>
              <div className="contact-social-grid">

                <a href="#" className="contact-social-btn instagram">
                  <div className="contact-social-icon"><Instagram size={18} /></div>
                  <span className="contact-social-text">Instagram</span>
                </a>

                <a href="#" className="contact-social-btn twitter">
                  <div className="contact-social-icon"><Twitter size={18} /></div>
                  <span className="contact-social-text">Twitter</span>
                </a>

                <a href="#" className="contact-social-btn facebook">
                  <div className="contact-social-icon"><Facebook size={18} /></div>
                  <span className="contact-social-text">Facebook</span>
                </a>

                <a href="#" className="contact-social-btn whatsapp">
                  <div className="contact-social-icon"><MessageCircle size={18} /></div>
                  <span className="contact-social-text">WhatsApp</span>
                </a>

              </div>
            </FadeIn>

          </div>
        </div>
      </section>

      {/* SECTION 3 - FAQ */}
      <section className="contact-faq">
        <div className="contact-faq-container">
          <div className="about-section-tag">Quick Answers</div>
          <h2 className="contact-faq-title">Frequently Asked Questions</h2>

          <div className="contact-faq-list">
            {FAQS.map((faq, index) => {
              const isOpenItem = openFaq === index;
              return (
                <FadeIn key={index} y={15} delay={index * 0.1} className="contact-faq-item">
                  <div
                    className="contact-faq-header"
                    onClick={() => setOpenFaq(isOpenItem ? null : index)}
                  >
                    <span className="contact-faq-q">{faq.q}</span>
                    <ChevronDown size={20} className={`contact-faq-icon ${isOpenItem ? 'open' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {isOpenItem && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="contact-faq-a-wrap"
                      >
                        <div className="contact-faq-a">{faq.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 - MAP */}
      <section className="contact-map-section">
        <div className="contact-map-container">
          <div className="contact-map-bar">
            <div className="contact-map-left">
              <MapPin size={16} className="contact-map-bar-icon" />
              KrishiSaathi HQ — Pune, Maharashtra
            </div>
            <a href="https://maps.google.com/?q=Pune" target="_blank" rel="noopener noreferrer" className="contact-map-link">
              Open in Google Maps ↗
            </a>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d121059.0471115312!2d73.78056461946028!3d18.52460355428807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2bf2e67461101%3A0x828d43bf9d9ee343!2sPune%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            className="contact-map-frame"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Pune Map"
          />
        </div>
      </section>

    </div>
  );
};

export default Contact;
