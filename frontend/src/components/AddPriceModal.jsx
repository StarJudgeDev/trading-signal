import { useState, useEffect } from 'react'
import axios from 'axios'
import Modal from './Modal'

const API_BASE = '/api'

// Helper function to get current local datetime in format for datetime-local input
const getCurrentLocalDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function AddPriceModal({ isOpen, onClose, signal, onPriceAdded }) {
  const [price, setPrice] = useState('')
  const [priceDateTime, setPriceDateTime] = useState(getCurrentLocalDateTime())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPrice('')
      setPriceDateTime(getCurrentLocalDateTime())
      setError('')
    }
  }, [isOpen])

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

      if (onPriceAdded) {
        onPriceAdded(response.data)
      }
      
      onClose()
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add price')
      console.error('Error adding price:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Price: ${signal?.pair || ''}`} size="medium">
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

      {signal && (
        <div style={{ marginBottom: '1rem', padding: '1rem', background: '#0f172a', borderRadius: '0.5rem' }}>
          <div><strong>Channel:</strong> {signal.channelName}</div>
          <div><strong>Type:</strong> {signal.type}</div>
          <div><strong>Status:</strong> {signal.status}</div>
          <div><strong>Latest Price:</strong> {signal.currentPrice || 'N/A'}</div>
          <div><strong>Reached Targets:</strong> {signal.reachedTargets || 0} / {signal.targets.length}</div>
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
          <strong>Note:</strong> If the price reaches or exceeds any target (TP), it will be automatically marked as reached.
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
    </Modal>
  )
}

export default AddPriceModal
