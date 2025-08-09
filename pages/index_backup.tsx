import { useState, useEffect } from 'react'
import Head from 'next/head'

// Minimal authentication component
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        onLogin()
      } else {
        setError('Invalid password')
      }
    } catch (err) {
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4c1d95 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>
          🚀 HPMREI Dashboard
        </h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '1rem',
              marginBottom: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '0.5rem',
              color: 'white'
            }}
            required
          />
          {error && (
            <div style={{ color: '#ff6b6b', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#6b7280' : 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Minimal Dashboard component - no complex state
function Dashboard() {
  const [data, setData] = useState<any>({})
  const [status, setStatus] = useState('Loading...')
  const [lastUpdate, setLastUpdate] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/proxy/data')
        const result = await response.json()
        
        if (response.ok && result.data) {
          setData(result.data)
          setStatus('✅ Connected')
          setLastUpdate(new Date().toTimeString().split(' ')[0])
        } else {
          setStatus('❌ Data Error')
        }
      } catch (error) {
        setStatus('❌ Connection Error')
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000) // 30 seconds
    return () => clearInterval(interval)
  }, [])

  const entries = Object.entries(data)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4c1d95 100%)',
      color: 'white',
      padding: '1rem'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #ffd700, #ff8c00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1rem'
        }}>
          🚀 HPMREI Dashboard v3.0
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <span style={{
            padding: '0.5rem 1rem',
            background: 'rgba(34, 197, 94, 0.2)',
            borderRadius: '0.5rem'
          }}>
            {status}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '0.5rem'
          }}>
            Last Update: {lastUpdate}
          </span>
          <span style={{
            padding: '0.5rem 1rem',
            background: 'rgba(168, 85, 247, 0.2)',
            borderRadius: '0.5rem'
          }}>
            Pairs: {entries.length}
          </span>
        </div>
      </div>

      {/* Simple Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem'
      }}>
        {entries.map(([symbol, info]: [string, any]) => (
          <div
            key={symbol}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{symbol}</h3>
              <span style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                background: getSignalColor(info.signal),
                color: 'white'
              }}>
                {info.signal?.replace('_', ' ') || 'N/A'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div>Price: ${info.price?.toFixed(4) || 'N/A'}</div>
              <div>Score: {info.score?.toFixed(2) || 'N/A'}</div>
              <div style={{ color: (info.change_24h || 0) >= 0 ? '#34d399' : '#f87171' }}>
                Change: {((info.change_24h || 0) >= 0 ? '+' : '')}{(info.change_24h || 0).toFixed(2)}%
              </div>
              <div>RSI: {info.rsi?.toFixed(1) || 'N/A'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getSignalColor(signal: string) {
  switch (signal) {
    case 'STRONG_BUY': return '#10b981'
    case 'BUY': return '#34d399'
    case 'NEUTRAL': return '#fbbf24'
    case 'SELL': return '#f97316'
    case 'STRONG_SELL': return '#ef4444'
    default: return '#6b7280'
  }
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check authentication on mount
    fetch('/api/auth/check')
      .then(res => res.ok && setIsAuthenticated(true))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4c1d95 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        ✨ Loading HPMREI Dashboard...
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>HPMREI Trading Dashboard v3.0</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {isAuthenticated ? <Dashboard /> : <LoginForm onLogin={() => setIsAuthenticated(true)} />}
    </>
  )
}
