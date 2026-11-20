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
      <h2 className="page-title">Sales & Inventory Reports</h2>
      
      {/* Filter Form */}
      <div className="theme-card">
        <form onSubmit={fetchReport} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
              Start Date
            </label>
            <input 
              type="date" 
              required 
              value={dates.start} 
              onChange={(e) => setDates({...dates, start: e.target.value})} 
              className="theme-input" 
            />
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-dark)' }}>
              End Date
            </label>
            <input 
              type="date" 
              required 
              value={dates.end} 
              onChange={(e) => setDates({...dates, end: e.target.value})} 
              className="theme-input" 
            />
          </div>
          
          <button type="submit" className="btn-primary" style={{ height: '45px', minWidth: '150px' }}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          
          {transactions.length > 0 && (
            <button 
              type="button" 
              onClick={downloadCSV} 
              className="btn-success" 
              style={{ height: '45px', minWidth: '150px', marginLeft: 'auto' }}
            >
              Download CSV
            </button>
          )}
        </form>
      </div>

      {/* Results Table */}
      <div className="theme-table-container">
        <table className="theme-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Branch</th>
              <th>Product</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Cashier</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No transactions found for this date range. Please select dates and generate a report.
                </td>
              </tr>
            ) : (
              transactions.map(t => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold' }}>{t.branch_name}</td>
                  <td>{t.product_name}</td>
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
  );
}