// src/services/HelloSignService.js
import axios from 'axios';
import { HELLOSIGN_API_BASE_URL, getHelloSignAuthHeader } from '../config/apiConfig';

// No initialization code that runs on import
// All API calls are now explicitly called by components

class HelloSignService {
  constructor() {
    // Set base URL - always use the API endpoint
    this.baseUrl = '/api';
      
    // Configure axios defaults with better timeout and retry logic
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // Increase timeout to 60 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      config => {
        console.log(`Making request to ${config.url}`);
        return config;
      },
      error => {
        console.error('Request failed:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for better error handling
    this.axiosInstance.interceptors.response.use(
      response => {
        if (!response.data) {
          throw new Error('No data received from API');
        }
        return response;
      },
      error => {
        // Log detailed error information
        console.error('HelloSign API Error:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
        
        // Create user-friendly error message
        let errorMessage = 'Failed to connect to HelloSign service. ';
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage += `Server returned ${error.response.status}: ${error.response.statusText}`;
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage += 'No response received from server. Please check your network connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage += error.message;
        }
        
        throw new Error(errorMessage);
      }
    );
  }

  async getSignatureRequests() {
    console.log('Fetching HelloSign signature requests...');
    try {
      const response = await this.axiosInstance.get('/hellosign/signature-requests');
      console.log('HelloSign API Response received');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch signature requests:', error);
      throw error;
    }
  }

  // Process signature request data
  processSignatureData(response) {
    if (!response || !response.signature_requests) {
      console.warn('Invalid response format:', response);
      return [];
    }

    return response.signature_requests.map(request => {
      // Process signers
      const signers = request.signatures.map(signature => ({
        email: signature.signer_email_address,
        name: signature.signer_name,
        order: signature.order,
        statusCode: signature.status_code,
        signedAt: signature.signed_at ? new Date(signature.signed_at * 1000).toLocaleDateString() : 'Not signed'
      }));

      // Extract custom fields if they exist
      const customFields = {};
      if (request.custom_fields) {
        request.custom_fields.forEach(field => {
          customFields[field.name] = field.value;
        });
      }

      return {
        id: request.signature_request_id,
        title: request.title,
        signers,
        customFields,
        response_data: request.response_data,
        raw_request: request // Keep raw request for additional processing if needed
      };
    });
  }

  // Format date to AEST timezone
  static formatDateToAEST(dateString) {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  }
}

// Create singleton instance
const helloSignService = new HelloSignService();

export default helloSignService;

/**
 * Fetches signature requests from HelloSign API
 * @param {Object} filters - Optional filters for the API request
 * @returns {Promise} - Promise with the API response
 */
export const fetchSignatureRequests = async (filters = {}) => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Add filters if provided
    if (filters.status) {
      queryParams.append('query', filters.status);
    }
    
    if (filters.fullName) {
      queryParams.append('query', filters.fullName);
    }
    
    // Add pagination parameters
    queryParams.append('page', filters.page || 1);
    queryParams.append('page_size', filters.pageSize || 20);
    
    // Build the URL with query parameters
    const url = `${HELLOSIGN_API_BASE_URL}/signature_request/list?${queryParams.toString()}`;
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getHelloSignAuthHeader(),
        'Content-Type': 'application/json',
      },
    });
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(`HelloSign API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse and return the response
    return await response.json();
  } catch (error) {
    console.error('Error fetching signature requests:', error);
    throw error;
  }
};

/**
 * Maps the status code to a human-readable status
 * @param {string} statusCode - The status code from HelloSign
 * @returns {string} - Human-readable status
 */
export const mapStatusToReadable = (statusCode) => {
  const statusMap = {
    'awaiting_signature': 'Awaiting Signature',
    'signed': 'Signed',
    'declined': 'Declined',
    'expired': 'Expired',
    'viewed': 'Viewed',
    'pending_approval': 'Pending Approval',
    'approved': 'Approved',
    'rejected': 'Rejected',
  };
  
  return statusMap[statusCode] || statusCode;
};

/**
 * Formats a date to AEST timezone
 * @param {string} dateString - The date string to format
 * @returns {string} - Formatted date in AEST
 */
export const formatDateToAEST = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Format to AEST (UTC+10)
    const options = {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    
    return date.toLocaleString('en-AU', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Extracts custom field value from signature request
 * @param {Object} signatureRequest - The signature request object
 * @param {string} fieldName - The name of the custom field
 * @returns {string} - The value of the custom field
 */
export const getCustomFieldValue = (signatureRequest, fieldName) => {
  if (!signatureRequest || !signatureRequest.custom_fields) {
    return 'N/A';
  }
  
  const field = signatureRequest.custom_fields.find(f => f.name === fieldName);
  return field ? field.value : 'N/A';
};