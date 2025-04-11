// src/services/HelloSignService.js
import axios from 'axios';
import { HELLOSIGN_API_BASE_URL, getHelloSignAuthHeader } from '../config/apiConfig';

// No initialization code that runs on import
// All API calls are now explicitly called by components

class HelloSignService {
  // Get all signature requests with better error handling
  static async getSignatureRequests() {
    try {
      console.log('Attempting to fetch HelloSign signature requests...');
      
      const AUTH_HEADER = process.env.REACT_APP_HELLOSIGN_API_KEY;
      
      const response = await axios.get('https://api.hellosign.com/v3/signature_request/list', {
        headers: {
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          page_size: 15,
          order_by: 'created_at',
          order_direction: 'desc'
        }
      });

      // Log the raw response in more detail
      console.log('Raw API Response from HelloSignService:', {
        status: response.status,
        totalRequests: response.data?.signature_requests?.length,
        firstRequestDetails: response.data?.signature_requests?.[0] ? {
          title: response.data.signature_requests[0].title,
          customFields: response.data.signature_requests[0].custom_fields,
          signatures: response.data.signature_requests[0].signatures,
          responseData: response.data.signature_requests[0].response_data
        } : null
      });
      
      // Ensure we only return the last 15 records
      if (response.data && response.data.signature_requests) {
        response.data.signature_requests = response.data.signature_requests
          .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
          .slice(0, 15);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching HelloSign signature requests:', error);
      throw error;
    }
  }
  
  // For testing - returns mock data to make sure the UI works
  static async getMockSignatureRequests() {
    console.log('Using mock HelloSign data');
    
    return {
      signature_requests: [
        {
          signature_request_id: "mock-1",
          title: "Mock Contract for Testing",
          created_at: Math.floor(Date.now() / 1000) - 604800, // 1 week ago
          is_complete: false,
          signatures: [
            {
              signer_email_address: "test@example.com",
              signer_name: "Test User",
              signer_title: "Developer",
              status_code: "awaiting_signature",
              signed_at: null
            }
          ],
          custom_fields: [
            { name: "Full name1", value: "John Smith" },
            { name: "Sign by date", value: "2025-05-01" },
            { name: "Start date", value: "2025-05-15" },
            { name: "Address Line 1", value: "123 Main St" },
            { name: "Address Line 2", value: "Suite 100" },
            { name: "Job Title", value: "Senior Developer" },
            { name: "Rate per day", value: "850" }
          ],
          response_data: [
            { name: "Date signed1", value: "" }
          ]
        },
        {
          signature_request_id: "mock-2",
          title: "Mock Signed Contract",
          created_at: Math.floor(Date.now() / 1000) - 1209600, // 2 weeks ago
          is_complete: true,
          signatures: [
            {
              signer_email_address: "signed@example.com",
              signer_name: "Signed User",
              signer_title: "Manager",
              status_code: "signed",
              signed_at: Math.floor(Date.now() / 1000) - 86400 // 1 day ago
            }
          ],
          custom_fields: [
            { name: "Full name1", value: "Jane Doe" },
            { name: "Sign by date", value: "2025-04-15" },
            { name: "Start date", value: "2025-04-20" },
            { name: "Address Line 1", value: "456 Oak Ave" },
            { name: "Address Line 2", value: "" },
            { name: "Job Title", value: "Project Manager" },
            { name: "Rate per day", value: "1200" }
          ],
          response_data: [
            { name: "Date signed1", value: "2025-04-10" }
          ]
        },
        {
          signature_request_id: "mock-3",
          title: "Mock Declined Contract",
          created_at: Math.floor(Date.now() / 1000) - 259200, // 3 days ago
          is_complete: false,
          signatures: [
            {
              signer_email_address: "declined@example.com",
              signer_name: "Declined User",
              signer_title: "Consultant",
              status_code: "declined",
              signed_at: null
            }
          ],
          custom_fields: [
            { name: "Full name1", value: "Robert Johnson" },
            { name: "Sign by date", value: "2025-04-30" },
            { name: "Start date", value: "2025-05-10" },
            { name: "Address Line 1", value: "789 Pine St" },
            { name: "Address Line 2", value: "Apt 42" },
            { name: "Job Title", value: "Technical Consultant" },
            { name: "Rate per day", value: "950" }
          ],
          response_data: [
            { name: "Date signed1", value: "" }
          ]
        }
      ]
    };
  }
  
  // Format date to AEST timezone - only called when needed
  static formatDateToAEST(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Process signature request data - only called when needed
  static processSignatureData(signatureData) {
    if (!signatureData || !signatureData.signature_requests) {
      return [];
    }
    
    return signatureData.signature_requests.map(request => {
      // Log the entire request for debugging
      console.log('Processing request:', {
        title: request.title,
        allCustomFields: request.custom_fields?.map((f, i) => `${i}: ${f.name} = ${f.value}`),
        allResponseData: request.response_data?.map(f => `${f.name} = ${f.value}`)
      });

      // Extract custom fields
      const customFields = {};
      if (request.custom_fields) {
        request.custom_fields.forEach((field, index) => {
          customFields[field.name] = field.value;
          console.log(`Field at index ${index}:`, field.name, '=', field.value);
        });
      }
      
      // Extract response data
      const responseData = request.response_data || [];
      
      // Prepare signers information
      const signers = request.signatures.map(signature => {
        return {
          email: signature.signer_email_address,
          name: signature.signer_name,
          title: signature.signer_title || 'N/A',
          statusCode: signature.status_code,
          signedAt: signature.signed_at ? this.formatDateToAEST(signature.signed_at * 1000) : 'Not signed',
          isComplete: signature.status_code === 'signed' ? 'Y' : 'N',
          isDeclined: signature.status_code === 'declined' ? 'Y' : 'N'
        };
      });
      
      return {
        id: request.signature_request_id,
        title: request.title,
        createdAt: this.formatDateToAEST(request.created_at * 1000),
        isComplete: request.is_complete ? 'Y' : 'N',
        signers: signers,
        customFields: customFields,  // Store all custom fields
        response_data: responseData,
        raw_request: request  // Store the raw request
      };
    });
  }
}

export default HelloSignService;

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