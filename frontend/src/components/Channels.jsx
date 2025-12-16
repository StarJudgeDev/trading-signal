import { useEffect, useState } from 'react'
import axios from 'axios'
import AddChannel from './AddChannel'

const API_BASE = '/api'

function Channels() {
  const [channels, setChannels] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [channelStats, setChannelStats] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchChannels()
  }, [])

  useEffect(() => {
    if (selectedChannel) {
      fetchChannelStats(selectedChannel)
    }
  }, [selectedChannel])

  const fetchChannels = async () => {
    try {
      const res = await axios.get(`${API_BASE}/channels`)
      setChannels(res.data)
    } catch (error) {
      console.error('Error fetching channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChannelStats = async (channelId) => {
    try {
      const res = await axios.get(`${API_BASE}/channels/${channelId}/stats`)
      setChannelStats(res.data)
    } catch (error) {
      console.error('Error fetching channel stats:', error)
    }
  }

  const handleChannelAdded = () => {
    setShowAddForm(false)
    fetchChannels()
  }

  if (loading) {
    return <div className="loading">Loading channels...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Telegram Channels</h2>
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
          {showAddForm ? 'Cancel' : '+ Add Channel'}
        </button>
      </div>

      {showAddForm && (
        <AddChannel
          onChannelAdded={handleChannelAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}
      
      <div className="card">
        <h3>Channel List ({channels.length})</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Telegram ID</th>
              <th>Total Signals</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No channels found
                </td>
              </tr>
            ) : (
              channels.map((channel) => (
                <tr key={channel._id}>
                  <td><strong>{channel.name}</strong></td>
                  <td>@{channel.username || 'N/A'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {channel.telegramId}
                  </td>
                  <td>{channel.totalSignals}</td>
                  <td>
                    <span className={`badge ${channel.isActive ? 'active' : 'stopped'}`}>
                      {channel.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedChannel(channel._id)}
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
                      View Stats
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {channelStats && (
        <div className="card">
          <h3>Channel Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">Total Signals</div>
              <div className="value">{channelStats.totalSignals}</div>
            </div>
            <div className="stat-card">
              <div className="label">Active</div>
              <div className="value">{channelStats.active}</div>
            </div>
            <div className="stat-card">
              <div className="label">Completed</div>
              <div className="value">{channelStats.completed}</div>
            </div>
            <div className="stat-card">
              <div className="label">Stopped</div>
              <div className="value">{channelStats.stopped}</div>
            </div>
            <div className="stat-card">
              <div className="label">Partial</div>
              <div className="value">{channelStats.partial}</div>
            </div>
            <div className="stat-card">
              <div className="label">Win Rate</div>
              <div className="value">{channelStats.winRate}%</div>
              <div className="sub-value">
                {channelStats.totalWins} wins / {channelStats.totalLosses} losses
              </div>
            </div>
            <div className="stat-card">
              <div className="label">Avg Targets Reached</div>
              <div className="value">{channelStats.averageTargetsReached}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Channels

