import React, { useState, useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";
import MSListService from '../services/MSListService';
import '../styles/ApproveRequest.css';

const ApproveRequest = () => {
  const { requestId } = useParams();
  const { user, loaded } = useAuth();
  
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  
  // Check if user is authorized to approve requests
  const isAuthorized = () => {
    if (!user || !user.userDetails) return false;
    
    const userEmail = user.userDetails.toLowerCase();
    return AUTHORIZED_USERS?.newHireRequestApprovers?.some(email => 
      email?.toLowerCase() === userEmail
    ) || false;
  };
  
  // Fetch request details when component mounts
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!loaded || !isAuthorized() || !requestId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await MSListService.getNewHireRequestById(requestId);
        setRequestData(data);
      } catch (err) {
        console.error(`Failed to fetch request details for ID ${requestId}:`, err);
        setError('Failed to load request details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [loaded, user, requestId]);
  
  // Handle approve action
  const handleApprove = async () => {
    if (!isAuthorized() || !requestId || !user?.userDetails) {
      setError('You are not authorized to approve this request.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await MSListService.approveNewHireRequest(requestId, user.userDetails);
      
      setActionSuccess('Request approved successfully!');
    } catch (err) {
      console.error(`Failed to approve request with ID ${requestId}:`, err);
      setError('Failed to approve request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle reject action
  const handleReject = async () => {
    if (!isAuthorized() || !requestId || !user?.userDetails) {
      setError('You are not authorized to reject this request.');
      return;
    }
    
    if (!rejectionReason?.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await MSListService.rejectNewHireRequest(requestId, user.userDetails, rejectionReason);
      
      setActionSuccess('Request rejected successfully!');
      setIsRejectModalOpen(false);
    } catch (err) {
      console.error(`Failed to reject request with ID ${requestId}:`, err);
      setError('Failed to reject request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open reject modal
  const openRejectModal = () => {
    setIsRejectModalOpen(true);
    setError(null);
  };
  
  // Close reject modal
  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
    setRejectionReason('');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };
  
  // Loading state
  if (!loaded) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Verifying your access permissions...</p>
      </div>
    );
  }
  
  // If not authorized, display message
  if (!isAuthorized()) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You do not have permission to approve or reject hire requests.</p>
          <Link to="/" className="back-button">Back to Home</Link>
        </div>
      </div>
    );
  }
  
  // If request ID is missing
  if (!requestId) {
    return <Navigate to="/pending-approvals" replace />;
  }
  
  return (
    <div className="container cloudmarc-theme">
      <div className="nav-buttons">
        <Link to="/pending-approvals" className="back-button">&#8592; Back to Pending Approvals</Link>
      </div>
      
      <h1>Review New Hire Request</h1>
      
      {/* Success message */}
      {actionSuccess && (
        <div className="success-message">
          <p>{actionSuccess}</p>
          <p>
            <Link to="/pending-approvals">Return to Pending Approvals</Link>
          </p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading request details...</p>
        </div>
      )}
      
      {/* Request Details */}
      {!loading && !actionSuccess && requestData && (
        <div className="approval-container">
          <div className="request-header">
            <h2>{requestData.FirstName || ''} {requestData.LastName || ''}</h2>
            <div className="request-meta">
              <div className="meta-item">
                <span className="meta-label">Status:</span>
                <span className={`status-badge ${requestData.ApprovalStatus?.toLowerCase() || 'pending'}`}>
                  {requestData.ApprovalStatus || 'Pending'}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created By:</span>
                <span>{requestData.CreateBy || 'N/A'}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Created On:</span>
                <span>{formatDate(requestData.CreateDate)}</span>
              </div>
            </div>
          </div>
          
          <div className="request-details">
            <div className="detail-section">
              <h3>Candidate Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Position:</label>
                  <span>{requestData.Position || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Resource Level:</label>
                  <span>{requestData.ResourceLevelCode || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{requestData.PersonalEmail || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Mobile:</label>
                  <span>{requestData.Mobile || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Address:</label>
                  <span>{requestData.Address || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Laptop Required:</label>
                  <span>{requestData.IsLaptopRequired || 'No'}</span>
                </div>
                <div className="detail-item">
                  <label>Rehire:</label>
                  <span>{requestData.Rehire || 'No'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Client Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Client Name:</label>
                  <span>{requestData.ClientName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Legal Name:</label>
                  <span>{requestData.NewClientLegalName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Address:</label>
                  <span>{requestData.NewClientAddress || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Email:</label>
                  <span>{requestData.NewClientEmailAddress || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Engagement Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Start Date:</label>
                  <span>{formatDate(requestData.StartDate)}</span>
                </div>
                <div className="detail-item">
                  <label>End Date:</label>
                  <span>{formatDate(requestData.ContractEndDate) || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Sign By Date:</label>
                  <span>{formatDate(requestData.SignByDate)}</span>
                </div>
                <div className="detail-item">
                  <label>Package/Rate:</label>
                  <span>{requestData.PackageOrRate || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Billing Rate:</label>
                  <span>{requestData.BillingRate || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>GP Margin:</label>
                  <span>{requestData.GrossProfitMargin || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Engagement Name:</label>
                  <span>{requestData.EngagementName || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <label>Task Name:</label>
                  <span>{requestData.TaskName || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {(requestData.ABNName || requestData.ABNNumber || requestData.ABNAddress) && (
              <div className="detail-section">
                <h3>ABN Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>ABN Name:</label>
                    <span>{requestData.ABNName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>ABN Number:</label>
                    <span>{requestData.ABNNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>ABN Address:</label>
                    <span>{requestData.ABNAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {requestData.Notes && (
              <div className="detail-section">
                <h3>Additional Notes</h3>
                <div className="notes-box">
                  {requestData.Notes}
                </div>
              </div>
            )}
          </div>
          
          <div className="approval-actions">
            <button 
              className="approve-button" 
              onClick={handleApprove}
              disabled={loading || requestData.ApprovalStatus !== 'Pending'}
            >
              Approve Request
            </button>
            <button 
              className="reject-button" 
              onClick={openRejectModal}
              disabled={loading || requestData.ApprovalStatus !== 'Pending'}
            >
              Reject Request
            </button>
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Reject New Hire Request</h3>
              <button className="close-button" onClick={closeRejectModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Please provide a reason for rejecting this request:</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows="4"
              />
              {error && <p className="error-text">{error}</p>}
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={closeRejectModal}>Cancel</button>
              <button 
                className="confirm-reject-button" 
                onClick={handleReject}
                disabled={!rejectionReason?.trim() || loading}
              >
                {loading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="section">
        <p className="version-tag">{APP_VERSION.number} ({APP_VERSION.date})</p>
      </div>
    </div>
  );
};

export default ApproveRequest;