import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for the "Go Back" button
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StorageMonitor() {
  const [data, setData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  const navigate = useNavigate(); // Hook for navigation
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchStorage = useCallback(async () => {
    // If no token or user, kick out
    if (!token || !user) {
      navigate('/');
      return;
    }

    try {
      const [resData, resRaw] = await Promise.all([
        axios.get(`${API_URL}/api/system/storage`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/system/raw-storage`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setData(resData.data);
      setRawData(resRaw.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      // Check if the backend returned a 403 Forbidden
      if (err.response && err.response.status === 403) {
        setError('Access Denied: You do not have administrator privileges.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch system data');
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, token, user, navigate]);

  useEffect(() => {
    // Early exit if the local storage says they are not an admin
    if (user && user.role !== 'admin') {
      setLoading(false);
      return;
    }

    let timeoutId;
    const fetchData = async () => {
      await fetchStorage();
      // Only auto-refresh if there is no error and user is admin
      if (user?.role === 'admin') {
        timeoutId = setTimeout(fetchData, 60000);
      }
    };
    fetchData();
    return () => clearTimeout(timeoutId);
  }, [fetchStorage, user]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const sortedFiles = data ? [...data.files].sort((a, b) => sortAsc ? a.size - b.size : b.size - a.size) : [];

  // --- ACCESS DENIED SCREEN ---
  // If the user is not an admin (checked locally) OR if the backend threw a 403 error
  if ((user && user.role !== 'admin') || error.includes('Access Denied') || error.includes('Forbidden')) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
          <h1 style={{ color: '#d32f2f', fontSize: '2.5rem', margin: '0 0 10px 0' }}>🛑 Access Denied</h1>
          <h3 style={{ color: '#333', marginBottom: '20px' }}>403 Forbidden</h3>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
            You do not have the required administrator permissions to view the Server Storage Monitor. This attempt has been logged.
          </p>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ padding: '12px 24px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- OTHER ERROR HANDLING ---
  if (loading && !data) return <h2>Running Linux commands on Render... (If server is asleep, this takes 50s)</h2>;
  if (error) return <h2 style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</h2>;
  if (!data || !rawData) return <h2>No data</h2>;

  // --- ADMIN DASHBOARD RENDERING ---
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

  const TerminalWindow = ({ command, output }) => (
    <div style={{ marginBottom: '20px', background: '#0d0d0d', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
      <pre style={{ color: '#d4d4d4', padding: '15px', margin: 0, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
        <span style={{ color: '#4af626' }}>$ {command}</span>
        {"\n"}
        {output || 'No output'}
      </pre>
    </div>
  );

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <div style={{ background: '#0b1f3a', color: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div><strong>Capstone Admin Console</strong> | Storage Monitor</div>
        <div>Signed in as: <strong>{user.username}</strong></div>
      </div>
      
      {/* ... (Keep all the rest of the rendering code exactly the same as before) ... */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#333', margin: 0 }}>Server storage and stored files</h2>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>Live | Last updated: {lastUpdated.toLocaleTimeString()}</div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: '15px' }}>
        <div style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '250px', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} stroke="none">
                  {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
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

        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0 }}>Inode Usage</h3>
          <div style={{ width: '100%', background: '#e0e0e0', borderRadius: '10px', height: '15px', overflow: 'hidden', marginTop: '10px' }}>
            <div style={{ width: `${inodePercent}%`, background: '#17a2b8', height: '100%' }}></div>
          </div>
          <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
            <strong>{data.inodes.used}</strong> used of <strong>{data.inodes.total}</strong> ({inodePercent}%)
          </p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '12px 15px' }}>Name (File / Folder)</th>
              <th style={{ padding: '12px 15px' }}>Path</th>
              <th style={{ padding: '12px 15px', cursor: 'pointer', color: '#0066cc' }} onClick={() => setSortAsc(!sortAsc)}>
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

      <h2 style={{ color: '#333', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>Terminal Evidence (Live)</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>These are the raw outputs from the Linux shell running on your Render backend.</p>

      <TerminalWindow command="df -h" output={rawData.dfH} />
      <TerminalWindow command="df -i" output={rawData.dfI} />
      <TerminalWindow command="du -sh /opt/render/project/src/*" output={rawData.duSh} />
      <TerminalWindow command="du -ah /opt/render/project/src | sort -rh | head -n 15" output={rawData.duSort} />
      <TerminalWindow command="find /opt/render/project/src -type f -size +10M -exec ls -lh {} +" output={rawData.findLarge} />

      <div style={{ marginTop: '20px', padding: '10px', background: '#e9ecef', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
        <div>Logged in to Capstone as: <strong>{user.username}</strong> ({user.role})</div>
      </div>
    </div>
  );
}