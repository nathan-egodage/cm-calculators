import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MSListService from '../services/MSListService';
import useAuth from '../hooks/useAuth';

const ApprovalHandler = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loaded } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const handleApproval = async () => {
      if (!loaded || !user) return;

      try {
        const msListService = new MSListService();
        await msListService.approveNewHireRequest(id, user.userDetails);
        setStatus('approved');
        setTimeout(() => {
          navigate('/pending-approvals');
        }, 3000);
      } catch (err) {
        console.error('Error approving request:', err);
        setError('Failed to approve request. Please try again later.');
        setStatus('error');
      }
    };

    const handleRejection = async () => {
      if (!loaded || !user) return;

      try {
        const msListService = new MSListService();
        await msListService.rejectNewHireRequest(id, user.userDetails, rejectionReason);
        setStatus('rejected');
        setTimeout(() => {
          navigate('/pending-approvals');
        }, 3000);
      } catch (err) {
        console.error('Error rejecting request:', err);
        setError('Failed to reject request. Please try again later.');
        setStatus('error');
      }
    };

    const path = window.location.pathname;
    if (path.includes('/approve-request/')) {
      handleApproval();
    } else if (path.includes('/reject-request/')) {
      setStatus('rejecting');
    }
  }, [id, user, loaded, navigate, rejectionReason]);

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    setStatus('processing');
  };

  if (!loaded) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to perform this action.</div>;
  }

  if (status === 'error') {
    return (
      <div className="error-message">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/pending-approvals')}>Back to Pending Approvals</button>
      </div>
    );
  }

  if (status === 'rejecting') {
    return (
      <div className="rejection-form">
        <h2>Reject Request</h2>
        <form onSubmit={handleRejectSubmit}>
          <div>
            <label htmlFor="reason">Reason for Rejection:</label>
            <textarea
              id="reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit">Submit Rejection</button>
        </form>
      </div>
    );
  }

  return (
    <div className="approval-status">
      <h2>
        {status === 'approved' ? 'Request Approved' : 
         status === 'rejected' ? 'Request Rejected' : 
         'Processing...'}
      </h2>
      <p>
        {status === 'approved' ? 'The request has been approved successfully.' : 
         status === 'rejected' ? 'The request has been rejected successfully.' : 
         'Please wait while we process your request...'}
      </p>
      {status !== 'processing' && (
        <p>You will be redirected to the pending approvals page shortly.</p>
      )}
    </div>
  );
};

export default ApprovalHandler; 