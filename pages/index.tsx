import { useState, useEffect } from 'react'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import LoginForm from '../components/LoginForm'

// Dynamically import Dashboard with no SSR to prevent hydration issues
const Dashboard = dynamic(() => import('../components/Dashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-xl">✨ Loading Enhanced HPMREI Dashboard...</div>
    </div>
  )
})

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/check')
      .then(res => {
        if (res.ok) {
          setIsAuthenticated(true)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">✨ Loading Enhanced HPMREI Dashboard v2.0...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>✨ ENHANCED HPMREI Trading Dashboard v3.0 - FRESH DEPLOYMENT</title>
        <meta name="description" content="Enhanced HPMREI cryptocurrency trading dashboard v3.0 with beautiful gradients - FRESH DEPLOYMENT" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="cache-control" content="no-cache, no-store, must-revalidate" />
        <meta name="pragma" content="no-cache" />
        <meta name="expires" content="0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #4c1d95 100%)',
        position: 'relative'
      }}>
        {isAuthenticated ? (
          <Dashboard />
        ) : (
          <LoginForm onLogin={() => setIsAuthenticated(true)} />
        )}
      </div>
    </>
  )
}
