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

  // --- EXPORT INVENTORY TO CSV ---
  const downloadCSV = () => {
    if (products.length === 0) return alert('No products to export');
    
    const headers = ['Branch', 'Product Name', 'SKU', 'Category', 'Price', 'Stock Quantity'];
    const rows = products.map(p => [
      p.branch_name,
      p.name,
      p.sku,
      p.category,
      p.price,
      p.stock_quantity
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h2 className="page-title">Product & Inventory Management</h2>

      {/* Add Product Form (Admins Only) */}
      {(user.role === 'super_admin' || user.role === 'admin') && (
        <div className="theme-card">
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Add New Product</h3>
          
          {message && (
            <p style={{ 
              color: message.includes('success') ? '#2e7d32' : '#d32f2f',
              background: message.includes('success') ? '#e8f5e9' : '#ffebee',
              padding: '10px', borderRadius: '5px', fontWeight: 'bold'
            }}>
              {message}
            </p>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} required className="theme-input" />
            <input type="text" name="sku" placeholder="SKU (Unique)" value={formData.sku} onChange={handleChange} required className="theme-input" />
            <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required className="theme-input" />
            <input type="number" step="0.01" name="price" placeholder="Price" value={formData.price} onChange={handleChange} required className="theme-input" />
            <input type="number" name="stock_quantity" placeholder="Initial Stock" value={formData.stock_quantity} onChange={handleChange} required className="theme-input" />
            
            {/* Super Admin must select a branch */}
            {user.role === 'super_admin' && (
              <select name="branch_id" value={formData.branch_id} onChange={handleChange} required className="theme-input">
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}
              </select>
            )}

            <button type="submit" className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '10px' }}>
              Add Product
            </button>
          </form>
        </div>
      )}

      {/* Table Header with CSV Download Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', marginTop: '30px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-dark)' }}>Inventory List</h3>
        <button onClick={downloadCSV} className="btn-success">
          Download CSV
        </button>
      </div>

      {/* Products Table */}
      <div className="theme-table-container">
        <table className="theme-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Branch</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--dark-pink)' }}>{product.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{product.sku}</td>
                  <td>{product.category}</td>
                  <td>₱{parseFloat(product.price).toFixed(2)}</td>
                  <td>
                    {product.stock_quantity <= 10 ? (
                      <span style={{ 
                        background: '#ffebee', color: '#d32f2f', 
                        padding: '5px 10px', borderRadius: '20px', 
                        fontWeight: 'bold', fontSize: '0.85em',
                        border: '1px solid #ffcdd2'
                      }}>
                        ⚠️ {product.stock_quantity} (Low)
                      </span>
                    ) : (
                      <strong style={{ color: '#2e7d32' }}>{product.stock_quantity}</strong>
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