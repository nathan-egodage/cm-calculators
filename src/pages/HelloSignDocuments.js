// src/pages/HelloSignDocuments.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import HelloSignService from '../services/HelloSignService';
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";

const AUTH_HEADER = `Basic ${process.env.HELLOSIGN_API_KEY}`;

const HelloSignDocuments = () => {
  // Get the authenticated user
  const { user, loading: authLoading, error: authError } = useAuth();
  
  // State for signature requests
  const [signatureRequests, setSignatureRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [rawApiResponse, setRawApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  
  // Check if user is authorized to access this page
  const isAuthorized = () => {
    if (!user) return false;
    
    return AUTHORIZED_USERS.helloSignDocuments.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
  };

  // Fetch signature requests when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !isAuthorized()) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Use the real HelloSign API
        const response = await HelloSignService.getSignatureRequests();
        console.log('Raw API Response in HelloSignDocuments:', {
          response,
          signatureRequests: response?.signature_requests,
          totalRequests: response?.signature_requests?.length
        });
        setRawApiResponse(response);
        const processedData = HelloSignService.processSignatureData(response);
        
        // Filter out Bank/Emergency/Pay Schedule documents
        const filteredData = processedData.filter(request => 
          !request.title.includes('Bank/Emergency/Pay Schedule')
        );
        
        setSignatureRequests(filteredData);
        setFilteredRequests(filteredData);
      } catch (err) {
        console.error('Failed to fetch signature requests:', err);
        setError('Failed to load signature requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Call the function
    fetchData();
    
    // Cleanup function
    return () => {
      // Any cleanup needed when component unmounts
    };
  }, [authLoading, user]); // Only run on initial load and auth changes

  // Apply filters when filter values change
  useEffect(() => {
    // Filter based on status and search term
    const filtered = signatureRequests.filter(request => {
      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        request.signers.some(signer => signer.statusCode === statusFilter);

      // Search filter
      const searchTerm = searchFilter.toLowerCase();
      const matchesSearch = !searchTerm || 
        request.title.toLowerCase().includes(searchTerm) ||
        request.signers.some(signer => 
          signer.email.toLowerCase().includes(searchTerm)
        ) ||
        (request.response_data?.find(field => field.name === "Full name3")?.value || '').toLowerCase().includes(searchTerm);

      // Exclude documents with "Bank/Emergency/Pay Schedule" or "management" in title
      const title = request.title.toLowerCase();
      const excludedTitle = title.includes('bank/emergency/pay schedule') || 
                          title.includes('management') ||
                          title.includes('dilan') ||
                          title.includes('david') ||
                          title.includes('ashley') ||
                          title.includes('darren') ||
                          title.includes('rocket') ||
                          title.includes('nathan') ||
                          title.includes('simon') ||
                          title.includes('james') ||
                          title.includes('greig');

      // Check for permanent employee salary limit
      const isPermanentEmployee = title.includes('permanent employee');
      let salaryUnderLimit = true;
      
      if (isPermanentEmployee && request.raw_request?.custom_fields) {
        const salaryValue = request.raw_request.custom_fields[8]?.value;
        if (salaryValue) {
          const numericSalary = parseFloat(salaryValue.replace(/,/g, ''));
          salaryUnderLimit = numericSalary <= 180000;
        }
      }

      return matchesStatus && matchesSearch && !excludedTitle && salaryUnderLimit;
    });

    setFilteredRequests(filtered);
  }, [statusFilter, searchFilter, signatureRequests]);

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle search filter change
  const handleSearchChange = (e) => {
    setSearchFilter(e.target.value);
  };

  // Add masking functions
  const maskEmail = (email) => {
    if (!email || email === 'N/A') return 'N/A';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    return `${localPart.slice(0, 2)}***@${domain}`;
  };

  const maskRateOrSalary = (rate) => {
    if (!rate || rate === 'N/A') return 'N/A';
    
    // For CloudMarc permanent employees (salary)
    if (rate.includes('PA')) {
      return 'AUD$ ***,***.00 PA';
    }
    
    // For contractors (daily rate)
    return 'AUD$ ***.00';
  };

  // Check if authentication is still in progress
  if (authLoading) {
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
          <p>You do not have permission to view this page.</p>
          <Link to="/" className="back-button">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container india-theme">
      <div className="nav-buttons">
        <Link to="/" className="back-button">&#8592; Back to All Calculators</Link>
      </div>
      
      <h1>Contract Agreements Status Dashboard</h1>
      
      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select 
            id="status-filter" 
            value={statusFilter} 
            onChange={handleStatusFilterChange}
          >
            <option value="all">All Statuses</option>
            <option value="awaiting_signature">Pending</option>
            <option value="signed">Signed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="search-filter">Search:</label>
          <input 
            type="text" 
            id="search-filter" 
            value={searchFilter} 
            onChange={handleSearchChange}
            placeholder="Search in any column (use * for wildcard)"
            className="search-input"
          />
          <span className="search-hint">
            Tip: Use * for any characters, ? for single character
          </span>
        </div>
      </div>
      
      {/* Loading and Error States */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading HelloSign documents...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* Results Table */}
      {!loading && !error && (
        <div className="document-table-container">
          <table className="document-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Document Title</th>
                <th>Status</th>
                <th>Signed At</th>
                <th>Job Title</th>
                <th>Rate PD /Salary PA</th>
                <th>Start Date</th>
                <th>Sign By Date</th>
                <th>Signer Email</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-results">No documents found matching the filters</td>
                </tr>
              ) :
                filteredRequests.flatMap(request => {
                  // Determine contract types
                  const isACNContract = request.title.includes('ACN Contractor Agreement');
                  const isIndividualContract = request.title.includes('Individual Contractor Agreement');
                  const isCloudMarcContract = request.title.includes('CloudMarc Permanent Employee');
                  
                  // Get fields based on contract type
                  let jobTitle, ratePerDay, startDate, signByDate;
                  
                  if (isACNContract && request.raw_request) {
                    // Get the name from response_data
                    const fullName = request.response_data?.find(field => field.name === "Full name3")?.value;
                    
                    // Get the custom fields directly from the raw request
                    const customFields = request.raw_request.custom_fields;
                    
                    if (customFields) {
                      // Get Job Title (index 9)
                      jobTitle = customFields[9]?.value || 'Services';
                      
                      // Get Rate Per Hour (index 4) and calculate daily rate
                      const ratePerHour = parseFloat(customFields[4]?.value) || 0;
                      ratePerDay = ratePerHour ? `AUD$ ${(ratePerHour * 8).toFixed(2)}` : 'N/A';
                      
                      // Get Start Date (index 3)
                      startDate = customFields[3]?.value || 'N/A';
                      signByDate = 'N/A';
                    } else {
                      jobTitle = 'Services';
                      ratePerDay = 'N/A';
                      startDate = 'N/A';
                      signByDate = 'N/A';
                    }
                  } else if (isIndividualContract && request.raw_request) {
                    // For Individual Contractor Agreement
                    const customFields = request.raw_request.custom_fields;
                    
                    if (customFields) {
                      // Find fields by name for Individual Contracts
                      jobTitle = customFields.find(f => f.name === "Job Title")?.value || 'N/A';
                      const rateValue = customFields.find(f => f.name === "Rate per day")?.value;
                      // Format rate with 2 decimal places
                      ratePerDay = rateValue ? `AUD$ ${parseFloat(rateValue).toFixed(2)}` : 'N/A';
                      startDate = customFields.find(f => f.name === "Start date")?.value || 'N/A';
                      signByDate = customFields.find(f => f.name === "Sign by date")?.value || 'N/A';
                    } else {
                      jobTitle = 'N/A';
                      ratePerDay = 'N/A';
                      startDate = 'N/A';
                      signByDate = 'N/A';
                    }
                  } else if (isCloudMarcContract && request.raw_request) {
                    // For CloudMarc Permanent Employee Contract
                    const customFields = request.raw_request.custom_fields;
                    
                    if (customFields) {
                      // Find fields by name for CloudMarc contracts
                      jobTitle = customFields.find(f => f.name === "Job Title")?.value || 'N/A';
                      
                      // Get salary from index 8
                      const salaryValue = customFields[8]?.value;
                      
                      // Format salary with commas and 2 decimal places if available
                      if (salaryValue) {
                        // Remove any existing commas and convert to number
                        const cleanValue = salaryValue.replace(/,/g, '');
                        const numericValue = parseFloat(cleanValue);
                        
                        // Format with commas and 2 decimal places
                        ratePerDay = `AUD$ ${numericValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}`;
                      } else {
                        ratePerDay = 'N/A';
                      }
                      
                      startDate = customFields.find(f => f.name === "Start Date")?.value || 'N/A';
                      signByDate = customFields.find(f => f.name === "Sign by date")?.value || 'N/A';

                      console.log('CloudMarc Contract Fields:', {
                        jobTitle,
                        salaryValue,
                        ratePerDay,
                        startDate,
                        signByDate,
                        allFields: customFields.map((f, i) => `${i}: ${f.name} = ${f.value}`)
                      });
                    } else {
                      jobTitle = 'N/A';
                      ratePerDay = 'N/A';
                      startDate = 'N/A';
                      signByDate = 'N/A';
                    }
                  } else {
                    // For any other type of document
                    jobTitle = 'N/A';
                    ratePerDay = 'N/A';
                    startDate = 'N/A';
                    signByDate = 'N/A';
                  }

                  return request.signers.map((signer, index) => (
                    <tr key={`${request.id}-${index}`} className={`status-${signer.statusCode}`}>
                      <td className="left-align">
                        {request.response_data?.find(field => field.name === "Full name3")?.value || 'N/A'}
                      </td>
                      <td className="left-align">{request.title}</td>
                      <td className="left-align">
                        <span className={`status-badge ${signer.statusCode}`}>
                          {signer.statusCode === 'awaiting_signature' ? 'Pending' : 
                           signer.statusCode === 'signed' ? 'Signed' : 
                           signer.statusCode === 'declined' ? 'Declined' : signer.statusCode}
                        </span>
                      </td>
                      <td className="left-align">{signer.signedAt}</td>
                      <td className="left-align">{jobTitle}</td>
                      <td className="left-align">{maskRateOrSalary(ratePerDay)}</td>
                      <td className="left-align">{startDate}</td>
                      <td className="left-align">{signByDate}</td>
                      <td className="left-align">{maskEmail(signer.email)}</td>
                    </tr>
                  ));
                })
              }
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

export default HelloSignDocuments;