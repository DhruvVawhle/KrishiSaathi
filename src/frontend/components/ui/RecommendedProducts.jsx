// ✅ Add this as first line
import React from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    label,
    loading,
    type,
    refresh
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

  // SKELETON
  if (loading) return (
    <section style={{
      padding: '60px 40px',
      background: '#F5E6CC'
    }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center }
          100% { background-position: -200% center }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            #EDD9B0 0%,
            #F5E6CC 50%,
            #EDD9B0 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
          border-radius: 8px;
        }
      `}</style>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div className="shimmer" style={{
          height: 20, width: 160,
          marginBottom: 8
        }} />
        <div className="shimmer" style={{
          height: 36, width: 300,
          marginBottom: 40
        }} />
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
              <div className="shimmer" style={{ height: 180 }} />
              <div style={{ padding: 16 }}>
                <div className="shimmer" style={{ height: 16, width: '80%', marginBottom: 8 }} />
                <div className="shimmer" style={{ height: 14, width: '60%', marginBottom: 16 }} />
                <div className="shimmer" style={{ height: 40 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )

  if (!recommendations.length) return null

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
            {/* Refresh button */}
            <button
              onClick={refresh}
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                border: '1.5px solid #EDD9B0',
                background: '#FDFAF4',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2D4F1E'
              }}
            >
              <RefreshCw size={16} />
            </button>

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

        {/* Type indicator */}
        {type === 'personalized' && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'rgba(45,79,30,0.08)',
            borderRadius: 999,
            marginBottom: 24,
            border: '1px solid rgba(45,79,30,0.15)'
          }}>
            <span style={{ fontSize: 12 }}>✨</span>
            <span style={{
              fontFamily: 'DM Sans',
              fontSize: 12,
              fontWeight: 600,
              color: '#2D4F1E'
            }}>
              Personalized based on your purchases
            </span>
          </div>
        )}

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
                <motion.div
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
                      loading={i < 2 ? "eager" : "lazy"}
                      {...(i < 2 ? { fetchPriority: "high" } : {})}
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

                    {/* Personalized tag */}
                    {type === 'personalized' && i < 2 && (
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        padding: '3px 8px',
                        background: '#E27D60',
                        borderRadius: 999,
                        fontFamily: 'Caveat',
                        fontSize: 11,
                        color: 'white'
                      }}>
                        For You ✨
                      </div>
                    )}
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
                </motion.div>
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
