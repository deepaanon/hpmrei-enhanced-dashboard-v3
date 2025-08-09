import React, { useState } from 'react'
import Head from 'next/head'
import LoginForm from '../components/LoginForm'
import DashboardClean from '../components/DashboardClean'
import ClientOnly from '../components/ClientOnly'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <div>
      <Head>
        <title>HPMREI Enhanced Dashboard v3.0</title>
        <meta name="description" content="High Probability Mean Reversion Entry Indicator Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {!isAuthenticated ? (
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <ClientOnly>
          <DashboardClean />
        </ClientOnly>
      )}
    </div>
  )
}
