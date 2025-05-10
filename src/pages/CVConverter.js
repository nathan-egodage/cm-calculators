import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AUTHORIZED_USERS } from '../config/appConfig';
import accountManagers from '../config/accountManagers.json';
import '../styles/CVConverter.css';

const CVConverter = () => {
  const { user, loading, error: authError } = useAuth();
  const [file, setFile] = useState(null);
  const [selectedManager, setSelectedManager] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [convertedCV, setConvertedCV] = useState(null);
  const [formTouched, setFormTouched] = useState({
    file: false,
    manager: false
  });
  const [conversionComplete, setConversionComplete] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState(null);

  // Check if user is authorized to use CV converter
  const isAuthorized = () => {
    if (!user) return false;
    return AUTHORIZED_USERS.cvConverterUsers.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setFormTouched(prev => ({ ...prev, file: true }));
    
    if (file) {
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });

      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a PDF, DOC, or DOCX file');
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(file);
      setError(null);
    }
  };

  const handleManagerSelect = (e) => {
    setSelectedManager(e.target.value);
    setFormTouched(prev => ({ ...prev, manager: true }));
    if (!e.target.value) {
      setError('Please select an account manager');
    } else {
      setError(null);
    }
  };

  const validateForm = () => {
    if (!file) {
      setError('Please select a file');
      return false;
    }
    if (!selectedManager) {
      setError('Please select an account manager');
      return false;
    }
    return true;
  };

  const handleConvert = async (event) => {
    event.preventDefault();
    setError(null);
    setConverting(true);
    setConversionComplete(false);
    setDownloadUrls(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('accountManager', selectedManager);
      if (positionTitle) {
        formData.append('positionTitle', positionTitle);
      }

      // Get the API URL from environment or use relative path for production
      const API_URL = process.env.NODE_ENV === 'development' 
        ? (process.env.REACT_APP_API_URL || 'http://localhost:7071')
        : '';
      console.log('Using API URL:', API_URL);

      console.log('Sending request to API...');
      const response = await fetch(`${API_URL}/api/convert-cv`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Do not set Content-Type header when sending FormData,
          // the browser will set it automatically with the correct boundary
        }
      });

      console.log('Response status:', response.status);
      let responseData;
      let responseText;
      
      try {
        responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // Only try to parse as JSON if we have content
        if (responseText.trim()) {
          try {
            responseData = JSON.parse(responseText);
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            throw new Error('Server returned invalid JSON response');
          }
        } else {
          throw new Error('Server returned empty response');
        }
      } catch (error) {
        console.error('Error reading response:', error);
        throw new Error('Failed to read server response');
      }

      if (!response.ok) {
        const errorMessage = responseData?.error || 'Server error occurred';
        const errorDetails = responseData?.details;
        console.error('Server error:', { message: errorMessage, details: errorDetails });
        throw new Error(errorMessage);
      }

      if (!responseData.docxUrl || !responseData.pdfUrl) {
        throw new Error('No download URLs in response');
      }

      setDownloadUrls({
        docx: responseData.docxUrl,
        pdf: responseData.pdfUrl
      });
      setConversionComplete(true);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'Failed to convert CV. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  // Check if loading is still in progress
  if (loading) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Verifying your access permissions...</p>
      </div>
    );
  }

  if (!isAuthorized()) {
    return (
      <div className="container">
        <div className="error-message">
          <h2>Access Denied</h2>
          <p>You do not have permission to access the CV Converter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container cloudmarc-theme">
      <div className="nav-buttons">
        <Link to="/" className="back-button">&#8592; Back to Home</Link>
      </div>

      <h1>CV Converter</h1>
      <p className="description">
        Convert your CV to CloudMarc's branded template using AI-powered document analysis.
      </p>

      <div className="converter-container">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="file-upload-section">
          <label className="file-label">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              disabled={converting}
            />
            {file ? file.name : 'Choose a file'}
            <span className="required-asterisk">*</span></label>

          <div className="account-manager-section">
            <label htmlFor="accountManager" className="required-field">
              Select Account Manager:
              <span className="required-asterisk">*</span>
            </label>
            <select
              id="accountManager"
              value={selectedManager}
              onChange={handleManagerSelect}
              disabled={converting}
              className={`account-manager-select ${formTouched.manager && !selectedManager ? 'invalid' : ''}`}
              required
            >
              <option value="">Select an account manager</option>
              {accountManagers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
            {formTouched.manager && !selectedManager && (
              <div className="field-error">Account manager is required</div>
            )}
          </div>

          <div className="position-title-section">
            <label htmlFor="positionTitle">
              Position Title (Optional):
              <span className="optional-text">(Will be used for profile summary)</span>
            </label>
            <input
              type="text"
              id="positionTitle"
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
              disabled={converting}
              className="position-title-input"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <button 
            className="convert-button"
            onClick={handleConvert}
            disabled={!file || !selectedManager || converting}
          >
            {converting ? 'Converting...' : 'Convert CV'}
          </button>
        </div>

        {converting && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Converting your CV...</p>
          </div>
        )}

        {conversionComplete && downloadUrls && (
          <div className="result-section">
            <h3>Conversion Complete!</h3>
            <div className="download-options">
              <a href={downloadUrls.docx} target="_blank" rel="noopener noreferrer" className="convert-button">
                Download DOCX
              </a>
              <a href={downloadUrls.pdf} target="_blank" rel="noopener noreferrer" className="convert-button">
                Download PDF
              </a>
            </div>
            <div className="preview-container">
              <iframe src={downloadUrls.pdf} title="CV Preview" width="100%" height="500px" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVConverter; 