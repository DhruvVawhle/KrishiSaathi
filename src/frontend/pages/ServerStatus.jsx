import React, { useState, useEffect }
  from 'react'

const ServerStatus = () => {
  const [status, setStatus] =
    useState(null)
  const [loading, setLoading] =
    useState(true)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setStatus(data)
    } catch (err) {
      setStatus({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(
      checkStatus, 10000
    )
    return () => clearInterval(interval)
  }, [])

  const statusColor = (s) =>
    s === 'ok'
      ? '#4CAF50'
      : s === 'offline'
        ? '#FF5252'
        : '#E27D60'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5E6CC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'DM Sans'
    }}>
      <div style={{
        background: '#FDFAF4',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        maxWidth: 480,
        border: '1.5px solid #EDD9B0',
        boxShadow:
          '0 8px 32px rgba(45,79,30,0.10)'
      }}>
        <h2 style={{
          fontFamily: 'Playfair Display',
          color: '#2D4F1E',
          margin: '0 0 24px',
          fontSize: 24
        }}>
          🌾 Server Status
        </h2>

        {loading ? (
          <div style={{
            textAlign: 'center',
            color: '#7A7A7A',
            padding: 24
          }}>
            Checking servers...
          </div>
        ) : status?.error ? (
          <div style={{
            color: '#FF5252',
            padding: 16,
            background:
              'rgba(255,82,82,0.08)',
            borderRadius: 12
          }}>
            ❌ {status.error}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {status?.servers &&
             Object.entries(
               status.servers
             ).map(([name, info]) => (
              <div key={name} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                padding: '12px 16px',
                background: '#F5E6CC',
                borderRadius: 12,
                border: '1px solid #EDD9B0'
              }}>
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: '#2D4F1E',
                    textTransform: 'uppercase'
                  }}>
                    {name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#7A7A7A'
                  }}>
                    Port {info.port}
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background:
                      statusColor(info.status),
                    boxShadow:
                      `0 0 6px ${statusColor(info.status)}`
                  }} />
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: statusColor(
                      info.status
                    ),
                    textTransform: 'uppercase'
                  }}>
                    {info.status}
                  </span>
                </div>
              </div>
            ))}

            <button
              onClick={checkStatus}
              style={{
                marginTop: 8,
                padding: '12px',
                background:
                  'linear-gradient(135deg,' +
                  '#2D4F1E,#3D6B2A)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Status
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServerStatus
