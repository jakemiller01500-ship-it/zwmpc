import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    role: 'staff' // Default role
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  const API_URL = import.meta.env.VITE_API_URL;

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
        setMessage('Registration successful! Please wait for Admin approval before logging in.');
        setIsLogin(true); // Switch back to login screen
        setFormData({ username: '', email: '', password: '', role: 'staff' }); // Clear form
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'Arial' }}>
      <h2>{isLogin ? 'Login to ZWMPC' : 'Register Account'}</h2>
      
      {/* Message block - Red for errors/pending, Blue for success */}
      {message && (
        <p style={{ color: message.includes('successful') ? 'blue' : 'red', fontWeight: 'bold' }}>
          {message}
        </p>
      )}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!isLogin && (
          <input 
            type="text" 
            name="username" 
            placeholder="Username" 
            onChange={handleChange} 
            value={formData.username}
            required 
          />
        )}
        
        <input 
          type="email" 
          name="email" 
          placeholder="Email" 
          onChange={handleChange} 
          value={formData.email}
          required 
        />
        
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={handleChange} 
          value={formData.password}
          required 
        />
        
        {/* ROLE SELECTION (ONLY FOR REGISTRATION) */}
        {!isLogin && (
          <>
            <label style={{ fontSize: '0.9rem', marginBottom: '-10px' }}>Select System Role:</label>
            <select 
              name="role" 
              value={formData.role} 
              onChange={handleChange} 
              required 
              style={{ padding: '8px' }}
            >
              <option value="staff">Staff</option>
              <option value="admin">Branch Admin</option>
            </select>
          </>
        )}
        
        <button type="submit" style={{ padding: '10px', cursor: 'pointer', fontWeight: 'bold' }}>
          {isLogin ? 'Login' : 'Register Request'}
        </button>
      </form>

      <p 
        onClick={() => { setIsLogin(!isLogin); setMessage(''); }} 
        style={{ cursor: 'pointer', color: 'blue', marginTop: '15px', textAlign: 'center' }}
      >
        {isLogin ? "Don't have an account? Register here." : "Already have an account? Login here."}
      </p>
    </div>
  );
}