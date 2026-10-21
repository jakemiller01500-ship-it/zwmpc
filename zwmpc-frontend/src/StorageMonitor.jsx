import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function StorageMonitor() {
  const [data, setData] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchStorage = useCallback(async () => {
    try {
      // Fetch both JSON data (for graphs) and Raw data (for terminal)
      const [resData, resRaw] = await Promise.all([
        axios.get(`${API_URL}/api/system/storage`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/system/raw-storage`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setData(resData.data);
      setRawData(resRaw.data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    let timeoutId;
    const fetchData = async () => {
      await fetchStorage();
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

  const sortedFiles = data ? [...data.files].sort((a, b) => sortAsc ? a.size - b.size : b.size - a.size) : [];

  if (loading && !data) return <h2>Running Linux commands on Render... (If server is asleep, this takes 50s)</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;
  if (!data || !rawData) return <h2>No data</h2>;

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

  // Reusable Terminal Window Component
    // Reusable Terminal Window Component
  const TerminalWindow = ({ title, output }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ background: '#1e1e1e', color: '#4af626', padding: '8px 15px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', fontFamily: 'monospace', borderBottom: '1px solid #333' }}>
        {title}
      </div>
      <pre style={{ background: '#0d0d0d', color: '#d4d4d4', padding: '15px', margin: 0, borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#333', margin: 0 }}>Server storage and stored files</h2>
        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          Live | Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* --- TOP SECTION: GRAPHS AND TABLES --- */}
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

      {/* --- BOTTOM SECTION: RAW TERMINAL EVIDENCE --- */}
      <h2 style={{ color: '#333', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>Terminal Evidence (Live)</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>These are the raw outputs from the Linux shell running on your Render backend.</p>

      <TerminalWindow title="df -h" output={rawData.dfH} />
      <TerminalWindow title="df -i" output={rawData.dfI} />
      <TerminalWindow title="du -sh /opt/render/project/src/*" output={rawData.duSh} />
      <TerminalWindow title="du -ah /opt/render/project/src | sort -rh | head -n 15" output={rawData.duSort} />
      <TerminalWindow title="find /opt/render/project/src -type f -size +10M -exec ls -lh {} +" output={rawData.findLarge} />

      <div style={{ marginTop: '20px', padding: '10px', background: '#e9ecef', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' }}>
        <div>Logged in to Capstone as: <strong>{user.username}</strong> ({user.role})</div>
      </div>
    </div>
  );
}