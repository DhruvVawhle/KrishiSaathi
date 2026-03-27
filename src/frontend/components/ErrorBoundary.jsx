import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, error: err }
  }

  componentDidCatch(error, info) {
    console.error(
      '[ErrorBoundary]',
      error,
      info
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#F5E6CC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'DM Sans',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16
          }}>
            🌾
          </div>
          <h2 style={{
            fontFamily: 'Playfair Display',
            fontWeight: 700,
            fontSize: 28,
            color: '#2D4F1E',
            margin: '0 0 12px'
          }}>
            Something went wrong
          </h2>
          <p style={{
            fontSize: 14,
            color: '#7A7A7A',
            margin: '0 0 24px',
            maxWidth: 400,
            lineHeight: 1.6
          }}>
            We encountered an unexpected error. Please refresh the page or go back home.
          </p>

          {/* Error details in dev */}
          {import.meta.env.DEV && (
            <details style={{
              marginBottom: 20,
              padding: '12px 16px',
              background: 'rgba(255,82,82,0.06)',
              borderRadius: 10,
              border: '1px solid rgba(255,82,82,0.20)',
              textAlign: 'left',
              maxWidth: 500,
              width: '100%'
            }}>
              <summary style={{
                fontFamily: 'DM Sans',
                fontSize: 12,
                fontWeight: 700,
                color: '#FF5252',
                cursor: 'pointer'
              }}>
                Error Details (Dev Only)
              </summary>
              <pre style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#FF5252',
                marginTop: 8,
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>
          )}

          <div style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center'
          }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '11px 22px',
                background: 'linear-gradient(135deg,#2D4F1E,#3D6B2A)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(45,79,30,0.25)'
              }}
            >
              🔄 Refresh Page
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '11px 22px',
                background: 'transparent',
                border: '1.5px solid #EDD9B0',
                borderRadius: 10,
                color: '#4A4A4A',
                fontFamily: 'DM Sans',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              🏠 Go Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
