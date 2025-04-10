import ApprovalHandler from './pages/ApprovalHandler';
import RejectRequest from './pages/RejectRequest';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... other routes ... */}
        <Route path="/approve-request/:id" element={<ApprovalHandler />} />
        <Route path="/reject-request/:id" element={<RejectRequest />} />
        {/* ... other routes ... */}
      </Routes>
    </Router>
  );
}

export default App; 