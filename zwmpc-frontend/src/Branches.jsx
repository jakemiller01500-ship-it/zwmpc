import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({ branch_name: '', location: '' });
  const [message, setMessage] = useState('');
  
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch branches on load
  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchBranches(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/branches`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Branch added successfully!');
      setFormData({ branch_name: '', location: '' });
      fetchBranches(); // Refresh list
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding branch');
    }
  };

  return (
    <div>
      <h2 className="page-title">Branch Management</h2>
      
      {/* Add Branch Form (Only Super Admin) */}
      {user.role === 'super_admin' && (
        <div className="theme-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Add New Branch</h3>
          
          {message && (
            <p style={{ 
              color: message.includes('success') ? '#2e7d32' : '#d32f2f',
              background: message.includes('success') ? '#e8f5e9' : '#ffebee',
              padding: '10px', borderRadius: '5px', fontWeight: 'bold'
            }}>
              {message}
            </p>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Branch Name" 
              required
              value={formData.branch_name} 
              onChange={(e) => setFormData({...formData, branch_name: e.target.value})} 
              className="theme-input"
              style={{ flex: 1, minWidth: '250px' }}
            />
            <input 
              type="text" 
              placeholder="Location" 
              required
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              className="theme-input"
              style={{ flex: 1, minWidth: '250px' }}
            />
            <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              Add Branch
            </button>
          </form>
        </div>
      )}

      {/* List of Branches */}
      <div className="theme-table-container">
        <table className="theme-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Branch Name</th>
              <th>Location</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No branches found.
                </td>
              </tr>
            ) : (
              branches.map(b => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{b.id}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--dark-pink)' }}>{b.branch_name}</td>
                  <td>{b.location}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}