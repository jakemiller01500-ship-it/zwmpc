import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [view, setView] = useState('home'); // 'home', 'login', 'register'
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    role: 'staff' 
  });
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e, isLogin) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/login' : '/api/register';
    
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, formData);
      
      if (isLogin) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); 
        navigate('/dashboard'); 
      } else {
        setMessage('Registration successful! Please wait for Admin approval.');
        setView('login'); 
        setFormData({ username: '', email: '', password: '', role: 'staff' }); 
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred');
    }
  };

  // Calculate the dynamic clipping paths for the slant design
  let clipPath = 'polygon(0 0, 0 0, 0 100%, 0 100%)'; // Hidden by default
  if (view === 'login') {
    clipPath = 'polygon(0 0, 65% 0, 35% 100%, 0 100%)'; // Slant / from left
  } else if (view === 'register') {
    clipPath = 'polygon(35% 0, 100% 0, 100% 100%, 65% 100%)'; // Slant \ from right
  }

  return (
    <div style={styles.container}>
      {/* Background Image */}
      <div style={styles.background}></div>

      {/* Top Left Logo */}
      <img src="/zwmpc-logo.jpg" alt="ZWMPC Logo" style={styles.logo} />

      {/* Animated Pink Slanted Panel */}
      <div style={{ ...styles.pinkPanel, clipPath: clipPath }}></div>

      {/* Home Screen (Buttons) */}
      <div style={{ ...styles.homeContainer, opacity: view === 'home' ? 1 : 0, pointerEvents: view === 'home' ? 'auto' : 'none' }}>
        <h1 style={styles.title}>ZWMPC Centralized System</h1>
        <p style={styles.subtitle}>Merchandising Monitoring and Management</p>
        <div style={styles.buttonGroup}>
          <button style={styles.glassBtn} onClick={() => setView('login')}>Login</button>
          <button style={styles.glassBtn} onClick={() => setView('register')}>Register</button>
        </div>
      </div>

      {/* Login Card (Center-Left) */}
      <div style={{ ...styles.slidingCard, left: '5%', transform: view === 'login' ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(-150%)' }}>
        <div style={styles.cardContent}>
          <h2 style={styles.cardTitle}>Welcome Back</h2>
          {message && <p style={styles.errorMsg}>{message}</p>}
          
          <form onSubmit={(e) => handleSubmit(e, true)} style={styles.form}>
            <input type="email" name="email" placeholder="Email" onChange={handleChange} value={formData.email} required style={styles.input} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} value={formData.password} required style={styles.input} />
            <button type="submit" style={styles.submitBtn}>Login</button>
          </form>
          
          <p style={styles.toggleText} onClick={() => { setView('register'); setMessage(''); }}>
            Need an account? Register here.
          </p>
          <p style={styles.backText} onClick={() => { setView('home'); setMessage(''); }}>
            ← Back to Home
          </p>
        </div>
      </div>

      {/* Register Card (Center-Right) */}
      <div style={{ ...styles.slidingCard, right: '5%', transform: view === 'register' ? 'translateY(-50%) translateX(0)' : 'translateY(-50%) translateX(150%)' }}>
        <div style={styles.cardContent}>
          <h2 style={styles.cardTitle}>Create Account</h2>
          {message && <p style={styles.errorMsg}>{message}</p>}
          
          <form onSubmit={(e) => handleSubmit(e, false)} style={styles.form}>
            <input type="text" name="username" placeholder="Username" onChange={handleChange} value={formData.username} required style={styles.input} />
            <input type="email" name="email" placeholder="Email" onChange={handleChange} value={formData.email} required style={styles.input} />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} value={formData.password} required style={styles.input} />
            
            <select name="role" value={formData.role} onChange={handleChange} required style={styles.input}>
              <option value="staff" style={{color: 'black'}}>Staff</option>
              <option value="admin" style={{color: 'black'}}>Branch Admin</option>
            </select>
            
            <button type="submit" style={styles.submitBtn}>Register Request</button>
          </form>
          
          <p style={styles.toggleText} onClick={() => { setView('login'); setMessage(''); }}>
            Already have an account? Login here.
          </p>
          <p style={styles.backText} onClick={() => { setView('home'); setMessage(''); }}>
            Back to Home →
          </p>
        </div>
      </div>

    </div>
  );
}

// --- CSS STYLES ---
const styles = {
  container: {
    position: 'relative',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
  },
  background: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: 'url("/zwmpc-building.jpg")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'brightness(0.7)',
    zIndex: -2,
  },
  pinkPanel: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#f4a6b8', // Light pink matching the building trim
    zIndex: -1,
    transition: 'clip-path 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  logo: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
    zIndex: 10,
  },
  homeContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    color: 'white',
    transition: 'opacity 0.4s ease',
    zIndex: 1,
  },
  title: {
    fontSize: '3.5rem',
    margin: '0 0 10px 0',
    textShadow: '2px 2px 10px rgba(0,0,0,0.8)',
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '1.4rem',
    marginBottom: '40px',
    textShadow: '1px 1px 5px rgba(0,0,0,0.8)',
  },
  buttonGroup: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'center',
  },
  glassBtn: {
    padding: '15px 50px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
  },
  slidingCard: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    // Stronger white glassmorphism to pop against the pink background
    background: 'rgba(255, 255, 255, 0.65)', 
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    // Smooth slide animation
    transition: 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    zIndex: 5,
    boxSizing: 'border-box',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#333', // Dark text for readability on white glass
    fontSize: '2rem',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    width: '100%',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid rgba(0,0,0,0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1rem',
    boxSizing: 'border-box',
    outline: 'none',
    color: '#333',
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    marginTop: '10px',
    borderRadius: '8px',
    border: 'none',
    background: '#d81b60', // A deeper pink/maroon for the button
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    transition: 'background 0.3s ease',
  },
  toggleText: {
    color: '#0066cc',
    marginTop: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
  },
  backText: {
    color: '#666',
    marginTop: '10px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  errorMsg: {
    color: '#d32f2f',
    background: 'rgba(255, 0, 0, 0.1)',
    padding: '10px',
    borderRadius: '5px',
    width: '100%',
    textAlign: 'center',
    marginBottom: '10px',
    fontSize: '0.9rem',
  }
};