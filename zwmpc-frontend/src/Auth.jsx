import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    role: 'staff', // Default role
    branch_id: '' 
  });
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch branches on load so the dropdown has data
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/public/branches`);
        setBranches(res.data);
      } catch (error) {
        console.error("Failed to load branches", error);
      }
    };
    if (!isLogin) fetchBranches(); // Only fetch when showing registration form
  }, [isLogin, API_URL]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, formData);
      
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); 
        navigate('/dashboard'); 
      } else {
        setMessage('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h2>{isLogin ? 'Login to ZWMPC' : 'Register Account'}</h2>
      {message && <p style={{ color: message.includes('failed') ? 'red' : 'blue' }}>{message}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!isLogin && (
          <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        )}
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        
        {/* ROLE AND BRANCH SELECTION (ONLY FOR REGISTRATION) */}
        {!isLogin && (
          <>
            <label style={{ fontSize: '0.9rem', marginBottom: '-10px' }}>Select System Role:</label>
            <select name="role" value={formData.role} onChange={handleChange} required style={{ padding: '8px' }}>
              <option value="staff">Staff</option>
              <option value="admin">Branch Admin</option>
              <option value="super_admin">Super Admin (System Owner)</option>
            </select>
          </>
        )}
        
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <p onClick={() => { setIsLogin(!isLogin); setMessage(''); }} style={{ cursor: 'pointer', color: 'blue', marginTop: '15px' }}>
        {isLogin ? "Don't have an account? Register here." : "Already have an account? Login here."}
      </p>
    </div>
  );
}