import React, {
  createContext, useContext,
  useState, useCallback
} from 'react'
import { AnimatePresence, motion }
  from 'motion/react'
import Toast from '../components/ui/Toast'

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((
    message, type = 'info', duration = 3000
  ) => {
    const id = Date.now()
    setToasts(prev => [...prev, {
      id, message, type, duration
    }])
    setTimeout(() => {
      setToasts(prev =>
        prev.filter(t => t.id !== id)
      )
    }, duration + 500)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev =>
      prev.filter(t => t.id !== id)
    )
  }, [])

  // Convenience methods
  const toast = {
    success: (msg, dur) =>
      showToast(msg, 'success', dur),
    error: (msg, dur) =>
      showToast(msg, 'error', dur),
    warning: (msg, dur) =>
      showToast(msg, 'warning', dur),
    info: (msg, dur) =>
      showToast(msg, 'info', dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        <AnimatePresence>
          {toasts.map(t => (
            <div key={t.id}
              style={{ pointerEvents: 'all' }}>
              <Toast
                message={t.message}
                type={t.type}
                duration={t.duration}
                visible={true}
                onClose={() => removeToast(t.id)}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error(
    'useToast must be used within ToastProvider'
  )
  return ctx
}
