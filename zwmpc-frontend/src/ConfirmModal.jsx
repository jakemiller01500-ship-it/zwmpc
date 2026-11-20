export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginTop: 0, color: '#d32f2f' }}>{title}</h3>
        <p style={{ color: '#555', marginBottom: '25px' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: '#e0e0e0', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '10px 20px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Confirm Delete</button>
        </div>
      </div>
    </div>
  );
}