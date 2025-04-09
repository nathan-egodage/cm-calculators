import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";
import MSListService from '../services/MSListService';
import ClientService from '../services/ClientService';
import '../styles/NewHireRequest.css';

const NewHireRequest = () => {
  // Get the authenticated user
  const { user, loaded } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('candidate');
  
  // Client type state (existing or new)
  const [isNewClient, setIsNewClient] = useState(false);
  
  // Add employee type state
  const [employeeType, setEmployeeType] = useState('AU PAYG Contractor');
  
  // Form state
  const [formData, setFormData] = useState({
    AccountManager: user?.userDetails || '',
    FirstName: '',
    LastName: '',
    PersonalEmail: '',
    Mobile: '',
    Address: '',
    Position: '',
    Office: '',
    ClientName: '',
    Status: 'Pending',
    SignByDate: '',
    StartDate: '',
    PackageOrRate: '',
    GrossProfitMargin: '',
    ContractEndDate: '',
    IsLaptopRequired: 'No',
    Rehire: 'No',
    Notes: '',
    ABNName: '',
    ABNNumber: '',
    ABNAddress: '',
    EngagementName: '',
    TaskName: '',
    BillingRate: '',
    NewClientLegalName: '',
    NewClientAddress: '',
    NewClientEmailAddress: '',
    ResourceLevelCode: '',
    ApprovalStatus: 'Pending',
    CreateDate: new Date().toISOString(),
    CreateBy: user?.userDetails || '',
    ApprovedBy: '',
    ApprovedDate: ''
  });
  
  // State for client list and loading states
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  // Office locations
  const officeLocations = [
    "Australia - Brisbane",
    "Australia - Melbourne",
    "Australia - Sydney",
    "India",
    "New Zealand - Christchurch",
    "Philippines - Manila"
  ];
  
  // Employee types
  const employeeTypes = [
    "AU FTE",
    "AU PAYG Contractor",
    "AU ABN Contractor",
    "PHP FTE",
    "PHP Contractor",
    "Offshore (Other) contractor"
  ];
  
  // Check if user is authorized to create new hire request
  const isAuthorized = () => {
    if (!user) return false;
    
    return AUTHORIZED_USERS.newHireRequestCreators.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
  };
  
  // Fetch clients from external API when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      if (!loaded || !isAuthorized()) return;
      
      try {
        setClientLoading(true);
        const clientList = await ClientService.getClients();
        setClients(clientList);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setError('Failed to load client list. Please try again later.');
      } finally {
        setClientLoading(false);
      }
    };
    
    fetchClients();
  }, [loaded, user]);
  
  // Email validation function
  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    setError(null);
  };
  
  const handleBlur = (e) => {
    const { name, value } = e.target;

    if (name === 'PersonalEmail' && !validateEmail(value)) {
      setError('Invalid email address');
    } else if (name === 'Mobile' && !/^\+\d{1,3}\d{4,14}$/.test(value)) {
      setError('Invalid phone number format');
    } else {
      setError(null);
    }
  };
  
  // Handle client selection - populate client details
  const handleClientSelect = async (e) => {
    const clientId = e.target.value;
    
    if (clientId) {
      setIsNewClient(false);
      try {
        setClientLoading(true);
        const clientDetails = await ClientService.getClientDetails(clientId);
        
        setFormData(prevData => ({
          ...prevData,
          ClientName: clientDetails.name,
          NewClientLegalName: clientDetails.legalName,
          NewClientAddress: clientDetails.address,
          NewClientEmailAddress: clientDetails.email
        }));
      } catch (err) {
        console.error('Failed to fetch client details:', err);
        setError('Failed to load client details. Please try again later.');
      } finally {
        setClientLoading(false);
      }
    }
  };
  
  // Handle client type change
  const handleClientTypeChange = (e) => {
    const isNew = e.target.value === 'new';
    setIsNewClient(isNew);
    
    // Clear client fields if switching client types
    if (isNew) {
      setFormData(prevData => ({
        ...prevData,
        ClientName: '',
        NewClientLegalName: '',
        NewClientAddress: '',
        NewClientEmailAddress: ''
      }));
    }
  };
  
  // Handle employee type change
  const handleEmployeeTypeChange = (e) => {
    setEmployeeType(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthorized()) {
      setError('You are not authorized to submit a new hire request.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        CreateDate: new Date().toISOString(),
        CreateBy: user.userDetails
      };
      
      // Submit to Microsoft List
      await MSListService.createNewHireRequest(submissionData);
      
      // Reset form and show success message
      setFormData({
        ...formData,
        FirstName: '',
        LastName: '',
        PersonalEmail: '',
        Mobile: '',
        Address: '',
        Position: '',
        Office: '',
        ClientName: '',
        SignByDate: '',
        StartDate: '',
        PackageOrRate: '',
        GrossProfitMargin: '',
        ContractEndDate: '',
        IsLaptopRequired: 'No',
        Rehire: 'No',
        Notes: '',
        ABNName: '',
        ABNNumber: '',
        ABNAddress: '',
        EngagementName: '',
        TaskName: '',
        BillingRate: '',
        NewClientLegalName: '',
        NewClientAddress: '',
        NewClientEmailAddress: '',
        ResourceLevelCode: '',
      });
      
      setSubmitSuccess(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      
    } catch (err) {
      console.error('Failed to submit new hire request:', err);
      setError('Failed to submit new hire request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const validateCandidateInfo = () => {
    const requiredFields = [
      'FirstName',
      'LastName',
      'PersonalEmail',
      'Mobile',
      'Position',
      'SignByDate',
      'StartDate',
      'PackageOrRate',
      'Office'
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill out the ${field} field.`);
        return false;
      }
    }

    if (!validateEmail(formData.PersonalEmail)) {
      setError('Invalid email address');
      return false;
    }

    if (!/^\+\d{1,3}\d{4,14}$/.test(formData.Mobile)) {
      setError('Invalid phone number format');
      return false;
    }

    setError(null);
    return true;
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
          <p>You do not have permission to access the New Hire Request form.</p>
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
      
      <h1>New Hire Request</h1>
      
      {submitSuccess && (
        <div className="success-message">
          <p>New hire request submitted successfully! It has been sent for approval.</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="new-hire-form">
        {/* Tabs Navigation */}
        <div className="form-tabs">
          <div 
            className={`tab-item ${activeTab === 'candidate' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidate')}
          >
            Candidate Information
          </div>
          <div 
            className={`tab-item ${activeTab === 'clientEngagement' ? 'active' : ''}`}
            onClick={() => setActiveTab('clientEngagement')}
          >
            Client & Engagement Details
          </div>
        </div>
        
        {/* Candidate Information Tab */}
        <div className={`tab-content ${activeTab === 'candidate' ? 'active' : ''}`}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="EmployeeType" className="required-field">Employee Type</label>
              <select id="EmployeeType" name="EmployeeType" value={employeeType} onChange={handleEmployeeTypeChange} required>
                <option value="">Select Employee Type</option>
                {employeeTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="AccountManager">Account Manager</label>
              <input type="text" id="AccountManager" name="AccountManager" value={formData.AccountManager} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="FirstName" className="required-field">First Name</label>
              <input type="text" id="FirstName" name="FirstName" value={formData.FirstName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="LastName" className="required-field">Last Name</label>
              <input type="text" id="LastName" name="LastName" value={formData.LastName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="PersonalEmail" className="required-field">Email</label>
              <input type="email" id="PersonalEmail" name="PersonalEmail" value={formData.PersonalEmail} onChange={handleInputChange} onBlur={handleBlur} required />
            </div>
            <div className="form-group">
              <label htmlFor="Mobile" className="required-field">Mobile</label>
              <input type="tel" id="Mobile" name="Mobile" value={formData.Mobile} onChange={handleInputChange} onBlur={handleBlur} required placeholder="e.g. +61412345678" />
            </div>
            <div className="form-group">
              <label htmlFor="Position" className="required-field">Position</label>
              <input type="text" id="Position" name="Position" value={formData.Position} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="ResourceLevelCode">Resource Level</label>
              <select id="ResourceLevelCode" name="ResourceLevelCode" value={formData.ResourceLevelCode} onChange={handleInputChange}>
                <option value="">Select Level</option>
                <option value="L1">Level 1</option>
                <option value="L2">Level 2</option>
                <option value="L3">Level 3</option>
                <option value="L4">Level 4</option>
                <option value="L5">Level 5</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="SignByDate" className="required-field">Sign By Date</label>
              <input type="date" id="SignByDate" name="SignByDate" value={formData.SignByDate} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="StartDate" className="required-field">Start Date</label>
              <input type="date" id="StartDate" name="StartDate" value={formData.StartDate} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="ContractEndDate">End Date</label>
              <input type="text" id="ContractEndDate" name="ContractEndDate" value={formData.ContractEndDate} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="PackageOrRate" className="required-field">Package/Rate</label>
              <input type="text" id="PackageOrRate" name="PackageOrRate" value={formData.PackageOrRate} onChange={handleInputChange} required placeholder="$XXX/day" />
            </div>
            <div className="form-group">
              <label htmlFor="Office" className="required-field">Office</label>
              <select id="Office" name="Office" value={formData.Office} onChange={handleInputChange} required>
                <option value="">Select Office</option>
                {officeLocations.map((office, index) => (
                  <option key={index} value={office}>{office}</option>
                ))}
              </select>
            </div>
            <div className="form-group span-2">
              <label htmlFor="Address">Address</label>
              <textarea id="Address" name="Address" value={formData.Address} onChange={handleInputChange} rows="2" />
            </div>
            <div className="form-group">
              <label htmlFor="GrossProfitMargin">Profit Margin %</label>
              <input type="text" id="GrossProfitMargin" name="GrossProfitMargin" value={formData.GrossProfitMargin} onChange={handleInputChange} placeholder="XX%" />
            </div>
            <div className="form-group">
              <label>Laptop Required</label>
              <div className="radio-group">
                <label>
                  <input type="radio" name="IsLaptopRequired" value="Yes" checked={formData.IsLaptopRequired === 'Yes'} onChange={() => setFormData({...formData, IsLaptopRequired: 'Yes'})} />
                  Yes
                </label>
                <label>
                  <input type="radio" name="IsLaptopRequired" value="No" checked={formData.IsLaptopRequired === 'No'} onChange={() => setFormData({...formData, IsLaptopRequired: 'No'})} />
                  No
                </label>
              </div>
            </div>
            <div className="form-group">
              <label>Rehire (Previous Staff)</label>
              <div className="radio-group">
                <label>
                  <input type="radio" name="Rehire" value="Yes" checked={formData.Rehire === 'Yes'} onChange={() => setFormData({...formData, Rehire: 'Yes'})} />
                  Yes
                </label>
                <label>
                  <input type="radio" name="Rehire" value="No" checked={formData.Rehire === 'No'} onChange={() => setFormData({...formData, Rehire: 'No'})} />
                  No
                </label>
              </div>
            </div>

            {/* ABN Information Fields */}
            {employeeType === "AU ABN Contractor" && (
              <>
                <div className="form-group">
                  <label htmlFor="ABNName" className="required-field">ABN Name</label>
                  <input type="text" id="ABNName" name="ABNName" value={formData.ABNName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="ABNNumber" className="required-field">ABN Number</label>
                  <input type="text" id="ABNNumber" name="ABNNumber" value={formData.ABNNumber} onChange={handleInputChange} required />
                </div>
                <div className="form-group span-2">
                  <label htmlFor="ABNAddress" className="required-field">ABN Address</label>
                  <textarea id="ABNAddress" name="ABNAddress" value={formData.ABNAddress} onChange={handleInputChange} rows="2" required />
                </div>
              </>
            )}

            <div className="form-group span-2">
              <label htmlFor="Notes">Notes</label>
              <textarea id="Notes" name="Notes" value={formData.Notes} onChange={handleInputChange} rows="3" placeholder="Any additional information..." />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="next-button"
              onClick={() => {
                if (validateCandidateInfo()) {
                  setActiveTab('clientEngagement');
                }
              }}
            >
              Next
            </button>
          </div>
        </div>
        
        {/* Client & Engagement Details Tab */}
        <div className={`tab-content ${activeTab === 'clientEngagement' ? 'active' : ''}`}>
          <div className="form-grid">
            <div className="form-group span-2">
              <div className="client-type-selector">
                <label>Client Type:</label>
                <div className="radio-group">
                  <label>
                    <input 
                      type="radio" 
                      name="clientType" 
                      value="existing" 
                      checked={!isNewClient} 
                      onChange={handleClientTypeChange}
                    />
                    Existing Client
                  </label>
                  <label>
                    <input 
                      type="radio" 
                      name="clientType" 
                      value="new" 
                      checked={isNewClient} 
                      onChange={handleClientTypeChange}
                    />
                    New Client
                  </label>
                </div>
              </div>
            </div>
            
            {!isNewClient && (
              <div className="form-group span-2">
                <label htmlFor="ClientSelect">Select Existing Client</label>
                <select id="ClientSelect" onChange={handleClientSelect} disabled={clientLoading}>
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {clientLoading && <span className="loading-indicator">Loading client data...</span>}
              </div>
            )}
            
            {isNewClient && (
              <>
                <div className="form-group">
                  <label htmlFor="ClientName" className="required-field">Client Name</label>
                  <input type="text" id="ClientName" name="ClientName" value={formData.ClientName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="NewClientLegalName">Client Legal Name</label>
                  <input type="text" id="NewClientLegalName" name="NewClientLegalName" value={formData.NewClientLegalName} onChange={handleInputChange} />
                </div>
                <div className="form-group span-2">
                  <label htmlFor="NewClientAddress">Client Address</label>
                  <textarea id="NewClientAddress" name="NewClientAddress" value={formData.NewClientAddress} onChange={handleInputChange} rows="2" />
                </div>
                <div className="form-group span-2">
                  <label htmlFor="NewClientEmailAddress">Client Email</label>
                  <input type="email" id="NewClientEmailAddress" name="NewClientEmailAddress" value={formData.NewClientEmailAddress} onChange={handleInputChange} />
                </div>
              </>
            )}
            
            
            <div className="form-group">
              <label htmlFor="EngagementName" className="required-field">Engagement Name</label>
              <input type="text" id="EngagementName" name="EngagementName" value={formData.EngagementName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="TaskName" className="required-field">Task Name</label>
              <input type="text" id="TaskName" name="TaskName" value={formData.TaskName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="BillingRate" className="required-field">Client Billing Rate</label>
              <input type="text" id="BillingRate" name="BillingRate" value={formData.BillingRate} onChange={handleInputChange} required placeholder="$XXX/day" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link to="/" className="cancel-button">Cancel</Link>
          </div>
        </div>
      </form>
      
      <div className="section">
        <p className="version-tag">{APP_VERSION.number} ({APP_VERSION.date})</p>
      </div>
    </div>
  );
};

export default NewHireRequest;