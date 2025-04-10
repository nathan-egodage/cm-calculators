import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import MSListService from '../services/MSListService';
import '../styles/RejectRequest.css';

const RejectRequest = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, loaded } = useAuth();
  
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    console.log('RejectRequest mounted with requestId:', requestId);
    console.log('User:', user);
    console.log('Loaded:', loaded);
    
    if (!loaded) {
      console.log('Auth not loaded yet, waiting...');
      return;
    }
    
    if (!user?.userDetails) {
      console.log('No user details found, redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('User authenticated:', user.userDetails);
  }, [loaded, user, requestId, navigate]);
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to reject request:', requestId);
      console.log('With reason:', rejectionReason);
      console.log('By user:', user.userDetails);
      
      await MSListService.rejectNewHireRequest(requestId, user.userDetails, rejectionReason);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/pending-approvals');
      }, 2000);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!loaded) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="container">
        <div className="success-message">
          <h2>Request Rejected Successfully</h2>
          <p>You will be redirected to the pending approvals page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="reject-form">
        <h2>Reject New Hire Request</h2>
        <p>Request ID: {requestId}</p>
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="rejectionReason">Reason for Rejection</label>
          <textarea
            id="rejectionReason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this request..."
            rows="4"
            disabled={loading}
          />
        </div>
        
        <div className="button-group">
          <button
            className="cancel-button"
            onClick={() => navigate('/pending-approvals')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="reject-button"
            onClick={handleReject}
            disabled={loading || !rejectionReason.trim()}
          >
            {loading ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectRequest; 