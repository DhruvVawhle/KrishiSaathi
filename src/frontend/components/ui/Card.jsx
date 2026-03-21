import React from 'react'
import { motion } from 'framer-motion'

const Card = ({
  children,
  hoverable = false,
  padding = 24,
  radius = 20,
  onClick,
  style = {},
  animate = true,
  ...props
}) => {
  const Component = animate ? motion.div : 'div'
  const motionProps = animate ? {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 }
  } : {}

  return (
    <Component
      onClick={onClick}
      {...motionProps}
      style={{
        background: '#FDFAF4',
        borderRadius: radius,
        border: '1.5px solid #EDD9B0',
        boxShadow:
          '0 2px 10px rgba(45,79,30,0.07)',
        padding,
        cursor: onClick ? 'pointer' : 'default',
        transition:
          'transform 220ms, box-shadow 220ms',
        ...style
      }}
      onMouseEnter={hoverable ? e => {
        e.currentTarget.style.transform =
          'translateY(-4px)'
        e.currentTarget.style.boxShadow =
          '0 8px 32px rgba(45,79,30,0.14)'
        e.currentTarget.style.borderColor =
          '#2D4F1E'
      } : undefined}
      onMouseLeave={hoverable ? e => {
        e.currentTarget.style.transform =
          'translateY(0)'
        e.currentTarget.style.boxShadow =
          '0 2px 10px rgba(45,79,30,0.07)'
        e.currentTarget.style.borderColor =
          '#EDD9B0'
      } : undefined}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Card
