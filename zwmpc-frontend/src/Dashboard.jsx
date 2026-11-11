import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      navigate('/'); // Kick out if no token
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#333', color: 'white', padding: '20px' }}>
        <h2>ZWMPC System</h2>
        <p>User: {user.username}</p>
        <p>Role: <strong>{user.role.toUpperCase()}</strong></p>
        <hr />
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
          
          {/* Super Admins and Admins can manage users */}
          {(user.role === 'super_admin' || user.role === 'admin') && (
            <Link to="/dashboard/users" style={{ color: 'white', textDecoration: 'none' }}>
              User Management
            </Link>
          )}

          {/* Super Admins and Admins can manage branches */}
          {(user.role === 'super_admin' || user.role === 'admin') && (
            <Link to="/dashboard/branches" style={{ color: 'white', textDecoration: 'none' }}>
              Branch Management
            </Link>
          )}
          
          {/* Storage Monitor Link - Now visible to everyone to test the 403 Forbidden screen */}
          <Link to="/dashboard/storage" style={{ color: '#4dabf7', fontWeight: 'bold', textDecoration: 'none' }}>
            🖥️ System Storage Monitor
          </Link>
          {/* Everyone can see Products */}
          <Link to="/dashboard/products" style={{ color: 'white', textDecoration: 'none' }}>
            📦 Product & Inventory
          </Link>
          {/* Everyone can process transactions */}
          <Link to="/dashboard/transactions" style={{ color: 'white', textDecoration: 'none' }}>
            🛒 Merchandising Transactions
          </Link>
          {/* Reports (Super Admin and Admin) */}
          {(user.role === 'super_admin' || user.role === 'admin') && (
          <Link to="/dashboard/reports" style={{ color: 'white', textDecoration: 'none' }}>
            📊 Sales & Reports
          </Link>
          )}
        </nav>

        <button 
          onClick={handleLogout} 
          style={{ marginTop: '30px', padding: '10px', width: '100%', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '30px', background: '#f4f4f9', overflowY: 'auto' }}>
        <Outlet /> {/* This is where the child routes will render */}
      </div>
    </div>
  );
}