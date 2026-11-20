import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [formData, setFormData] = useState({
    username: '', email: '', contact_number: '', profile_picture: '', password: '', confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFormData({
          username: res.data.username,
          email: res.data.email,
          contact_number: res.data.contact_number || '',
          profile_picture: res.data.profile_picture || '',
          password: '',
          confirmPassword: ''
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [API_URL, token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle Image Upload (Convert to Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return setMessage({ text: 'Image must be less than 2MB', type: 'error' });
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setMessage({ text: 'Passwords do not match', type: 'error' });
    }

    try {
      const res = await axios.put(`${API_URL}/api/users/profile/me`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local storage so the dashboard reflects the new name and picture immediately
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      
      // Force reload to update the sidebar immediately
      window.location.reload(); 
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Error updating profile', type: 'error' });
    }
  };

  if (loading) return <h2 className="page-title">Loading Profile...</h2>;

  return (
    <div>
      <h2 className="page-title">My Profile</h2>
      
      {message.text && (
        <div style={{ 
          padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold',
          background: message.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: message.type === 'success' ? '#2e7d32' : '#d32f2f'
        }}>
          {message.text}
        </div>
      )}

      <div className="theme-card" style={{ maxWidth: '800px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          
          {/* Left Column: Profile Picture */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '150px', height: '150px', borderRadius: '50%', 
              background: 'var(--primary-pink)', margin: '0 auto 15px auto',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              overflow: 'hidden', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}>
              {formData.profile_picture ? (
                <img src={formData.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '4rem', color: 'white', fontWeight: 'bold' }}>
                  {formData.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <label className="btn-secondary" style={{ cursor: 'pointer', padding: '10px 15px', display: 'inline-block', fontSize: '0.9rem' }}>
              Upload Photo
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>Max size: 2MB</p>
          </div>

          {/* Right Column: Form Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={styles.label}>Username</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange} required className="theme-input" />
            </div>

            <div>
              <label style={styles.label}>Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="theme-input" />
            </div>

            <div>
              <label style={styles.label}>Contact Number</label>
              <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} placeholder="e.g. 09123456789" className="theme-input" />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '10px 0' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Leave password blank if you do not want to change it.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={styles.label}>New Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="theme-input" />
              </div>
              <div>
                <label style={styles.label}>Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="theme-input" />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '20px' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  label: { display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)' }
};