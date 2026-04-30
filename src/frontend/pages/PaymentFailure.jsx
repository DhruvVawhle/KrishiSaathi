import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { XCircle, RotateCcw, ShoppingBag, Headphones, AlertTriangle } from 'lucide-react'

const PaymentFailure = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [countdown, setCountdown] = useState(15)

  const errorMessage = location.state?.error || 'Your payment could not be processed.'
  const orderId = location.state?.orderId || null
  const method = location.state?.method || null

  // Auto redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/checkout')
      return
    }
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown, navigate])

  // Prevent back to broken payment state
  useEffect(() => {
    window.history.replaceState(null, '', window.location.href)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5E6CC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'DM Sans, sans-serif'
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
        {/* Animated Error Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '2px solid rgba(220, 38, 38, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}
        >
          <XCircle size={40} color="#DC2626" strokeWidth={2} />
        </motion.div>

        {/* Handwritten subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span style={{
            fontFamily: 'Caveat, cursive',
            fontSize: 18,
            color: '#E27D60',
            fontWeight: 700
          }}>
            Payment Failed 😔
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 700,
            fontSize: 32,
            color: '#2D4F1E',
            margin: '8px 0 12px'
          }}
        >
          Oops! Something Went Wrong
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            color: '#7A7A7A',
            marginBottom: 24,
            lineHeight: 1.6
          }}
        >
          Don't worry — your money has not been deducted.<br/>
          Please try again or choose a different payment method.
        </motion.p>

        {/* Error Details Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            background: 'rgba(220, 38, 38, 0.04)',
            borderRadius: 14,
            border: '1.5px solid rgba(220, 38, 38, 0.15)',
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            textAlign: 'left'
          }}
        >
          <AlertTriangle size={18} color="#DC2626" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              color: '#DC2626',
              marginBottom: 4,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700
            }}>
              Error Details
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#7A7A7A',
              lineHeight: 1.5
            }}>
              {errorMessage}
            </div>
          </div>
        </motion.div>

        {/* Order ID (if available) */}
        {orderId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{
              background: '#F5E6CC',
              borderRadius: 14,
              border: '1.5px solid #EDD9B0',
              padding: '14px 20px',
              marginBottom: 28,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 11,
              color: '#B0A898',
              marginBottom: 4,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 700
            }}>
              Order Reference
            </div>
            <div style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 800,
              fontSize: 18,
              color: '#2D4F1E',
              letterSpacing: '0.04em'
            }}>
              #{orderId.toString().toUpperCase()}
            </div>
            {method && (
              <div style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                color: '#7A7A7A',
                marginTop: 4,
                fontWeight: 500
              }}>
                Method: {method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : method}
              </div>
            )}
          </motion.div>
        )}

        {/* Helpful Tips */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            background: 'rgba(45, 79, 30, 0.04)',
            borderRadius: 14,
            border: '1.5px solid rgba(45, 79, 30, 0.12)',
            padding: '16px 20px',
            marginBottom: 28,
            textAlign: 'left'
          }}
        >
          <div style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            color: '#2D4F1E',
            marginBottom: 10
          }}>
            💡 Quick Tips
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Check your internet connection and try again',
              'Ensure sufficient balance in your account',
              'Try a different payment method (UPI, Card, COD)',
              'Contact your bank if the issue persists'
            ].map((tip, i) => (
              <div key={i} style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                color: '#7A7A7A',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                lineHeight: 1.4
              }}>
                <span style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: '#B0A898',
                  flexShrink: 0
                }} />
                {tip}
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}
        >
          <button
            onClick={() => navigate('/checkout')}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: 'none',
              background: '#2D4F1E',
              fontFamily: 'DM Sans, sans-serif',
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
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(45,79,30,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(45,79,30,0.2)'
            }}
          >
            <RotateCcw size={18} /> Retry Payment
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: '1.5px solid #EDD9B0',
              background: 'white',
              fontFamily: 'DM Sans, sans-serif',
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
            onMouseEnter={e => {
              e.currentTarget.style.background = '#F5E6CC'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <ShoppingBag size={18} /> Marketplace
          </button>
        </motion.div>

        {/* Support Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85 }}
        >
          <button
            onClick={() => navigate('/support')}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 13,
              color: '#E27D60',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,125,96,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Headphones size={15} /> Need Help? Contact Support
          </button>
        </motion.div>

        {/* Auto-redirect notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            color: '#B0A898',
            background: 'rgba(237,217,176,0.2)',
            padding: '8px 12px',
            borderRadius: 8,
            display: 'inline-block',
            marginTop: 8
          }}
        >
          Auto-redirecting to <strong>Checkout</strong> in <span style={{ color: '#E27D60', fontWeight: 800 }}>{countdown}s</span>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default PaymentFailure
