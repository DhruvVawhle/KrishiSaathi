import React from 'react'

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    color: '#2D4F1E',
    bg: 'rgba(45,79,30,0.10)',
    icon: '✓'
  },
  placed: {
    label: 'Order Placed',
    color: '#3B82F6',
    bg: 'rgba(59, 130, 246, 0.10)',
    icon: '🛒'
  },
  processing: {
    label: 'Processing',
    color: '#E27D60',
    bg: 'rgba(226,125,96,0.10)',
    icon: '⟳'
  },
  packed: {
    label: 'Packed',
    color: '#8B5CF6',
    bg: 'rgba(139, 92, 246, 0.10)',
    icon: '📦'
  },
  shipped: {
    label: 'Shipped',
    color: '#F0A080',
    bg: 'rgba(240,160,128,0.10)',
    icon: '🚚'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: '#14B8A6',
    bg: 'rgba(20, 184, 166, 0.10)',
    icon: '🛵'
  },
  delivered: {
    label: 'Delivered',
    color: '#4CAF50',
    bg: 'rgba(76,175,80,0.10)',
    icon: '✓'
  },
  cancelled: {
    label: 'Cancelled',
    color: '#FF5252',
    bg: 'rgba(255,82,82,0.10)',
    icon: '✕'
  },
  published: {
    label: 'Published',
    color: '#4CAF50',
    bg: 'rgba(76,175,80,0.10)',
    icon: '●'
  },
  draft: {
    label: 'Draft',
    color: '#7A7A7A',
    bg: 'rgba(122,122,122,0.10)',
    icon: '○'
  }
}

const StatusBadge = ({
  status,
  size = 'md'
}) => {
  const config = STATUS_CONFIG[
    status?.toLowerCase()
  ] || STATUS_CONFIG.draft

  const sizes = {
    sm: { fontSize: 10, padding: '2px 8px' },
    md: { fontSize: 12, padding: '4px 12px' },
    lg: { fontSize: 14, padding: '6px 16px' },
  }
  const s = sizes[size] || sizes.md

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: s.padding,
      borderRadius: 999,
      background: config.bg,
      fontFamily: 'DM Sans',
      fontWeight: 700,
      fontSize: s.fontSize,
      color: config.color,
      whiteSpace: 'nowrap'
    }}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}

export default StatusBadge
