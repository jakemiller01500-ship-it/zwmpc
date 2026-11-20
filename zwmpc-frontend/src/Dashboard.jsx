import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Used to highlight the active page
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token) {
      navigate('/'); 
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--dark-pink)' }}>Loading System...</div>;

  // Helper function to style the links and highlight the active page
  const getLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      color: isActive ? 'var(--dark-pink)' : 'var(--text-dark)',
      textDecoration: 'none',
      padding: '12px 15px',
      borderRadius: '8px',
      backgroundColor: isActive ? '#fdf2f5' : 'transparent',
      fontWeight: isActive ? 'bold' : '500',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.2s ease',
      marginBottom: '5px',
      borderLeft: isActive ? '4px solid var(--dark-pink)' : '4px solid transparent'
    };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
      
      {/* Sidebar */}
      <div style={{ 
        width: '260px', 
        background: 'var(--white)', 
        padding: '20px', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: '2px 0 15px rgba(0,0,0,0.05)',
        zIndex: 10
      }}>
        
        {/* User Profile Section */}
        <div style={{ textAlign: 'center', marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
          
          {/* Clickable Avatar */}
          <Link to="/dashboard/profile" style={{ textDecoration: 'none' }}>
            <div style={{ 
              width: '75px', height: '75px', borderRadius: '50%', background: 'var(--primary-pink)', 
              display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 12px auto',
              color: 'white', fontSize: '2rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(244, 166, 184, 0.4)',
              overflow: 'hidden', cursor: 'pointer', border: '3px solid white', transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {user.profile_picture ? (
                <img src={user.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>
          </Link>

          <h3 style={{ margin: '0 0 5px 0', color: 'var(--text-dark)', fontSize: '1.1rem' }}>{user.username}</h3>
          <span style={{ 
            fontSize: '0.75rem', background: '#fdf2f5', color: 'var(--dark-pink)', 
            padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold', letterSpacing: '0.5px'
          }}>
            {user.role.toUpperCase()}
          </span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px', cursor: 'pointer' }} onClick={() => navigate('/dashboard/profile')}>
            Edit Profile
          </p>
        </div>
        
        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          <Link to="/dashboard" style={getLinkStyle('/dashboard')}>🏠 Home</Link>
          
          {(user.role === 'super_admin' || user.role === 'admin') && (
            <Link to="/dashboard/users" style={getLinkStyle('/dashboard/users')}>👥 User Management</Link>
          )}

          {(user.role === 'super_admin' || user.role === 'admin') && (
            <Link to="/dashboard/branches" style={getLinkStyle('/dashboard/branches')}>🏢 Branch Management</Link>
          )}
          
          <Link to="/dashboard/products" style={getLinkStyle('/dashboard/products')}>📦 Product & Inventory</Link>
          <Link to="/dashboard/transactions" style={getLinkStyle('/dashboard/transactions')}>🛒 Transactions</Link>
          
          {(user.role === 'super_admin' || user.role === 'admin') && (
            <Link to="/dashboard/reports" style={getLinkStyle('/dashboard/reports')}>📊 Sales & Reports</Link>
          )}

          <Link to="/dashboard/storage" style={getLinkStyle('/dashboard/storage')}>🖥️ Storage Monitor</Link>
          
          {user.role === 'super_admin' && (
            <Link to="/dashboard/audit" style={getLinkStyle('/dashboard/audit')}>📜 Audit Logs</Link>
          )}
          {/* Add this inside the <nav> tag */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
            <Link to="/dashboard/manual" style={getLinkStyle('/dashboard/manual')}>
              User Manual
            </Link>
          </div>
        </nav>

        {/* Logout Button */}
        <button 
          onClick={handleLogout} 
          style={{ 
            marginTop: '20px', padding: '12px', width: '100%', 
            background: 'transparent', color: 'var(--dark-pink)', 
            border: '2px solid var(--dark-pink)', borderRadius: '8px', 
            cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.target.style.background = 'var(--dark-pink)'; e.target.style.color = 'white'; }}
          onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--dark-pink)'; }}
        >
          Logout
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <Outlet /> 
      </div>
    </div>
  );
}