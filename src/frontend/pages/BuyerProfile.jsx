import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/frontend/contexts/ToastContext";
import Button from "@/frontend/components/ui/Button";
import Input from "@/frontend/components/ui/Input";
import Card from "@/frontend/components/ui/Card";
import EmptyState from "@/frontend/components/ui/EmptyState";
import { auth, db } from "@/frontend/config/firebaseConfig";
import { onAuthStateChanged, updateProfile as updateAuthProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import axios from "axios";
import {
  Edit2, Mail, Phone, MapPin, Building2, Hash,
  ShoppingBag, Heart, Truck, HelpCircle,
  Search, Package, Settings, ChevronRight
} from "lucide-react";
import "./BuyerProfile.css";

const API_BASE = "/api/payment";

// --- MOCK ORDERS ---
const mockOrders = [
  {
    id: "#KS-20240312",
    date: "12 Mar 2024",
    status: "Delivered",
    items: 3,
    total: "₹245",
    products: [
      { name: "Tomato", qty: 2, img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100&q=80" },
      { name: "Spinach", qty: 1, img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&q=80" },
      { name: "Potato", qty: 3, img: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&q=80" }
    ]
  },
  {
    id: "#KS-20240308",
    date: "8 Mar 2024",
    status: "Processing",
    items: 2,
    total: "₹150",
    products: [
      { name: "Apple", qty: 2, img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6fac6?w=100&q=80" },
      { name: "Banana", qty: 1, img: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&q=80" }
    ]
  },
  {
    id: "#KS-20240228",
    date: "28 Feb 2024",
    status: "Delivered",
    items: 2,
    total: "₹90",
    products: [
      { name: "Rice", qty: 1, img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&q=80" },
      { name: "Wheat Flour", qty: 1, img: "https://images.unsplash.com/photo-1598282367507-eedf61a15a81?w=100&q=80" }
    ]
  }
];


export default function BuyerProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Profile Data State
  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // UI States
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Orders Filters
  const [orderFilter, setOrderFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');

  // Notifications State
  const [notifSettings, setNotifSettings] = useState({
    orderUpdates: true,
    promotions: false,
    newArrivals: true
  });

  // Load User Data
  useEffect(() => {
    // 1. Instantly load cached profile to eliminate perceived UI waiting time
    const cached = localStorage.getItem("buyerProfile");
    if (cached) {
      try { setProfileData(JSON.parse(cached)); } catch (e) { }
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(u);

      try {
        const userRef = doc(db, "buyers", u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const fetchedData = snap.data();
          setProfileData(prev => ({ ...prev, ...fetchedData }));
          // Cache the latest verified profile data
          localStorage.setItem("buyerProfile", JSON.stringify({ ...(cached ? JSON.parse(cached) : {}), ...fetchedData }));
        } else {
          setProfileData(prev => ({ ...prev, fullName: u.displayName || "" }));
        }
      } catch (err) {
        console.error("Failed to load profile from Firestore:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Save Settings logic
  const handleSaveSettings = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, "buyers", user.uid);
      await setDoc(userRef, { ...profileData, updatedAt: serverTimestamp() }, { merge: true });
      if (user.displayName !== profileData.fullName) {
        await updateAuthProfile(user, { displayName: profileData.fullName });
      }
      toast.success("Profile saved successfully");
      localStorage.setItem("buyerProfile", JSON.stringify({ ...profileData }));
      setIsEditMode(false);
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Utils
  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const getInitial = () => {
    if (profileData.fullName) return profileData.fullName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  // Filtered orders
  const filteredOrders = mockOrders.filter(o => {
    const matchesMatch = orderFilter === 'All' || o.status === orderFilter;
    const searchMatch = !orderSearch || o.id.toLowerCase().includes(orderSearch.toLowerCase());
    return matchesMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className="bp-container animate-pulse">
        <div className="bp-hero" style={{ background: 'var(--color-bg-soft)' }}>
          <div className="bp-hero-content" style={{ opacity: 0.5 }}>
            <div className="bp-avatar-wrapper">
              <div className="bp-avatar" style={{ background: 'rgba(0,0,0,0.05)', borderColor: 'var(--color-bg-soft)' }}></div>
            </div>
            <div className="bp-user-info">
              <div style={{ width: 160, height: 28, background: 'rgba(0,0,0,0.08)', borderRadius: 6, marginBottom: 8 }}></div>
              <div style={{ width: 120, height: 16, background: 'rgba(0,0,0,0.05)', borderRadius: 4 }}></div>
            </div>
          </div>
        </div>
        <div className="bp-stats-strip" style={{ height: 110, background: 'var(--color-bg-soft)' }}></div>
        <div className="bp-main">
          <aside className="bp-sidebar">
            <div className="bp-card" style={{ height: 380, background: 'var(--color-bg-soft)' }}></div>
            <div className="bp-loyalty-card" style={{ height: 200, background: 'var(--color-bg-soft)', opacity: 0.5 }}></div>
          </aside>
          <main className="bp-content" style={{ minHeight: 400, background: 'var(--color-bg-soft)' }}></main>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '100px 20px' }}>
          <EmptyState
          icon={ShoppingBag}
          title="Please Log In"
          subtitle="You need to be logged in to view your profile and order history."
          actionLabel="Go to Login"
          onAction={() => navigate('/login')}
        />
      </div>
    );
  }

  return (
    <div className="bp-container">

      {/* SECTION 1 - HERO BANNER */}
      <motion.section
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="bp-hero"
      >
        <svg className="bp-hero-bg-leaf" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
        <div className="bp-hero-bg-dots" />

        <Link to="/" className="bp-breadcrumb">← Back to Home</Link>
        <div className="bp-join-date">Member since March 2024</div>

        <div className="bp-hero-content">
          <div className="bp-avatar-wrapper">
            <div className="bp-avatar">
              <span className="bp-avatar-text">{getInitial()}</span>
              <div className="bp-avatar-edit-overlay">
                <Edit2 size={18} />
                <span>Edit</span>
              </div>
            </div>
          </div>
          <div className="bp-user-info">
            <h1 className="bp-user-name">{profileData.fullName || "Buyer"}</h1>
            <p className="bp-user-email">{user.email}</p>
          </div>
        </div>

        <button onClick={() => { setActiveTab('settings'); setIsEditMode(true); window.scrollTo({ top: 400, behavior: 'smooth' }); }} className="bp-hero-edit-btn">
          <Edit2 size={14} /> Edit Profile
        </button>
      </motion.section>

      {/* SECTION 2 - STATS STRIP */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="bp-stats-strip"
      >
        <div className="bp-stat-item">
          <h3 className="bp-stat-value">3</h3>
          <p className="bp-stat-label">TOTAL ORDERS</p>
        </div>
        <div className="bp-stat-item">
          <h3 className="bp-stat-value">₹485</h3>
          <p className="bp-stat-label">TOTAL SPENT</p>
        </div>
        <div className="bp-stat-item">
          <h3 className="bp-stat-value">240</h3>
          <p className="bp-stat-label">LOYALTY POINTS</p>
        </div>
        <div className="bp-stat-item">
          <h3 className="bp-stat-value gold">Gold</h3>
          <p className="bp-stat-label">MEMBER TIER</p>
        </div>
      </motion.div>

      {/* TWO COLUMN LAYOUT */}
      <div className="bp-main">

        {/* LEFT SIDEBAR */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="bp-sidebar"
        >
          {/* Card 1: Profile Info */}
          <div className="bp-card">
            <h4 className="bp-card-title">PROFILE INFO</h4>

            <div className="bp-info-row">
              <div className="bp-info-icon"><Mail size={14} /></div>
              <div className="bp-info-content">
                <span className="bp-info-label">EMAIL</span>
                <span className="bp-info-value">{user.email}</span>
              </div>
            </div>
            <div className="bp-info-row">
              <div className="bp-info-icon"><Phone size={14} /></div>
              <div className="bp-info-content">
                <span className="bp-info-label">PHONE</span>
                {profileData.phone ? (
                  <span className="bp-info-value">{profileData.phone}</span>
                ) : (
                  <span className="bp-info-empty">Not provided <span className="bp-info-add-link" onClick={() => { setActiveTab('settings'); setIsEditMode(true); }}>+ Add</span></span>
                )}
              </div>
            </div>
            <div className="bp-info-row">
              <div className="bp-info-icon"><MapPin size={14} /></div>
              <div className="bp-info-content">
                <span className="bp-info-label">ADDRESS</span>
                {profileData.address ? (
                  <span className="bp-info-value">{profileData.address}</span>
                ) : (
                  <span className="bp-info-empty">Not provided <span className="bp-info-add-link" onClick={() => { setActiveTab('settings'); setIsEditMode(true); }}>+ Add</span></span>
                )}
              </div>
            </div>
            <div className="bp-info-row">
              <div className="bp-info-icon"><Building2 size={14} /></div>
              <div className="bp-info-content">
                <span className="bp-info-label">CITY</span>
                {profileData.city ? (
                  <span className="bp-info-value">{profileData.city}</span>
                ) : (
                  <span className="bp-info-empty">Not provided <span className="bp-info-add-link" onClick={() => { setActiveTab('settings'); setIsEditMode(true); }}>+ Add</span></span>
                )}
              </div>
            </div>
            <div className="bp-info-row">
              <div className="bp-info-icon"><Hash size={14} /></div>
              <div className="bp-info-content">
                <span className="bp-info-label">PINCODE</span>
                {profileData.pincode ? (
                  <span className="bp-info-value">{profileData.pincode}</span>
                ) : (
                  <span className="bp-info-empty">Not provided <span className="bp-info-add-link" onClick={() => { setActiveTab('settings'); setIsEditMode(true); }}>+ Add</span></span>
                )}
              </div>
            </div>

            <Button
              fullWidth
              variant="primary"
              onClick={() => { setActiveTab('settings'); setIsEditMode(true); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              className="mb-3"
            >
              ✏ Edit Profile
            </Button>
            <Button
              fullWidth
              variant={copied ? "success" : "ghost"}
              onClick={handleCopyEmail}
              style={{ border: '1px solid #EDD9B0' }}
            >
              {copied ? "✓ Copied!" : "Copy Email"}
            </Button>
          </div>

          {/* Card 2: Loyalty */}
          <div className="bp-loyalty-card">
            <div className="bp-loyalty-tag">Rewards</div>
            <div className="bp-loyalty-title">🌾 Loyalty Points</div>
            <div className="bp-loyalty-pts">
              240 <span className="bp-loyalty-pts-txt">points available</span>
            </div>
            <div className="bp-progress-labels">
              <span className="bp-prog-tier">Gold Member</span>
              <span className="bp-prog-next">260 pts to Platinum</span>
            </div>
            <div className="bp-progress-bg">
              <div className="bp-progress-fill" style={{ width: '48%' }} />
            </div>
            <button className="bp-loyalty-btn">Redeem Points</button>
          </div>

          {/* Card 3: Quick Actions */}
          <div className="bp-quick-actions">
            <h4 className="bp-card-title">QUICK ACTIONS</h4>
            <Link to="/marketplace" className="bp-q-action">
              <ShoppingBag className="bp-q-icon" size={16} />
              <span className="bp-q-text">Browse Marketplace</span>
              <ChevronRight className="bp-q-arrow" size={14} />
            </Link>
            <div onClick={() => setActiveTab('wishlist')} className="bp-q-action">
              <Heart className="bp-q-icon" size={16} />
              <span className="bp-q-text">My Wishlist</span>
              <ChevronRight className="bp-q-arrow" size={14} />
            </div>
            <div onClick={() => setActiveTab('orders')} className="bp-q-action">
              <Truck className="bp-q-icon" size={16} />
              <span className="bp-q-text">Track Orders</span>
              <ChevronRight className="bp-q-arrow" size={14} />
            </div>
            <Link to="/support" className="bp-q-action">
              <HelpCircle className="bp-q-icon" size={16} />
              <span className="bp-q-text">Get Support</span>
              <ChevronRight className="bp-q-arrow" size={14} />
            </Link>
          </div>
        </motion.aside>

        {/* RIGHT CONTENT */}
        <motion.main
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
          className="bp-content"
        >
          <div className="bp-tabs-header">
            <button onClick={() => setActiveTab('orders')} className={`bp-tab ${activeTab === 'orders' ? 'active' : ''}`}>
              📦 Orders <span className="bp-tab-badge">3</span>
            </button>
            <button onClick={() => setActiveTab('wishlist')} className={`bp-tab ${activeTab === 'wishlist' ? 'active' : ''}`}>
              ❤ Wishlist <span className="bp-tab-badge">0</span>
            </button>
            <button onClick={() => setActiveTab('addresses')} className={`bp-tab ${activeTab === 'addresses' ? 'active' : ''}`}>
              📍 Addresses <span className="bp-tab-badge">0</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`bp-tab ${activeTab === 'settings' ? 'active' : ''}`}>
              ⚙ Settings
            </button>
          </div>

          <div className="bp-tab-content">

            <AnimatePresence mode="wait">
              {/* TAB 1: ORDERS */}
              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="bp-filters">
                    {['All', 'Delivered', 'Processing', 'Cancelled'].map(f => (
                      <button key={f} onClick={() => setOrderFilter(f)} className={`bp-filter-pill ${orderFilter === f ? 'active' : ''}`}>
                        {f}
                      </button>
                    ))}
                    <div className="bp-search">
                      <Search size={14} className="bp-search-icon" />
                      <input
                        type="text" placeholder="Search orders..."
                        className="bp-search-input"
                        value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="bp-orders-list">
                    {filteredOrders.length === 0 ? (
                      <div className="bp-empty-state">
                        <div className="bp-empty-icon-box"><Package size={48} color="#2D4F1E" /></div>
                        <h2 className="bp-empty-title">No orders found</h2>
                        <p className="bp-empty-desc">We couldn't find any orders matching your criteria.</p>
                      </div>
                    ) : (
                      filteredOrders.map((order, idx) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                          className="bp-order-card"
                        >
                          <div className="bp-oc-header">
                            <div>
                              <h4 className="bp-oc-id">{order.id}</h4>
                              <p className="bp-oc-date">{order.date}</p>
                            </div>
                            <span className={`bp-status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                          </div>

                          <div className="bp-oc-products">
                            {order.products.map((p, i) => (
                              <div key={i} className="bp-chip">
                                <img src={p.img} alt={p.name} className="bp-chip-img" />
                                <span className="bp-chip-name">{p.name}</span>
                                <span className="bp-chip-qty">×{p.qty}</span>
                              </div>
                            ))}
                          </div>

                          <div className="bp-oc-footer">
                            <span className="bp-oc-items">{order.items} items</span>
                            <span className="bp-oc-total">{order.total}</span>
                            <div className="bp-oc-actions">
                              <button className="bp-btn-view">View Details</button>
                              {order.status === 'Delivered' && (
                                <button className="bp-btn-action">Reorder</button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: WISHLIST */}
              {activeTab === 'wishlist' && (
                <EmptyState
                  icon={<Heart size={40} />}
                  title="Your wishlist is empty"
                  subtitle="Save items you love while browsing the marketplace."
                  action={{ label: "Browse Marketplace", onClick: () => navigate('/marketplace') }}
                />
              )}

              {/* TAB 3: ADDRESSES */}
              {activeTab === 'addresses' && (
                <EmptyState
                  icon={<MapPin size={40} />}
                  title="No saved addresses"
                  subtitle="Add a delivery address to speed up checkout."
                  action={{ label: "Add New Address", onClick: () => {} }}
                />
              )}

              {/* TAB 4: SETTINGS */}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

                  {/* Sec 1 */}
                  <div className="bp-settings-section">
                    <div className="bp-settings-header">
                      <h4 className="bp-settings-title">Personal Information</h4>
                      <button onClick={() => setIsEditMode(!isEditMode)} className="bp-settings-edit-toggle">
                        {isEditMode ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    <div className="bp-form-grid">
                      <div className="bp-form-group">
                        <Input
                          label="Full Name"
                          disabled={!isEditMode}
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                        />
                      </div>
                      <div className="bp-form-group">
                        <Input
                          label="Email Address"
                          type="email"
                          disabled
                          value={user.email || ""}
                          icon={<Mail size={16} />}
                        />
                      </div>
                      <div className="bp-form-group">
                        <Input
                          label="Phone Number"
                          disabled={!isEditMode}
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          icon={<Phone size={16} />}
                        />
                      </div>
                      <div className="bp-form-group">
                        <Input
                          label="City"
                          disabled={!isEditMode}
                          value={profileData.city}
                          onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                          icon={<Building2 size={16} />}
                        />
                      </div>
                      <div className="bp-form-group full-w">
                        <Input
                          label="Full Address"
                          disabled={!isEditMode}
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          icon={<MapPin size={16} />}
                        />
                      </div>
                      <div className="bp-form-group">
                        <Input
                          label="Pincode"
                          disabled={!isEditMode}
                          value={profileData.pincode}
                          onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                          icon={<Hash size={16} />}
                        />
                      </div>

                      {isEditMode && (
                        <div className="flex gap-4 mt-6">
                          <Button
                            onClick={handleSaveSettings}
                            loading={isSaving}
                            variant="success"
                          >
                            Save Changes
                          </Button>
                          <Button
                            onClick={() => setIsEditMode(false)}
                            variant="ghost"
                            style={{ border: '1px solid #EDD9B0' }}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sec 2: Notifications */}
                  <div className="bp-settings-section">
                    <div className="bp-settings-header"><h4 className="bp-settings-title">Notifications</h4></div>

                    <div className="bp-toggle-row">
                      <div className="bp-toggle-left">
                        <h5>Order Updates</h5><p>Get SMS for order status</p>
                      </div>
                      <div className={`bp-toggle-switch ${notifSettings.orderUpdates ? 'on' : ''}`} onClick={() => setNotifSettings(p => ({ ...p, orderUpdates: !p.orderUpdates }))}>
                        <div className="bp-toggle-thumb" />
                      </div>
                    </div>
                    <div className="bp-toggle-row">
                      <div className="bp-toggle-left">
                        <h5>Promotions</h5><p>Receive offers and discounts</p>
                      </div>
                      <div className={`bp-toggle-switch ${notifSettings.promotions ? 'on' : ''}`} onClick={() => setNotifSettings(p => ({ ...p, promotions: !p.promotions }))}>
                        <div className="bp-toggle-thumb" />
                      </div>
                    </div>
                    <div className="bp-toggle-row">
                      <div className="bp-toggle-left">
                        <h5>New Arrivals</h5><p>Know when new produce arrives</p>
                      </div>
                      <div className={`bp-toggle-switch ${notifSettings.newArrivals ? 'on' : ''}`} onClick={() => setNotifSettings(p => ({ ...p, newArrivals: !p.newArrivals }))}>
                        <div className="bp-toggle-thumb" />
                      </div>
                    </div>
                  </div>

                  {/* Sec 3: Danger */}
                  <div className="bp-settings-section" style={{ marginBottom: 0 }}>
                    <div className="bp-settings-header"><h4 className="bp-settings-title" style={{ color: 'var(--color-accent)' }}>Danger Zone</h4></div>
                    <div className="bp-danger-zone">
                      <div className="bp-danger-text">
                        <h5>Delete Account</h5>
                        <p>Permanently delete all your data</p>
                      </div>
                      <button className="bp-btn-danger">Delete Account</button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.main>
      </div>
    </div>
  );
}
