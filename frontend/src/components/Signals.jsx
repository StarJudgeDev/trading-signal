import { useEffect, useState } from 'react'
import axios from 'axios'
import AddSignal from './AddSignal'
import UpdateSignal from './UpdateSignal'

const API_BASE = '/api'

function Signals() {
  const [signals, setSignals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    channelId: ''
  })
  const [channels, setChannels] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [updatingSignal, setUpdatingSignal] = useState(null)

  useEffect(() => {
    fetchChannels()
    fetchSignals()
  }, [filters])

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API_BASE}/channels`)
      setChannels(res.data)
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const fetchSignals = async () => {
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.channelId) params.append('channelId', filters.channelId)
      
      const res = await axios.get(`${API_BASE}/signals?${params.toString()}`)
      setSignals(res.data.signals || res.data)
    } catch (error) {
      console.error('Error fetching signals:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const getStatusBadge = (status) => {
    return <span className={`badge ${status.toLowerCase()}`}>{status}</span>
  }

  if (loading) {
    return <div className="loading">Loading signals...</div>
  }

  const handleSignalAdded = () => {
    setShowAddForm(false)
    fetchSignals()
  }

  const handleSignalUpdated = () => {
    setUpdatingSignal(null)
    fetchSignals()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Trading Signals</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '0.75rem 1.5rem',
            background: showAddForm ? '#475569' : '#10b981',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Signal'}
        </button>
      </div>

      {showAddForm && (
        <AddSignal
          onSignalAdded={handleSignalAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {updatingSignal && (
        <UpdateSignal
          signal={updatingSignal}
          onUpdate={handleSignalUpdated}
          onCancel={() => setUpdatingSignal(null)}
        />
      )}
      
      <div className="card">
        <h3>Filters</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            style={{
              padding: '0.5rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#e2e8f0'
            }}
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="STOPPED">Stopped</option>
            <option value="PARTIAL">Partial</option>
          </select>
          
          <select
            value={filters.channelId}
            onChange={(e) => setFilters({ ...filters, channelId: e.target.value })}
            style={{
              padding: '0.5rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#e2e8f0'
            }}
          >
            <option value="">All Channels</option>
            {channels.map(ch => (
              <option key={ch._id} value={ch._id}>{ch.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h3>Signal List ({signals.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>Type</th>
                <th>Pair</th>
                <th>Entry</th>
                <th>Targets</th>
                <th>Stop Loss</th>
                <th>Reached</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {signals.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem' }}>
                    No signals found
                  </td>
                </tr>
              ) : (
                signals.map((signal) => (
                  <tr key={signal._id}>
                    <td>{formatDate(signal.createdAt)}</td>
                    <td>{signal.channelName}</td>
                    <td>
                      <span className={`badge ${signal.type.toLowerCase()}`}>
                        {signal.type}
                      </span>
                    </td>
                    <td><strong>{signal.pair}</strong></td>
                    <td>
                      {signal.entry.min} - {signal.entry.max}
                      {signal.entry.userEntry && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          (User: {signal.entry.userEntry})
                        </div>
                      )}
                    </td>
                    <td>
                      {signal.targets.map((target, idx) => (
                        <div
                          key={idx}
                          style={{
                            color: target.reached ? '#10b981' : '#94a3b8',
                            textDecoration: target.reached ? 'line-through' : 'none'
                          }}
                        >
                          TP{idx + 1}: {target.level}
                          {target.reached && ' ✓'}
                        </div>
                      ))}
                    </td>
                    <td>{signal.stopLoss}</td>
                    <td>
                      {signal.reachedTargets} / {signal.targets.length}
                    </td>
                    <td>{getStatusBadge(signal.status)}</td>
                    <td>
                      <button
                        onClick={() => setUpdatingSignal(signal)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          background: '#3b82f6',
                          border: 'none',
                          borderRadius: '0.375rem',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Signals

