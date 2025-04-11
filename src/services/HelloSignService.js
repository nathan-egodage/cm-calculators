// src/services/HelloSignService.js
import axios from 'axios';

class HelloSignService {
  constructor() {
    // Set base URL for HelloSign API
    this.baseUrl = 'https://api.hellosign.com/v3';
    
    // Get API key from environment
    this.apiKey = process.env.REACT_APP_HELLOSIGN_API_KEY;
    if (!this.apiKey) {
      console.error('HelloSign API key not found in environment variables');
    }

    // Configure axios defaults with proper auth header format
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout
      auth: {
        username: this.apiKey,
        password: ''
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      response => {
        if (!response.data) {
          throw new Error('No data received from API');
        }
        return response;
      },
      error => {
        console.error('HelloSign API Error:', error);
        throw error;
      }
    );
  }

  async getSignatureRequests() {
    try {
      const response = await this.axiosInstance.get('/signature_request/list', {
        params: {
          page: 1,
          page_size: 15,  // Limit to 15 results
          order_by: 'created_at',  // Sort by creation date
          order_direction: 'desc'  // Most recent first
        }
      });
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

    // Take only the first 15 requests after sorting by created_at
    const sortedRequests = response.signature_requests
      .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
      .slice(0, 15);

    return sortedRequests.map(request => {
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
        raw_request: request,
        created_at: request.created_at ? new Date(request.created_at * 1000).toLocaleDateString() : 'N/A'
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