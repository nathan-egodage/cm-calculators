// API Configuration
// This file contains API keys and endpoints

// HelloSign API Configuration
export const HELLOSIGN_API_KEY = process.env.REACT_APP_HELLOSIGN_API_KEY || '';
export const HELLOSIGN_API_BASE_URL = 'https://api.hellosign.com/v3';

// Helper function to get the authorization header
export const getHelloSignAuthHeader = () => {
  return `Basic ${HELLOSIGN_API_KEY}`;
};

export const CLIENT_API_CONFIG = {
  baseURL: 'https://api.example.com',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
}; 