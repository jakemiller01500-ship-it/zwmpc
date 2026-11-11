import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [resStats, resAnalytics] = await Promise.all([
          axios.get(`${API_URL}/api/dashboard/stats`, config),
          axios.get(`${API_URL}/api/dashboard/analytics`, config)
        ]);
        setStats(resStats.data);
        setAnalytics(resAnalytics.data);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, [API_URL, token]);

  if (!stats || !analytics) return <h2>Loading Analytics...</h2>;

  return (
    <div>
      <h1 style={{ marginBottom: '5px' }}>Welcome, {user.username}</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        {user.role === 'super_admin' ? 'System-Wide Overview' : 'Branch Overview'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Today's Sales</h3>
          <h1 style={styles.cardValue}>₱{parseFloat(stats.todays_sales).toFixed(2)}</h1>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Today's Transactions</h3>
          <h1 style={styles.cardValue}>{stats.todays_transactions}</h1>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Total Products</h3>
          <h1 style={styles.cardValue}>{stats.total_products}</h1>
        </div>
        <div style={{ ...styles.card, background: stats.low_stock_count > 0 ? '#ffebee' : 'white' }}>
          <h3 style={{...styles.cardTitle, color: stats.low_stock_count > 0 ? '#d32f2f' : '#666'}}>Low Stock Alerts</h3>
          <h1 style={{...styles.cardValue, color: stats.low_stock_count > 0 ? '#d32f2f' : '#333'}}>{stats.low_stock_count}</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={styles.chartCard}>
          <h3>Revenue Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.salesTrend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `₱${value}`} />
              <Line type="monotone" dataKey="revenue" stroke="#0066cc" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3>Top 5 Best-Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topProducts}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_sold" fill="#4caf50" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '1rem', color: '#666' },
  cardValue: { margin: 0, fontSize: '2rem', color: '#333' },
  chartCard: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }
};