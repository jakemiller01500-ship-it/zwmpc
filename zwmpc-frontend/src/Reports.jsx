import { useState } from 'react';
import axios from 'axios';

export default function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [dates, setDates] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/reports/transactions?startDate=${dates.start}&endDate=${dates.end}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (transactions.length === 0) return alert('No data to export');
    
    const headers = ['Date', 'Branch', 'Product', 'Type', 'Qty', 'Total Price', 'Cashier'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      t.branch_name,
      t.product_name,
      t.transaction_type,
      t.quantity,
      t.total_price,
      t.cashier_name
    ]);

    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${dates.start}_to_${dates.end}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h2>Sales & Inventory Reports</h2>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <form onSubmit={fetchReport} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Start Date</label>
            <input type="date" required value={dates.start} onChange={(e) => setDates({...dates, start: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>End Date</label>
            <input type="date" required value={dates.end} onChange={(e) => setDates({...dates, end: e.target.value})} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
          
          {transactions.length > 0 && (
            <button type="button" onClick={downloadCSV} style={{ padding: '10px 20px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginLeft: 'auto' }}>
              Download CSV
            </button>
          )}
        </form>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
            <tr>
              <th style={{ padding: '15px' }}>Date</th>
              <th style={{ padding: '15px' }}>Branch</th>
              <th style={{ padding: '15px' }}>Product</th>
              <th style={{ padding: '15px' }}>Type</th>
              <th style={{ padding: '15px' }}>Qty</th>
              <th style={{ padding: '15px' }}>Total</th>
              <th style={{ padding: '15px' }}>Cashier</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>No transactions found for this date range.</td></tr>
            ) : (
              transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '15px' }}>{t.branch_name}</td>
                  <td style={{ padding: '15px' }}>{t.product_name}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: t.transaction_type === 'SALE' ? '#d32f2f' : '#2e7d32' }}>{t.transaction_type}</td>
                  <td style={{ padding: '15px' }}>{t.quantity}</td>
                  <td style={{ padding: '15px' }}>₱{parseFloat(t.total_price).toFixed(2)}</td>
                  <td style={{ padding: '15px' }}>{t.cashier_name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}