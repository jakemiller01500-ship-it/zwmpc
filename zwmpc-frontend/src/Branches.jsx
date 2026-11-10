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
      <h1>Branch Management</h1>
      
      {/* FIXED: ONLY Super Admin can see the Add Branch form */}
      {user.role === 'super_admin' && (
        <div style={{ background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Add New Branch</h3>
          {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" placeholder="Branch Name" required
              value={formData.branch_name} 
              onChange={(e) => setFormData({...formData, branch_name: e.target.value})} 
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}
            />
            <input 
              type="text" placeholder="Location" required
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', flex: 1 }}
            />
            <button type="submit" style={{ padding: '10px 20px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              Add Branch
            </button>
          </form>
        </div>
      )}

      {/* List of Branches */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '15px' }}>ID</th>
              <th style={{ padding: '15px' }}>Branch Name</th>
              <th style={{ padding: '15px' }}>Location</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>No branches found.</td></tr>
            ) : (
              branches.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{b.id}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{b.branch_name}</td>
                  <td style={{ padding: '15px' }}>{b.location}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}