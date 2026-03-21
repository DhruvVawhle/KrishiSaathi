import React, { useEffect } from 'react'
import { motion, AnimatePresence }
  from 'framer-motion'
import {
  CheckCircle, XCircle,
  AlertTriangle, Info, X
} from 'lucide-react'

const TYPES = {
  success: {
    icon: CheckCircle,
    color: '#4CAF50',
    bg: '#F0FFF4',
    border: 'rgba(76,175,80,0.25)'
  },
  error: {
    icon: XCircle,
    color: '#FF5252',
    bg: '#FFF5F5',
    border: 'rgba(255,82,82,0.25)'
  },
  warning: {
    icon: AlertTriangle,
    color: '#E27D60',
    bg: '#FFFAF0',
    border: 'rgba(226,125,96,0.25)'
  },
  info: {
    icon: Info,
    color: '#2D4F1E',
    bg: '#F0F5EE',
    border: 'rgba(45,79,30,0.25)'
  }
}

const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  visible
}) => {
  const config = TYPES[type] || TYPES.info
  const Icon = config.icon

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [visible, duration, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20,
                     scale: 0.95 }}
          animate={{ opacity: 1, y: 0,
                     scale: 1 }}
          exit={{ opacity: 0, y: 20,
                  scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: config.bg,
            border: `1px solid ${config.border}`,
            borderRadius: 12,
            boxShadow:
              '0 8px 24px rgba(0,0,0,0.12)',
            fontFamily: 'DM Sans',
            fontSize: 14,
            color: '#4A4A4A',
            maxWidth: 360,
            minWidth: 280
          }}
        >
          <Icon size={18} color={config.color}
            style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            {message}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#B0A898',
              padding: 0,
              display: 'flex'
            }}
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast
