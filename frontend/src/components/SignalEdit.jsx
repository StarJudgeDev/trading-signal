import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import PriceInput from './PriceInput'
import UpdateSignal from './UpdateSignal'

const API_BASE = '/api'

// Helper to format datetime for input
const formatDateTimeForInput = (timestamp) => {
  const dt = new Date(timestamp)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  const hours = String(dt.getHours()).padStart(2, '0')
  const minutes = String(dt.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function SignalEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [signal, setSignal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPriceInput, setShowPriceInput] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [editingPriceIndex, setEditingPriceIndex] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editDateTime, setEditDateTime] = useState('')

  useEffect(() => {
    fetchSignal()
  }, [id])

  const fetchSignal = async () => {
    try {
      setLoading(true)
      const res = await axios.get(`${API_BASE}/signals/${id}`)
      setSignal(res.data)
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to load signal')
      console.error('Error fetching signal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePriceUpdated = (data) => {
    if (data.signal) {
      setSignal(data.signal)
    } else {
      fetchSignal() // Refresh signal data
    }
    if (data.newTargetsReached > 0) {
      alert(`${data.newTargetsReached} target(s) reached!`)
    }
  }

  const handleSignalUpdated = () => {
    setShowUpdateForm(false)
    fetchSignal()
  }

  const startEdit = (index, priceEntry) => {
    setEditingPriceIndex(index)
    setEditPrice(String(priceEntry.price))
    setEditDateTime(formatDateTimeForInput(priceEntry.timestamp))
  }

  const handleEditPrice = async () => {
    if (editingPriceIndex === null || !signal) return
    
    try {
      await axios.put(`${API_BASE}/signals/${signal._id}/price/${editingPriceIndex}`, {
        price: parseFloat(editPrice),
        timestamp: editDateTime ? new Date(editDateTime).toISOString() : signal.priceHistory[editingPriceIndex].timestamp
      })
      
      await fetchSignal()
      setEditingPriceIndex(null)
      setEditPrice('')
      setEditDateTime('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update price')
    }
  }

  const handleDeletePrice = async (index) => {
    if (window.confirm('Are you sure you want to delete this price entry? This will recalculate all targets.')) {
      try {
        await axios.delete(`${API_BASE}/signals/${signal._id}/price/${index}`)
        await fetchSignal()
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete price')
      }
    }
  }

  if (loading) {
    return <div className="loading">Loading signal...</div>
  }

  if (error && !signal) {
    return (
      <div>
        <div style={{ padding: '1rem', background: '#7f1d1d', color: '#fca5a5', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          {error}
        </div>
        <button
          onClick={() => navigate('/signals')}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Back to Signals
        </button>
      </div>
    )
  }

  if (!signal) {
    return <div className="loading">Signal not found</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <button
            onClick={() => navigate('/signals')}
            style={{
              padding: '0.5rem 1rem',
              background: '#334155',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#e2e8f0',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            ← Back to Signals
          </button>
          <h2 style={{ display: 'inline' }}>Edit Signal: {signal.pair}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowPriceInput(!showPriceInput)}
            style={{
              padding: '0.75rem 1.5rem',
              background: showPriceInput ? '#475569' : '#10b981',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {showPriceInput ? 'Cancel' : '+ Add Price'}
          </button>
          <button
            onClick={() => setShowUpdateForm(!showUpdateForm)}
            style={{
              padding: '0.75rem 1.5rem',
              background: showUpdateForm ? '#475569' : '#3b82f6',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            {showUpdateForm ? 'Cancel' : 'Update Signal'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem',
          background: '#7f1d1d',
          border: '1px solid #ef4444',
          borderRadius: '0.5rem',
          color: '#fca5a5',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      {showPriceInput && (
        <PriceInput
          signal={signal}
          onPriceUpdated={handlePriceUpdated}
          onCancel={() => setShowPriceInput(false)}
        />
      )}

      {showUpdateForm && (
        <UpdateSignal
          signal={signal}
          onUpdate={handleSignalUpdated}
          onCancel={() => setShowUpdateForm(false)}
        />
      )}

      {/* Signal Information */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3>Signal Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Channel</div>
            <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{signal.channelName}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Type</div>
            <div>
              <span className={`badge ${signal.type.toLowerCase()}`}>{signal.type}</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Pair</div>
            <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{signal.pair}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</div>
            <div>
              <span className={`badge ${signal.status.toLowerCase()}`}>{signal.status}</span>
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Entry Range</div>
            <div style={{ color: '#e2e8f0' }}>
              {signal.entry.min} - {signal.entry.max}
              {signal.entry.userEntry && (
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  User Entry: {signal.entry.userEntry}
                </div>
              )}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Stop Loss</div>
            <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{signal.stopLoss}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Latest Price</div>
            <div style={{ color: '#e2e8f0', fontWeight: '600' }}>{signal.currentPrice || 'N/A'}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Reached Targets</div>
            <div style={{ color: '#e2e8f0', fontWeight: '600' }}>
              {signal.reachedTargets || 0} / {signal.targets.length}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Created At</div>
            <div style={{ color: '#e2e8f0' }}>{new Date(signal.createdAt).toLocaleString()}</div>
          </div>
          {signal.leverage && (
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Leverage</div>
              <div style={{ color: '#e2e8f0' }}>{signal.leverage}</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #334155' }}>
          <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Targets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {signal.targets.map((target, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.75rem',
                  background: target.reached ? '#064e3b' : '#1e293b',
                  border: `1px solid ${target.reached ? '#10b981' : '#334155'}`,
                  borderRadius: '0.5rem',
                  minWidth: '120px'
                }}
              >
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.25rem' }}>TP{idx + 1}</div>
                <div style={{ 
                  color: target.reached ? '#10b981' : '#e2e8f0', 
                  fontWeight: '600',
                  textDecoration: target.reached ? 'line-through' : 'none'
                }}>
                  {target.level}
                </div>
                {target.reached && target.reachedAt && (
                  <div style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    ✓ Reached: {new Date(target.reachedAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price History Table */}
      <div className="card">
        <h3>Price History ({signal.priceHistory?.length || 0})</h3>
        {signal.priceHistory && signal.priceHistory.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...signal.priceHistory].reverse().map((priceEntry, idx) => {
                  const originalIndex = signal.priceHistory.length - 1 - idx
                  const isEditing = editingPriceIndex === originalIndex
                  
                  return (
                    <tr key={idx}>
                      <td style={{ color: '#e2e8f0' }}>
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={editDateTime}
                            onChange={(e) => setEditDateTime(e.target.value)}
                            style={{
                              padding: '0.5rem',
                              background: '#1e293b',
                              border: '1px solid #475569',
                              borderRadius: '0.25rem',
                              color: '#e2e8f0',
                              fontSize: '0.875rem'
                            }}
                          />
                        ) : (
                          new Date(priceEntry.timestamp).toLocaleString()
                        )}
                      </td>
                      <td style={{ textAlign: 'right', color: '#e2e8f0', fontWeight: '600' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            style={{
                              padding: '0.5rem',
                              background: '#1e293b',
                              border: '1px solid #475569',
                              borderRadius: '0.25rem',
                              color: '#e2e8f0',
                              fontSize: '0.875rem',
                              width: '120px',
                              textAlign: 'right'
                            }}
                          />
                        ) : (
                          priceEntry.price
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={handleEditPrice}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPriceIndex(null)
                                setEditPrice('')
                                setEditDateTime('')
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#475569',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => startEdit(originalIndex, priceEntry)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#3b82f6',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePrice(originalIndex)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
            No price history yet. Click "Add Price" to add the first price entry.
          </div>
        )}
      </div>
    </div>
  )
}

export default SignalEdit
