import { useState, useEffect } from 'react'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import Channels from './components/Channels'
import Signals from './components/Signals'
import Analysis from './components/Analysis'
import './App.css'

const API_BASE = '/api'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    fetchOverview()
  }, [])

  // Refetch overview when switching to dashboard tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchOverview()
    }
  }, [activeTab])

  const fetchOverview = async () => {
    try {
      const res = await axios.get(`${API_BASE}/analysis/overview`)
      setOverview(res.data)
      // Trigger dashboard refresh
      setRefreshTrigger(prev => prev + 1)
    } catch (error) {
      console.error('Error fetching overview:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    // If switching to dashboard, refresh data
    if (tab === 'dashboard') {
      fetchOverview()
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📈 Future Trading Signal Analyzer</h1>
        <nav className="nav-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => handleTabChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'signals' ? 'active' : ''}
            onClick={() => handleTabChange('signals')}
          >
            Signals
          </button>
          <button
            className={activeTab === 'channels' ? 'active' : ''}
            onClick={() => handleTabChange('channels')}
          >
            Channels
          </button>
          <button
            className={activeTab === 'analysis' ? 'active' : ''}
            onClick={() => handleTabChange('analysis')}
          >
            Analysis
          </button>
        </nav>
      </header>

      <main className="app-main">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'dashboard' && <Dashboard overview={overview} refreshTrigger={refreshTrigger} isActive={activeTab === 'dashboard'} />}
            {activeTab === 'signals' && <Signals />}
            {activeTab === 'channels' && <Channels />}
            {activeTab === 'analysis' && <Analysis />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
