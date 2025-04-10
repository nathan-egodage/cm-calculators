import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";
import MSListService from '../services/MSListService';
import '../styles/PendingApprovals.css';

const PendingApprovals = () => {
  const { user, loaded } = useAuth();
  
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if user is authorized to view and approve requests
  const isAuthorized = () => {
    if (!user) return false;
    
    return AUTHORIZED_USERS.newHireRequestApprovers.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
  };
  
  // Fetch pending approvals when component mounts
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      if (!loaded || !isAuthorized()) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const requests = await MSListService.getPendingApprovalsForUser(user.userDetails);
        setPendingRequests(requests);
      } catch (err) {
        console.error('Failed to fetch pending approvals:', err);
        setError('Failed to load pending approval requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingApprovals();
  }, [loaded, user]);
  
  // Approve request
  const approveRequest = async (requestId) => {
    try {
      setLoading(true);
      await MSListService.approveNewHireRequest(requestId, user.userDetails);
      setPendingRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
    } catch (err) {
      console.error('Failed to approve request:', err);
      setError('Failed to approve request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Reject request
  const rejectRequest = async (requestId) => {
    try {
      setLoading(true);
      await MSListService.rejectNewHireRequest(requestId, user.userDetails, 'Rejection reason');
      setPendingRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
    } catch (err) {
      console.error('Failed to reject request:', err);
      setError('Failed to reject request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on search term
  const filteredRequests = pendingRequests.filter(request => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    return (
      (request.Title && request.Title.toLowerCase().includes(term)) ||
      (request.FirstName && request.FirstName.toLowerCase().includes(term)) ||
      (request.LastName && request.LastName.toLowerCase().includes(term)) ||
      (request.Position && request.Position.toLowerCase().includes(term)) ||
      (request.ClientName && request.ClientName.toLowerCase().includes(term))
    );
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
          <p>You do not have permission to view or approve hire requests.</p>
          <Link to="/" className="back-button">Back to Home</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container cloudmarc-theme">
      <div className="nav-buttons">
        <Link to="/" className="back-button">&#8592; Back to Home</Link>
      </div>
      
      <h1>Pending Approval Requests</h1>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* Search and filters */}
      <div className="filters-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, position, or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="action-buttons">
          <Link to="/new-hire-request" className="new-request-button">
            + New Hire Request
          </Link>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading pending approval requests...</p>
        </div>
      )}
      
      {/* No results */}
      {!loading && filteredRequests.length === 0 && (
        <div className="no-results">
          {searchTerm ? (
            <p>No requests matching "{searchTerm}" found.</p>
          ) : (
            <p>No pending approval requests found.</p>
          )}
        </div>
      )}
      
      {/* Results table */}
      {!loading && filteredRequests.length > 0 && (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Actions</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Personal Email</th>
                <th>Mobile</th>
                <th>Position</th>
                <th>Client Name</th>
                <th>Package/Rate</th>
                <th>Gross Profit Margin</th>
                <th>Contract End Date</th>
                <th>Is Laptop Required</th>
                <th>Notes</th>
                <th>Billing Rate</th>
                <th>New Client Legal Name</th>
                <th>Approval Status</th>
                <th>Created By</th>
                <th>Employee Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <button onClick={() => approveRequest(request.id)} className="approve-button">Approve</button>
                    <button onClick={() => rejectRequest(request.id)} className="reject-button">Reject</button>
                  </td>
                  <td>{request.FirstName}</td>
                  <td>{request.LastName}</td>
                  <td>{request.PersonalEmail}</td>
                  <td>{request.Mobile}</td>
                  <td>{request.Position}</td>
                  <td>{request.ClientName}</td>
                  <td>{request.PackageOrRate}</td>
                  <td>{request.GrossProfitMargin}</td>
                  <td>{request.ContractEndDate}</td>
                  <td>{request.IsLaptopRequired}</td>
                  <td>{request.Notes}</td>
                  <td>{request.BillingRate}</td>
                  <td>{request.NewClientLegalName}</td>
                  <td>{request.ApprovalStatus}</td>
                  <td>{request.CreateBy}</td>
                  <td>{request.EmployeeType}</td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="section">
        <p className="version-tag">{APP_VERSION.number} ({APP_VERSION.date})</p>
      </div>
    </div>
  );
};

export default PendingApprovals;