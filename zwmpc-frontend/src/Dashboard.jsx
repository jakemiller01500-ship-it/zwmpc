import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom'; // Combined into one import

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
          {/* Changed to <Link> and added textDecoration: 'none' so it doesn't look like a blue link */}
          <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
            Home
          </Link>
          
          <Link to="/dashboard/branches" style={{ color: 'white', textDecoration: 'none' }}>
            Branch Management
          </Link>
          
          {/* ONLY ADMINS SEE THIS LINK */}
          {user.role === 'admin' && (
            <Link to="/dashboard/storage" style={{ color: '#4dabf7', fontWeight: 'bold', textDecoration: 'none' }}>
              🖥️ System Storage Monitor
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
      <div style={{ flex: 1, padding: '30px', background: '#f4f4f9' }}>
        <Outlet /> {/* This is where the child routes will render */}
      </div>
    </div>
  );
}