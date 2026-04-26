import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gocomet-assignment.onrender.com';
const API_URL = `${API_BASE_URL}/api/rfqs`;

export default function RfqList({ setView, setSelectedRfqId }) {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRfqs();
    const interval = setInterval(fetchRfqs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRfqs = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data)) {
        setRfqs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="header">
        <h1 className="header-title">RFQ Dashboard</h1>
        <button className="btn btn-primary" onClick={() => setView('create')}>
          + Create New RFQ
        </button>
      </header>

      {loading ? (
        <p>Loading auctions...</p>
      ) : rfqs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>No RFQs Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Create your first RFQ to start the bidding process.</p>
        </div>
      ) : (
        <div className="grid-2">
          {rfqs.map(rfq => {
            const lowestBid = rfq.bids && rfq.bids.length > 0 ? rfq.bids[0].totalAmount : null;
            
            return (
              <div key={rfq.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {rfq.referenceId}
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{rfq.name}</h2>
                  </div>
                  <span className={`badge ${rfq.status === 'ACTIVE' ? 'badge-active' : 'badge-closed'}`}>
                    {rfq.status}
                  </span>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Current Lowest Bid:</span>
                    <span style={{ fontWeight: 600, color: lowestBid ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                      {lowestBid ? `$${lowestBid.toFixed(2)}` : 'No bids yet'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Service Date:</span>
                    <span>{new Date(rfq.serviceDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Close Time:</span>
                    <span>{new Date(rfq.endTime).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Forced Close Time:</span>
                    <span style={{ color: 'var(--danger-color)' }}>{new Date(rfq.forcedCloseTime).toLocaleString()}</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-outline" 
                  style={{ width: '100%' }} 
                  onClick={() => {
                    setSelectedRfqId(rfq.id);
                    setView('details');
                  }}
                >
                  View Details & Bid
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
