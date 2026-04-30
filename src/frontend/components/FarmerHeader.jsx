// ✅ src/components/FarmerHeader.jsx (Enhanced v2)
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@/frontend/contexts/UserContext";

const getFirstName = (user) => {
  try {
    const name =
      user?.name
      || user?.displayName
      || ''
    if (name &&
        name !== 'User' &&
        name !== 'Farmer') {
      const first =
        name.trim().split(' ')[0]
      if (first.length > 1) return first
    }
    const stored = JSON.parse(
      localStorage.getItem('ks_user')
      || 'null'
    )
    if (stored?.name &&
        stored.name !== 'User') {
      return stored.name
        .trim().split(' ')[0]
    }
    if (stored?.email) {
      const prefix =
        stored.email.split('@')[0]
      return prefix.charAt(0)
        .toUpperCase()
        + prefix.slice(1)
    }
  } catch {}
  return null
}

const FARMER_NAV = [
  {
    label: 'Overview',
    section: 'overview',
    icon: '📊',
    path: '/farmer-dashboard'
  },
  {
    label: 'Products',
    section: 'products',
    icon: '🌿',
    path: '/farmer-dashboard'
  },
  {
    label: 'Mandi',
    section: 'mandi',
    icon: '📈',
    path: '/farmer-dashboard'
  },
  {
    label: 'Analytics',
    section: 'analytics',
    icon: '📉',
    path: '/farmer-dashboard'
  },
  {
    label: 'Marketplace',
    section: null,
    icon: '🛒',
    path: '/marketplace'
  }
]

const FarmerHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogout: contextLogout } = useUser() || {};
  const [showDropdown, setShowDropdown] = useState(false);

  const firstName = getFirstName(user)

  const handleLogout = () => {
    if (contextLogout) {
      contextLogout();
    } else {
      ["userRole", "isLoggedIn", "userEmail", "cart", "ks_user"].forEach((k) =>
        localStorage.removeItem(k)
      );
      window.dispatchEvent(new CustomEvent("cart-cleared"));
    }
    navigate("/login");
  };

  return (
    <header style={{
      background:
        'linear-gradient(135deg,' +
        '#1A2E12 0%,' +
        '#2D4F1E 60%,' +
        '#1A2E12 100%)',
      borderBottom:
        '1.5px solid rgba(237,217,176,0.20)',
      position: 'sticky',
      top: 0,
      zIndex: 999,
      boxShadow:
        '0 4px 20px rgba(0,0,0,0.30)'
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        gap: 0
      }}>

        {/* ── LOGO ───────────────── */}
        <div
          onClick={() =>
            navigate('/farmer-dashboard')
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            flexShrink: 0,
            marginRight: 32,
            textDecoration: 'none'
          }}
        >
          {/* Logo mark */}
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background:
              'linear-gradient(135deg,' +
              '#E27D60,#C96848)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow:
              '0 2px 8px rgba(226,125,96,0.40)',
            flexShrink: 0
          }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 2C12 2 8 6 8 10C8 12.2 9.8 14 12 14C14.2 14 16 12.2 16 10C16 6 12 2 12 2Z"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M12 14V22"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M9 17L12 14L15 17"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M7 12L12 14L17 12"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.7"
                fill="none"
              />
            </svg>
          </div>

          {/* Logo text */}
          <div>
            <div style={{
              fontFamily:
                'Playfair Display',
              fontWeight: 700,
              fontSize: 19,
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}>
              KrishiSaathi
            </div>
            <div style={{
              fontFamily: 'DM Sans',
              fontSize: 9,
              color:
                'rgba(237,217,176,0.70)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 600
            }}>
              Farmer Portal
            </div>
          </div>
        </div>

        {/* ── NAV ITEMS ──────────── */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flex: 1
        }}>
          {FARMER_NAV.map(item => {
            const active =
              location.pathname ===
              item.path

            return (
              <button
                key={item.label}
                onClick={() => {
                  if (item.section) {
                    navigate(item.path)
                    // Dispatch section event
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent(
                          'farmer-nav',
                          {
                            detail:
                              item.section
                          }
                        )
                      )
                    }, 100)
                  } else {
                    navigate(item.path)
                  }
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: active
                    ? 'rgba(237,217,176,0.18)'
                    : 'transparent',
                  color: active
                    ? '#EDD9B0'
                    : 'rgba(255,255,255,0.65)',
                  fontFamily: 'DM Sans',
                  fontWeight: active
                    ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  transition: 'all 150ms',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget
                      .style.color = 'white'
                    e.currentTarget
                      .style.background =
                      'rgba(255,255,255,0.10)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget
                      .style.color =
                      'rgba(255,255,255,0.65)'
                    e.currentTarget
                      .style.background =
                      'transparent'
                  }
                }}
              >
                <span
                  style={{ fontSize: 13 }}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* ── RIGHT ACTIONS ───────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0
        }}>

          {/* Add Product Button */}
          <button
            onClick={() => {
              navigate('/farmer-dashboard')
              setTimeout(() => {
                window.dispatchEvent(
                  new CustomEvent(
                    'farmer-nav',
                    { detail: 'add-product' }
                  )
                )
              }, 100)
            }}
            style={{
              padding: '8px 18px',
              background:
                'linear-gradient(' +
                '135deg,#E27D60,#C96848)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontFamily: 'DM Sans',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow:
                '0 2px 10px rgba(226,125,96,0.40)',
              transition: 'all 150ms',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              e.currentTarget.style
                .transform =
                'translateY(-1px)'
              e.currentTarget.style
                .boxShadow =
                '0 4px 14px rgba(226,125,96,0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style
                .transform = 'none'
              e.currentTarget.style
                .boxShadow =
                '0 2px 10px rgba(226,125,96,0.40)'
            }}
          >
            <span style={{ fontSize: 14 }}>
              +
            </span>
            Add Product
          </button>

          {/* User dropdown button */}
          <div style={{
            position: 'relative'
          }}>
            <button
              onClick={() =>
                setShowDropdown(p => !p)
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 12px',
                background:
                  'rgba(255,255,255,0.10)',
                border:
                  '1px solid rgba(237,217,176,0.25)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 150ms'
              }}
              onMouseEnter={e => {
                e.currentTarget.style
                  .background =
                  'rgba(255,255,255,0.15)'
                e.currentTarget.style
                  .borderColor =
                  'rgba(237,217,176,0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style
                  .background =
                  'rgba(255,255,255,0.10)'
                e.currentTarget.style
                  .borderColor =
                  'rgba(237,217,176,0.25)'
              }}
            >
              {/* Avatar circle */}
              <div style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg,' +
                  '#2D4F1E,#4A7C30)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily:
                  'Playfair Display',
                fontWeight: 700,
                fontSize: 13,
                color: 'white',
                border:
                  '2px solid rgba(237,217,176,0.50)',
                flexShrink: 0,
                position: 'relative'
              }}>
                {(firstName || 'F')
                  .charAt(0)
                  .toUpperCase()}

                {/* Online indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#4CAF50',
                  border: '1.5px solid white'
                }} />
              </div>

              {/* Name display */}
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 12,
                  color: 'white',
                  lineHeight: 1.2,
                  maxWidth: 110,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  🌾 {firstName || 'Farmer'}
                </div>
                <div style={{
                  fontFamily: 'DM Sans',
                  fontSize: 9,
                  color:
                    'rgba(237,217,176,0.65)',
                  letterSpacing: '0.04em'
                }}>
                  Verified Farmer
                </div>
              </div>

              {/* Chevron */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  opacity: 0.6,
                  transform: showDropdown
                    ? 'rotate(180deg)'
                    : 'none',
                  transition:
                    'transform 200ms',
                  flexShrink: 0
                }}
              >
                <path
                  d="M2 4L6 8L10 4"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Dropdown panel */}
            {showDropdown && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99
                  }}
                  onClick={() =>
                    setShowDropdown(false)
                  }
                />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 230,
                  background: '#FDFAF4',
                  borderRadius: 14,
                  border:
                    '1.5px solid #EDD9B0',
                  boxShadow:
                    '0 12px 40px rgba(45,79,30,0.22)',
                  overflow: 'hidden',
                  zIndex: 100
                }}>

                  {/* Profile info */}
                  <div style={{
                    padding: '14px 16px',
                    background:
                      'linear-gradient(135deg,' +
                      '#2D4F1E,#3D6B2A)',
                    borderBottom:
                      '1px solid #EDD9B0'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background:
                          'rgba(255,255,255,0.20)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'center',
                        fontFamily:
                          'Playfair Display',
                        fontWeight: 700,
                        fontSize: 16,
                        color: 'white',
                        border:
                          '2px solid rgba(237,217,176,0.40)'
                      }}>
                        {(firstName || 'F')
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div style={{
                          fontFamily:
                            'DM Sans',
                          fontWeight: 700,
                          fontSize: 13,
                          color: 'white'
                        }}>
                          🌾 {
                            user?.name
                            || firstName
                            || 'Farmer'
                          }
                        </div>
                        <div style={{
                          fontFamily:
                            'DM Sans',
                          fontSize: 10,
                          color:
                            'rgba(255,255,255,0.60)',
                          marginTop: 1
                        }}>
                          {user?.email || ''}
                        </div>
                      </div>
                    </div>

                    {/* Verified badge */}
                    <div style={{
                      display:
                        'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 10,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background:
                        'rgba(76,175,80,0.25)',
                      border:
                        '1px solid rgba(76,175,80,0.40)',
                      fontFamily: 'DM Sans',
                      fontWeight: 700,
                      fontSize: 10,
                      color: '#A5D6A7'
                    }}>
                      ✅ Verified Farmer
                    </div>
                  </div>

                  {/* Menu items */}
                  <div style={{
                    padding: '6px 0'
                  }}>
                    {[
                      {
                        icon: '👤',
                        label:
                          'Profile Settings',
                        section: 'profile'
                      },
                      {
                        icon: '🌿',
                        label: 'My Products',
                        section: 'products'
                      },
                      {
                        icon: '💰',
                        label:
                          'Sales History',
                        section:
                          'analytics'
                      },
                      {
                        icon: '📈',
                        label:
                          'Mandi Rates',
                        section: 'mandi'
                      },
                      {
                        icon: '🏪',
                        label:
                          'View Marketplace',
                        path: '/marketplace'
                      }
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setShowDropdown(
                            false
                          )
                          if (item.path) {
                            navigate(
                              item.path
                            )
                          } else {
                            navigate(
                              '/farmer-dashboard'
                            )
                            setTimeout(
                              () => {
                                window
                                  .dispatchEvent(
                                    new CustomEvent(
                                      'farmer-nav',
                                      {
                                        detail:
                                          item.section
                                      }
                                    )
                                  )
                              }, 100
                            )
                          }
                        }}
                        style={{
                          width: '100%',
                          padding:
                            '10px 16px',
                          background: 'none',
                          border: 'none',
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: 10,
                          cursor: 'pointer',
                          fontFamily:
                            'DM Sans',
                          fontWeight: 500,
                          fontSize: 13,
                          color: '#4A4A4A',
                          textAlign: 'left',
                          transition:
                            'all 150ms'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget
                            .style.background =
                            '#F5E6CC'
                          e.currentTarget
                            .style.color =
                            '#2D4F1E'
                          e.currentTarget
                            .style.fontWeight =
                            '600'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget
                            .style.background =
                            'none'
                          e.currentTarget
                            .style.color =
                            '#4A4A4A'
                          e.currentTarget
                            .style.fontWeight =
                            '500'
                        }}
                      >
                        <span style={{
                          fontSize: 16,
                          width: 22,
                          textAlign: 'center'
                        }}>
                          {item.icon}
                        </span>
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  <div style={{
                    borderTop:
                      '1px solid #EDD9B0',
                    padding: '6px 0 4px'
                  }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 10,
                        cursor: 'pointer',
                        fontFamily: 'DM Sans',
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#E27D60',
                        textAlign: 'left',
                        transition:
                          'all 150ms'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget
                          .style.background =
                          'rgba(226,125,96,0.08)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget
                          .style.background =
                          'none'
                      }}
                    >
                      <span style={{
                        fontSize: 16,
                        width: 22,
                        textAlign: 'center'
                      }}>
                        ⬅️
                      </span>
                      Logout
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default FarmerHeader;
