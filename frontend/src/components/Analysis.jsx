import { useEffect, useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const API_BASE = '/api'

const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899']

function Analysis() {
  const [comparison, setComparison] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComparison()
  }, [])

  const fetchComparison = async () => {
    try {
      const res = await axios.get(`${API_BASE}/analysis/channel-comparison`)
      setComparison(res.data)
    } catch (error) {
      console.error('Error fetching comparison:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading analysis...</div>
  }

  const sortedByWinRate = [...comparison].sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
  const sortedBySignals = [...comparison].sort((a, b) => b.totalSignals - a.totalSignals)

  return (
    <div>
      <h2>Channel Analysis & Comparison</h2>

      <div className="card">
        <h3>Win Rate Comparison</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedByWinRate.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="channelName" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
            <Legend />
            <Bar dataKey="winRate" fill="#3b82f6" name="Win Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3>Channel Performance Metrics</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Total Signals</th>
              <th>Win Rate</th>
              <th>Avg Targets Reached</th>
              <th>Completion Rate</th>
              <th>Stop Loss Rate</th>
            </tr>
          </thead>
          <tbody>
            {sortedByWinRate.map((channel, idx) => (
              <tr key={idx}>
                <td><strong>{channel.channelName}</strong></td>
                <td>{channel.totalSignals}</td>
                <td>
                  <span className={`win-rate ${parseFloat(channel.winRate) >= 60 ? 'high' : parseFloat(channel.winRate) >= 40 ? 'medium' : 'low'}`}>
                    {channel.winRate}%
                  </span>
                </td>
                <td>{channel.averageTargetsReached}</td>
                <td>{channel.completionRate}%</td>
                <td>{channel.stopLossRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Signal Volume Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sortedBySignals.slice(0, 6).map(ch => ({
                name: ch.channelName,
                value: ch.totalSignals
              }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {sortedBySignals.slice(0, 6).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Analysis

