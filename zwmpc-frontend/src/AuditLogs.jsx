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
      <h2 className="page-title">System Audit Trail</h2>
      <p style={{ color: 'var(--text-muted)', marginTop: '-10px', marginBottom: '25px', fontSize: '1rem' }}>
        Review the latest system activities, user logins, and data synchronizations.
      </p>
      
      <div className="theme-table-container">
        <table className="theme-table" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    {log.username || 'System'}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold',
                      background: '#fdf2f5', color: 'var(--dark-pink)', border: '1px solid var(--primary-pink)'
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-dark)' }}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}