import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, ShoppingBag, Clock,
  CheckCircle, XCircle, ChevronRight,
  ArrowLeft, RefreshCw, AlertCircle, Truck
} from 'lucide-react'
import EmptyState from '@/frontend/components/ui/EmptyState'
import StatusBadge from '@/frontend/components/ui/StatusBadge'
import Skeleton from '@/frontend/components/ui/Skeleton'
import Button from '@/frontend/components/ui/Button'
import Card from '@/frontend/components/ui/Card'

// Backend URL — proxied via Vite to userserver on port 5002
const API_BASE = "";

const OrderTimeline = ({ status = 'confirmed' }) => {
  const s = status?.toLowerCase();
  const steps = [
    { id: 'placed', label: 'Placed', icon: Clock, active: true },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, active: ['confirmed', 'shipped', 'delivered'].includes(s) },
    { id: 'shipped', label: 'Shipped', icon: Truck, active: ['shipped', 'delivered'].includes(s) },
    { id: 'delivered', label: 'Delivered', icon: Package, active: s === 'delivered' }
  ]

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '0.5px dashed #EDD9B0', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '28px', left: '12%', right: '12%', height: '1.5px', background: '#EDD9B0', zIndex: 0 }} />
      {steps.map((step) => (
        <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, zIndex: 1, width: '25%' }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: step.active ? '#2D4F1E' : '#FDFAF4',
            border: `1.5px solid ${step.active ? '#2D4F1E' : '#EDD9B0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <step.icon size={12} color={step.active ? 'white' : '#B0A898'} />
          </div>
          <span style={{ fontSize: 9, fontWeight: step.active ? 700 : 500, color: step.active ? '#2D4F1E' : '#B0A898' }}>{step.label}</span>
        </div>
      ))}
    </div>
  )
}

const OrderHistory = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('All')

  // Safe user retrieval
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('ks_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Failed to parse ks_user", e);
      return null;
    }
  }, []);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      const timer = setTimeout(() => navigate('/login'), 2000);
      return () => clearTimeout(timer);
    }
    fetchOrders()
  }, [user, navigate])

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true)
    setError(null)
    try {
      const uid = user.uid || user.id;
      if (!uid) throw new Error("User ID not found in session");

      const token = localStorage.getItem('idToken') || localStorage.getItem('ks_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE}/api/orders/user/${uid}`,
        { headers }
      )
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }
      
      const data = await res.json()
      // Normalize data structure
      const fetched = Array.isArray(data.orders) ? data.orders : (Array.isArray(data) ? data : []);
      // Sort newest first
      const sorted = fetched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted)
    } catch (err) {
      console.error('Orders fetch error:', err)
      setError(err.message || 'Could not load orders.')
      // Fallback to mock data so page is not empty during dev/offline
      setOrders(MOCK_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  // STATUS CONFIG
  const STATUS = {
    confirmed: { label: 'Confirmed', color: '#2D4F1E', bg: 'rgba(45,79,30,0.10)', icon: CheckCircle },
    processing: { label: 'Processing', color: '#E27D60', bg: 'rgba(226,125,96,0.10)', icon: Clock },
    delivered: { label: 'Delivered', color: '#4CAF50', bg: 'rgba(76,175,80,0.10)', icon: Package },
    cancelled: { label: 'Cancelled', color: '#FF5252', bg: 'rgba(255,82,82,0.10)', icon: XCircle },
    received: { label: 'Received', color: '#2D4F1E', bg: 'rgba(45,79,30,0.10)', icon: CheckCircle },
    default: { label: 'Status Unknown', color: '#7A7A7A', bg: 'rgba(122,122,122,0.10)', icon: Clock }
  }

  const FILTERS = ['All', 'Confirmed', 'Processing', 'Delivered', 'Cancelled']

  const filtered = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter(o => {
      if (filter === 'All') return true;
      const oStatus = (o.status || '').toLowerCase();
      const fStatus = filter.toLowerCase();
      // Special mapping for received -> confirmed
      if (fStatus === 'confirmed' && oStatus === 'received') return true;
      return oStatus === fStatus;
    });
  }, [orders, filter]);

  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return 'Date unknown';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Date unknown';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return 'Date unknown';
    }
  };

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#F5E6CC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #EDD9B0', borderTopColor: '#2D4F1E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontFamily: 'DM Sans', color: '#4A4A4A' }}>Redirecting to login...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5E6CC', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {[1,2,3].map(i => (
          <Skeleton.Card key={i} rows={3} className="mb-4" />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5E6CC', padding: '40px 20px', fontFamily: 'DM Sans' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* PAGE HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, border: '1.5px solid #EDD9B0' }}
            icon={<ArrowLeft size={18} />}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: 'Caveat', fontSize: 20, color: '#E27D60' }}>
              Your purchases
            </span>
            <h1 style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 32, color: '#2D4F1E', margin: '2px 0 0' }}>
              Order History
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            style={{ width: 40, height: 40, borderRadius: '50%', padding: 0, border: '1.5px solid #EDD9B0' }}
            icon={<RefreshCw size={16} />}
            title="Refresh Orders"
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => {
            const isActive = filter === f;
            return (
              <Button
                key={f}
                size="sm"
                variant={isActive ? "primary" : "ghost"}
                onClick={() => setFilter(f)}
                style={{
                  borderRadius: 999,
                  border: isActive ? 'none' : '1.5px solid #EDD9B0',
                  padding: '8px 18px',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {f}
                {f !== 'All' && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>
                    ({orders.filter(o => {
                      const status = (o.status || '').toLowerCase();
                      const filterLow = f.toLowerCase();
                      if (filterLow === 'confirmed' && status === 'received') return true;
                      return status === filterLow;
                    }).length})
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* ERROR STATE */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.2)', borderRadius: 12, fontSize: 13, color: '#FF5252', marginBottom: 20 }}>
            <AlertCircle size={16} />
            <span>{error} Showing cached/local data.</span>
          </div>
        )}

        {filtered.length === 0 && (
          <EmptyState
            icon={<ShoppingBag size={32} />}
            title="No orders found"
            subtitle={filter === 'All' ? "You haven't placed any orders yet. Start exploring our fresh harvest!" : `We couldn't find any ${filter.toLowerCase()} orders.`}
            action={{ label: "Go to Marketplace", onClick: () => navigate('/marketplace') }}
          />
        )}

        {/* ORDER CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 60 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((order, i) => {
              return (
                <motion.div
                  key={order._id || order.orderId || `order-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{
                    background: '#FDFAF4',
                    borderRadius: 20,
                    border: '1.5px solid #EDD9B0',
                    padding: 24,
                    cursor: 'pointer',
                    transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 4px 12px rgba(45,79,30,0.05)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(45,79,30,0.12)';
                    e.currentTarget.style.borderColor = '#2D4F1E';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(45,79,30,0.05)';
                    e.currentTarget.style.borderColor = '#EDD9B0';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#2D4F1E', letterSpacing: '-0.01em' }}>
                        {order.orderId || `#${(order._id || '').slice(-6).toUpperCase()}`}
                      </div>
                      <div style={{ fontSize: 13, color: '#7A7A7A', marginTop: 4 }}>
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <StatusBadge
                      status={order.status?.toLowerCase()}
                    />
                  </div>

                  {/* Items Summary */}
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                    {(order.items || []).slice(0, 3).map((item, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px 6px 6px', background: '#F5E6CC', borderRadius: 999, border: '1px solid #EDD9B0' }}>
                        {item.image ? (
                          <img src={item.image} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EDD9B0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <Package size={14} color="#2D4F1E" />
                          </div>
                        )}
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#4A4A4A' }}>
                          {item.name} { (item.qty || item.quantity) > 1 ? `×${item.qty || item.quantity}` : '' }
                        </span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 12px', background: '#F5E6CC', borderRadius: 999, border: '1px solid #EDD9B0', fontSize: 12, color: '#7A7A7A', fontWeight: 600 }}>
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '0.5px solid #EDD9B0' }}>
                    <div style={{ fontSize: 13, color: '#7A7A7A', display: 'flex', alignItems: 'center', gap: 6 }}>
                      { (order.paymentMethod || order.payment_method || '').toLowerCase() === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment' }
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#7A7A7A', marginBottom: 2 }}>Total Amount</div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: '#2D4F1E' }}>₹{order.total || order.totalAmount || 0}</div>
                      </div>
                      <ChevronRight size={20} color="#EDD9B0" />
                    </div>
                  </div>

                  <OrderTimeline status={order.status} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

const MOCK_ORDERS = [
  { _id: 'mock001', orderId: 'ORD467415', status: 'confirmed', createdAt: new Date().toISOString(), paymentMethod: 'cod', total: 94.50, items: [{ name: 'Banana', qty: 1, price: 50, image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?w=100' }] },
  { _id: 'mock002', orderId: 'ORD467300', status: 'delivered', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), paymentMethod: 'upi', total: 320, items: [{ name: 'Tomatoes', qty: 2, price: 60, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=100' }, { name: 'Spinach', qty: 1, price: 20, image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100' }] }
]

export default OrderHistory

