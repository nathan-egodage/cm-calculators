// API Configuration
// This file contains API keys and endpoints

// HelloSign API Configuration
export const HELLOSIGN_API_BASE_URL = '/api/hellosign';

// Helper function to get the authorization header
export const getHelloSignAuthHeader = () => {
  const apiKey = process.env.REACT_APP_HELLOSIGN_API_KEY;
  if (!apiKey) {
    console.error('HelloSign API key not found in environment variables');
  }
  return `Basic ${apiKey}`;
};

// API endpoints
export const API_ENDPOINTS = {
  SIGNATURE_REQUESTS: '/signature-requests',
  SIGNATURE_REQUEST_FILES: '/signature-request-files',
  ACCOUNT_INFO: '/account'
};

// API timeouts (in milliseconds)
export const API_TIMEOUTS = {
  DEFAULT: 60000,
  LONG_RUNNING: 120000
};

// API retry configuration
export const API_RETRY_CONFIG = {
  retries: 2,
  initialDelayMs: 1000,
  maxDelayMs: 5000
};

export const CLIENT_API_CONFIG = {
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
}; 