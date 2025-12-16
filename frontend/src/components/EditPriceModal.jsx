import { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from './Modal'

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

function EditPriceModal({ isOpen, onClose, signal, priceEntry, priceIndex, onPriceUpdated }) {
  const [price, setPrice] = useState('')
  const [priceDateTime, setPriceDateTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && priceEntry) {
      setPrice(String(priceEntry.price))
      setPriceDateTime(formatDateTimeForInput(priceEntry.timestamp))
      setError('')
    }
  }, [isOpen, priceEntry])

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

      await axios.put(`${API_BASE}/signals/${signal._id}/price/${priceIndex}`, {
        price: parseFloat(price),
        timestamp: priceDateTime ? new Date(priceDateTime).toISOString() : priceEntry.timestamp
      })

      if (onPriceUpdated) {
        onPriceUpdated()
      }
      
      onClose()
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update price')
      console.error('Error updating price:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!priceEntry || !signal) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Price Entry" size="medium">
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
        <div><strong>Pair:</strong> {signal.pair}</div>
        <div><strong>Type:</strong> {signal.type}</div>
        <div><strong>Original Date:</strong> {new Date(priceEntry.timestamp).toLocaleString()}</div>
        <div><strong>Original Price:</strong> {priceEntry.price}</div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
            Price *
          </label>
          <input
            type="number"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            autoFocus
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
            Date & Time *
          </label>
          <input
            type="datetime-local"
            value={priceDateTime}
            onChange={(e) => setPriceDateTime(e.target.value)}
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

        <div style={{ 
          padding: '0.75rem', 
          background: '#1e293b', 
          border: '1px solid #334155', 
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          <strong>Note:</strong> Updating this price will recalculate all targets based on the entire price history.
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#334155',
              border: '1px solid #475569',
              borderRadius: '0.5rem',
              color: '#e2e8f0',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: loading ? '#475569' : '#10b981',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'Updating...' : 'Update Price'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EditPriceModal
