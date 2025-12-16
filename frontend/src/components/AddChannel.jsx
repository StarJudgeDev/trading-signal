import { useState } from 'react'
import axios from 'axios'

const API_BASE = '/api'

function AddChannel({ onChannelAdded, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    telegramId: '',
    username: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.name) {
        setError('Channel name is required')
        setLoading(false)
        return
      }

      // Generate telegramId if not provided
      const telegramId = formData.telegramId || `manual_${Date.now()}`

      const channelData = {
        name: formData.name,
        telegramId: telegramId,
        username: formData.username || undefined,
        description: formData.description || undefined
      }

      await axios.post(`${API_BASE}/channels`, channelData)

      // Reset form
      setFormData({
        name: '',
        telegramId: '',
        username: '',
        description: ''
      })

      if (onChannelAdded) {
        onChannelAdded()
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create channel')
      console.error('Error creating channel:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3>Add New Channel</h3>
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

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Channel Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Trading Signals Channel"
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

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Telegram ID (optional, auto-generated if empty)
            </label>
            <input
              type="text"
              name="telegramId"
              value={formData.telegramId}
              onChange={handleChange}
              placeholder="Auto-generated"
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

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Username (optional)
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="@channel_username"
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

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Channel description..."
              rows="2"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#e2e8f0',
                resize: 'vertical'
              }}
            />
          </div>
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
            {loading ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddChannel

