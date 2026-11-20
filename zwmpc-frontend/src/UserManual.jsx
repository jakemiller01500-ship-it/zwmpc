import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserManual() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('text'); // 'text' or 'pdf'
  
  const pdfUrl = '/ZWMPC_User_Manual.pdf'; 

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="manual-wrapper">
      
      {/* Top Header & Actions */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            ← Back
          </button>
          <button 
            onClick={() => setViewMode('text')} 
            className={viewMode === 'text' ? 'btn-primary' : 'btn-secondary'}
          >
            📖 Online Text
          </button>
          <button 
            onClick={() => setViewMode('pdf')} 
            className={viewMode === 'pdf' ? 'btn-primary' : 'btn-secondary'}
          >
            📄 View PDF
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {viewMode === 'text' && (
            <button onClick={handlePrint} className="btn-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              🖨️ Print Text
            </button>
          )}
          
          {/* Always visible download button */}
          <a 
            href={pdfUrl} 
            download="ZWMPC_User_Manual.pdf" 
            className="btn-primary" 
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            📥 Download PDF
          </a>
        </div>
      </div>

      {/* =========================================
          VIEW 1: THE HTML TEXT MANUAL
          ========================================= */}
      {viewMode === 'text' && (
        <div className="manual-content theme-card">
          
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid var(--primary-pink)', paddingBottom: '20px' }}>
            <h1 style={{ color: 'var(--dark-pink)', margin: '0 0 10px 0', fontSize: '2rem' }}>
              ZWMPC Centralized Merchandising System
            </h1>
            <h2 style={{ color: 'var(--text-muted)', margin: '0', fontSize: '1.2rem' }}>
              Official User Manual · Version 1.0
            </h2>
          </div>

          {/* Table of Contents */}
          <div style={{ background: '#fdf2f5', padding: '20px', borderRadius: '8px', marginBottom: '40px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--dark-pink)' }}>Contents</h3>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', color: 'var(--text-dark)' }}>
              <li>1. Getting Started</li>
              <li>2. Features of Every Account</li>
              <li>3. Super Admin Guide</li>
              <li>4. Branch Admin Guide</li>
              <li>5. Staff Guide</li>
              <li>6. Troubleshooting & FAQ</li>
            </ul>
          </div>

          {/* Content Sections */}
          <div style={{ lineHeight: '1.6', color: 'var(--text-dark)' }}>
            <h3 style={{ color: 'var(--dark-pink)' }}>1. Getting Started</h3>
            <p>Welcome to the ZWMPC System. This system manages the inventory, sales, and branches of the cooperative. To log in, ensure you have been approved by an administrator. If your branch is inactive, you will not be able to access the dashboard.</p>

            <h3 style={{ color: 'var(--dark-pink)', marginTop: '30px' }}>2. Features of Every Account</h3>
            <p><strong>Profile:</strong> Click your avatar in the sidebar to upload a picture, change your contact number, or update your password.</p>
            <p><strong>Dashboard:</strong> Shows live stats, revenue trends, and low-stock alerts based on your specific role.</p>

            <h3 style={{ color: 'var(--dark-pink)', marginTop: '30px' }}>3. Super Admin Guide</h3>
            <p><strong>User Management:</strong> The Super Admin must approve new users and assign them to a branch before they can log in. You can also edit roles or delete accounts here.</p>
            <p><strong>Branch Management:</strong> You can create new branches, set them to Active/Inactive, or delete them. Inactive branches block user logins.</p>
            <p><strong>Audit Logs:</strong> Tracks all critical system actions (logins, approvals, deletions) for security.</p>

            <h3 style={{ color: 'var(--dark-pink)', marginTop: '30px' }}>4. Branch Admin Guide</h3>
            <p>Admins manage the inventory for their specific branch. You can add products, view low stock, export inventory to CSV, and generate sales reports for specific date ranges.</p>

            <h3 style={{ color: 'var(--dark-pink)', marginTop: '30px' }}>5. Staff Guide</h3>
            <p>Staff members process transactions. Use the "Transactions" page to record a <strong>SALE</strong> (which reduces stock) or a <strong>RESTOCK</strong> (which increases stock). The system will block a sale if there is not enough inventory.</p>

            <h3 style={{ color: 'var(--dark-pink)', marginTop: '30px' }}>6. Troubleshooting & FAQ</h3>
            <p><strong>I can't log in.</strong> Ensure your account is approved and your branch is active. If you forgot your password, contact the Super Admin.</p>
            <p><strong>Why is the Dashboard blank?</strong> Ensure the backend server is running. If you just logged in, it may take a few seconds to fetch the data.</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-muted)', fontSize: '0.9rem', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
            © 2026 ZWMPC Multi-Purpose Cooperative. All rights reserved.
          </div>
        </div>
      )}

      {/* =========================================
          VIEW 2: THE EMBEDDED PDF
          ========================================= */}
      {viewMode === 'pdf' && (
        <div className="theme-card no-print" style={{ padding: '10px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '10px', padding: '10px', background: '#fff3cd', color: '#856404', borderRadius: '5px', fontSize: '0.9rem' }}>
            <strong>Note:</strong> If the PDF does not load below, your browser might not support embedded PDFs. Please use the <strong>Download PDF</strong> button above to view it.
          </div>
          <iframe 
            src={`${pdfUrl}#toolbar=1&navpanes=0`} 
            title="User Manual PDF"
            width="100%" 
            height="100%" 
            style={{ border: 'none', borderRadius: '8px', flex: 1 }}
          />
        </div>
      )}

    </div>
  );
}

//Fix