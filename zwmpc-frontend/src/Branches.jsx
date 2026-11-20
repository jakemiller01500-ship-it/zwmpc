import { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({ branch_name: '', location: '' });
  const [message, setMessage] = useState('');
  
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: null });

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/branches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data);
    } catch (error) { console.error(error); }
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
      fetchBranches();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding branch');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.put(`${API_URL}/api/branches/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchBranches();
    } catch (error) { alert('Error toggling branch status'); }
  };

  const triggerDelete = (branch) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Branch',
      message: `WARNING: Are you sure you want to permanently delete ${branch.branch_name}? All assigned users will lose their branch assignment and will be locked out.`,
      action: async () => {
        try {
          await axios.delete(`${API_URL}/api/branches/${branch.id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchBranches();
        } catch (err) { 
          alert(err.response?.data?.message || 'Error deleting branch'); 
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div>
      <h2 className="page-title">Branch Management</h2>
      
      {user.role === 'super_admin' && (
        <div className="theme-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Add New Branch</h3>
          {message && (
            <p style={{ color: message.includes('success') ? '#2e7d32' : '#d32f2f', background: message.includes('success') ? '#e8f5e9' : '#ffebee', padding: '10px', borderRadius: '5px', fontWeight: 'bold' }}>{message}</p>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <input type="text" placeholder="Branch Name" required value={formData.branch_name} onChange={(e) => setFormData({...formData, branch_name: e.target.value})} className="theme-input" style={{ flex: 1, minWidth: '250px' }} />
            <input type="text" placeholder="Location" required value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="theme-input" style={{ flex: 1, minWidth: '250px' }} />
            <button type="submit" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Add Branch</button>
          </form>
        </div>
      )}

      <div className="theme-table-container">
        <table className="theme-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>ID</th>
              <th>Branch Name</th>
              <th>Location</th>
              <th>Status</th>
              {user.role === 'super_admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr><td colSpan={user.role === 'super_admin' ? "5" : "4"} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No branches found.</td></tr>
            ) : (
              branches.map(b => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{b.id}</td>
                  <td style={{ fontWeight: 'bold', color: b.is_active ? 'var(--dark-pink)' : '#999' }}>
                    {b.branch_name}
                  </td>
                  <td>{b.location}</td>
                  <td>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold',
                      background: b.is_active ? '#e8f5e9' : '#ffebee', 
                      color: b.is_active ? '#2e7d32' : '#d32f2f',
                      border: b.is_active ? '1px solid #a5d6a7' : '1px solid #ffcdd2'
                    }}>
                      {b.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  {user.role === 'super_admin' && (
                    <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleToggleStatus(b.id)} className={b.is_active ? "btn-secondary" : "btn-success"} style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                        {b.is_active ? 'Set Inactive' : 'Set Active'}
                      </button>
                      <button onClick={() => triggerDelete(b)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.action}
        title={modalConfig.title}
        message={modalConfig.message}
      />
    </div>
  );
}