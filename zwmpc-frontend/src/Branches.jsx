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
      
      {/* Only show the form if the user is an Admin */}
      {user.role === 'admin' && (
        <div style={{ background: 'white', padding: '20px', marginBottom: '20px', borderRadius: '8px' }}>
          <h3>Add New Branch</h3>
          {message && <p style={{ color: 'blue' }}>{message}</p>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" placeholder="Branch Name" required
              value={formData.branch_name} 
              onChange={(e) => setFormData({...formData, branch_name: e.target.value})} 
            />
            <input 
              type="text" placeholder="Location" required
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
            />
            <button type="submit">Add Branch</button>
          </form>
        </div>
      )}

      {/* List of Branches */}
      <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#ddd', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>ID</th>
            <th style={{ padding: '10px' }}>Branch Name</th>
            <th style={{ padding: '10px' }}>Location</th>
          </tr>
        </thead>
        <tbody>
          {branches.map(b => (
            <tr key={b.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '10px' }}>{b.id}</td>
              <td style={{ padding: '10px' }}>{b.branch_name}</td>
              <td style={{ padding: '10px' }}>{b.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}