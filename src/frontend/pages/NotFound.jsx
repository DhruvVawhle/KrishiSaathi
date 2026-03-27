import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [countdown, setCountdown] = useState(10)

  // Auto redirect after 10 seconds
  useEffect(() => {
    if (countdown <= 0) {
      navigate('/', { replace: true })
      return
    }
    const timer = setTimeout(
      () => setCountdown(p => p - 1),
      1000
    )
    return () => clearTimeout(timer)
  }, [countdown, navigate])

  // Detect user role for smart redirect
  const getHomeRoute = () => {
    try {
      const user = JSON.parse(
        localStorage.getItem('ks_user') || 'null'
      )
      if (user?.role === 'farmer') {
        return '/farmer-dashboard'
      }
      if (user?.role === 'buyer') {
        return '/marketplace'
      }
    } catch {}
    return '/'
  }

  const homeRoute = getHomeRoute()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5E6CC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: 'DM Sans',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.04,
        backgroundImage: 'radial-gradient(circle,#2D4F1E 1px,transparent 1px)',
        backgroundSize: '32px 32px',
        pointerEvents: 'none'
      }} />

      {/* Glow top */}
      <div style={{
        position: 'absolute',
        top: -120,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle,rgba(45,79,30,0.12) 0%,transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        textAlign: 'center',
        maxWidth: 560,
        width: '100%'
      }}>

        {/* 404 Illustration */}
        <div style={{ marginBottom: 32 }}>
          <svg
            viewBox="0 0 560 200"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              display: 'block'
            }}
          >
            {/* Left 4 */}
            <text
              x="30"
              y="175"
              fontFamily="Playfair Display"
              fontWeight="700"
              fontSize="200"
              fill="none"
              stroke="#EDD9B0"
              strokeWidth="3"
              opacity="0.8"
            >
              4
            </text>
            <text
              x="30"
              y="175"
              fontFamily="Playfair Display"
              fontWeight="700"
              fontSize="200"
              fill="#2D4F1E"
              opacity="0.08"
            >
              4
            </text>

            {/* 0 with wheat illustration */}
            <text
              x="160"
              y="175"
              fontFamily="Playfair Display"
              fontWeight="700"
              fontSize="200"
              fill="none"
              stroke="#EDD9B0"
              strokeWidth="3"
              opacity="0.8"
            >
              0
            </text>
            <text
              x="160"
              y="175"
              fontFamily="Playfair Display"
              fontWeight="700"
              fontSize="200"
              fill="#2D4F1E"
              opacity="0.08"
            >
              0
            </text>

            {/* Wheat stalk inside 0 */}
            <g transform="translate(262,20)">
              {/* Main stalk */}
              <line
                x1="0" y1="160"
                x2="0" y2="40"
                stroke="#2D4F1E"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Wheat grains */}
              <ellipse cx="0" cy="30" rx="10" ry="18" fill="#2D4F1E" opacity="0.9" />
              <ellipse cx="-12" cy="55" rx="8" ry="14" fill="#2D4F1E" opacity="0.75" transform="rotate(-25 -12 55)" />
              <ellipse cx="12" cy="55" rx="8" ry="14" fill="#2D4F1E" opacity="0.75" transform="rotate(25 12 55)" />
              <ellipse cx="-10" cy="78" rx="7" ry="12" fill="#2D4F1E" opacity="0.60" transform="rotate(-20 -10 78)" />
              <ellipse cx="10" cy="78" rx="7" ry="12" fill="#2D4F1E" opacity="0.60" transform="rotate(20 10 78)" />
              {/* Leaf */}
              <path d="M0 110 Q-20 95 -18 80" stroke="#E27D60" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M0 120 Q22 105 20 90" stroke="#E27D60" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>

            {/* Right 4 */}
            <text x="335" y="175" fontFamily="Playfair Display" fontWeight="700" fontSize="200" fill="none" stroke="#EDD9B0" strokeWidth="3" opacity="0.8">4</text>
            <text x="335" y="175" fontFamily="Playfair Display" fontWeight="700" fontSize="200" fill="#2D4F1E" opacity="0.08">4</text>

            {/* Small decorative dots */}
            <circle cx="80" cy="20" r="4" fill="#E27D60" opacity="0.5" />
            <circle cx="120" cy="50" r="3" fill="#EDD9B0" opacity="0.8" />
            <circle cx="440" cy="30" r="4" fill="#E27D60" opacity="0.5" />
            <circle cx="480" cy="60" r="3" fill="#EDD9B0" opacity="0.8" />
            <circle cx="60" cy="140" r="3" fill="#2D4F1E" opacity="0.3" />
            <circle cx="500" cy="150" r="3" fill="#2D4F1E" opacity="0.3" />
          </svg>
        </div>

        {/* Heading */}
        <h1 style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 'clamp(26px,4vw,36px)', color: '#2D4F1E', margin: '0 0 12px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Page not found
        </h1>

        {/* Subtext */}
        <p style={{ fontFamily: 'DM Sans', fontSize: 16, color: '#7A7A7A', margin: '0 0 8px', lineHeight: 1.7, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Attempted path */}
        {location.pathname !== '/' && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,82,82,0.08)', border: '1px solid rgba(255,82,82,0.20)', fontFamily: 'DM Sans', fontSize: 12, color: '#FF5252', marginBottom: 28, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span>❌</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{location.pathname}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: location.pathname === '/' ? 28 : 0 }}>
          {/* Primary — Go Home */}
          <button
            onClick={() => navigate(homeRoute, { replace: true })}
            style={{ padding: '12px 24px', background: 'linear-gradient(135deg,#2D4F1E,#3D6B2A)', border: 'none', borderRadius: 12, color: 'white', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(45,79,30,0.30)', transition: 'all 200ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(45,79,30,0.40)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(45,79,30,0.30)' }}
          >
            🏠 Take me home
          </button>

          {/* Secondary — Go Back */}
          <button
            onClick={() => navigate(-1)}
            style={{ padding: '12px 24px', background: 'transparent', border: '1.5px solid #EDD9B0', borderRadius: 12, color: '#4A4A4A', fontFamily: 'DM Sans', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 200ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D4F1E'; e.currentTarget.style.color = '#2D4F1E'; e.currentTarget.style.background = 'rgba(45,79,30,0.04)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDD9B0'; e.currentTarget.style.color = '#4A4A4A'; e.currentTarget.style.background = 'transparent' }}
          >
            ← Go back
          </button>
        </div>

        {/* Auto redirect notice */}
        <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#B0A898', marginTop: 24, marginBottom: 0 }}>
          Redirecting to home in{' '}
          <span style={{ fontWeight: 700, color: '#E27D60' }}>
            {countdown}s
          </span>
        </p>

        {/* Quick links */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid #EDD9B0' }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#B0A898', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Popular pages
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '🏠 Home', path: '/' },
              { label: '🛒 Marketplace', path: '/marketplace' },
              { label: '🌾 Farmer Dashboard', path: '/farmer-dashboard' },
              { label: '📦 My Orders', path: '/orderhistory' },
              { label: '🔑 Login', path: '/login' }
            ].map(link => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{ padding: '6px 14px', borderRadius: 999, border: '1.5px solid #EDD9B0', background: '#FDFAF4', fontFamily: 'DM Sans', fontSize: 12, fontWeight: 500, color: '#4A4A4A', cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2D4F1E'; e.currentTarget.style.color = '#2D4F1E'; e.currentTarget.style.background = 'rgba(45,79,30,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDD9B0'; e.currentTarget.style.color = '#4A4A4A'; e.currentTarget.style.background = '#FDFAF4' }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand footer */}
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#E27D60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            🌾
          </div>
          <span style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 16, color: '#2D4F1E' }}>
            KrishiSaathi
          </span>
        </div>

      </div>
    </div>
  )
}

export default NotFound
