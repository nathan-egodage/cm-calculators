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
  
  // Tab state with progress tracking
  const [activeTab, setActiveTab] = useState('candidate');
  const [tabsCompleted, setTabsCompleted] = useState({
    candidate: false,
    clientEngagement: false
  });
  
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
    CreateDate: new Date().toISOString(),
    CreateBy: user?.userDetails || '',
    ApprovedBy: '',
    ApprovedDate: ''
  });
  
  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});
  
  // State for client list and loading states
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [testSuccess, setTestSuccess] = useState(false);
  
  // Office locations
  const officeLocations = [
    "Australia - Brisbane",
    "Australia - Melbourne",
    "Australia - Sydney",
    "India",
    "New Zealand - Christchurch",
    "Philippines - Manila"
  ];
  
  // Employee types with categories
  const employeeTypeOptions = [
    { value: "AU FTE", label: "AU FTE", category: "Australia" },
    { value: "AU PAYG Contractor", label: "AU PAYG Contractor", category: "Australia" },
    { value: "AU ABN Contractor", label: "AU ABN Contractor", category: "Australia" },
    { value: "PHP FTE", label: "PHP FTE", category: "Philippines" },
    { value: "PHP Contractor", label: "PHP Contractor", category: "Philippines" },
    { value: "Offshore (Other) contractor", label: "Offshore (Other) contractor", category: "Other" }
  ];
  
  // Resource levels with description
  const resourceLevels = [
    { value: "", label: "Select Level" },
    { value: "L1", label: "Level 1 - Junior", description: "0-2 years experience" },
    { value: "L2", label: "Level 2 - Intermediate", description: "2-4 years experience" },
    { value: "L3", label: "Level 3 - Senior", description: "4-8 years experience" },
    { value: "L4", label: "Level 4 - Lead", description: "8+ years experience" },
    { value: "L5", label: "Level 5 - Principal", description: "10+ years experience with leadership" }
  ];
  
  // Account managers
  const accountManagers = [
    { value: "", label: "Select an Account Manager" },
    { value: "Darren Dalla Riva", label: "Darren Dalla Riva" },
    { value: "David Scanlon", label: "David Scanlon" },
    { value: "James Gregory", label: "James Gregory" },
    { value: "Nathan Egodage", label: "Nathan Egodage" },
    { value: "Rocket Ilukpitiya", label: "Rocket Ilukpitiya" },
    { value: "Simon Brownbill", label: "Simon Brownbill" }
  ];
  
  // Check if user is authorized to create new hire request
  const isAuthorized = () => {
    if (!user) return false;
    
    return AUTHORIZED_USERS.newHireRequestCreators.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
  };
  
  // Set today as minimum date for date pickers
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch clients from external API when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      if (!loaded || !isAuthorized()) return;
      
      try {
        setClientLoading(true);
        const clientList = await ClientService.getClients();
        setClients(Array.isArray(clientList) ? clientList : []);
      } catch (err) {
        console.error('Failed to fetch clients:', err);
        setError('Failed to load client list. Please try again later.');
        setClients([]);
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
  
  // Phone validation function
  const validatePhone = (phone) => {
    // Accept international format with + and digits
    return /^\+\d{1,3}\d{4,14}$/.test(phone);
  };
  
  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear specific validation error when field is updated
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
    
    // Clear general error
    setError(null);
  };
  
  // Handle blur events for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...validationErrors };

    // Validate specific fields
    if (name === 'PersonalEmail' && value && !validateEmail(value)) {
      newErrors[name] = 'Please enter a valid email address';
    } else if (name === 'Mobile' && value && !validatePhone(value)) {
      newErrors[name] = 'Please enter a valid phone number in international format (e.g., +61412345678)';
    } else if (name === 'PackageOrRate' && value && !/^\$?\d+(\.\d{1,2})?(\/day|\/hr)?$/.test(value)) {
      newErrors[name] = 'Please enter a valid rate (e.g., $700/day)';
    } else if (name === 'BillingRate' && value && !/^\$?\d+(\.\d{1,2})?(\/day|\/hr)?$/.test(value)) {
      newErrors[name] = 'Please enter a valid billing rate (e.g., $900/day)';
    } else {
      // Clear error if validation passes
      delete newErrors[name];
    }

    setValidationErrors(newErrors);
  };
  
  // Handle client selection - populate client details
  const handleClientSelect = async (e) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    
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
    setSelectedClient('');
    
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
    
    // Clear ABN fields if switching from ABN contractor
    if (e.target.value !== 'AU ABN Contractor') {
      setFormData(prevData => ({
        ...prevData,
        ABNName: '',
        ABNNumber: '',
        ABNAddress: ''
      }));
    }
  };
  
  // Validate candidate info tab
  const validateCandidateInfo = () => {
    const requiredFields = [
      { name: 'FirstName', label: 'First Name' },
      { name: 'LastName', label: 'Last Name' },
      { name: 'PersonalEmail', label: 'Email' },
      { name: 'Mobile', label: 'Mobile' },
      { name: 'Position', label: 'Position' },
      { name: 'SignByDate', label: 'Sign By Date' },
      { name: 'StartDate', label: 'Start Date' },
      { name: 'PackageOrRate', label: 'Package/Rate' },
      { name: 'Office', label: 'Office' },
      { name: 'GrossProfitMargin', label: 'Profit Margin %' },
      { name: 'Address', label: 'Address' },
      { name: 'ResourceLevelCode', label: 'Resource Level' },
      { name: 'ClientLegalName', label: 'Client Legal Name' },
      { name: 'LegalEntityName', label: 'Legal Entity Name' },
      { name: 'ClientEmail', label: 'Client Email' }
    ];
    
    // Add ABN fields if ABN contractor
    if (employeeType === 'AU ABN Contractor') {
      requiredFields.push(
        { name: 'ABNName', label: 'ABN Name' },
        { name: 'ABNNumber', label: 'ABN Number' },
        { name: 'ABNAddress', label: 'ABN Address' }
      );
    }

    let newErrors = {};
    let isValid = true;

    // Check required fields
    for (let field of requiredFields) {
      if (!formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
        isValid = false;
      }
    }

    // Check email format
    if (formData.PersonalEmail && !validateEmail(formData.PersonalEmail)) {
      newErrors.PersonalEmail = 'Please enter a valid email address';
      isValid = false;
    }

    // Check Client Email format
    if (formData.ClientEmail && !validateEmail(formData.ClientEmail)) {
      newErrors.ClientEmail = 'Please enter a valid client email address';
      isValid = false;
    }

    // Check phone format
    if (formData.Mobile && !validatePhone(formData.Mobile)) {
      newErrors.Mobile = 'Please enter a valid phone number in international format (e.g., +61412345678)';
      isValid = false;
    }
    
    // Check dates
    if (formData.StartDate && formData.SignByDate && new Date(formData.StartDate) < new Date(formData.SignByDate)) {
      newErrors.StartDate = 'Start Date cannot be earlier than Sign By Date';
      isValid = false;
    }

    setValidationErrors(newErrors);
    
    // Update tab completion status
    if (isValid) {
      setTabsCompleted(prev => ({
        ...prev,
        candidate: true
      }));
    }

    return isValid;
  };
  
  // Validate client engagement tab
  const validateClientEngagement = () => {
    const requiredFields = [
      { name: 'EngagementName', label: 'Engagement Name' },
      { name: 'TaskName', label: 'Task Name' },
      { name: 'BillingRate', label: 'Client Billing Rate' }
    ];
    
    // Add client name if new client
    if (isNewClient) {
      requiredFields.push({ name: 'ClientName', label: 'Client Name' });
    } else if (!selectedClient) {
      return false; // Existing client selected but no client chosen
    }

    let newErrors = {};
    let isValid = true;

    // Check required fields
    for (let field of requiredFields) {
      if (!formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
        isValid = false;
      }
    }
    
    setValidationErrors(newErrors);
    
    // Update tab completion status
    if (isValid) {
      setTabsCompleted(prev => ({
        ...prev,
        clientEngagement: true
      }));
    }

    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthorized()) {
      setError('You are not authorized to submit a new hire request.');
      return;
    }
    
    // Validate both tabs
    const candidateValid = validateCandidateInfo();
    const clientValid = validateClientEngagement();
    
    if (!candidateValid || !clientValid) {
      // If the current tab is not the one with errors, switch to the tab with errors
      if (candidateValid && !clientValid) {
        setActiveTab('clientEngagement');
      } else if (!candidateValid && clientValid) {
        setActiveTab('candidate');
      }
      
      setError('Please fix the validation errors before submitting.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        CreateDate: new Date().toISOString(),
        CreateBy: user.userDetails,
        EmployeeType: employeeType
      };
      
      console.log('Starting submission process...');
      console.log('Submission data:', submissionData);
      
      // Submit to Microsoft List with user parameter
      const response = await MSListService.createNewHireRequest(submissionData, user);
      console.log('Submission response:', response);
      
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
      
      // Reset validation and tabs
      setValidationErrors({});
      setTabsCompleted({
        candidate: false,
        clientEngagement: false
      });
      setActiveTab('candidate');
      setSelectedClient('');
      setIsNewClient(false);
      
      setSubmitSuccess(true);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
      
    } catch (err) {
      console.error('Detailed error in form submission:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      setError(`Failed to submit new hire request: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test MS List connection
  const testMSListConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setTestSuccess(false);
      
      console.log('%c Starting MS List connection test...', 'background: #222; color: #bada55');
      
      // Ensure authentication is enabled
      await MSListService.enableAuthentication();
      
      // Test data with all required fields mapped to MS List fields
      const testData = {
        field_1: 'Test', // FirstName
        field_2: 'User', // LastName
        field_3: user?.userDetails || 'test@test.com', // PersonalEmail
        field_4: '+61412345678', // Mobile
        field_5: '123 Test Street, Test City', // Address
        field_6: 'Test Position', // Position
        field_7: 'Test Client', // ClientName
        field_8: 'Pending', // Status
        field_9: new Date().toISOString().split('T')[0], // SignByDate
        field_10: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // StartDate
        field_11: '$800/day', // PackageOrRate
        field_12: '30', // GrossProfitMargin
        field_13: '6 months', // ContractEndDate
        field_14: 'No', // IsLaptopRequired
        field_15: 'Australia - Sydney', // Office
        field_16: 'No', // Rehire
        field_17: 'Test connection request', // Notes
        field_21: 'Test Engagement', // EngagementName
        field_22: 'Test Task', // TaskName
        field_23: '$1000/day', // BillingRate
        field_27: 'L3', // ResourceLevelCode
        field_30: user?.userDetails || 'test@test.com', // CreateBy
        field_33: 'AU PAYG Contractor', // EmployeeType
        Title: user?.userDetails || 'test@test.com', // AccountManager
        CreateDate: new Date().toISOString()
      };
      
      console.log('%c Creating test item with data:', 'color: #6495ED', testData);
      
      // Create test item in MS List
      const response = await MSListService.createNewHireRequest(testData);
      console.log('%c Test item created successfully:', 'background: #222; color: #bada55', response);
      
      // Send test email notification
      if (user?.userDetails) {
        const testEmailSubject = 'Test Email - MS List Connection Successful';
        const testEmailContent = `
          <h2>MS List Connection Test Successful</h2>
          <p>This email confirms that the connection to Microsoft Lists is working correctly.</p>
          <h3>Test Item Created:</h3>
          <ul>
            <li><strong>Account Manager:</strong> ${testData.Title}</li>
            <li><strong>Candidate Name:</strong> ${testData.field_1} ${testData.field_2}</li>
            <li><strong>Position:</strong> ${testData.field_6}</li>
            <li><strong>Client:</strong> ${testData.field_7}</li>
            <li><strong>Status:</strong> ${testData.field_8}</li>
            <li><strong>Package/Rate:</strong> ${testData.field_11}</li>
            <li><strong>Billing Rate:</strong> ${testData.field_23}</li>
          </ul>
          <p>The test item has been created in the MS List and this email notification confirms that both systems are functioning correctly.</p>
          <p><em>This is a test message. You can safely delete the test item from MS Lists.</em></p>
        `;
        
        console.log('%c Sending test email to:', 'color: #6495ED', user.userDetails);
        const emailResult = await MSListService.sendEmail([user.userDetails], testEmailSubject, testEmailContent);
        console.log('%c Email sending result:', 'background: #222; color: #bada55', emailResult);
      }
      
      // Verify the item was created by fetching it
      const allItems = await MSListService.getNewHireRequests();
      console.log('%c Current items in list:', 'color: #6495ED', allItems);
      
      setTestSuccess(true);
      setTimeout(() => {
        setTestSuccess(false);
      }, 5000);
      
    } catch (err) {
      console.error('MS List Connection Test Failed:', err);
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred';
      setError(`Failed to connect to Microsoft Lists. Error: ${errorMessage}`);
    } finally {
      setLoading(false);
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
      
      {/* Connection Test */}
      <div className="test-connection-section">
        <button 
          onClick={testMSListConnection}
          className="test-button secondary-button"
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test MS List Connection'}
        </button>
        
        {testSuccess && (
          <div className="inline-success-message">
            <span className="success-icon">✓</span> Connection test successful!
          </div>
        )}
      </div>
      
      {/* Notifications */}
      {submitSuccess && (
        <div className="success-message">
          <div className="message-content">
            <span className="success-icon">✓</span>
            <div>
              <h3>Request Submitted Successfully</h3>
              <p>Your new hire request has been created and is pending approval.</p>
            </div>
          </div>
          <Link to="/pending-approvals" className="view-pending-link">View Pending Approvals</Link>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <div className="message-content">
            <span className="error-icon">!</span>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="new-hire-form">
        <div className="form-section">
          <h3 className="section-title">Employment Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="EmployeeType" className="required-field">Employee Type</label>
              <select 
                id="EmployeeType" 
                name="EmployeeType" 
                value={employeeType} 
                onChange={handleEmployeeTypeChange} 
                required
                className={validationErrors.EmployeeType ? 'error' : ''}
              >
                <option value="">Select Employee Type</option>
                {/* Group employee types by category */}
                <optgroup label="Australia">
                  {employeeTypeOptions
                    .filter(type => type.category === 'Australia')
                    .map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))
                  }
                </optgroup>
                <optgroup label="Philippines">
                  {employeeTypeOptions
                    .filter(type => type.category === 'Philippines')
                    .map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))
                  }
                </optgroup>
                <optgroup label="Other">
                  {employeeTypeOptions
                    .filter(type => type.category === 'Other')
                    .map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))
                  }
                </optgroup>
              </select>
              {validationErrors.EmployeeType && <div className="error-text">{validationErrors.EmployeeType}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="AccountManager">Account Manager</label>
              <select 
                id="AccountManager" 
                name="AccountManager" 
                value={formData.AccountManager} 
                onChange={handleInputChange}
                className={validationErrors.AccountManager ? 'error' : ''}
              >
                {accountManagers.map((manager, index) => (
                  <option key={index} value={manager.value}>{manager.label}</option>
                ))}
              </select>
              {validationErrors.AccountManager && <div className="error-text">{validationErrors.AccountManager}</div>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Candidate Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="FirstName" className="required-field">First Name</label>
              <input 
                type="text" 
                id="FirstName" 
                name="FirstName" 
                value={formData.FirstName} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.FirstName ? 'error' : ''}
                placeholder="Enter first name"
                required 
              />
              {validationErrors.FirstName && <div className="error-text">{validationErrors.FirstName}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="LastName" className="required-field">Last Name</label>
              <input 
                type="text" 
                id="LastName" 
                name="LastName" 
                value={formData.LastName} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.LastName ? 'error' : ''}
                placeholder="Enter last name"
                required 
              />
              {validationErrors.LastName && <div className="error-text">{validationErrors.LastName}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="PersonalEmail" className="required-field">Email</label>
              <input 
                type="email" 
                id="PersonalEmail" 
                name="PersonalEmail" 
                value={formData.PersonalEmail} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.PersonalEmail ? 'error' : ''}
                placeholder="email@example.com"
                required 
              />
              {validationErrors.PersonalEmail && <div className="error-text">{validationErrors.PersonalEmail}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="Mobile" className="required-field">Mobile</label>
              <input 
                type="tel" 
                id="Mobile" 
                name="Mobile" 
                value={formData.Mobile} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.Mobile ? 'error' : ''}
                placeholder="+61412345678"
                required 
              />
              {validationErrors.Mobile && <div className="error-text">{validationErrors.Mobile}</div>}
              {!validationErrors.Mobile && (
                <div className="hint-text">International format with country code (e.g., +61412345678)</div>
              )}
            </div>
            
            <div className="form-group span-2">
              <label htmlFor="Address" className="required-field">Address</label>
              <textarea 
                id="Address" 
                name="Address" 
                value={formData.Address} 
                onChange={handleInputChange}
                className={validationErrors.Address ? 'error' : ''}
                placeholder="Enter full address"
                rows="2" 
              />
              {validationErrors.Address && <div className="error-text">{validationErrors.Address}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="Office" className="required-field">Office</label>
              <select 
                id="Office" 
                name="Office" 
                value={formData.Office} 
                onChange={handleInputChange}
                className={validationErrors.Office ? 'error' : ''}
                required
              >
                <option value="">Select Office</option>
                {officeLocations.map((office, index) => (
                  <option key={index} value={office}>{office}</option>
                ))}
              </select>
              {validationErrors.Office && <div className="error-text">{validationErrors.Office}</div>}
            </div>

            <div className="form-group">
              <label>Laptop Required</label>
              <div>
                <label>
                  <input
                    type="radio"
                    name="IsLaptopRequired"
                    value="Yes"
                    checked={formData.IsLaptopRequired === 'Yes'}
                    onChange={handleInputChange}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="IsLaptopRequired"
                    value="No"
                    checked={formData.IsLaptopRequired === 'No'}
                    onChange={handleInputChange}
                  />
                  No
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Rehire (Previous Staff)</label>
              <div>
                <label>
                  <input
                    type="radio"
                    name="Rehire"
                    value="Yes"
                    checked={formData.Rehire === 'Yes'}
                    onChange={handleInputChange}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="Rehire"
                    value="No"
                    checked={formData.Rehire === 'No'}
                    onChange={handleInputChange}
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Position Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="Position" className="required-field">Position</label>
              <input 
                type="text" 
                id="Position" 
                name="Position" 
                value={formData.Position} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.Position ? 'error' : ''}
                placeholder="e.g. Senior Developer"
                required 
              />
              {validationErrors.Position && <div className="error-text">{validationErrors.Position}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="ResourceLevelCode" className="required-field">Resource Level</label>
              <select 
                id="ResourceLevelCode" 
                name="ResourceLevelCode" 
                value={formData.ResourceLevelCode} 
                onChange={handleInputChange}
                className={validationErrors.ResourceLevelCode ? 'error' : ''}
              >
                {resourceLevels.map((level, index) => (
                  <option key={index} value={level.value}>
                    {level.label}
                    {level.description && ` - ${level.description}`}
                  </option>
                ))}
              </select>
              {validationErrors.ResourceLevelCode && <div className="error-text">{validationErrors.ResourceLevelCode}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="SignByDate" className="required-field">Sign By Date</label>
              <input 
                type="date" 
                id="SignByDate" 
                name="SignByDate" 
                value={formData.SignByDate} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.SignByDate ? 'error' : ''}
                min={today}
                required 
              />
              {validationErrors.SignByDate && <div className="error-text">{validationErrors.SignByDate}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="StartDate" className="required-field">Start Date</label>
              <input 
                type="date" 
                id="StartDate" 
                name="StartDate" 
                value={formData.StartDate} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.StartDate ? 'error' : ''}
                min={formData.SignByDate || today}
                required 
              />
              {validationErrors.StartDate && <div className="error-text">{validationErrors.StartDate}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="ContractEndDate">Contract Term</label>
              <input 
                type="text" 
                id="ContractEndDate" 
                name="ContractEndDate" 
                value={formData.ContractEndDate} 
                onChange={handleInputChange}
                className={validationErrors.ContractEndDate ? 'error' : ''}
                placeholder="Enter contract term"
              />
              {validationErrors.ContractEndDate && <div className="error-text">{validationErrors.ContractEndDate}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="PackageOrRate" className="required-field">Package/Rate</label>
              <input 
                type="text" 
                id="PackageOrRate" 
                name="PackageOrRate" 
                value={formData.PackageOrRate} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.PackageOrRate ? 'error' : ''}
                placeholder="$XXX/day or $XXX,XXX PA"
                required 
              />
              {validationErrors.PackageOrRate && <div className="error-text">{validationErrors.PackageOrRate}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="GrossProfitMargin" className="required-field">Profit Margin %</label>
              <div className="input-with-icon">
                <input 
                  type="text" 
                  id="GrossProfitMargin" 
                  name="GrossProfitMargin" 
                  value={formData.GrossProfitMargin} 
                  onChange={handleInputChange}
                  className={validationErrors.GrossProfitMargin ? 'error' : ''}
                  placeholder="XX"
                />
                <span className="input-icon">%</span>
              </div>
              {validationErrors.GrossProfitMargin && <div className="error-text">{validationErrors.GrossProfitMargin}</div>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Client Information</h3>
          <div className="client-type-selector">
            <label>Client Type:</label>
            <div className="toggle-buttons">
              <button
                type="button"
                className={!isNewClient ? 'active' : ''}
                onClick={() => handleClientTypeChange({ target: { value: 'existing' } })}
              >
                Existing Client
              </button>
              <button
                type="button"
                className={isNewClient ? 'active' : ''}
                onClick={() => handleClientTypeChange({ target: { value: 'new' } })}
              >
                New Client
              </button>
            </div>
          </div>
          {!isNewClient ? (
            <div className="form-group client-select-group">
              <label htmlFor="ClientSelect" className="required-field">Select Existing Client</label>
              <select 
                id="ClientSelect" 
                onChange={handleClientSelect} 
                value={selectedClient}
                disabled={clientLoading}
                className={validationErrors.ClientSelect ? 'error' : ''}
                required
              >
                <option value="">Select a client</option>
                {Array.isArray(clients) && clients.length > 0 ? (
                  clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {clientLoading ? 'Loading clients...' : 'No clients available'}
                  </option>
                )}
              </select>
              {clientLoading && <span className="loading-indicator">Loading client data...</span>}
              {validationErrors.ClientSelect && <div className="error-text">{validationErrors.ClientSelect}</div>}
              
              {selectedClient && (
                <div className="selected-client-info">
                  <div className="info-item">
                    <span className="info-label">Legal Name:</span>
                    <span className="info-value">{formData.NewClientLegalName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{formData.NewClientAddress || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{formData.NewClientEmailAddress || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="ClientName" className="required-field">Client Name</label>
                <input 
                  type="text" 
                  id="ClientName" 
                  name="ClientName" 
                  value={formData.ClientName} 
                  onChange={handleInputChange}
                  className={validationErrors.ClientName ? 'error' : ''}
                  placeholder="Client Business Name"
                  required={isNewClient}
                />
                {validationErrors.ClientName && <div className="error-text">{validationErrors.ClientName}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="NewClientLegalName" className="required-field">Client Legal Name</label>
                <input 
                  type="text" 
                  id="NewClientLegalName" 
                  name="NewClientLegalName" 
                  value={formData.NewClientLegalName} 
                  onChange={handleInputChange}
                  className={validationErrors.NewClientLegalName ? 'error' : ''}
                  placeholder="Legal Entity Name"
                  required
                />
                {validationErrors.NewClientLegalName && <div className="error-text">{validationErrors.NewClientLegalName}</div>}
              </div>
              
              <div className="form-group span-2">
                <label htmlFor="NewClientAddress" className="required-field">Client Address</label>
                <textarea 
                  id="NewClientAddress" 
                  name="NewClientAddress" 
                  value={formData.NewClientAddress} 
                  onChange={handleInputChange}
                  className={validationErrors.NewClientAddress ? 'error' : ''}
                  placeholder="Client's business address"
                  rows="2"
                />
                {validationErrors.NewClientAddress && <div className="error-text">{validationErrors.NewClientAddress}</div>}
              </div>
              
              <div className="form-group span-2">
                <label htmlFor="NewClientEmailAddress" className="required-field">Client Email</label>
                <input 
                  type="email" 
                  id="NewClientEmailAddress" 
                  name="NewClientEmailAddress" 
                  value={formData.NewClientEmailAddress} 
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={validationErrors.NewClientEmailAddress ? 'error' : ''}
                  placeholder="client@example.com"
                  required
                />
                {validationErrors.NewClientEmailAddress && <div className="error-text">{validationErrors.NewClientEmailAddress}</div>}
              </div>
            </div>
          )}
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Engagement Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="EngagementName" className="required-field">Engagement Name</label>
              <input 
                type="text" 
                id="EngagementName" 
                name="EngagementName" 
                value={formData.EngagementName} 
                onChange={handleInputChange}
                className={validationErrors.EngagementName ? 'error' : ''}
                placeholder="Project or engagement name"
                required
              />
              {validationErrors.EngagementName && <div className="error-text">{validationErrors.EngagementName}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="TaskName" className="required-field">Task Name</label>
              <input 
                type="text" 
                id="TaskName" 
                name="TaskName" 
                value={formData.TaskName} 
                onChange={handleInputChange}
                className={validationErrors.TaskName ? 'error' : ''}
                placeholder="Specific role or task"
                required
              />
              {validationErrors.TaskName && <div className="error-text">{validationErrors.TaskName}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="BillingRate" className="required-field">Client Billing Rate</label>
              <input 
                type="text" 
                id="BillingRate" 
                name="BillingRate" 
                value={formData.BillingRate} 
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={validationErrors.BillingRate ? 'error' : ''}
                placeholder="$XXX/day"
                required
              />
              {validationErrors.BillingRate && <div className="error-text">{validationErrors.BillingRate}</div>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3 className="section-title">Additional Notes</h3>
          <div className="form-grid">
            <div className="form-group span-2">
              <label htmlFor="Notes">Notes</label>
              <textarea 
                id="Notes" 
                name="Notes" 
                value={formData.Notes} 
                onChange={handleInputChange}
                className={validationErrors.Notes ? 'error' : ''}
                placeholder="Any additional information, special requirements, or context..."
                rows="3"
              />
              {validationErrors.Notes && <div className="error-text">{validationErrors.Notes}</div>}
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
      
      <div className="section">
        <p className="version-tag">{APP_VERSION.number} ({APP_VERSION.date})</p>
      </div>
    </div>
  );
};

export default NewHireRequest;