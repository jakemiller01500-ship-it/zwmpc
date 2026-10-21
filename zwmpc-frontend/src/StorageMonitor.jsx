import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StorageMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/system/storage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch system data');
      } finally {
        setLoading(false);
      }
    };
    fetchStorage();
  }, [API_URL, token]);

  // Helper to format bytes into readable GB/MB
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return <h2>Running Linux commands on Render... (If server is asleep, this takes 50s)</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;
  if (!data) return <h2>No data</h2>;

  // Calculate Percentages
  const usedPercent = ((data.disk.usedBytes / data.disk.totalBytes) * 100).toFixed(1);
  const appPercent = ((data.appSize / data.disk.totalBytes) * 100).toFixed(1);

  // Data for the Donut Chart
  const chartData = [
    { name: 'Application files', value: data.appSize, color: '#0066cc' }, // Blue
    { name: 'Other used', value: data.otherUsed, color: '#f5a623' }, // Orange
    { name: 'Free', value: data.disk.freeBytes, color: '#e0e0e0' } // Gray
  ];

  // Warning Level Logic
  let statusText = 'NORMAL';
  let statusColor = 'green';
  if (usedPercent > 85) { statusText = 'CRITICAL'; statusColor = 'red'; }
  else if (usedPercent > 70) { statusText = 'WARNING'; statusColor = 'orange'; }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      
      {/* Top Header Bar */}
      <div style={{ background: '#0b1f3a', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div><strong>Capstone Admin Console</strong> | Storage Monitor</div>
        <div>Signed in as: <strong>{user.username}</strong></div>
      </div>

      <h2 style={{ color: '#333' }}>Server storage and stored files</h2>

      {/* Chart Card */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        
        <div style={{ width: '300px', height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} stroke="none">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatBytes(value)} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginLeft: '40px', fontSize: '1.2rem' }}>
          <p>
            <strong>{formatBytes(data.disk.usedBytes)}</strong> of <strong>{formatBytes(data.disk.totalBytes)}</strong> used ({usedPercent}%) - 
            <span style={{ color: statusColor, fontWeight: 'bold', marginLeft: '5px' }}>{statusText}</span>. 
            <br/> Application files: <strong>{formatBytes(data.appSize)}</strong> ({appPercent}%)
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '12px 15px' }}>File</th>
              <th style={{ padding: '12px 15px' }}>Path</th>
              <th style={{ padding: '12px 15px' }}>Size (largest first)</th>
              <th style={{ padding: '12px 15px' }}>Modified</th>
            </tr>
          </thead>
          <tbody>
            {data.files.map((file, index) => {
              // Split path to get just the file name
              const fileName = file.path.split('/').pop();
              return (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 15px', color: '#0066cc' }}>{fileName}</td>
                  <td style={{ padding: '10px 15px', color: '#555' }}>{file.path}</td>
                  <td style={{ padding: '10px 15px' }}>{formatBytes(file.size)}</td>
                  <td style={{ padding: '10px 15px', color: '#555' }}>{file.modified}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '20px', padding: '10px', background: '#e9ecef', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
        <div>Logged in to Capstone as: <strong>{user.username}</strong> ({user.role})</div>
        <div>{new Date().toLocaleString()}</div>
      </div>

    </div>
  );
}