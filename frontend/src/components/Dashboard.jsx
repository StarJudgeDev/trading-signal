import { useEffect, useState } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API_BASE = '/api'

function Dashboard({ overview, refreshTrigger, isActive }) {
  const [bestChannels, setBestChannels] = useState([])
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isActive) {
      fetchData()
    }
  }, [refreshTrigger, isActive])

  const fetchData = async () => {
    try {
      const [channelsRes, trendsRes] = await Promise.all([
        axios.get(`${API_BASE}/analysis/best-channels?limit=5`),
        axios.get(`${API_BASE}/analysis/trends?days=30`)
      ])
      setBestChannels(channelsRes.data)
      setTrends(trendsRes.data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div>
      <h2>Dashboard Overview</h2>
      
      {overview && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Channels</div>
            <div className="value">{overview.totalChannels}</div>
          </div>
          <div className="stat-card">
            <div className="label">Total Signals</div>
            <div className="value">{overview.totalSignals}</div>
          </div>
          <div className="stat-card">
            <div className="label">Active Signals</div>
            <div className="value">{overview.activeSignals}</div>
          </div>
          <div className="stat-card">
            <div className="label">Overall Win Rate</div>
            <div className="value">{overview.overallWinRate}%</div>
            <div className="sub-value">
              {overview.totalWins} wins / {overview.totalLosses} losses
            </div>
          </div>
          <div className="stat-card">
            <div className="label">Completed</div>
            <div className="value">{overview.completedSignals}</div>
          </div>
          <div className="stat-card">
            <div className="label">Stopped</div>
            <div className="value">{overview.stoppedSignals}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Best Performing Channels</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Total Signals</th>
              <th>Win Rate</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Avg Targets Reached</th>
            </tr>
          </thead>
          <tbody>
            {bestChannels.map((channel) => (
              <tr key={channel.channelId}>
                <td>{channel.channelName}</td>
                <td>{channel.totalSignals}</td>
                <td>
                  <span className={`win-rate ${parseFloat(channel.winRate) >= 60 ? 'high' : parseFloat(channel.winRate) >= 40 ? 'medium' : 'low'}`}>
                    {channel.winRate}%
                  </span>
                </td>
                <td>{channel.wins}</td>
                <td>{channel.losses}</td>
                <td>{channel.averageTargetsReached}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trends.length > 0 && (
        <div className="card">
          <h3>30-Day Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Signals" />
              <Line type="monotone" dataKey="wins" stroke="#10b981" name="Wins" />
              <Line type="monotone" dataKey="losses" stroke="#ef4444" name="Losses" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default Dashboard

