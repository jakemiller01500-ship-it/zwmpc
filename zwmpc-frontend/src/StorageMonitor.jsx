import { useState, useEffect } from 'react';
import axios from 'axios';

export default function StorageMonitor() {
  const [data, setData] = useState({ disk: '', inodes: '', files: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
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

  // Parse the `df -h /` output to calculate the percentage for the graph
  let usedPercent = 0;
  let diskStats = { size: '0', used: '0', avail: '0' };

  if (data.disk) {
    const lines = data.disk.split('\n');
    if (lines.length > 1) {
      // Split by whitespace. Line 2 looks like: overlay 50G 15G 36G 30% /
      const stats = lines[1].split(/\s+/); 
      if (stats.length >= 5) {
        diskStats = { size: stats[1], used: stats[2], avail: stats[3] };
        usedPercent = parseInt(stats[4].replace('%', ''));
      }
    }
  }

  // Determine warning color
  const getProgressColor = (percent) => {
    if (percent > 85) return '#ff4d4f'; // Red
    if (percent > 70) return '#faad14'; // Yellow
    return '#52c41a'; // Green
  };

  if (loading) return <h2>Running Linux commands on Render...</h2>;
  if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

  return (
    <div>
      <h1>System Storage Monitor</h1>
      <p style={{ color: '#666' }}>Live telemetry from the Render Backend Container</p>

      {/* GRAPH SECTION */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Disk Utilization Graph</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>Used: {diskStats.used} / {diskStats.size}</span>
          <span style={{ fontWeight: 'bold', color: getProgressColor(usedPercent) }}>
            {usedPercent}% Used
          </span>
        </div>
        {/* The Graph (Progress Bar) */}
        <div style={{ width: '100%', background: '#e0e0e0', borderRadius: '10px', height: '25px', overflow: 'hidden' }}>
          <div style={{ 
            width: `${usedPercent}%`, 
            background: getProgressColor(usedPercent), 
            height: '100%', 
            transition: 'width 0.5s ease-in-out' 
          }}></div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '0.9em' }}>Available Space: {diskStats.avail}</p>
      </div>

      {/* TABLES SECTION */}
      <div style={{ display: 'flex', gap: '20px' }}>
        
        {/* Inodes Table */}
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Inode Usage</h3>
          <p style={{ fontSize: '0.9em', color: '#666' }}>Shows how many files the server can hold.</p>
          <pre style={{ background: '#f4f4f4', padding: '10px', overflowX: 'auto' }}>
            {data.inodes}
          </pre>
        </div>

        {/* Raw Disk Table */}
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px' }}>
          <h3>Raw Disk Output (`df -h`)</h3>
          <pre style={{ background: '#f4f4f4', padding: '10px', overflowX: 'auto' }}>
            {data.disk}
          </pre>
        </div>
      </div>

      {/* Largest Files Table */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h3>Top 20 Largest Files & Directories</h3>
        <p style={{ fontSize: '0.9em', color: '#666' }}>Sorted by size (du -ah | sort -rh)</p>
        <pre style={{ background: '#f4f4f4', padding: '10px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {data.files}
        </pre>
      </div>
    </div>
  );
}