import { useState } from 'react'
import axios from 'axios'

const API_BASE = '/api'

function UpdateSignal({ signal, onUpdate, onCancel }) {
  const [updateType, setUpdateType] = useState('TP_REACHED')
  const [targetIndex, setTargetIndex] = useState('')
  const [targetCount, setTargetCount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let updatedSignal = { ...signal }

      // Add update message
      updatedSignal.updates = updatedSignal.updates || []
      updatedSignal.updates.push({
        message: message || `Target reached`,
        type: updateType,
        timestamp: new Date()
      })

      // Handle different update types
      if (updateType === 'TP_REACHED') {
        if (targetIndex !== '') {
          // Specific target index
          const index = parseInt(targetIndex) - 1
          if (index >= 0 && index < signal.targets.length && !signal.targets[index].reached) {
            updatedSignal.targets[index].reached = true
            updatedSignal.targets[index].reachedAt = new Date()
            updatedSignal.reachedTargets = (updatedSignal.reachedTargets || 0) + 1
          }
        } else if (targetCount !== '') {
          // Multiple targets (e.g., "hit two targets")
          const count = parseInt(targetCount)
          let marked = 0
          for (let i = 0; i < signal.targets.length && marked < count; i++) {
            if (!signal.targets[i].reached) {
              updatedSignal.targets[i].reached = true
              updatedSignal.targets[i].reachedAt = new Date()
              marked += 1
            }
          }
          updatedSignal.reachedTargets = (updatedSignal.reachedTargets || 0) + marked
        } else {
          // Mark next unreached target
          for (let i = 0; i < signal.targets.length; i++) {
            if (!signal.targets[i].reached) {
              updatedSignal.targets[i].reached = true
              updatedSignal.targets[i].reachedAt = new Date()
              updatedSignal.reachedTargets = (updatedSignal.reachedTargets || 0) + 1
              break
            }
          }
        }

        // Update status
        if (updatedSignal.reachedTargets === signal.targets.length) {
          updatedSignal.status = 'COMPLETED'
        } else if (updatedSignal.reachedTargets > 0) {
          updatedSignal.status = 'PARTIAL'
        }
      } else if (updateType === 'SL_HIT') {
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

  const unreachedTargets = signal.targets.filter(t => !t.reached)

  return (
    <div className="card">
      <h3>Update Signal: {signal.pair}</h3>
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
            Update Type *
          </label>
          <select
            value={updateType}
            onChange={(e) => {
              setUpdateType(e.target.value)
              setTargetIndex('')
              setTargetCount('')
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
            <option value="TP_REACHED">Target Reached (TP)</option>
            <option value="PROFIT_LOCKED">Profit Locked / Breakeven</option>
            <option value="SL_HIT">Stop Loss Hit</option>
            <option value="UPDATE">General Update</option>
          </select>
        </div>

        {updateType === 'TP_REACHED' && unreachedTargets.length > 0 && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                Specific Target (optional - leave empty to mark next unreached)
              </label>
              <select
                value={targetIndex}
                onChange={(e) => {
                  setTargetIndex(e.target.value)
                  setTargetCount('')
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  color: '#e2e8f0'
                }}
              >
                <option value="">Auto (next unreached)</option>
                {signal.targets.map((target, idx) => (
                  !target.reached && (
                    <option key={idx} value={idx + 1}>
                      TP{idx + 1}: {target.level}
                    </option>
                  )
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#94a3b8' }}>
                Or: Number of Targets Reached (e.g., "hit two targets")
              </label>
              <input
                type="number"
                min="1"
                max={unreachedTargets.length}
                value={targetCount}
                onChange={(e) => {
                  setTargetCount(e.target.value)
                  setTargetIndex('')
                }}
                placeholder="e.g., 2"
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
          </>
        )}

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

