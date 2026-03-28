import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Home, Package, Truck, Clock, FileText } from 'lucide-react'
import { generateInvoice } from '../utils/invoiceGenerator'

const OrderTimeline = ({ status = 'confirmed' }) => {
  const steps = [
    { id: 'placed', label: 'Order Placed', icon: Clock, active: true },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle, active: ['confirmed', 'shipped', 'delivered'].includes(status) },
    { id: 'shipped', label: 'Shipped', icon: Truck, active: ['shipped', 'delivered'].includes(status) },
    { id: 'delivered', label: 'Delivered', icon: Package, active: status === 'delivered' }
  ]

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '30px 0', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '20px', left: '10%', right: '10%', height: '2px', background: '#EDD9B0', zIndex: 0 }} />
      {steps.map((step, idx) => (
        <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1, width: '25%' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: step.active ? '#2D4F1E' : '#FDFAF4',
            border: `2px solid ${step.active ? '#2D4F1E' : '#EDD9B0'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}>
            <step.icon size={20} color={step.active ? 'white' : '#B0A898'} />
          </div>
          <span style={{ fontSize: 11, fontWeight: step.active ? 700 : 500, color: step.active ? '#2D4F1E' : '#B0A898' }}>{step.label}</span>
        </div>
      ))}
    </div>
  )
}

const ThankYou = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams()
  const [countdown, setCountdown] = useState(5)

  // Get orderId from state OR params
  const orderId = location.state?.orderId
    || location.state?.id
    || id
    || 'ORD' + Date.now()

  // Prevent back to checkout
  useEffect(() => {
    window.history.replaceState(null, '', window.location.href)
  }, [])

  // Auto redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/orderhistory')
      return
    }
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown, navigate])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5E6CC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'DM Sans'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          background: '#FDFAF4',
          borderRadius: 24,
          border: '1.5px solid #EDD9B0',
          boxShadow: '0 16px 48px rgba(45,79,30,0.14)',
          padding: '48px 40px',
          textAlign: 'center',
          maxWidth: 520,
          width: '100%'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(76,175,80,0.12)',
            border: '2px solid rgba(76,175,80,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}
        >
          <CheckCircle size={40} color="#4CAF50" strokeWidth={2} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span style={{ fontFamily: 'Caveat', fontSize: 18, color: '#E27D60', fontWeight: 700 }}>
            Order Confirmed! 🎉
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: 'Playfair Display',
            fontWeight: 700,
            fontSize: 32,
            color: '#2D4F1E',
            margin: '8px 0 12px'
          }}
        >
          Thank You for Shopping! 🌾
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: 'DM Sans',
            fontSize: 14,
            color: '#7A7A7A',
            marginBottom: 24,
            lineHeight: 1.6
          }}
        >
          Your order has been received and is being processed.<br/>
          Check <strong style={{color: '#2D4F1E'}}>My Orders</strong> for live tracking updates.
        </motion.p>

        <OrderTimeline status="confirmed" />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: '#F5E6CC',
            borderRadius: 14,
            border: '1.5px solid #EDD9B0',
            padding: '16px 20px',
            marginBottom: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{
            fontFamily: 'DM Sans',
            fontSize: 11,
            color: '#B0A898',
            marginBottom: 4,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700
          }}>
            Order Identification
          </div>
          <div style={{
            fontFamily: 'DM Sans',
            fontWeight: 800,
            fontSize: 22,
            color: '#2D4F1E',
            letterSpacing: '0.04em'
          }}>
            #{orderId.toString().toUpperCase()}
          </div>
          <div style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#7A7A7A', marginTop: 6, fontWeight: 500 }}>
            Estimated delivery within 2–4 business days
          </div>

          {location.state?.orderData && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => generateInvoice(location.state.orderData)}
              style={{
                marginTop: 18,
                background: '#2D4F1E',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontFamily: 'DM Sans',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(45,79,30,0.15)'
              }}
            >
              <FileText size={16} /> Download Real Invoice
            </motion.button>
          )}
        </motion.div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: '1.5px solid #EDD9B0',
              background: 'white',
              fontFamily: 'DM Sans',
              fontWeight: 600,
              fontSize: 14,
              color: '#2D4F1E',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
          >
            <Home size={18} /> Marketplace
          </button>
          <button
            onClick={() => navigate('/orderhistory')}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: 'none',
              background: '#2D4F1E',
              fontFamily: 'DM Sans',
              fontWeight: 700,
              fontSize: 14,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(45,79,30,0.2)',
              transition: 'all 0.2s'
            }}
          >
            <Package size={18} /> My Orders
          </button>
        </div>

        <div style={{ 
          fontFamily: 'DM Sans', 
          fontSize: 12, 
          color: '#B0A898',
          background: 'rgba(237,217,176,0.2)',
          padding: '8px 12px',
          borderRadius: 8,
          display: 'inline-block'
        }}>
          Auto-redirecting to <strong>My Orders</strong> in <span style={{ color: '#E27D60', fontWeight: 800 }}>{countdown}s</span>
        </div>
      </motion.div>
    </div>
  )
}

export default ThankYou

