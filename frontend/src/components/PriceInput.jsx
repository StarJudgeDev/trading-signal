import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = '/api'

// Helper function to get current local datetime in format for datetime-local input
const getCurrentLocalDateTime = () => {
  const now = new Date()
  // Convert to local time string in YYYY-MM-DDTHH:mm format
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

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

function PriceInput({ signal: initialSignal, onPriceUpdated, onCancel }) {
  const [signal, setSignal] = useState(initialSignal)
  const [price, setPrice] = useState('')
  const [priceDateTime, setPriceDateTime] = useState(getCurrentLocalDateTime())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingPriceIndex, setEditingPriceIndex] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editDateTime, setEditDateTime] = useState('')

  // Update signal when initialSignal changes
  useEffect(() => {
    setSignal(initialSignal)
  }, [initialSignal])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!price || isNaN(price)) {
        setError('Please enter a valid price')
        setLoading(false)
        return
      }

      const response = await axios.post(`${API_BASE}/signals/${signal._id}/price`, {
        price: parseFloat(price),
        timestamp: priceDateTime ? new Date(priceDateTime).toISOString() : new Date().toISOString()
      })

      // Reset form but keep it open for adding more prices
      setPrice('')
      setPriceDateTime(getCurrentLocalDateTime())

      // Refresh signal data to get updated price history
      try {
        const updatedSignalRes = await axios.get(`${API_BASE}/signals/${signal._id}`)
        setSignal(updatedSignalRes.data) // Update local state with fresh data
        if (onPriceUpdated) {
          onPriceUpdated({ ...response.data, signal: updatedSignalRes.data })
        }
      } catch (err) {
        // If refresh fails, still call callback with original response
        if (onPriceUpdated) {
          onPriceUpdated(response.data)
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add price')
      console.error('Error adding price:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (index, priceEntry) => {
    setEditingPriceIndex(index)
    setEditPrice(String(priceEntry.price))
    setEditDateTime(formatDateTimeForInput(priceEntry.timestamp))
  }

  const handleEditPrice = async () => {
    if (editingPriceIndex === null) return
    
    try {
      const response = await axios.put(`${API_BASE}/signals/${signal._id}/price/${editingPriceIndex}`, {
        price: parseFloat(editPrice),
        timestamp: editDateTime ? new Date(editDateTime).toISOString() : signal.priceHistory[editingPriceIndex].timestamp
      })
      
      const updatedSignalRes = await axios.get(`${API_BASE}/signals/${signal._id}`)
      setSignal(updatedSignalRes.data)
      setEditingPriceIndex(null)
      setEditPrice('')
      setEditDateTime('')
      if (onPriceUpdated) {
        onPriceUpdated({ signal: updatedSignalRes.data })
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update price')
    }
  }

  const handleDeletePrice = async (index) => {
    if (window.confirm('Are you sure you want to delete this price entry? This will recalculate all targets.')) {
      try {
        await axios.delete(`${API_BASE}/signals/${signal._id}/price/${index}`)
        const updatedSignalRes = await axios.get(`${API_BASE}/signals/${signal._id}`)
        setSignal(updatedSignalRes.data)
        if (onPriceUpdated) {
          onPriceUpdated({ signal: updatedSignalRes.data })
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to delete price')
      }
    }
  }

  return (
    <div className="card">
      <h3>Add Price: {signal.pair}</h3>
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

      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '0.5rem' }}>
        <div><strong>Channel:</strong> {signal.channelName}</div>
        <div><strong>Type:</strong> {signal.type}</div>
        <div><strong>Status:</strong> {signal.status}</div>
        <div><strong>Latest Price:</strong> {signal.currentPrice || 'N/A'}</div>
        <div><strong>Reached Targets:</strong> {signal.reachedTargets || 0} / {signal.targets.length}</div>
        <div style={{ marginTop: '0.5rem' }}>
          <strong>Targets:</strong>
          {signal.targets.map((target, idx) => (
            <span
              key={idx}
              style={{
                marginLeft: '0.5rem',
                color: target.reached ? '#10b981' : '#94a3b8',
                textDecoration: target.reached ? 'line-through' : 'none'
              }}
            >
              TP{idx + 1}: {target.level} {target.reached && '✓'}
            </span>
          ))}
        </div>
      </div>

      {signal.priceHistory && signal.priceHistory.length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '0.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#e2e8f0' }}>Price History ({signal.priceHistory.length})</h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem', color: '#94a3b8' }}>Date & Time</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem', color: '#94a3b8' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem', color: '#94a3b8' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...signal.priceHistory].reverse().map((priceEntry, idx) => {
                  const originalIndex = signal.priceHistory.length - 1 - idx
                  const isEditing = editingPriceIndex === originalIndex
                  
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.5rem', color: '#e2e8f0' }}>
                        {isEditing ? (
                          <input
                            type="datetime-local"
                            value={editDateTime}
                            onChange={(e) => setEditDateTime(e.target.value)}
                            style={{
                              padding: '0.25rem',
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
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: '#e2e8f0', fontWeight: '600' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="any"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            style={{
                              padding: '0.25rem',
                              background: '#1e293b',
                              border: '1px solid #475569',
                              borderRadius: '0.25rem',
                              color: '#e2e8f0',
                              fontSize: '0.875rem',
                              width: '100px',
                              textAlign: 'right'
                            }}
                          />
                        ) : (
                          priceEntry.price
                        )}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={handleEditPrice}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#10b981',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
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
                                padding: '0.25rem 0.5rem',
                                background: '#475569',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => startEdit(originalIndex, priceEntry)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#3b82f6',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePrice(originalIndex)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#ef4444',
                                border: 'none',
                                borderRadius: '0.25rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
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
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
            Token Price *
          </label>
          <input
            type="number"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Enter token price"
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#e2e8f0'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
            Price Date & Time (default: current)
          </label>
          <input
            type="datetime-local"
            value={priceDateTime}
            onChange={(e) => setPriceDateTime(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#e2e8f0'
            }}
          />
        </div>

        <div style={{ 
          padding: '0.75rem', 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          <strong>Note:</strong> You can add multiple prices over time. If the price reaches or exceeds any target (TP), it will be automatically marked as reached. The latest price will be saved as the current price. You can edit or delete price history entries to recalculate targets.
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#334155',
                border: '1px solid #475569',
                borderRadius: '0.5rem',
                color: '#e2e8f0',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading ? '#475569' : '#3b82f6',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Adding...' : 'Add Price'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PriceInput
