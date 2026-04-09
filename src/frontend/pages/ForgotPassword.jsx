import React, {
  useState, useRef, useEffect
} from 'react'
import { useNavigate, Link } from
  'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from 'firebase/auth'
import { auth } from '../config/firebaseConfig'

const ForgotPassword = () => {
  const navigate = useNavigate()

  // Steps:
  // 1 = enter email or phone
  // 2 = enter OTP
  // 3 = success
  const [step, setStep] = useState(1)
  const [method, setMethod] =
    useState('email') // 'email' or 'phone'
  const [identifier, setIdentifier] =
    useState('')
  const [maskedIdentifier, setMaskedIdentifier] =
    useState('')
  const [otp, setOtp] =
    useState(['','','','','',''])
  const [loading, setLoading] =
    useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] =
    useState(0)

  // 6 refs for OTP boxes
  const otpRefs = [
    useRef(null), useRef(null),
    useRef(null), useRef(null),
    useRef(null), useRef(null)
  ]

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(
          prev => prev - 1
        ), 1000
      )
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Mask email: a****@gmail.com
  const maskEmail = (email) => {
    const [local, domain] = email.split('@')
    if (!domain) return email
    return local.charAt(0) +
      '****@' + domain
  }

  // Mask phone: +91 XXXXX XX890
  const maskPhone = (phone) => {
    const digits = phone.replace(
      /\D/g, ''
    )
    if (digits.length >= 10) {
      return '+91 XXXXX XX' +
        digits.slice(-3)
    }
    return phone
  }

  // Send OTP handler
  const handleSendOTP = async () => {
    setLoading(true)
    setError('')

    try {
      const val = identifier.trim()

      if (!val) {
        setError('Please enter email or phone')
        setLoading(false)
        return
      }

      // Detect if email or phone
      const isEmail = val.includes('@')
      const isPhone = /^\+?[\d\s]{10,}$/.test(val)

      if (!isEmail && !isPhone) {
        setError('Enter a valid email or phone number')
        setLoading(false)
        return
      }

      if (isEmail) {
        // --- FIX 2: EMAIL RESET ---
        try {
          console.log('[ForgotPassword] Sending reset to:', val)
          await sendPasswordResetEmail(auth, val, {
            url: window.location.origin + '/login',
            handleCodeInApp: false
          })
          console.log('✅ Reset email sent to:', val)
          setMaskedIdentifier(maskEmail(val))
          setMethod('email')
          setStep(2)
          setResendCooldown(30)
        } catch (err) {
          console.error('❌ Email reset error:', err.code, err.message)
          throw err
        }

      } else {
        // --- FIX 3: PHONE OTP ---
        try {
          let phone = val.replace(/\s/g, '')
          if (phone.startsWith('0')) {
            phone = '+91' + phone.slice(1)
          } else if (!phone.startsWith('+')) {
            phone = '+91' + phone
          }

          console.log('[ForgotPassword] Sending OTP to:', phone)

          // Clear existing verifier
          if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear() } catch {}
            window.recaptchaVerifier = null
          }

          // Create fresh RecaptchaVerifier
          window.recaptchaVerifier = new RecaptchaVerifier(
            auth,
            'recaptcha-container',
            {
              size: 'invisible',
              callback: () => { console.log('✅ Recaptcha solved') },
              'expired-callback': () => {
                console.warn('⚠️ Recaptcha expired')
                if (window.recaptchaVerifier) {
                  try { window.recaptchaVerifier.clear() } catch {}
                  window.recaptchaVerifier = null
                }
              }
            }
          )

          // Render recaptcha first
          await window.recaptchaVerifier.render()
          console.log('[ForgotPassword] Recaptcha ready')

          const confirmationResult = await signInWithPhoneNumber(
            auth,
            phone,
            window.recaptchaVerifier
          )

          window.confirmationResult = confirmationResult
          console.log('✅ Phone OTP sent to:', phone)

          setMaskedIdentifier(maskPhone(phone))
          setMethod('phone')
          setStep(2)
          setResendCooldown(30)
        } catch (err) {
          console.error('❌ Phone OTP error:', err.code, err.message)
          if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear() } catch {}
            window.recaptchaVerifier = null
          }
          throw err
        }
      }

    } catch (err) {
      // --- FIX 4: ERROR MESSAGES ---
      console.error('[ForgotPassword] Send error:', err.code, err.message)
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/invalid-phone-number': 'Please enter a valid phone number (+91XXXXXXXXXX).',
        'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
        'auth/missing-phone-number': 'Please enter your phone number.',
        'auth/quota-exceeded': 'SMS quota exceeded. Try email instead.',
        'auth/captcha-check-failed': 'Security check failed. Please refresh and try again.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/operation-not-allowed': 'This login method is not enabled. Contact support.',
        'auth/missing-app-credential': 'App configuration error. Please refresh.'
      }
      setError(errorMessages[err.code] || `Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // OTP input handler
  const handleOtpChange = (index, value) => {
    // Only allow single digit
    const digit = value.replace(
      /\D/g, ''
    ).slice(-1)

    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto focus next box
    if (digit && index < 5) {
      otpRefs[index + 1]?.current?.focus()
    }
  }

  // Handle backspace
  const handleOtpKeyDown = (
    index, e
  ) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs[index - 1]?.current
          ?.focus()
      }
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
    }
  }

  // Handle paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    const newOtp = ['','','','','','']
    pasted.split('').forEach((d, i) => {
      newOtp[i] = d
    })
    setOtp(newOtp)
    // Focus last filled
    const lastIndex =
      Math.min(pasted.length, 5)
    otpRefs[lastIndex]?.current?.focus()
  }

  // Verify OTP
  const handleVerifyOTP = async () => {
    const code = otp.join('')

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (method === 'phone') {
        if (!window.confirmationResult) {
          setError('Session expired. Please click Resend.')
          setLoading(false)
          return
        }

        console.log('[ForgotPassword] Verifying OTP:', code)
        await window.confirmationResult.confirm(code)
        console.log('✅ Phone OTP verified!')
      }

      // Email: Firebase sends reset link directly so step 3 is success
      setStep(3)

    } catch (err) {
      console.error('[ForgotPassword] Verify error:', err.code, err.message)
      const errorMessages = {
        'auth/invalid-verification-code': 'Invalid code. Please check and try again.',
        'auth/code-expired': 'Code has expired. Please request a new one.',
        'auth/missing-verification-code': 'Please enter the verification code.'
      }
      setError(errorMessages[err.code] || `Verification failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return
    setOtp(['','','','','',''])
    setError('')
    await handleSendOTP()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5E6CC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      {/* Recaptcha - must be in DOM */}
      <div
        id="recaptcha-container"
        style={{ display: 'none' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        style={{
          background: '#FDFAF4',
          borderRadius: 20,
          padding: '40px 36px',
          width: '100%',
          maxWidth: 420,
          border: '1.5px solid #EDD9B0',
          boxShadow:
            '0 8px 32px rgba(45,79,30,0.10)'
        }}
      >
        {/* Back button */}
        <button
          onClick={() =>
            step > 1
              ? setStep(prev => prev - 1)
              : navigate('/login')
          }
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'DM Sans',
            fontSize: 13,
            color: '#7A7A7A',
            marginBottom: 24,
            padding: 0,
            transition: 'color 150ms'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color
              = '#2D4F1E'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color
              = '#7A7A7A'
          }}
        >
          ← {step > 1
            ? 'Back'
            : 'Back to Login'}
        </button>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Enter identifier ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Icon */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background:
                  'rgba(226,125,96,0.12)',
                border:
                  '1.5px solid rgba(226,125,96,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                marginBottom: 20
              }}>
                🔐
              </div>

              <h2 style={{
                fontFamily:
                  'Playfair Display',
                fontWeight: 700,
                fontSize: 26,
                color: '#2D4F1E',
                margin: '0 0 8px'
              }}>
                Forgot Password?
              </h2>

              <p style={{
                fontFamily: 'DM Sans',
                fontSize: 14,
                color: '#7A7A7A',
                margin: '0 0 28px',
                lineHeight: 1.6
              }}>
                Enter your email or phone
                number. We'll send you a
                verification code.
              </p>

              {/* Input */}
              <div style={{ marginBottom: 8 }}>
                <label style={{
                  fontFamily: 'DM Sans',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#4A4A4A',
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}>
                  Email or Phone Number
                </label>
                <input
                  type="text"
                  placeholder="you@email.com or +91 9876543210"
                  value={identifier}
                  onChange={e =>
                    setIdentifier(e.target.value)
                  }
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSendOTP()
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border:
                      '1.5px solid #EDD9B0',
                    background: '#F5E6CC',
                    fontFamily: 'DM Sans',
                    fontSize: 14,
                    color: '#4A4A4A',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border 150ms'
                  }}
                  onFocus={e => {
                    e.target.style.border
                      = '1.5px solid #2D4F1E'
                  }}
                  onBlur={e => {
                    e.target.style.border
                      = '1.5px solid #EDD9B0'
                  }}
                />
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '8px 12px',
                  background:
                    'rgba(255,82,82,0.08)',
                  borderRadius: 8,
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  color: '#FF5252',
                  marginBottom: 12
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Send button */}
              <button
                onClick={handleSendOTP}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading
                    ? '#7A7A7A'
                    : 'linear-gradient(135deg,#2D4F1E,#3D6B2A)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer',
                  marginTop: 8,
                  boxShadow: loading
                    ? 'none'
                    : '0 4px 14px rgba(45,79,30,0.30)',
                  transition: 'all 200ms'
                }}
              >
                {loading
                  ? '⏳ Sending Code...'
                  : 'Send Verification Code →'
                }
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: Enter OTP ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Icon */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background:
                  'rgba(45,79,30,0.10)',
                border:
                  '1.5px solid rgba(45,79,30,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                marginBottom: 20
              }}>
                {method === 'email'
                  ? '📧' : '📱'}
              </div>

              <h2 style={{
                fontFamily:
                  'Playfair Display',
                fontWeight: 700,
                fontSize: 26,
                color: '#2D4F1E',
                margin: '0 0 8px'
              }}>
                Verify account
              </h2>

              {/* Masked identifier message */}
              <p style={{
                fontFamily: 'DM Sans',
                fontSize: 14,
                color: '#7A7A7A',
                margin: '0 0 28px',
                lineHeight: 1.6
              }}>
                We've sent a code to{' '}
                <span style={{
                  fontWeight: 700,
                  color: '#4A4A4A'
                }}>
                  {maskedIdentifier}
                </span>
              </p>

              {/* OTP boxes */}
              {/* Format: [_][_][_] - [_][_][_] */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24
              }}>
                {[0,1,2].map(i => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    onChange={e =>
                      handleOtpChange(
                        i, e.target.value
                      )
                    }
                    onKeyDown={e =>
                      handleOtpKeyDown(i, e)
                    }
                    onPaste={handleOtpPaste}
                    style={{
                      width: 52,
                      height: 56,
                      borderRadius: 12,
                      border: otp[i]
                        ? '2px solid #2D4F1E'
                        : '2px solid #EDD9B0',
                      background: otp[i]
                        ? 'rgba(45,79,30,0.06)'
                        : '#F5E6CC',
                      fontFamily:
                        'Playfair Display',
                      fontWeight: 700,
                      fontSize: 22,
                      color: '#2D4F1E',
                      textAlign: 'center',
                      outline: 'none',
                      cursor: 'text',
                      transition: 'all 150ms',
                      boxShadow: otp[i]
                        ? '0 0 0 3px rgba(45,79,30,0.10)'
                        : 'none'
                    }}
                    onFocus={e => {
                      e.target.style.border
                        = '2px solid #2D4F1E'
                      e.target.style.boxShadow
                        = '0 0 0 3px rgba(45,79,30,0.12)'
                    }}
                    onBlur={e => {
                      if (!otp[i]) {
                        e.target.style.border
                          = '2px solid #EDD9B0'
                        e.target.style.boxShadow
                          = 'none'
                      }
                    }}
                  />
                ))}

                {/* Dash separator */}
                <span style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 20,
                  color: '#B0A898',
                  margin: '0 2px',
                  userSelect: 'none'
                }}>
                  —
                </span>

                {[3,4,5].map(i => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    onChange={e =>
                      handleOtpChange(
                        i, e.target.value
                      )
                    }
                    onKeyDown={e =>
                      handleOtpKeyDown(i, e)
                    }
                    onPaste={handleOtpPaste}
                    style={{
                      width: 52,
                      height: 56,
                      borderRadius: 12,
                      border: otp[i]
                        ? '2px solid #2D4F1E'
                        : '2px solid #EDD9B0',
                      background: otp[i]
                        ? 'rgba(45,79,30,0.06)'
                        : '#F5E6CC',
                      fontFamily:
                        'Playfair Display',
                      fontWeight: 700,
                      fontSize: 22,
                      color: '#2D4F1E',
                      textAlign: 'center',
                      outline: 'none',
                      cursor: 'text',
                      transition: 'all 150ms',
                      boxShadow: otp[i]
                        ? '0 0 0 3px rgba(45,79,30,0.10)'
                        : 'none'
                    }}
                    onFocus={e => {
                      e.target.style.border
                        = '2px solid #2D4F1E'
                      e.target.style.boxShadow
                        = '0 0 0 3px rgba(45,79,30,0.12)'
                    }}
                    onBlur={e => {
                      if (!otp[i]) {
                        e.target.style.border
                          = '2px solid #EDD9B0'
                        e.target.style.boxShadow
                          = 'none'
                      }
                    }}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '8px 12px',
                  background:
                    'rgba(255,82,82,0.08)',
                  borderRadius: 8,
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  color: '#FF5252',
                  marginBottom: 12,
                  textAlign: 'center'
                }}>
                  ⚠️ {error}
                </div>
              )}

              {/* Verify button */}
              <button
                onClick={handleVerifyOTP}
                disabled={
                  loading ||
                  otp.join('').length !== 6
                }
                style={{
                  width: '100%',
                  padding: '13px',
                  background:
                    otp.join('').length === 6
                      && !loading
                      ? 'linear-gradient(135deg,#2D4F1E,#3D6B2A)'
                      : '#B0A898',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor:
                    otp.join('').length === 6
                    && !loading
                      ? 'pointer'
                      : 'not-allowed',
                  marginBottom: 16,
                  boxShadow:
                    otp.join('').length === 6
                      ? '0 4px 14px rgba(45,79,30,0.30)'
                      : 'none',
                  transition: 'all 200ms'
                }}
              >
                {loading
                  ? '⏳ Verifying...'
                  : 'Verify Code →'
                }
              </button>

              {/* Resend row */}
              <div style={{
                textAlign: 'center',
                fontFamily: 'DM Sans',
                fontSize: 13,
                color: '#7A7A7A'
              }}>
                Didn't receive a code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: resendCooldown > 0
                      ? 'not-allowed'
                      : 'pointer',
                    color: resendCooldown > 0
                      ? '#B0A898'
                      : '#2D4F1E',
                    textDecoration:
                      resendCooldown > 0
                        ? 'none'
                        : 'underline',
                    padding: 0
                  }}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend'
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              style={{ textAlign: 'center' }}
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.1,
                  type: 'spring',
                  stiffness: 200
                }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background:
                    'rgba(76,175,80,0.12)',
                  border:
                    '2px solid rgba(76,175,80,0.30)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  margin: '0 auto 20px'
                }}
              >
                ✅
              </motion.div>

              <h2 style={{
                fontFamily:
                  'Playfair Display',
                fontWeight: 700,
                fontSize: 26,
                color: '#2D4F1E',
                margin: '0 0 12px'
              }}>
                {method === 'email'
                  ? 'Check Your Email!'
                  : 'Phone Verified!'
                }
              </h2>

              <p style={{
                fontFamily: 'DM Sans',
                fontSize: 14,
                color: '#7A7A7A',
                margin: '0 0 28px',
                lineHeight: 1.7
              }}>
                {method === 'email'
                  ? `We've sent a password reset link to ${maskedIdentifier}. Check your inbox and follow the link.`
                  : 'Your phone has been verified successfully. You can now login with your phone number.'
                }
              </p>

              <button
                onClick={() =>
                  navigate('/login')
                }
                style={{
                  width: '100%',
                  padding: '13px',
                  background:
                    'linear-gradient(135deg,#2D4F1E,#3D6B2A)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow:
                    '0 4px 14px rgba(45,79,30,0.30)'
                }}
              >
                Back to Login →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
