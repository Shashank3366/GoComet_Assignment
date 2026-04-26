import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/rfqs';

export default function RfqDetails({ rfqId, setView }) {
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: '',
    carrierName: '',
    freightCharges: '',
    originCharges: '',
    destinationCharges: '',
    transitTime: '',
    quoteValidity: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchRfq();
    const interval = setInterval(fetchRfq, 3000);
    return () => clearInterval(interval);
  }, [rfqId]);

  const fetchRfq = async () => {
    try {
      const res = await fetch(`${API_URL}/${rfqId}`);
      if (res.ok) {
        const data = await res.json();
        setRfq(data);
      } else {
        setView('list');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleBid = async (e) => {
    e.preventDefault();
    setBidLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const payload = { ...formData, terms_accepted: termsAccepted };
      const res = await fetch(`${API_URL}/${rfqId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Bid submitted successfully!');
        setFormData({ supplierName: '', carrierName: '', freightCharges: '', originCharges: '', destinationCharges: '', transitTime: '', quoteValidity: '' });
        setTermsAccepted(false);
        fetchRfq();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.error || 'Failed to submit bid');
      }
    } catch (err) {
      setErrorMessage('Network error');
    } finally {
      setBidLoading(false);
    }
  };

  if (loading) return <div className="container">Loading auction details...</div>;
  if (!rfq) return <div className="container">RFQ not found</div>;

  const now = new Date();
  const endTime = new Date(rfq.endTime);
  const forcedTime = new Date(rfq.forcedCloseTime);
  const isActive = rfq.status === 'ACTIVE';

  const triggerWindowStart = new Date(endTime.getTime() - rfq.triggerWindowMins * 60000);
  const isInTriggerWindow = now >= triggerWindowStart && now < endTime;

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{rfq.referenceId}</div>
          <h1 className="header-title">{rfq.name}</h1>
        </div>
        <button className="btn btn-outline" onClick={() => setView('list')}>
          Back to Dashboard
        </button>
      </header>

      <div className="grid-2">
        {/* Left Column: Details & Bids */}
        <div>
          <div className="card" style={{ marginBottom: '2rem', borderTop: `4px solid ${isActive ? 'var(--accent-color)' : 'var(--danger-color)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem' }}>Auction Status</h2>
              <span className={`badge ${isActive ? 'badge-active' : 'badge-closed'}`}>{rfq.status}</span>
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Current Close Time</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: isInTriggerWindow ? 'var(--accent-color)' : 'inherit' }}>
                  {endTime.toLocaleTimeString()}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Forced Close Time</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--danger-color)' }}>
                  {forcedTime.toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <p><strong>Trigger Window:</strong> Last {rfq.triggerWindowMins} minutes</p>
              <p><strong>Extension:</strong> +{rfq.extensionDurationMins} minutes</p>
              <p><strong>Rule:</strong> {rfq.extensionType}</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Current Bids (Rankings)</h3>
            {!rfq.bids || rfq.bids.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No bids submitted yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Supplier</th>
                      <th>Total Amount</th>
                      <th>Transit Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfq.bids.map((bid, idx) => (
                      <tr key={bid.id} style={{ backgroundColor: idx === 0 ? 'rgba(16, 185, 129, 0.1)' : 'transparent' }}>
                        <td>
                          <span style={{ 
                            background: idx === 0 ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', 
                            color: idx === 0 ? '#fff' : 'inherit',
                            padding: '0.2rem 0.6rem', 
                            borderRadius: '4px', 
                            fontWeight: 'bold' 
                          }}>
                            L{idx + 1}
                          </span>
                        </td>
                        <td>{bid.supplier?.name || 'Unknown'}</td>
                        <td style={{ fontWeight: 600, color: idx === 0 ? 'var(--accent-color)' : 'inherit' }}>
                          ${bid.totalAmount.toFixed(2)}
                        </td>
                        <td>{bid.transitTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bid Form & Logs */}
        <div>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Submit New Quote</h3>
            {!isActive ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#f87171' }}>
                Bidding is closed for this RFQ.
              </div>
            ) : (
              <form onSubmit={handleBid}>
                <div className="form-group">
                  <label className="form-label">Supplier Name</label>
                  <input required name="supplierName" value={formData.supplierName} onChange={handleChange} className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Carrier Name</label>
                  <input required name="carrierName" value={formData.carrierName} onChange={handleChange} className="form-control" />
                </div>
                
                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Freight Charges ($)</label>
                    <input type="number" step="0.01" required name="freightCharges" value={formData.freightCharges} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Origin Charges ($)</label>
                    <input type="number" step="0.01" required name="originCharges" value={formData.originCharges} onChange={handleChange} className="form-control" />
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Destination Charges ($)</label>
                    <input type="number" step="0.01" required name="destinationCharges" value={formData.destinationCharges} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Transit Time (e.g., 12 Days)</label>
                    <input required name="transitTime" value={formData.transitTime} onChange={handleChange} className="form-control" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quote Validity Date</label>
                  <input type="date" required name="quoteValidity" value={formData.quoteValidity} onChange={handleChange} className="form-control" />
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                  <input 
                    type="checkbox" 
                    id="termsAccepted" 
                    checked={termsAccepted} 
                    onChange={(e) => setTermsAccepted(e.target.checked)} 
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="termsAccepted" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem' }}>
                    I agree to the Terms and Conditions
                  </label>
                </div>
                {!termsAccepted && (
                  <div style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                    * You must agree to the terms to place a bid.
                  </div>
                )}

                {errorMessage && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {errorMessage}
                  </div>
                )}
                {successMessage && (
                  <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {successMessage}
                  </div>
                )}

                <button type="submit" disabled={bidLoading || !termsAccepted} className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  {bidLoading ? 'Submitting...' : 'Submit Final Quote'}
                </button>
              </form>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Activity Log</h3>
            {!rfq.logs || rfq.logs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No activity yet.</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {rfq.logs.map((log) => (
                  <div key={log.id} style={{ 
                    padding: '1rem', 
                    marginBottom: '0.5rem', 
                    background: log.eventType === 'EXTENSION_TRIGGERED' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    borderLeft: `4px solid ${log.eventType === 'EXTENSION_TRIGGERED' ? 'var(--primary-color)' : 'var(--text-secondary)'}`,
                    borderRadius: '4px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>{log.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
