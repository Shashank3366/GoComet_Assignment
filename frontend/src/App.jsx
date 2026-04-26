import { useState } from 'react';
import RfqList from './components/RfqList';
import CreateRfq from './components/CreateRfq';
import RfqDetails from './components/RfqDetails';

function App() {
  const [view, setView] = useState('list'); // 'list', 'create', 'details'
  const [selectedRfqId, setSelectedRfqId] = useState(null);

  return (
    <div className="container">
      {view === 'list' && (
        <RfqList setView={setView} setSelectedRfqId={setSelectedRfqId} />
      )}
      {view === 'create' && (
        <CreateRfq setView={setView} />
      )}
      {view === 'details' && selectedRfqId && (
        <RfqDetails rfqId={selectedRfqId} setView={setView} />
      )}
    </div>
  );
}

export default App;
