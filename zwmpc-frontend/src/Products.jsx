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

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [resProducts, resBranches] = await Promise.all([
        axios.get(`${API_URL}/api/products`, config),
        user.role === 'super_admin' ? axios.get(`${API_URL}/api/branches`, config) : Promise.resolve({ data: [] })
      ]);
      setProducts(resProducts.data);
      setBranches(resBranches.data);
    } catch (err) { console.error(err); }
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
      setTimeout(() => setMessage(''), 3000);
      fetchData(); 
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error adding product');
    }
  };

  const downloadCSV = () => {
    if (products.length === 0) return alert('No products to export');
    const headers = ['Branch', 'Product Name', 'SKU', 'Category', 'Price', 'Stock Quantity'];
    const rows = products.map(p => [p.branch_name, p.name, p.sku, p.category, p.price, p.stock_quantity]);
    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h2 className="page-title">Product & Inventory</h2>

      {/* Add Product Form */}
      {(user.role === 'super_admin' || user.role === 'admin') && (
        <div className="theme-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Add New Product</h3>
          
          {message && (
            <p style={{ color: message.includes('success') ? '#2e7d32' : '#d32f2f', background: message.includes('success') ? '#e8f5e9' : '#ffebee', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}>
              {message}
            </p>
          )}
          
          {/* CSS Grid for beautiful spacing */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
            
            <div>
              <label style={styles.label}>Product Name</label>
              <input type="text" name="name" placeholder="e.g. Fresh Milk" value={formData.name} onChange={handleChange} required className="theme-input" />
            </div>

            <div>
              <label style={styles.label}>SKU (Unique)</label>
              <input type="text" name="sku" placeholder="e.g. MLK-001" value={formData.sku} onChange={handleChange} required className="theme-input" />
            </div>

            <div>
              <label style={styles.label}>Category</label>
              <input type="text" name="category" placeholder="e.g. Dairy" value={formData.category} onChange={handleChange} required className="theme-input" />
            </div>

            <div>
              <label style={styles.label}>Price (₱)</label>
              <input type="number" step="0.01" name="price" placeholder="0.00" value={formData.price} onChange={handleChange} required className="theme-input" />
            </div>

            <div>
              <label style={styles.label}>Initial Stock</label>
              <input type="number" name="stock_quantity" placeholder="0" value={formData.stock_quantity} onChange={handleChange} required className="theme-input" />
            </div>
            
            {user.role === 'super_admin' && (
              <div>
                <label style={styles.label}>Assign to Branch</label>
                <select name="branch_id" value={formData.branch_id} onChange={handleChange} required className="theme-input">
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
                </select>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Save Product</button>
            </div>
          </form>
        </div>
      )}

      {/* Table Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', marginTop: '40px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Inventory List</h3>
        <button onClick={downloadCSV} className="btn-success" style={{ padding: '10px 15px', fontSize: '0.9rem' }}>
          Export CSV
        </button>
      </div>

      {/* Products Table */}
      <div className="theme-table-container">
        <table className="theme-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock Status</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--dark-pink)' }}>{product.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>₱{parseFloat(product.price).toFixed(2)}</td>
                  <td>
                    {product.stock_quantity <= 10 ? (
                      <span style={{ background: '#ffebee', color: '#d32f2f', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85em', border: '1px solid #ffcdd2' }}>
                        ⚠️ {product.stock_quantity} (Low)
                      </span>
                    ) : (
                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                        {product.stock_quantity} in stock
                      </span>
                    )}
                  </td>
                  <td>{product.branch_name}</td>
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
  label: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-dark)' }
};