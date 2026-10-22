import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserManagement() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranches, setSelectedBranches] = useState({}); // Track branch selection per user

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchPending = async () => {
    try {
      const [resUsers, resBranches] = await Promise.all([
        axios.get(`${API_URL}/api/users/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/branches`, { headers: { Authorization: `Bearer ${token}` } }) // Only SA can fetch all branches
      ]);
      setPendingUsers(resUsers.data);
      setBranches(resBranches.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id) => {
    try {
      await axios.post(`${API_URL}/api/users/approve`, 
        { user_id: id, branch_id: selectedBranches[id] }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPending(); // Refresh list
    } catch (err) { alert('Error approving user'); }
  };

  const handleReject = async (id) => {
    if(!window.confirm("Reject and delete this request?")) return;
    try {
      await axios.delete(`${API_URL}/api/users/reject/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchPending();
    } catch (err) { alert('Error rejecting user'); }
  };

  return (
    <div>
      <h2>Pending Registration Requests</h2>
      {pendingUsers.length === 0 ? <p>No pending requests.</p> : (
        <table style={{ width: '100%', background: 'white', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#ddd' }}>
            <tr>
              <th style={{ padding: '10px' }}>Username</th>
              <th style={{ padding: '10px' }}>Email</th>
              <th style={{ padding: '10px' }}>Requested Role</th>
              {user.role === 'super_admin' && <th style={{ padding: '10px' }}>Assign Branch</th>}
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '10px' }}>{u.username}</td>
                <td style={{ padding: '10px' }}>{u.email}</td>
                <td style={{ padding: '10px' }}><strong>{u.role.toUpperCase()}</strong></td>
                
                {/* Super Admin dropdown to assign branch */}
                {user.role === 'super_admin' && (
                  <td style={{ padding: '10px' }}>
                    <select 
                      onChange={(e) => setSelectedBranches({...selectedBranches, [u.id]: e.target.value})}
                      defaultValue=""
                    >
                      <option value="">-- Select Branch --</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                    </select>
                  </td>
                )}

                <td style={{ padding: '10px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleApprove(u.id)} style={{ background: 'green', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => handleReject(u.id)} style={{ background: 'red', color: 'white', padding: '5px 10px', border: 'none', cursor: 'pointer' }}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}