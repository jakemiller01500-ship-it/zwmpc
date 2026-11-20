import { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState({}); 
  
  // State for Delete/Reject Modal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', action: null
  });

  // State for Edit Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ role: '', branch_id: '' });
  const [editError, setEditError] = useState('');

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [resUsers, resBranches] = await Promise.all([
        axios.get(`${API_URL}/api/users/all`, config),
        axios.get(`${API_URL}/api/branches`, config)
      ]);
      setUsers(resUsers.data);
      setBranches(resBranches.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async (id, role) => {
    if (role !== 'super_admin' && !selectedBranches[id]) {
      alert("Please assign a branch to this user before approving.");
      return; 
    }

    try {
      await axios.post(`${API_URL}/api/users/approve`, 
        { user_id: id, branch_id: selectedBranches[id] }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
      alert("User approved and assigned to branch successfully!");
    } catch (err) { 
      alert(err.response?.data?.message || 'Error approving user'); 
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({ role: user.role, branch_id: user.branch_id || '' });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editFormData.role !== 'super_admin' && !editFormData.branch_id) {
      return setEditError('Please assign a branch for this role.');
    }

    try {
      await axios.put(`${API_URL}/api/users/${editingUser.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingUser(null); 
      fetchData(); 
    } catch (err) {
      setEditError(err.response?.data?.message || 'Error updating user');
    }
  };

  const triggerReject = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Reject Request',
      message: 'Are you sure you want to reject and permanently delete this registration request?',
      action: async () => {
        try {
          await axios.delete(`${API_URL}/api/users/reject/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchData();
        } catch (err) { alert('Error rejecting user'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const triggerDelete = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete User Account',
      message: 'WARNING: Are you sure you want to permanently delete this user? This action cannot be undone.',
      action: async () => {
        try {
          await axios.delete(`${API_URL}/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Error deleting user'); }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div>
      <h2 className="page-title">User Management</h2>
      
      <div className="theme-table-container">
        <table className="theme-table" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 'bold' }}>{u.username}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                  <td>
                    <strong style={{ color: u.role === 'super_admin' ? '#d32f2f' : 'var(--dark-pink)' }}>
                      {u.role.toUpperCase()}
                    </strong>
                  </td>
                  
                  {/* Branch Column */}
                  <td>
                    {u.is_approved ? (u.branch_name || <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>UNASSIGNED</span>) : (
                      currentUser.role === 'super_admin' && u.role !== 'super_admin' ? (
                        <select 
                          onChange={(e) => setSelectedBranches({...selectedBranches, [u.id]: e.target.value})}
                          defaultValue=""
                          className="theme-input"
                          style={{ padding: '8px', width: '150px' }}
                        >
                          <option value="">-- Assign --</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                        </select>
                      ) : 'Pending'
                    )}
                  </td>

                  {/* Status Column */}
                  <td>
                    <span style={{ 
                      padding: '6px 12px', borderRadius: '20px', fontSize: '0.8em', fontWeight: 'bold',
                      background: u.is_approved ? '#e8f5e9' : '#fff8e1', 
                      color: u.is_approved ? '#2e7d32' : '#f57f17',
                      border: u.is_approved ? '1px solid #a5d6a7' : '1px solid #ffe082'
                    }}>
                      {u.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    
                    {!u.is_approved && (
                      <>
                        <button onClick={() => handleApprove(u.id, u.role)} className="btn-success" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Approve</button>
                        <button onClick={() => triggerReject(u.id)} className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Reject</button>
                      </>
                    )}

                    {u.is_approved && currentUser.role === 'super_admin' && parseInt(currentUser.id) !== parseInt(u.id) && (
                      <button onClick={() => openEditModal(u)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                        Edit
                      </button>
                    )}

                    {currentUser.role === 'super_admin' && parseInt(currentUser.id) !== parseInt(u.id) && (
                      <button onClick={() => triggerDelete(u.id)} className="btn-danger" style={{ background: '#d32f2f', padding: '6px 12px', fontSize: '0.9rem' }}>
                        Delete
                      </button>
                    )}
                  </td>
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

      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <h3 style={{ marginTop: 0, color: 'var(--dark-pink)', borderBottom: '2px solid #fdf2f5', paddingBottom: '10px' }}>
              Edit User: {editingUser.username}
            </h3>
            
            {editError && <p style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>{editError}</p>}
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>System Role</label>
                <select 
                  value={editFormData.role} 
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="theme-input"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Branch Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {editFormData.role !== 'super_admin' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>Assign Branch</label>
                  <select 
                    value={editFormData.branch_id} 
                    onChange={(e) => setEditFormData({...editFormData, branch_id: e.target.value})}
                    className="theme-input"
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}