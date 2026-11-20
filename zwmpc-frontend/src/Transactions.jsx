import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ product_id: '', quantity: 1, transaction_type: 'SALE' });
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [resTrans, resProducts] = await Promise.all([
        axios.get(`${API_URL}/api/transactions`, config),
        axios.get(`${API_URL}/api/products`, config)
      ]);
      setTransactions(resTrans.data);
      setProducts(resProducts.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_URL}/api/transactions`, formData, config);
      setMessage(`${formData.transaction_type} processed successfully!`);
      setFormData({ product_id: '', quantity: 1, transaction_type: 'SALE' });
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
      
      fetchData(); // Refresh table
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error processing transaction');
    }
  };

  const handleProductChange = (e) => {
    setFormData({ ...formData, product_id: e.target.value });
  };

  const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));

  return (
    <div>
      <h2 className="page-title">Merchandising Transactions</h2>

      <div style={{ display: 'flex', gap: '30px', marginBottom: '20px', flexWrap: 'wrap' }}>
        
        {/* Transaction Form */}
        <div className="theme-card" style={{ flex: '1 1 350px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Process New Transaction</h3>
          
          {message && (
            <p style={{ 
              color: message.includes('success') ? '#2e7d32' : '#d32f2f',
              background: message.includes('success') ? '#e8f5e9' : '#ffebee',
              padding: '10px', borderRadius: '5px', fontWeight: 'bold', fontSize: '0.9rem'
            }}>
              {message}
            </p>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Transaction Type</label>
              <select name="transaction_type" value={formData.transaction_type} onChange={(e) => setFormData({...formData, transaction_type: e.target.value})} className="theme-input">
                <option value="SALE">Record a Sale (Out)</option>
                <option value="RESTOCK">Record a Restock (In)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Select Product</label>
              <select name="product_id" value={formData.product_id} onChange={handleProductChange} required className="theme-input">
                <option value="">-- Select Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Quantity</label>
              <input type="number" min="1" name="quantity" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} required className="theme-input" />
            </div>

            {selectedProduct && (
              <div style={{ 
                background: '#fdf2f5', padding: '15px', borderRadius: '8px', 
                borderLeft: '4px solid var(--dark-pink)'
              }}>
                <p style={{ margin: '0 0 5px 0', color: 'var(--text-muted)' }}>Unit Price: <strong>₱{parseFloat(selectedProduct.price).toFixed(2)}</strong></p>
                <p style={{ margin: 0, color: 'var(--dark-pink)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  Total: ₱{(selectedProduct.price * formData.quantity).toFixed(2)}
                </p>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
              Process Transaction
            </button>
          </form>
        </div>

        {/* Transaction History */}
        <div style={{ flex: '2 1 600px' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-dark)' }}>Recent Transactions</h3>
          <div className="theme-table-container">
            <table className="theme-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions yet.</td></tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 'bold' }}>{t.product_name}</td>
                      <td>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold',
                          background: t.transaction_type === 'SALE' ? '#ffebee' : '#e8f5e9',
                          color: t.transaction_type === 'SALE' ? '#d32f2f' : '#2e7d32',
                          border: t.transaction_type === 'SALE' ? '1px solid #ffcdd2' : '1px solid #a5d6a7'
                        }}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td>{t.quantity}</td>
                      <td style={{ fontWeight: 'bold' }}>₱{parseFloat(t.total_price).toFixed(2)}</td>
                      <td>{t.cashier_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}