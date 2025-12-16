import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Dashboard from './components/Dashboard'
import Channels from './components/Channels'
import SignalsList from './components/SignalsList'
import SignalEdit from './components/SignalEdit'
import Analysis from './components/Analysis'
import './App.css'

const API_BASE = '/api'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Determine active tab from location
  const getActiveTab = () => {
    if (location.pathname.startsWith('/signals')) return 'signals'
    if (location.pathname.startsWith('/channels')) return 'channels'
    if (location.pathname.startsWith('/analysis')) return 'analysis'
    return 'dashboard'
  }

  const activeTab = getActiveTab()

  useEffect(() => {
    fetchOverview()
  }, [])

  // Refetch overview when switching to dashboard
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/') {
      fetchOverview()
    }
  }, [location.pathname])

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
    if (tab === 'dashboard') {
      navigate('/dashboard')
      fetchOverview()
    } else if (tab === 'signals') {
      navigate('/signals')
    } else if (tab === 'channels') {
      navigate('/channels')
    } else if (tab === 'analysis') {
      navigate('/analysis')
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
        {loading && (location.pathname === '/dashboard' || location.pathname === '/') ? (
          <div className="loading">Loading...</div>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard overview={overview} refreshTrigger={refreshTrigger} isActive={activeTab === 'dashboard'} />} />
            <Route path="/dashboard" element={<Dashboard overview={overview} refreshTrigger={refreshTrigger} isActive={activeTab === 'dashboard'} />} />
            <Route path="/signals" element={<SignalsList />} />
            <Route path="/signals/edit/:id" element={<SignalEdit />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/analysis" element={<Analysis />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App
