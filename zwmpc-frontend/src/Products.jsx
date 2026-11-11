import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({ 
    name: '', sku: '', category: 'General', price: '', stock_quantity: 0, branch_id: '' 
  });
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch Products and Branches (if Super Admin)
  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [resProducts, resBranches] = await Promise.all([
        axios.get(`${API_URL}/api/products`, config),
        user.role === 'super_admin' ? axios.get(`${API_URL}/api/branches`, config) : Promise.resolve({ data: [] })
      ]);
      setProducts(resProducts.data);
      setBranches(resBranches.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/api/products`, formData, config);
      setMessage('Product added successfully!');
      setFormData({ name: '', sku: '', category: 'General', price: '', stock_quantity: 0, branch_id: '' });
      fetchData(); // Refresh table
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding product');
    }
  };

  return (
    <div>
      <h2>Product & Inventory Management</h2>

      {/* Add Product Form (Admins Only) */}
      {(user.role === 'super_admin' || user.role === 'admin') && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Add New Product</h3>
          {message && <p style={{ color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} required style={styles.input} />
            <input type="text" name="sku" placeholder="SKU (Unique)" value={formData.sku} onChange={handleChange} required style={styles.input} />
            <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required style={styles.input} />
            <input type="number" step="0.01" name="price" placeholder="Price" value={formData.price} onChange={handleChange} required style={styles.input} />
            <input type="number" name="stock_quantity" placeholder="Initial Stock" value={formData.stock_quantity} onChange={handleChange} required style={styles.input} />
            
            {/* Super Admin must select a branch */}
            {user.role === 'super_admin' && (
              <select name="branch_id" value={formData.branch_id} onChange={handleChange} required style={styles.input}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
            )}

            <button type="submit" style={{ ...styles.btn, gridColumn: 'span 2' }}>Add Product</button>
          </form>
        </div>
      )}

      {/* Products Table */}
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={styles.th}>Product Name</th>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Price</th>
              <th style={styles.th}>Stock</th>
              <th style={styles.th}>Branch</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No products found.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={styles.td}>{product.name}</td>
                  <td style={styles.td}>{product.sku}</td>
                  <td style={styles.td}>{product.category}</td>
                  <td style={styles.td}>₱{parseFloat(product.price).toFixed(2)}</td>
                  <td style={styles.td}>
                    {product.stock_quantity <= 10 ? (
                      <span style={{ background: '#ffcccc', color: '#d32f2f', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' }}>
                        ⚠️ {product.stock_quantity} (Low)
                      </span>
                    ) : (
                      <strong style={{ color: 'green' }}>{product.stock_quantity}</strong>
                    )}
                  </td>
                  <td style={styles.td}>{product.branch_name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '12px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  th: { padding: '15px', fontWeight: 'bold' },
  td: { padding: '15px' }
};