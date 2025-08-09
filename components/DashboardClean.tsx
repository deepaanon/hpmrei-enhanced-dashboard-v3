import { useState, useEffect, useRef } from 'react'

interface MarketData {
  [symbol: string]: {
    signal: string
    score: number
    price: number
    change_24h: number
    rsi: number
    volume_24h?: number
    market_cap?: number
    timeframe_analysis?: any
  }
}

export default function DashboardClean() {
  // State management - using arrays instead of Sets to avoid hydration issues
  const [marketData, setMarketData] = useState<MarketData>({})
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [status, setStatus] = useState('Loading...')
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('symbol')
  const [showAddSymbol, setShowAddSymbol] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]) // Array instead of Set
  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = 12

  const fetchData = async () => {
    try {
      const response = await fetch('/api/proxy/data')
      const data = await response.json()
      
      if (response.ok && data.data) {
        setMarketData(data.data)
        // Use a simple timestamp instead of locale string to avoid hydration mismatch
        setLastUpdate(`${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}`)
        setStatus('✅ Connected')
      } else {
        setStatus('❌ Data Error')
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setStatus('❌ Connection Error')
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG_BUY': return 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg'
      case 'BUY': return 'bg-gradient-to-r from-green-300 to-green-500 text-white shadow-md'
      case 'NEUTRAL': return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-md'
      case 'SELL': return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md'
      case 'STRONG_SELL': return 'bg-gradient-to-r from-red-500 to-red-700 text-white shadow-lg'
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-md'
    }
  }

  const addSymbol = async () => {
    if (!newSymbol.trim()) return
    
    try {
      const response = await fetch('/api/proxy/pairs/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newSymbol.toUpperCase() })
      })
      
      if (response.ok) {
        setNewSymbol('')
        setShowAddSymbol(false)
        fetchData()
      } else {
        alert('Failed to add symbol')
      }
    } catch (error) {
      console.error('Error adding symbol:', error)
      alert('Error adding symbol')
    }
  }

  const removeSelectedSymbols = async () => {
    if (selectedSymbols.length === 0) return
    
    try {
      const response = await fetch('/api/proxy/pairs/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: selectedSymbols })
      })
      
      if (response.ok) {
        setSelectedSymbols([])
        fetchData()
      } else {
        alert('Failed to remove symbols')
      }
    } catch (error) {
      console.error('Error removing symbols:', error)
      alert('Error removing symbols')
    }
  }

  const handleFileUpload = async (event: any) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/proxy/pairs/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        setShowUpload(false)
        fetchData()
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        alert('Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Error uploading file')
    }
  }

  const exportSymbols = async () => {
    try {
      const response = await fetch('/api/proxy/pairs/export')
      const blob = await response.blob()
      
      if (typeof window !== 'undefined') {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'trading_pairs.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting symbols:', error)
      alert('Error exporting symbols')
    }
  }

  const toggleSymbolSelection = (symbol: string) => {
    const isSelected = selectedSymbols.includes(symbol)
    if (isSelected) {
      setSelectedSymbols(selectedSymbols.filter(s => s !== symbol))
    } else {
      setSelectedSymbols([...selectedSymbols, symbol])
    }
  }

  // Filter and sort data
  const filteredData = Object.entries(marketData || {}).filter(([symbol, data]: [string, any]) => {
    if (!data) return false
    if (filter === 'ALL') return true
    return data.signal === filter
  })

  const sortedData = filteredData.sort(([aSymbol, aData]: [string, any], [bSymbol, bData]: [string, any]) => {
    if (!aData || !bData) return 0
    switch (sortBy) {
      case 'symbol': return aSymbol.localeCompare(bSymbol)
      case 'signal': return (aData.signal || '').localeCompare(bData.signal || '')
      case 'score': return (bData.score || 0) - (aData.score || 0)
      case 'change': return (bData.change_24h || 0) - (aData.change_24h || 0)
      default: return 0
    }
  })

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentData = sortedData.slice(startIndex, startIndex + itemsPerPage)

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
        padding: '1.5rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #ffd700, #ff8c00)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.5rem'
        }}>
          🚀 ENHANCED HPMREI DASHBOARD v3.0
        </h1>
        <p style={{ color: '#e2e8f0', fontSize: '1.1rem' }}>
          Real-time cryptocurrency trading signals with portfolio management
        </p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          gap: '1rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ 
            padding: '0.5rem 1rem',
            background: status.includes('✅') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            {status}
          </span>
          <span style={{ 
            padding: '0.5rem 1rem',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            Last Update: {lastUpdate}
          </span>
          <span style={{ 
            padding: '0.5rem 1rem',
            background: 'rgba(168, 85, 247, 0.2)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            Total Pairs: {Object.keys(marketData).length}
          </span>
        </div>
      </div>

      {/* Portfolio Management Panel */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ 
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#60a5fa'
        }}>
          📊 Portfolio Management
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <button
            onClick={() => setShowAddSymbol(true)}
            style={{
              background: 'linear-gradient(45deg, #34d399, #10b981)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            ➕ Add Symbol
          </button>
          <button
            onClick={() => setShowUpload(true)}
            style={{
              background: 'linear-gradient(45deg, #60a5fa, #3b82f6)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            📤 Upload List
          </button>
          <button
            onClick={removeSelectedSymbols}
            disabled={selectedSymbols.length === 0}
            style={{
              background: selectedSymbols.length > 0 ? 'linear-gradient(45deg, #f87171, #ef4444)' : '#6b7280',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              border: 'none',
              cursor: selectedSymbols.length > 0 ? 'pointer' : 'not-allowed',
              color: 'white'
            }}
          >
            🗑️ Remove Selected ({selectedSymbols.length})
          </button>
          <button
            onClick={exportSymbols}
            style={{
              background: 'linear-gradient(45deg, #a78bfa, #8b5cf6)',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            💾 Export All
          </button>
        </div>
      </div>

      {/* Add Symbol Modal */}
      {showAddSymbol && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#374151',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid #4b5563',
            maxWidth: '400px',
            width: '100%',
            margin: '1rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Add New Symbol</h3>
            <label htmlFor="new-symbol-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Symbol</label>
            <input
              type="text"
              id="new-symbol-input"
              name="newSymbol"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="Enter symbol (e.g., BTCUSDT)"
              style={{
                width: '100%',
                background: '#4b5563',
                border: '1px solid #6b7280',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: 'white'
              }}
              onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={addSymbol}
                style={{
                  flex: 1,
                  background: '#059669',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                Add Symbol
              </button>
              <button
                onClick={() => setShowAddSymbol(false)}
                style={{
                  flex: 1,
                  background: '#6b7280',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#374151',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid #4b5563',
            maxWidth: '400px',
            width: '100%',
            margin: '1rem'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Upload Symbol List</h3>
            <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>Upload a CSV or TXT file with trading symbols (one per line)</p>
            <label htmlFor="file-upload-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>File</label>
            <input
              type="file"
              id="file-upload-input"
              name="fileUpload"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt"
              style={{
                width: '100%',
                background: '#4b5563',
                border: '1px solid #6b7280',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: 'white'
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowUpload(false)}
                style={{
                  flex: 1,
                  background: '#6b7280',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        background: 'rgba(31, 41, 55, 0.5)',
        backdropFilter: 'blur(8px)',
        padding: '1.5rem',
        borderRadius: '1rem',
        border: '1px solid rgba(75, 85, 99, 0.5)',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#60a5fa' }}>🎛️ Filters & Controls</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <label htmlFor="signal-filter" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Filter by Signal</label>
            <select 
              id="signal-filter"
              name="signalFilter"
              value={filter} 
              onChange={(e: any) => setFilter(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(75, 85, 99, 0.5)',
                border: '1px solid #6b7280',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                backdropFilter: 'blur(4px)',
                color: 'white'
              }}
            >
              <option value="ALL">All Signals</option>
              <option value="STRONG_BUY">🟢 Strong Buy</option>
              <option value="BUY">🟢 Buy</option>
              <option value="NEUTRAL">🟡 Neutral</option>
              <option value="SELL">🟠 Sell</option>
              <option value="STRONG_SELL">🔴 Strong Sell</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-by" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Sort by</label>
            <select 
              id="sort-by"
              name="sortBy"
              value={sortBy} 
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(75, 85, 99, 0.5)',
                border: '1px solid #6b7280',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                backdropFilter: 'blur(4px)',
                color: 'white'
              }}
            >
              <option value="symbol">Symbol A-Z</option>
              <option value="signal">Signal Strength</option>
              <option value="score">HPMREI Score</option>
              <option value="change">24h Change</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trading Pairs Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {currentData.map(([symbol, data]: [string, any]) => (
          <div
            key={symbol}
            onClick={() => toggleSymbolSelection(symbol)}
            style={{
              background: selectedSymbols.includes(symbol) 
                ? 'rgba(59, 130, 246, 0.3)' 
                : 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              padding: '1.5rem',
              borderRadius: '1rem',
              border: selectedSymbols.includes(symbol)
                ? '2px solid #3b82f6'
                : '1px solid rgba(255, 255, 255, 0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
          >
            {selectedSymbols.includes(symbol) && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: '#3b82f6',
                color: 'white',
                borderRadius: '50%',
                width: '1.5rem',
                height: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem'
              }}>
                ✓
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{symbol}</h3>
              <span 
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}
                className={getSignalColor(data.signal)}
              >
                {data.signal.replace('_', ' ')}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: '#9ca3af' }}>Price:</span>
                <span style={{ fontWeight: '600', marginLeft: '0.5rem' }}>${data.price?.toFixed(4) || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>Score:</span>
                <span style={{ fontWeight: '600', marginLeft: '0.5rem' }}>{data.score?.toFixed(2) || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>24h Change:</span>
                <span 
                  style={{ 
                    fontWeight: '600', 
                    marginLeft: '0.5rem',
                    color: (data.change_24h || 0) >= 0 ? '#34d399' : '#f87171'
                  }}
                >
                  {((data.change_24h || 0) >= 0 ? '+' : '')}{(data.change_24h || 0).toFixed(2)}%
                </span>
              </div>
              <div>
                <span style={{ color: '#9ca3af' }}>RSI:</span>
                <span style={{ fontWeight: '600', marginLeft: '0.5rem' }}>{data.rsi?.toFixed(1) || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === 1 ? '#6b7280' : 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
              borderRadius: '0.5rem',
              fontWeight: '500',
              border: 'none',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              color: 'white'
            }}
          >
            ← Previous
          </button>
          
          <span style={{
            padding: '0.5rem 1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '0.5rem'
          }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '0.5rem 1rem',
              background: currentPage === totalPages ? '#6b7280' : 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
              borderRadius: '0.5rem',
              fontWeight: '500',
              border: 'none',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              color: 'white'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
