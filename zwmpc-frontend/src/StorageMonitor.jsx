import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StorageMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // false = Largest first
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  // Use useCallback so we can call this from setInterval without dependency warnings
  const fetchStorage = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/system/storage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    let timeoutId;
    
    const fetchData = async () => {
      await fetchStorage();
      // Schedule the next fetch (60s prevents overlapping requests if Render is asleep)
      timeoutId = setTimeout(fetchData, 60000); 
    };
    
    fetchData();
    return () => clearTimeout(timeoutId);
  }, [fetchStorage]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- SORTING LOGIC ---
  const sortedFiles = data ? [...data.files].sort((a, b) => {
    return sortAsc ? a.size - b.size : b.size - a.size;
  }) : [];

  if (loading && !data) return <h2>Running Linux commands on Render... (If server is asleep, this takes 50s)</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;
  if (!data) return <h2>No data</h2>;

  // Disk Calculations
  const usedPercent = ((data.disk.usedBytes / data.disk.totalBytes) * 100).toFixed(1);
  const appPercent = ((data.appSize / data.disk.totalBytes) * 100).toFixed(1);
  const inodePercent = ((data.inodes.used / data.inodes.total) * 100).toFixed(1);

  const chartData = [
    { name: 'Application files', value: data.appSize, color: '#0066cc' },
    { name: 'Other used', value: data.otherUsed, color: '#f5a623' },
    { name: 'Free', value: data.disk.freeBytes, color: '#e0e0e0' }
  ];

  let statusText = 'NORMAL';
  let statusColor = 'green';
  if (usedPercent > 85) { statusText = 'CRITICAL'; statusColor = 'red'; }
  else if (usedPercent > 70) { statusText = 'WARNING'; statusColor = 'orange'; }

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      
      <div style={{ background: '#0b1f3a', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div><strong>Capstone Admin Console</strong> | Storage Monitor</div>
        <div>Signed in as: <strong>{user.username}</strong></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#333', margin: 0 }}>Server storage and stored files</h2>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          Live (Auto-refreshes every 60s) | Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: '15px' }}>
        
        {/* Disk Graph */}
        <div style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '250px', height: '200px' }}>
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
          <div style={{ marginLeft: '20px', fontSize: '1.1rem' }}>
            <p>
              <strong>{formatBytes(data.disk.usedBytes)}</strong> of <strong>{formatBytes(data.disk.totalBytes)}</strong> used ({usedPercent}%) - 
              <span style={{ color: statusColor, fontWeight: 'bold', marginLeft: '5px' }}>{statusText}</span>. 
              <br/> Application files: <strong>{formatBytes(data.appSize)}</strong> ({appPercent}%)
            </p>
          </div>
        </div>

        {/* Inode Usage Card */}
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Inode Usage</h3>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Total file/folder capacity</p>
          <div style={{ width: '100%', background: '#e0e0e0', borderRadius: '10px', height: '15px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ width: `${inodePercent}%`, background: '#17a2b8', height: '100%' }}></div>
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
            <strong>{data.inodes.used}</strong> used of <strong>{data.inodes.total}</strong> ({inodePercent}%)
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '12px 15px' }}>Name (File / Folder)</th>
              <th style={{ padding: '12px 15px' }}>Path</th>
              
              {/* CLICKABLE SORT HEADER */}
              <th 
                style={{ padding: '12px 15px', cursor: 'pointer', color: '#0066cc', userSelect: 'none' }}
                onClick={() => setSortAsc(!sortAsc)}
                title="Click to toggle sort order"
              >
                Size {sortAsc ? '↑ (Smallest)' : '↓ (Largest)'}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file, index) => {
              const fileName = file.path.split('/').pop();
              return (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px 15px', color: file.isFolder ? '#f5a623' : '#0066cc', fontWeight: file.isFolder ? 'bold' : 'normal' }}>
                    {file.isFolder ? '📁 ' : '📄 '} {fileName}
                  </td>
                  <td style={{ padding: '10px 15px', color: '#555' }}>{file.path}</td>
                  <td style={{ padding: '10px 15px' }}>{formatBytes(file.size)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#e9ecef', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
        <div>Logged in to Capstone as: <strong>{user.username}</strong> ({user.role})</div>
      </div>
    </div>
  );
}