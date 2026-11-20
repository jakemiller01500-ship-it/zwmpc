import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/audit-logs`, { headers: { Authorization: `Bearer ${token}` } });
        setLogs(res.data);
      } catch (err) { console.error(err); }
    };
    fetchLogs();
  }, [API_URL, token]);

  return (
    <div>
      <h2>System Audit Trail</h2>
      <p style={{ color: '#666' }}>Review the latest system activities and data synchronizations.</p>
      
      <div style={{ background: 'white', borderRadius: '8px', overflowX: 'auto', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '15px' }}>Date & Time</th>
              <th style={{ padding: '15px' }}>User</th>
              <th style={{ padding: '15px' }}>Action</th>
              <th style={{ padding: '15px' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{log.username || 'System'}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ padding: '5px 10px', background: '#e3f2fd', color: '#0066cc', borderRadius: '5px', fontSize: '0.85em', fontWeight: 'bold' }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '15px', color: '#555' }}>{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}