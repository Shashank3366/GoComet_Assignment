import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/rfqs`;

export default function CreateRfq({ setView }) {
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    forcedCloseTime: '',
    serviceDate: '',
    triggerWindowMins: 5,
    extensionDurationMins: 2,
    extensionType: 'ANY_BID'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setView('list');
      } else {
        alert(data.error || 'Failed to create RFQ');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const setDemoTimes = () => {
    const now = new Date();
    const toInputString = (minsToAdd) => new Date(now.getTime() + minsToAdd * 60000 - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    setFormData({
      ...formData,
      name: 'Demo Freight to NYC',
      startTime: toInputString(-1),
      endTime: toInputString(5),
      forcedCloseTime: toInputString(15),
      serviceDate: toInputString(1440 * 7),
      triggerWindowMins: 2,
      extensionDurationMins: 1,
      extensionType: 'ANY_BID'
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <header className="header">
        <h1 className="header-title">Create New RFQ</h1>
        <button className="btn btn-outline" onClick={() => setView('list')}>
          Back to Dashboard
        </button>
      </header>

      <div className="card">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={setDemoTimes} className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
            Fill Demo Data (Quick Test)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">RFQ Name / Description</label>
            <input required name="name" value={formData.name} onChange={handleChange} className="form-control" placeholder="e.g., Ocean Freight Mumbai to New York" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Bid Start Time</label>
              <input type="datetime-local" required name="startTime" value={formData.startTime} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Bid Close Time</label>
              <input type="datetime-local" required name="endTime" value={formData.endTime} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Forced Close Time</label>
              <input type="datetime-local" required name="forcedCloseTime" value={formData.forcedCloseTime} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Service Date</label>
              <input type="datetime-local" required name="serviceDate" value={formData.serviceDate} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0' }} />
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-color)' }}>British Auction Configuration</h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Trigger Window (Minutes)</label>
              <input type="number" min="1" required name="triggerWindowMins" value={formData.triggerWindowMins} onChange={handleChange} className="form-control" />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'block' }}>
                How close to the end time to check for triggers.
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">Extension Duration (Minutes)</label>
              <input type="number" min="1" required name="extensionDurationMins" value={formData.extensionDurationMins} onChange={handleChange} className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Extension Trigger Condition</label>
            <select name="extensionType" value={formData.extensionType} onChange={handleChange} className="form-control">
              <option value="ANY_BID">Any Bid Received in Trigger Window</option>
              <option value="ANY_RANK">Any Supplier Rank Change</option>
              <option value="L1_RANK">Lowest Bidder (L1) Rank Change</option>
            </select>
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'right' }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ minWidth: '200px' }}>
              {loading ? 'Creating...' : 'Create RFQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
