import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  // Use the Vercel environment variable for the Render backend URL
  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, formData);
      
      if (isLogin) {
        // Save both token and user data to localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); 
        
        // Redirect to the protected Dashboard
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
      {message && <p style={{ color: 'blue' }}>{message}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!isLogin && (
          <input type="text" name="username" placeholder="Username" onChange={handleChange} required />
        )}
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
        
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: 'blue', marginTop: '15px' }}>
        {isLogin ? "Don't have an account? Register here." : "Already have an account? Login here."}
      </p>
    </div>
  );
}