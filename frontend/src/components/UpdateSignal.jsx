import { useState, useEffect } from 'react'
import axios from 'axios'

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

function UpdateSignal({ signal, onUpdate, onCancel }) {
  const [updateType, setUpdateType] = useState('UPDATE')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState(signal?.status || 'ACTIVE')
  const [originalStatus, setOriginalStatus] = useState(signal?.status || 'ACTIVE')
  const [type, setType] = useState(signal?.type || 'LONG')
  const [symbol, setSymbol] = useState(signal?.symbol || '')
  const [pair, setPair] = useState(signal?.pair || '')
  const [entryMin, setEntryMin] = useState(signal?.entry?.min || '')
  const [entryMax, setEntryMax] = useState(signal?.entry?.max || '')
  const [userEntry, setUserEntry] = useState(signal?.entry?.userEntry || '')
  const [stopLoss, setStopLoss] = useState(signal?.stopLoss || '')
  const [leverage, setLeverage] = useState(signal?.leverage || '')
  const [targets, setTargets] = useState(signal?.targets?.map(t => t.level) || [''])
  const [createdAt, setCreatedAt] = useState(signal?.createdAt ? formatDateTimeForInput(signal.createdAt) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (signal) {
      setStatus(signal.status || 'ACTIVE')
      setOriginalStatus(signal.status || 'ACTIVE')
      setType(signal.type || 'LONG')
      setSymbol(signal.symbol || '')
      setPair(signal.pair || '')
      setEntryMin(signal.entry?.min || '')
      setEntryMax(signal.entry?.max || '')
      setUserEntry(signal.entry?.userEntry || '')
      setStopLoss(signal.stopLoss || '')
      setLeverage(signal.leverage || '')
      setTargets(signal.targets?.map(t => t.level) || [''])
      setCreatedAt(signal.createdAt ? formatDateTimeForInput(signal.createdAt) : '')
    }
  }, [signal])

  const handleTargetChange = (index, value) => {
    const newTargets = [...targets]
    newTargets[index] = value
    setTargets(newTargets)
  }

  const addTargetField = () => {
    setTargets([...targets, ''])
  }

  const removeTargetField = (index) => {
    const newTargets = targets.filter((_, i) => i !== index)
    setTargets(newTargets)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate targets
      const validTargets = targets
        .filter(t => t !== '' && !isNaN(t))
        .map(t => {
          const level = parseFloat(t)
          // Find existing target to preserve reached status
          const existingTarget = signal.targets?.find(et => et.level === level)
          return {
            level: level,
            reached: existingTarget?.reached || false,
            reachedAt: existingTarget?.reachedAt || null
          }
        })

      if (validTargets.length === 0) {
        setError('Please add at least one valid target')
        setLoading(false)
        return
      }

      let updatedSignal = { ...signal }

      // Update signal fields
      updatedSignal.status = status
      updatedSignal.type = type
      updatedSignal.entry = {
        min: parseFloat(entryMin),
        max: parseFloat(entryMax),
        userEntry: userEntry ? parseFloat(userEntry) : undefined
      }
      updatedSignal.stopLoss = parseFloat(stopLoss)
      updatedSignal.leverage = leverage || undefined
      updatedSignal.targets = validTargets

      // Add update message if provided
      if (message || updateType !== 'UPDATE') {
        updatedSignal.updates = updatedSignal.updates || []
        updatedSignal.updates.push({
          message: message || `Signal updated: ${updateType}`,
          type: updateType,
          timestamp: new Date()
        })
      }

      // Handle different update types
      if (updateType === 'SL_HIT') {
        updatedSignal.status = 'STOPPED'
      } else if (updateType === 'PROFIT_LOCKED') {
        // Keep current status but mark as partial if not already
        if (updatedSignal.status === 'ACTIVE') {
          updatedSignal.status = 'PARTIAL'
        }
      }

      updatedSignal.updatedAt = new Date()

      await axios.put(`${API_BASE}/signals/${signal._id}`, updatedSignal)

      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update signal')
      console.error('Error updating signal:', error)
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
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              <option value="ACTIVE">ACTIVE</option>
              <option value="PARTIAL">PARTIAL</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="STOPPED">STOPPED</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
              Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
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
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
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
              value={pair}
              onChange={(e) => setPair(e.target.value)}
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
              value={entryMin}
              onChange={(e) => setEntryMin(e.target.value)}
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
              value={entryMax}
              onChange={(e) => setEntryMax(e.target.value)}
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
              value={userEntry}
              onChange={(e) => setUserEntry(e.target.value)}
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
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
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
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
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
              Signal Date & Time
            </label>
            <input
              type="datetime-local"
              value={createdAt}
              onChange={(e) => setCreatedAt(e.target.value)}
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
        
        {status !== originalStatus && (
          <div style={{
            padding: '0.75rem',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: '#fbbf24'
          }}>
            <strong>Warning:</strong> Status changed from {originalStatus} to {status}. All target reached flags will be reset and price history will be cleared.
          </div>
        )}

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
          {targets.map((target, index) => (
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
              {targets.length > 1 && (
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
            Update Type *
          </label>
          <select
            value={updateType}
            onChange={(e) => {
              setUpdateType(e.target.value)
            }}
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
            <option value="PROFIT_LOCKED">Profit Locked / Breakeven</option>
            <option value="SL_HIT">Stop Loss Hit</option>
            <option value="UPDATE">General Update</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
            Update Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g., We've successfully hit two targets on this trade..."
            rows="3"
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
            {loading ? 'Updating...' : 'Update Signal'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UpdateSignal
