import { motion, useInView, useReducedMotion } from 'motion/react'
import React, { useRef } from 'react'

export const FadeIn = ({ children, delay = 0, y = 24 }) => {
  const ref = useRef(null)
  const shouldReduce = useReducedMotion()
  const isInView = useInView(ref, {
    once: true,
    margin: '-80px 0px'
  })
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: shouldReduce ? 0 : y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: shouldReduce ? 0 : y }}
      transition={{
        duration: 0.45,
        delay,
        ease: [0.25, 0.4, 0.25, 1]
      }}
    >
      {children}
    </motion.div>
  )
}

// Stagger wrapper for lists
export const StaggerFade = ({ children, baseDelay = 0 }) => (
  <>
    {React.Children.map(children, (child, i) => (
      <FadeIn key={i} delay={baseDelay + i * 0.07}>
        {child}
      </FadeIn>
    ))}
  </>
)
