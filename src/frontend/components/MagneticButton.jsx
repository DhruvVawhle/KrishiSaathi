import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'

const MagneticButton = ({ children, onClick, style, className }) => {
  const shouldReduce = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 20 })
  const springY = useSpring(y, { stiffness: 300, damping: 20 })

  const handleMouseMove = (e) => {
    if (shouldReduce) return
    const rect = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * 0.3)
    y.set((e.clientY - rect.top - rect.height / 2) * 0.3)
  }

  return (
    <motion.button
      style={{
        x: springX,
        y: springY,
        background: '#2D4F1E',
        color: '#fff',
        fontFamily: 'DM Sans',
        fontWeight: 700,
        border: 'none',
        borderRadius: 10,
        padding: '12px 28px',
        cursor: 'pointer',
        fontSize: 14,
        ...style
      }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0) }}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  )
}

export default MagneticButton
