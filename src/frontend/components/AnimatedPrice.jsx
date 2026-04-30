import { AnimatePresence, motion } from 'motion/react'

const AnimatedPrice = ({ value, style }) => (
  <AnimatePresence mode="popLayout">
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ type:'spring',
        stiffness:400, damping:30 }}
      style={{ display:'inline-block', ...style }}
    >
      {value}
    </motion.span>
  </AnimatePresence>
)

export default AnimatedPrice
