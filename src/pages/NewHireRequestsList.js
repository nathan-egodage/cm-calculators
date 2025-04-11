import React, { useEffect, useState } from 'react';
import msListService from '../services/MSListService';
import { AUTHORIZED_USERS } from '../config/appConfig';
import { Link } from 'react-router-dom';

const NewHireRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const sortedRequests = React.useMemo(() => {
    let sortableRequests = [...requests];
    if (sortConfig.key !== null) {
      sortableRequests.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableRequests;
  }, [requests, sortConfig]);

  const filteredRequests = React.useMemo(() => {
    return sortedRequests.filter(request => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return Object.values(request).some(value =>
        value && value.toString().toLowerCase().includes(term)
      );
    });
  }, [sortedRequests, searchTerm]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isLocalhost) {
          // For localhost, set default user and proceed with MSAL authentication
          setUserInfo({
            userDetails: 'nathan@cloudmarc.com.au',
            identityProvider: 'aad',
            userId: 'test-user',
            userRoles: ['authenticated']
          });
          return;
        }

        const response = await fetch('/.auth/me');
        const authData = await response.json();
        
        if (authData.clientPrincipal) {
          setUserInfo(authData.clientPrincipal);
        } else {
          window.location.href = '/.auth/login/aad';
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        if (!isLocalhost) {
          setError('Authentication failed. Please try logging in again.');
        }
      }
    };

    checkAuth();
  }, [isLocalhost]);

  useEffect(() => {
    if (!userInfo) return;

    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Initialize MS List Service first
        await msListService.initialize();
        
        // Then fetch the data
        const data = await msListService.getNewHireRequests();
        setRequests(data);
      } catch (err) {
        console.error('Failed to fetch new hire requests:', err);
        setError(`Failed to fetch new hire requests: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [userInfo]);

  const userHasAccess = () => {
    if (!userInfo) return false;
    return AUTHORIZED_USERS.newHireRequestCreators.includes(userInfo.userDetails);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

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

  if (!userInfo) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Verifying your access permissions...</p>
      </div>
    );
  }

  if (!userHasAccess()) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You do not have permission to view hire requests.</p>
          <button 
            onClick={() => window.location.href = '/.auth/logout'}
            className="logout-button"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav-buttons">
        <Link to="/" className="back-button">&#8592; Back to Home</Link>
      </div>
      <h1>View Hire Requests</h1>
      
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
      
      <div className="filters-section">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading new hire requests...</p>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('field_8')}>Status</th>
                <th onClick={() => handleSort('field_30')}>Created By</th>
                <th onClick={() => handleSort('field_29')}>Created Date</th>
                <th onClick={() => handleSort('field_1')}>First Name</th>
                <th onClick={() => handleSort('field_2')}>Last Name</th>
                <th onClick={() => handleSort('field_7')}>Client Name</th>
                <th onClick={() => handleSort('field_24')}>New Client Name</th>
                <th onClick={() => handleSort('field_12')}>GP Margin %</th>
                <th onClick={() => handleSort('field_23')}>Billing Rate</th>
                <th onClick={() => handleSort('field_10')}>Start Date</th>
                <th onClick={() => handleSort('field_11')}>Package/Rate</th>
                <th onClick={() => handleSort('field_14')}>Laptop Required</th>
                <th onClick={() => handleSort('field_35')}>Rehire</th>
                <th onClick={() => handleSort('field_33')}>Employee Type</th>
                <th onClick={() => handleSort('field_6')}>Position</th>
                <th onClick={() => handleSort('field_3')}>Personal Email</th>
                <th onClick={() => handleSort('field_4')}>Mobile</th>
                <th onClick={() => handleSort('field_13')}>Contract Term</th>
                <th onClick={() => handleSort('field_17')}>Notes</th>
                
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td><span className={`status-badge ${request.field_8.toLowerCase()}`}>{request.field_8}</span></td>
                  <td>{request.field_30}</td>
                  <td>{formatDate(request.field_29)}</td>
                  <td>{request.field_1}</td>
                  <td>{request.field_2}</td>
                  <td>{request.field_7}</td>
                  <td>{request.field_24}</td>
                  <td><span className={`status-badge ${parseFloat(request.field_12) < 35 ? 'gp-margin-low' : 'gp-margin-high'}`}>{request.field_12}%</span></td>
                  <td>${request.field_23}</td>
                  <td>{formatDate(request.field_10)}</td>
                  <td>${request.field_11}</td>
                  <td><span className={`status-badge ${request.field_14 === 'Yes' ? 'laptop-required-yes' : 'laptop-required-no'}`}>{request.field_14}</span></td>
                  <td><span className={`status-badge ${request.field_16 === 'Yes' ? 'rehire-yes' : 'rehire-no'}`}>{request.field_16}</span></td>
                  <td>{request.field_33}</td>
                  <td>{request.field_6}</td>
                  <td>{request.field_3}</td>
                  <td>{request.field_4}</td>
                  <td>{request.field_13}</td>
                  <td>{request.field_17}</td>
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