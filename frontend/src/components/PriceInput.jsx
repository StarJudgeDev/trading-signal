import { useState } from 'react'
import axios from 'axios'

const API_BASE = '/api'

function PriceInput({ signal, onPriceUpdated, onCancel }) {
  const [price, setPrice] = useState('')
  const [priceDateTime, setPriceDateTime] = useState(new Date().toISOString().slice(0, 16))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      // Reset form
      setPrice('')
      setPriceDateTime(new Date().toISOString().slice(0, 16))

      if (onPriceUpdated) {
        onPriceUpdated(response.data)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update price')
      console.error('Error updating price:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3>Update Price: {signal.pair}</h3>
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
        <div><strong>Current Price:</strong> {signal.currentPrice || 'N/A'}</div>
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
            placeholder="Enter current token price"
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
          <strong>Note:</strong> If the price reaches or exceeds any target (TP), it will be automatically marked as reached.
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
              Cancel
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
            {loading ? 'Updating...' : 'Update Price'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PriceInput
