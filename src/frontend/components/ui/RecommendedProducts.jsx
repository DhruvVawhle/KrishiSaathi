import React from 'react'
import { useState } from 'react'
import { motion as m, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Check,
  RefreshCw, Sparkles
} from 'lucide-react'
import useRecommendations
  from '@/frontend/hooks/useRecommendations'
import { useCart }
  from '@/frontend/contexts/CartContext'


const RecommendedProducts = () => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const {
    recommendations,
    loading,
    error,
    type,
    label
  } = useRecommendations()

  const [addedIds, setAddedIds] = useState([])

  const handleAdd = (product) => {
    addToCart(product, 1)
    setAddedIds(prev => [...prev, product.id])
    setTimeout(() => {
      setAddedIds(prev =>
        prev.filter(id => id !== product.id)
      )
    }, 1500)
  }

  // SKELETON (animate-pulse using inline style for simplicity or CSS)
  if (loading) return (
    <section style={{
      padding: '60px 40px',
      background: '#F5E6CC'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{ height: 20, width: 160, background: '#EDD9B0', marginBottom: 8, borderRadius: 4 }} className="animate-pulse" />
        <div style={{ height: 36, width: 300, background: '#EDD9B0', marginBottom: 40, borderRadius: 4 }} className="animate-pulse" />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: '#FDFAF4',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1.5px solid #EDD9B0'
            }}>
              <div style={{ height: 180, background: '#EDD9B0' }} className="animate-pulse" />
              <div style={{ padding: 16 }}>
                <div style={{ height: 16, width: '80%', background: '#EDD9B0', marginBottom: 8, borderRadius: 4 }} className="animate-pulse" />
                <div style={{ height: 14, width: '60%', background: '#EDD9B0', marginBottom: 16, borderRadius: 4 }} className="animate-pulse" />
                <div style={{ height: 40, background: '#EDD9B0', borderRadius: 12 }} className="animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  if (error) {
    console.error('❌ RecommendedProducts Error:', error);
    return (
      <section style={{ padding: '40px', background: '#FFF5F5', textAlign: 'center' }}>
        <div style={{ color: '#C53030', fontWeight: 600 }}>
          ⚠️ Unable to load recommendations at this time.
        </div>
      </section>
    );
  }

  if (!recommendations?.length) return null

  return (
    <section style={{
      padding: '60px 40px',
      background: '#F5E6CC'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>

        {/* Section header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 36
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6
            }}>
              <Sparkles size={16} color="#E27D60" />
              <span style={{
                fontFamily: 'Caveat',
                fontSize: 17,
                color: '#E27D60'
              }}>
                {type === 'personalized' ? 'Just For You' : 'Trending Now'}
              </span>
            </div>
            <h2 style={{
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              fontSize: 34,
              color: '#2D4F1E',
              margin: 0
            }}>
              {label}
            </h2>
          </div>

          <div style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center'
          }}>
            {/* View all */}
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: '1.5px solid #2D4F1E',
                background: 'transparent',
                fontFamily: 'DM Sans',
                fontWeight: 600,
                fontSize: 13,
                color: '#2D4F1E',
                cursor: 'pointer'
              }}
            >
              View All →
            </button>
          </div>
        </div>

        {/* Products grid */}
        <div className="rec-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 20
        }}>
          <AnimatePresence>
            {recommendations.map((product, i) => {
              const isAdded = addedIds.includes(product.id)
              return (
                <m.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    background: '#FDFAF4',
                    borderRadius: 16,
                    border: '1.5px solid #EDD9B0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(45,79,30,0.06)',
                    transition: 'transform 220ms, box-shadow 220ms'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,79,30,0.12)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(45,79,30,0.06)'
                  }}
                >
                  {/* Product image */}
                  <div style={{
                    position: 'relative',
                    height: 180,
                    overflow: 'hidden'
                  }}>
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 300ms'
                      }}
                      onError={e => {
                        e.target.src = ''
                        e.target.style.display = 'none'
                      }}
                    />

                    {/* Category badge */}
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      padding: '3px 10px',
                      background: 'rgba(45,79,30,0.85)',
                      borderRadius: 999,
                      fontFamily: 'DM Sans',
                      fontWeight: 600,
                      fontSize: 10,
                      color: 'white'
                    }}>
                      {product.category}
                    </div>
                  </div>

                  {/* Product info */}
                  <div style={{ padding: 16 }}>
                    <div style={{
                      fontFamily: 'Playfair Display',
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#2D4F1E',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {product.name}
                    </div>

                    <div style={{
                      fontFamily: 'DM Sans',
                      fontSize: 13,
                      color: '#7A7A7A',
                      marginBottom: 14
                    }}>
                      ₹{product.price}
                      /{product.unit || product.priceUnit}
                    </div>

                    {/* Add to cart */}
                    <button
                      onClick={() => handleAdd(product)}
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 12,
                        border: 'none',
                        background: isAdded
                          ? 'linear-gradient(135deg, #4CAF50, #388E3C)'
                          : 'linear-gradient(135deg, #E27D60, #C96848)',
                        color: 'white',
                        fontFamily: 'DM Sans',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'all 300ms',
                        boxShadow: isAdded
                          ? '0 4px 14px rgba(76,175,80,0.35)'
                          : '0 4px 14px rgba(226,125,96,0.30)'
                      }}
                    >
                      {isAdded ? (
                        <>
                          <Check size={15} />
                          Added!
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={15} />
                          Add to Cart
                        </>
                      )}
                    </button>
                  </div>
                </m.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Mobile grid override */}
        <style>{`
          @media (max-width: 1024px) {
            .rec-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          @media (max-width: 768px) {
            .rec-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 480px) {
            .rec-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </section>
  )
}

export default RecommendedProducts
