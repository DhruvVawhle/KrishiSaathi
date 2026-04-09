import React, { useState, useId } from 'react'

const Input = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  icon: Icon,
  error,
  success,
  hint,
  required = false,
  disabled = false,
  maxLength,
  showCount = false,
  style = {},
  inputStyle = {},
  rightIcon,
  id,
  noMargin,
  ...props
}) => {
  const generatedId = useId()
  const inputId = id || generatedId
  const [focused, setFocused] = useState(false)

  const borderColor = error
    ? '#FF5252'
    : success
      ? '#4CAF50'
      : focused
        ? '#2D4F1E'
        : '#EDD9B0'

  const shadowColor = error
    ? 'rgba(255,82,82,0.12)'
    : success
      ? 'rgba(76,175,80,0.12)'
      : focused
        ? 'rgba(45,79,30,0.10)'
        : 'none'

  return (
    <div style={{ width: '100%', marginBottom: noMargin ? 0 : 20, ...style }}>

      {/* Label */}
      {label && (
        <label 
          htmlFor={inputId}
          style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: 'DM Sans',
          fontWeight: 700,
          fontSize: 11,
          color: '#4A4A4A',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          {label}
          {required && (
            <span style={{ color: '#FF5252' }}>
              *
            </span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Left icon */}
        {Icon && (
          <div style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: focused
              ? '#2D4F1E' : '#B0A898',
            transition: 'color 200ms',
            pointerEvents: 'none',
            display: 'flex'
          }}>
            {(typeof Icon === 'string' || React.isValidElement(Icon)) ? Icon : (Icon && <Icon size={16} />)}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: 48,
            paddingLeft: Icon ? 42 : 14,
            paddingRight: (success || error || rightIcon ||
              showCount) ? 42 : 14,
            background: focused
              ? 'white' : '#F5E6CC',
            border: `1.5px solid ${borderColor}`,
            borderRadius: 12,
            fontFamily: 'DM Sans',
            fontSize: 14,
            color: '#4A4A4A',
            outline: 'none',
            boxShadow: focused || error || success
              ? `0 0 0 3px ${shadowColor}`
              : 'none',
            transition: 'all 200ms',
            boxSizing: 'border-box',
            cursor: disabled
              ? 'not-allowed' : 'text',
            opacity: disabled ? 0.6 : 1,
            ...inputStyle
          }}
          id={inputId}
          {...props}
        />

        {/* Right indicator/Icon */}
        {(success || error || rightIcon) && (
          <div style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            {rightIcon && rightIcon}
            {success && (
              <span style={{
                color: '#4CAF50',
                fontSize: 16
              }}>✓</span>
            )}
            {error && (
              <span style={{
                color: '#FF5252',
                fontSize: 16
              }}>✕</span>
            )}
          </div>
        )}
      </div>

      {/* Character count */}
      {showCount && maxLength && (
        <div style={{
          textAlign: 'right',
          fontFamily: 'DM Sans',
          fontSize: 11,
          color: value?.length > maxLength * 0.9
            ? '#FF5252' : '#B0A898',
          marginTop: 4
        }}>
          {value?.length || 0}/{maxLength}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 5,
            fontFamily: 'DM Sans',
            fontSize: 12,
            color: '#FF5252'
          }}
        >
          ⚠ {error}
        </div>
      )}

      {/* Hint */}
      {hint && !error && (
        <div style={{
          marginTop: 5,
          fontFamily: 'DM Sans',
          fontSize: 12,
          color: '#B0A898'
        }}>
          {hint}
        </div>
      )}
    </div>
  )
}

export default Input
