import React, { useEffect, useState } from 'react';
import msListService from '../services/MSListService';
import { AUTHORIZED_USERS } from '../config/appConfig';
import { Link } from 'react-router-dom';

const NewHireRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const url = 'https://graph.microsoft.com/v1.0/sites/cloudmarc.sharepoint.com,a1e3c62a-f735-4ee2-a5a7-9412e863c617,f6ba5e0b-6ec1-43d8-98de-28e8c2517d38/lists/4ac9d268-cbfc-455a-8b9b-cf09547e8bd4/items?$expand=fields';
        
        console.log('Fetching from URL:', url);
        
        // Use the getNewHireRequests method directly from MSListService
        // instead of making our own fetch call
        const data = await msListService.getNewHireRequests();
        
        // Only update state if the component is still mounted
        if (isMounted) {
          setRequests(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch new hire requests:', err);
        
        // Only update state if the component is still mounted
        if (isMounted) {
          if (err.errorCode === 'interaction_in_progress') {
            setError('Authentication is in progress. Please try again in a moment.');
          } else {
            setError(`Failed to fetch new hire requests: ${err.message}`);
          }
          setLoading(false);
        }
      }
    };

    fetchRequests();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const userHasAccess = () => {
    try {
      const accounts = msListService.msalInstance.getAllAccounts();
      const currentUserEmail = accounts.length > 0 ? accounts[0]?.username : null;
      const isLocalhost = window.location.hostname === 'localhost';
      
      console.log('Current user:', currentUserEmail);
      console.log('Is localhost:', isLocalhost);
      
      return isLocalhost || 
        (currentUserEmail && AUTHORIZED_USERS.newHireRequestCreators.includes(currentUserEmail));
    } catch (error) {
      console.error('Error checking user access:', error);
      return false;
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (!userHasAccess()) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You do not have permission to view hire requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav-buttons">
        <Link to="/" className="back-button">&#8592; Back to Home</Link>
      </div>
      <h1>New Hire Requests</h1>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          {error.includes('interaction_in_progress') && (
            <button onClick={() => window.location.reload()} className="retry-button">
              Retry
            </button>
          )}
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading new hire requests...</p>
        </div>
      ) : requests.length > 0 ? (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Approval Status</th>
                <th>Created By</th>
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
                
                <th>Employee Type</th>
                <th>Start Date</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.field_8}</td>
                  <td>{request.field_30}</td>
                  <td>{request.field_1}</td>
                  <td>{request.field_2}</td>
                  <td>{request.field_3}</td>
                  <td>{request.field_4}</td>
                  <td>{request.field_6}</td>
                  <td>{request.field_7}</td>
                  <td>{request.field_11}</td>
                  <td>{request.field_12}</td>
                  <td>{formatDate(request.field_13)}</td>
                  <td>{request.field_14}</td>
                  <td>{request.field_17}</td>
                  <td>{request.field_23}</td>
                  <td>{request.field_24}</td>
                  <td>{request.field_33}</td>
                  <td>{formatDate(request.field_10)}</td>
                  <td>{formatDate(request.field_29)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results">
          <p>No new hire requests found.</p>
        </div>
      )}
    </div>
  );
};

export default NewHireRequestsList;