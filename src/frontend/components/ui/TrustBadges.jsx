import React from 'react'

const badges = [
  { icon: '🔒', text: 'Secure Payment' },
  { icon: '🚚', text: 'Fast Delivery' },
  { icon: '✅', text: 'Verified Farmers' },
  { icon: '↩️', text: 'Easy Returns' },
]

const TrustBadges = ({
  items = badges,
  style = {}
}) => (
  <div style={{
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
    ...style
  }}>
    {items.map(badge => (
      <div key={badge.text} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: 'rgba(45,79,30,0.06)',
        borderRadius: 999,
        border: '1px solid rgba(45,79,30,0.12)'
      }}>
        <span style={{ fontSize: 14 }}>
          {badge.icon}
        </span>
        <span style={{
          fontFamily: 'DM Sans',
          fontSize: 12,
          fontWeight: 600,
          color: '#2D4F1E'
        }}>
          {badge.text}
        </span>
      </div>
    ))}
  </div>
)

export default TrustBadges
