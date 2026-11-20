import { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState({}); 
  
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    action: null
  });

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

  // UPDATED: Added role parameter and branch validation
  const handleApprove = async (id, role) => {
    // Check if a branch is selected (skip check if approving a Super Admin)
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
        } catch (err) { 
          alert(err.response?.data?.message || 'Error deleting user'); 
        }
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
                  
                  {/* Branch Column */}
                  <td style={{ padding: '15px' }}>
                    {u.is_approved ? (u.branch_name || 'N/A') : (
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

                  {/* Status Column */}
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '5px 10px', borderRadius: '15px', fontSize: '0.8em', fontWeight: 'bold',
                      background: u.is_approved ? '#ccffcc' : '#fff3cd', 
                      color: u.is_approved ? '#006600' : '#856404' 
                    }}>
                      {u.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td style={{ padding: '15px', display: 'flex', gap: '10px' }}>
                    
                    {!u.is_approved && (
                      <>
                        {/* UPDATED: Passed u.role to handleApprove */}
                        <button onClick={() => handleApprove(u.id, u.role)} style={{ background: '#4caf50', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                        <button onClick={() => triggerReject(u.id)} style={{ background: '#f44336', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                      </>
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
      
    </div>
  );
}