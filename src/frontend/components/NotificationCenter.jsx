import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, X, ShoppingBag, Package, XCircle, CreditCard, Tag, AlertTriangle, Star, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../contexts/UserContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NOTIF_CONFIG = {
  order_placed:    { icon: ShoppingBag,   color: '#2D4F1E' },
  order_delivered: { icon: Package,       color: '#4CAF50' },
  order_cancelled: { icon: XCircle,       color: '#FF5252' },
  payment:         { icon: CreditCard,    color: '#F0A080' },
  promo:           { icon: Tag,           color: '#E27D60' },
  low_stock:       { icon: AlertTriangle, color: '#E27D60' },
  new_product:     { icon: Leaf,          color: '#4A7A35' },
  system:          { icon: Bell,          color: '#7A7A7A' },
  farmer_review:   { icon: Star,          color: '#F5A623' },
  welcome:         { icon: Leaf,          color: '#2D4F1E' },
};

const NotificationCenter = () => {
  const { user } = useUser();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const panelRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 🔥 CRITICAL: Hide if no user
  if (!user?.uid) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = user?.role === 'farmer'
    ? ['All', 'Farm', 'Sales', 'System']
    : ['All', 'Orders', 'Promos', 'System'];

  const filtered = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Orders') return ['order_placed', 'order_delivered', 'order_cancelled'].includes(n.type);
    if (activeTab === 'Promos') return n.type === 'promo';
    if (activeTab === 'Farm') return ['new_product', 'low_stock', 'farmer_review'].includes(n.type);
    if (activeTab === 'Sales') return ['order_placed', 'payment'].includes(n.type);
    if (activeTab === 'System') return ['system', 'welcome'].includes(n.type);
    return true;
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    
    // 🔥 Fix "Invalid Date" issues
    if (isNaN(date.getTime())) return "Just now";
    
    const diff = Date.now() - date.getTime();
    if (diff < 0) return "Just now"; // Future dates
    
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div style={{ position: 'relative' }} ref={panelRef}>
      {/* Bell Icon */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={unreadCount > 0 && !isOpen ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
        style={{
          position: 'relative',
          padding: '10px',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          cursor: 'pointer',
          color: 'white'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#E27D60',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '50%',
            minWidth: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #2D4F1E'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: '350px',
              maxHeight: '480px',
              background: '#FDFAF4',
              borderRadius: '20px',
              border: '1.5px solid #EDD9B0',
              boxShadow: '0 12px 32px rgba(45,79,30,0.15)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #EDD9B0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2D4F1E' }}>Notifications</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      style={{ background: 'none', border: 'none', color: '#2D4F1E', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A7A7A' }}>
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: activeTab === tab ? '#2D4F1E' : 'transparent',
                      color: activeTab === tab ? 'white' : '#7A7A7A',
                      transition: 'all 200ms'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#7A7A7A' }}>
                  <BellOff size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
                </div>
              ) : (
                filtered.map(notif => {
                  const Icon = NOTIF_CONFIG[notif.type]?.icon || Bell;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.actionUrl) navigate(notif.actionUrl);
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        gap: '12px',
                        cursor: 'pointer',
                        background: notif.read ? 'transparent' : 'rgba(45,79,30,0.03)',
                        borderBottom: '1px solid rgba(237, 217, 176, 0.4)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '10px', 
                        background: `${NOTIF_CONFIG[notif.type]?.color || '#7A7A7A'}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Icon size={18} color={NOTIF_CONFIG[notif.type]?.color || '#7A7A7A'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: notif.read ? 500 : 700, fontSize: '13px', color: '#2D4F1E', marginBottom: '2px' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7A7A7A', lineHeight: 1.4 }}>
                          {notif.body}
                        </div>
                        <div style={{ fontSize: '10px', color: '#B0A898', marginTop: '6px' }}>
                          {formatTime(notif.createdAt || notif.time)}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                        style={{ background: 'none', border: 'none', color: '#C0B8B0', cursor: 'pointer', padding: '4px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
