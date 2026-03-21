import React from 'react';

/**
 * Standard Error Boundary to catch UI crashes and show a fallback.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Critical Runtime Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#FDF7E5',
          borderRadius: '12px',
          border: '1px solid #EDD9B0',
          margin: '20px',
          color: '#2D4F1E',
          fontFamily: 'DM Sans, sans-serif'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>🌾 Oops! Something went wrong.</h2>
          <p style={{ opacity: 0.8, marginBottom: '24px' }}>
            We encountered a minor issue while loading this part of the application.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#2D4F1E',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <pre style={{
              marginTop: '24px',
              textAlign: 'left',
              background: '#fff',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '12px',
              overflowX: 'auto',
              border: '1px solid #eee'
            }}>
              {this.state.error?.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
