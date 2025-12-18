import { useState, useEffect } from 'react'
import axios from 'axios'

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

function AddSignal({ onSignalAdded, onCancel }) {
  const [channels, setChannels] = useState([])
  const [formData, setFormData] = useState({
    channelId: '',
    type: 'LONG',
    symbol: '',
    pair: '',
    entryMin: '',
    entryMax: '',
    userEntry: '',
    stopLoss: '',
    risk: '',
    leverage: '',
    targets: [''],
    signalDateTime: getCurrentLocalDateTime() // Default to current local date/time
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API_BASE}/channels`)
      setChannels(res.data)
      if (res.data.length > 0) {
        setFormData(prev => ({ ...prev, channelId: res.data[0]._id }))
      }
    } catch (error) {
      console.error('Error fetching channels:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleTargetChange = (index, value) => {
    const newTargets = [...formData.targets]
    newTargets[index] = value
    setFormData(prev => ({ ...prev, targets: newTargets }))
  }

  const addTargetField = () => {
    setFormData(prev => ({ ...prev, targets: [...prev.targets, ''] }))
  }

  const removeTargetField = (index) => {
    const newTargets = formData.targets.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, targets: newTargets }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.channelId || !formData.symbol || !formData.entryMin || !formData.entryMax || !formData.stopLoss) {
        setError('Please fill in all required fields')
        setLoading(false)
        return
      }

      // Filter out empty targets
      const validTargets = formData.targets
        .filter(t => t.trim() !== '')
        .map(t => ({
          level: parseFloat(t),
          reached: false,
          reachedAt: null
        }))

      if (validTargets.length === 0) {
        setError('Please add at least one target')
        setLoading(false)
        return
      }

      // Get channel info
      const channel = channels.find(c => c._id === formData.channelId)
      if (!channel) {
        setError('Channel not found')
        setLoading(false)
        return
      }

      // Determine pair if not provided
      let pair = formData.pair
      if (!pair && formData.symbol) {
        pair = formData.symbol.includes('/') ? formData.symbol : `${formData.symbol}/USDT`
      }

      // Parse date/time or use current date/time
      const signalDate = formData.signalDateTime 
        ? new Date(formData.signalDateTime)
        : new Date()

      const signalData = {
        channelId: formData.channelId,
        channelName: channel.name,
        messageId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: formData.type,
        symbol: formData.symbol.split('/')[0] || formData.symbol,
        pair: pair,
        entry: {
          min: parseFloat(formData.entryMin),
          max: parseFloat(formData.entryMax),
          userEntry: formData.userEntry ? parseFloat(formData.userEntry) : undefined
        },
        targets: validTargets,
        stopLoss: parseFloat(formData.stopLoss),
        leverage: formData.leverage || undefined,
        status: 'ACTIVE',
        createdAt: signalDate
      }

      await axios.post(`${API_BASE}/signals`, signalData)
      
      // Reset form
      setFormData({
        channelId: channels.length > 0 ? channels[0]._id : '',
        type: 'LONG',
        symbol: '',
        pair: '',
        entryMin: '',
        entryMax: '',
        userEntry: '',
        stopLoss: '',
        risk: '',
        leverage: '',
        targets: [''],
        signalDateTime: getCurrentLocalDateTime()
      })

      if (onSignalAdded) {
        onSignalAdded()
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create signal')
      console.error('Error creating signal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
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
              Channel *
            </label>
            <select
              name="channelId"
              value={formData.channelId}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#e2e8f0'
              }}
            >
              <option value="">Select Channel</option>
              {channels.map(ch => (
                <option key={ch._id} value={ch._id}>{ch.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: '#e2e8f0'
              }}
            >
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Symbol *
            </label>
            <input
              type="text"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="BAS or BTC"
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
              Pair (optional, auto: SYMBOL/USDT)
            </label>
            <input
              type="text"
              name="pair"
              value={formData.pair}
              onChange={handleChange}
              placeholder="BAS/USDT"
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
              Entry Min *
            </label>
            <input
              type="number"
              step="any"
              name="entryMin"
              value={formData.entryMin}
              onChange={handleChange}
              placeholder="0.007035"
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
              Entry Max *
            </label>
            <input
              type="number"
              step="any"
              name="entryMax"
              value={formData.entryMax}
              onChange={handleChange}
              placeholder="0.008205"
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
              User Entry (optional)
            </label>
            <input
              type="number"
              step="any"
              name="userEntry"
              value={formData.userEntry}
              onChange={handleChange}
              placeholder="0.007500"
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
              Stop Loss *
            </label>
            <input
              type="number"
              step="any"
              name="stopLoss"
              value={formData.stopLoss}
              onChange={handleChange}
              placeholder="0.006350"
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
              Leverage (optional)
            </label>
            <input
              type="text"
              name="leverage"
              value={formData.leverage}
              onChange={handleChange}
              placeholder="2x-3x"
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
              Signal Date & Time (default: current)
            </label>
            <input
              type="datetime-local"
              name="signalDateTime"
              value={formData.signalDateTime}
              onChange={handleChange}
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
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ color: '#94a3b8' }}>Targets (TP) *</label>
            <button
              type="button"
              onClick={addTargetField}
              style={{
                padding: '0.25rem 0.75rem',
                background: '#10b981',
                border: 'none',
                borderRadius: '0.375rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              + Add Target
            </button>
          </div>
          {formData.targets.map((target, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="number"
                step="any"
                value={target}
                onChange={(e) => handleTargetChange(index, e.target.value)}
                placeholder={`TP${index + 1}`}
                required={index === 0}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  color: '#e2e8f0'
                }}
              />
              {formData.targets.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTargetField(index)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
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
            {loading ? 'Creating...' : 'Create Signal'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddSignal

