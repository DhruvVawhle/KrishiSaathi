import React from 'react'
import { motion } from 'framer-motion'
import Button from './Button'

const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.97 }}
    animate={{ opacity: 1, scale: 1 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px',
      textAlign: 'center'
    }}
  >
    {/* Icon illustration */}
    <div style={{
      width: 88,
      height: 88,
      borderRadius: '50%',
      background: '#EDD9B0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      position: 'relative'
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#F5E6CC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {emoji && (
          <span style={{ fontSize: 28 }}>
            {emoji}
          </span>
        )}
        {Icon && (
          (typeof Icon === 'string' || React.isValidElement(Icon)) ? Icon : <Icon size={28} color="#2D4F1E" />
        )}
      </div>
    </div>

    <h3 style={{
      fontFamily: 'Playfair Display',
      fontWeight: 700,
      fontSize: 22,
      color: '#2D4F1E',
      margin: '0 0 8px'
    }}>
      {title}
    </h3>

    {subtitle && (
      <p style={{
        fontFamily: 'DM Sans',
        fontSize: 14,
        color: '#7A7A7A',
        maxWidth: 300,
        lineHeight: 1.6,
        margin: '0 0 28px'
      }}>
        {subtitle}
      </p>
    )}

    <div style={{
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      justifyContent: 'center'
    }}>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
      {secondaryLabel && onSecondary && (
        <Button
          variant="ghost"
          onClick={onSecondary}
        >
          {secondaryLabel}
        </Button>
      )}
    </div>
  </motion.div>
)

export default EmptyState
