import React from 'react'

const shimmerStyle = {
  background:
    'linear-gradient(90deg, #EDD9B0 0%, #F5E6CC 50%, #EDD9B0 100%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s ease-in-out infinite',
  borderRadius: 8
}

export const SkeletonBox = ({
  width = '100%',
  height = 16,
  radius = 8,
  style = {}
}) => (
  <>
    <div style={{
      ...shimmerStyle,
      width,
      height,
      borderRadius: radius,
      ...style
    }} />
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% center }
        100% { background-position: -200% center }
      }
    `}</style>
  </>
)

export const SkeletonCard = () => (
  <div style={{
    background: '#FDFAF4',
    borderRadius: 16,
    padding: 24,
    border: '1.5px solid #EDD9B0'
  }}>
    <SkeletonBox height={18} width="60%"
      style={{ marginBottom: 12 }} />
    <SkeletonBox height={14} width="80%"
      style={{ marginBottom: 8 }} />
    <SkeletonBox height={14} width="40%"
      style={{ marginBottom: 20 }} />
    <SkeletonBox height={40}
      style={{ borderRadius: 12 }} />
  </div>
)

export const SkeletonProductCard = () => (
  <div style={{
    background: '#FDFAF4',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1.5px solid #EDD9B0'
  }}>
    <SkeletonBox height={200}
      style={{ borderRadius: 0 }} />
    <div style={{ padding: 16 }}>
      <SkeletonBox height={18} width="70%"
        style={{ marginBottom: 8 }} />
      <SkeletonBox height={14} width="50%"
        style={{ marginBottom: 16 }} />
      <SkeletonBox height={40}
        style={{ borderRadius: 12 }} />
    </div>
  </div>
)

export const SkeletonText = ({
  lines = 3
}) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  }}>
    {Array.from({ length: lines }).map(
      (_, i) => (
        <SkeletonBox
          key={i}
          height={14}
          width={i === lines - 1
            ? '60%' : '100%'}
        />
      )
    )}
  </div>
)

export const SkeletonTable = ({
  rows = 5,
  cols = 4
}) => (
  <div>
    {Array.from({ length: rows }).map(
      (_, i) => (
        <div key={i} style={{
          display: 'grid',
          gridTemplateColumns:
            `repeat(${cols}, 1fr)`,
          gap: 12,
          padding: '12px 0',
          borderBottom: '1px solid #EDD9B0'
        }}>
          {Array.from({ length: cols }).map(
            (_, j) => (
              <SkeletonBox
                key={j}
                height={14}
                width={j === 0 ? '80%' : '60%'}
              />
            )
          )}
        </div>
      )
    )}
  </div>
)

const Skeleton = {
  Box: SkeletonBox,
  Card: SkeletonCard,
  ProductCard: SkeletonProductCard,
  Text: SkeletonText,
  Table: SkeletonTable
};

export default Skeleton;
