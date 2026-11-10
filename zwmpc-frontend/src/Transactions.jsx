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
        axios.get(`${API_URL}/api/products`, config) // Gets products for this user's branch
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
      fetchData(); // Refresh table
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error processing transaction');
    }
  };

  const handleProductChange = (e) => {
    setFormData({ ...formData, product_id: e.target.value });
  };

  // Find selected product to display current price/stock
  const selectedProduct = products.find(p => p.id === parseInt(formData.product_id));

  return (
    <div>
      <h2>Merchandising Transactions</h2>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        
        {/* Transaction Form */}
        <div style={{ flex: 1, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Process New Transaction</h3>
          {message && <p style={{ color: message.includes('success') ? 'green' : 'red', fontWeight: 'bold' }}>{message}</p>}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select name="transaction_type" value={formData.transaction_type} onChange={(e) => setFormData({...formData, transaction_type: e.target.value})} style={styles.input}>
              <option value="SALE">Record a Sale (Out)</option>
              <option value="RESTOCK">Record a Restock (In)</option>
            </select>

            <select name="product_id" value={formData.product_id} onChange={handleProductChange} required style={styles.input}>
              <option value="">-- Select Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
              ))}
            </select>

            <input type="number" min="1" name="quantity" placeholder="Quantity" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} required style={styles.input} />

            {selectedProduct && (
              <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '5px' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong>Price:</strong> ₱{parseFloat(selectedProduct.price).toFixed(2)}</p>
                <p style={{ margin: 0 }}><strong>Total Amount:</strong> ₱{(selectedProduct.price * formData.quantity).toFixed(2)}</p>
              </div>
            )}

            <button type="submit" style={styles.btn}>Process Transaction</button>
          </form>
        </div>

        {/* Transaction History */}
        <div style={{ flex: 2, background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <h3>Recent Transactions</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>By</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>No transactions yet.</td></tr>
              ) : (
                transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={styles.td}>{new Date(t.created_at).toLocaleDateString()}</td>
                    <td style={styles.td}>{t.product_name}</td>
                    <td style={styles.td}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em', fontWeight: 'bold', background: t.transaction_type === 'SALE' ? '#ffcccc' : '#ccffcc', color: t.transaction_type === 'SALE' ? '#cc0000' : '#006600' }}>
                        {t.transaction_type}
                      </span>
                    </td>
                    <td style={styles.td}>{t.quantity}</td>
                    <td style={styles.td}>₱{parseFloat(t.total_price).toFixed(2)}</td>
                    <td style={styles.td}>{t.cashier_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  input: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' },
  btn: { padding: '12px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  th: { padding: '10px', fontWeight: 'bold' },
  td: { padding: '10px' }
};