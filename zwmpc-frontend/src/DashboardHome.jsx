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

  if (!stats || !analytics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <h2 style={{ color: 'var(--dark-pink)' }}>Loading Analytics...</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title */}
      <h2 className="page-title">Welcome, {user.username}</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '-10px', marginBottom: '30px', fontSize: '1.1rem' }}>
        {user.role === 'super_admin' ? 'System-Wide Overview' : 'Branch Overview'}
      </p>

      {/* STATS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Today's Sales */}
        <div className="theme-card" style={{ borderLeft: '5px solid var(--dark-pink)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            💰 Today's Sales
          </h3>
          <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-dark)' }}>
            ₱{parseFloat(stats.todays_sales).toFixed(2)}
          </h1>
        </div>

        {/* Today's Transactions */}
        <div className="theme-card" style={{ borderLeft: '5px solid var(--primary-pink)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            🛒 Today's Transactions
          </h3>
          <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-dark)' }}>
            {stats.todays_transactions}
          </h1>
        </div>

        {/* Total Products */}
        <div className="theme-card" style={{ borderLeft: '5px solid #888' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            📦 Total Products
          </h3>
          <h1 style={{ margin: 0, fontSize: '2.2rem', color: 'var(--text-dark)' }}>
            {stats.total_products}
          </h1>
        </div>

        {/* Low Stock Alerts (Red if > 0) */}
        <div className="theme-card" style={{ 
          borderLeft: stats.low_stock_count > 0 ? '5px solid #d32f2f' : '5px solid #2e7d32',
          background: stats.low_stock_count > 0 ? '#fff5f5' : 'var(--white)'
        }}>
          <h3 style={{ 
            margin: '0 0 10px 0', fontSize: '0.9rem', 
            color: stats.low_stock_count > 0 ? '#d32f2f' : 'var(--text-muted)', 
            textTransform: 'uppercase', letterSpacing: '1px' 
          }}>
            ⚠️ Low Stock Alerts
          </h3>
          <h1 style={{ 
            margin: 0, fontSize: '2.2rem', 
            color: stats.low_stock_count > 0 ? '#d32f2f' : 'var(--text-dark)' 
          }}>
            {stats.low_stock_count}
          </h1>
        </div>
      </div>

      {/* CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        
        {/* Revenue Trend Chart */}
        <div className="theme-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)', borderBottom: '2px solid #fdf2f5', paddingBottom: '10px' }}>
            Revenue Trend (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.salesTrend}>
              <XAxis dataKey="date" tick={{fill: 'var(--text-muted)'}} />
              <YAxis tick={{fill: 'var(--text-muted)'}} />
              <Tooltip 
                formatter={(value) => `₱${value}`} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
              />
              {/* Changed line color to match theme */}
              <Line type="monotone" dataKey="revenue" stroke="var(--dark-pink)" strokeWidth={3} dot={{r: 4, fill: 'var(--dark-pink)'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Chart */}
        <div className="theme-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)', borderBottom: '2px solid #fdf2f5', paddingBottom: '10px' }}>
            Top 5 Best-Selling Products
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topProducts}>
              <XAxis dataKey="name" tick={{fill: 'var(--text-muted)'}} />
              <YAxis tick={{fill: 'var(--text-muted)'}} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {/* Changed bar color to match theme */}
              <Bar dataKey="total_sold" fill="var(--primary-pink)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}