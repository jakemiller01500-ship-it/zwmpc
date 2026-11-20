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

  // --- TRIGGER EDIT MODAL ---
  const openEditModal = (user) => {
    setEditingUser(user);
    setEditFormData({ role: user.role, branch_id: user.branch_id || '' });
    setEditError('');
  };

  // --- SUBMIT EDIT ---
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editFormData.role !== 'super_admin' && !editFormData.branch_id) {
      return setEditError('Please assign a branch for this role.');
    }

    try {
      await axios.put(`${API_URL}/api/users/${editingUser.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingUser(null); // Close modal
      fetchData(); // Refresh table
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
      <h2>User Management</h2>
      
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '15px' }}>Username</th>
              <th style={{ padding: '15px' }}>Email</th>
              <th style={{ padding: '15px' }}>Role</th>
              <th style={{ padding: '15px' }}>Branch</th>
              <th style={{ padding: '15px' }}>Status</th>
              <th style={{ padding: '15px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{u.username}</td>
                  <td style={{ padding: '15px', color: '#555' }}>{u.email}</td>
                  <td style={{ padding: '15px' }}><strong style={{ color: u.role === 'super_admin' ? '#d32f2f' : '#0066cc' }}>{u.role.toUpperCase()}</strong></td>
                  
                  <td style={{ padding: '15px' }}>
                    {u.is_approved ? (u.branch_name || <span style={{ color: 'red' }}>UNASSIGNED</span>) : (
                      currentUser.role === 'super_admin' && u.role !== 'super_admin' ? (
                        <select 
                          onChange={(e) => setSelectedBranches({...selectedBranches, [u.id]: e.target.value})}
                          defaultValue=""
                          style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                          <option value="">-- Assign --</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                        </select>
                      ) : 'Pending'
                    )}
                  </td>

                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '5px 10px', borderRadius: '15px', fontSize: '0.8em', fontWeight: 'bold',
                      background: u.is_approved ? '#ccffcc' : '#fff3cd', 
                      color: u.is_approved ? '#006600' : '#856404' 
                    }}>
                      {u.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>

                  <td style={{ padding: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    
                    {!u.is_approved && (
                      <>
                        <button onClick={() => handleApprove(u.id, u.role)} style={{ background: '#4caf50', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                        <button onClick={() => triggerReject(u.id)} style={{ background: '#f44336', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                      </>
                    )}

                    {/* EDIT BUTTON: Visible for approved users to SA */}
                    {u.is_approved && currentUser.role === 'super_admin' && parseInt(currentUser.id) !== parseInt(u.id) && (
                      <button onClick={() => openEditModal(u)} style={{ background: '#0066cc', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Edit
                      </button>
                    )}

                    {currentUser.role === 'super_admin' && parseInt(currentUser.id) !== parseInt(u.id) && (
                      <button onClick={() => triggerDelete(u.id)} style={{ background: '#d32f2f', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#0066cc' }}>Edit User: {editingUser.username}</h3>
            
            {editError && <p style={{ color: '#d32f2f', background: '#ffebee', padding: '10px', borderRadius: '5px' }}>{editError}</p>}
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>System Role</label>
                <select 
                  value={editFormData.role} 
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Branch Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {editFormData.role !== 'super_admin' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Assign Branch</label>
                  <select 
                    value={editFormData.branch_id} 
                    onChange={(e) => setEditFormData({...editFormData, branch_id: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', background: '#e0e0e0', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}