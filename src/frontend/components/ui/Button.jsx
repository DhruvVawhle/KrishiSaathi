import React from 'react'
import { motion } from 'framer-motion'

const VARIANTS = {
  primary: {
    background:
      'linear-gradient(135deg, #E27D60, #C96848)',
    color: 'white',
    border: 'none',
    shadow: '0 6px 20px rgba(226,125,96,0.35)',
    hoverShadow:
      '0 10px 28px rgba(226,125,96,0.45)',
  },
  secondary: {
    background:
      'linear-gradient(135deg, #2D4F1E, #3D6B2A)',
    color: 'white',
    border: 'none',
    shadow: '0 6px 20px rgba(45,79,30,0.25)',
    hoverShadow:
      '0 10px 28px rgba(45,79,30,0.35)',
  },
  ghost: {
    background: 'transparent',
    color: '#4A4A4A',
    border: '1.5px solid #EDD9B0',
    shadow: 'none',
    hoverShadow: 'none',
  },
  danger: {
    background: 'transparent',
    color: '#FF5252',
    border: '1.5px solid #FF5252',
    shadow: 'none',
    hoverShadow: 'none',
  },
  success: {
    background:
      'linear-gradient(135deg, #4CAF50, #388E3C)',
    color: 'white',
    border: 'none',
    shadow: '0 6px 20px rgba(76,175,80,0.30)',
    hoverShadow:
      '0 10px 28px rgba(76,175,80,0.40)',
  }
}

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  style = {},
  'aria-label': ariaLabel,
  ...props
}) => {
  const v = VARIANTS[variant] ||
    VARIANTS.primary

  const sizes = {
    sm: { height: 36, padding: '0 16px',
          fontSize: 12 },
    md: { height: 44, padding: '0 24px',
          fontSize: 14 },
    lg: { height: 52, padding: '0 32px',
          fontSize: 16 },
  }
  const s = sizes[size] || sizes.md

  return (
    <motion.button
      type={type}
      onClick={!disabled && !loading
        ? onClick : undefined}
      whileTap={!disabled && !loading
        ? { scale: 0.98 } : {}}
      whileHover={!disabled && !loading
        ? { translateY: -2 } : {}}
      style={{
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: 'DM Sans',
        fontWeight: 700,
        borderRadius: 12,
        border: v.border,
        background: disabled
          ? '#EDD9B0' : v.background,
        color: disabled
          ? '#B0A898' : v.color,
        boxShadow: v.shadow,
        cursor: disabled || loading
          ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.6 : 1,
        transition:
          'box-shadow 200ms, transform 200ms',
        outline: 'none',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      onFocus={e => {
        e.target.style.outline =
          '2px solid #2D4F1E'
        e.target.style.outlineOffset = '3px'
      }}
      onBlur={e => {
        e.target.style.outline = 'none'
      }}
      aria-label={ariaLabel}
      {...props}
    >
      {loading ? (
        <>
          <div style={{
            width: 16, height: 16,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' &&
            icon}
          {children}
          {icon && iconPosition === 'right' &&
            icon}
        </>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </motion.button>
  )
}

export default Button
