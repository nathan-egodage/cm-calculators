// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

// Helper function to get environment variables
const getEnvVar = (name) => {
  // Try window.__env__ first (production)
  const value = window.__env__?.[name] || process.env[name];
  
  if (!value) {
    console.error(`Environment variable ${name} not found in window.__env__ or process.env`);
    throw new Error(`Environment variable ${name} not found`);
  }
  
  return value;
};

// Initialize configuration object
const initializeConfig = () => {
  // Log initialization start
  console.log('Validating configuration in:', process.env.NODE_ENV);
  console.log('window.__env__ available:', !!window.__env__);

  // Get required environment variables
  const clientId = getEnvVar('REACT_APP_CLIENT_ID');
  const tenantId = getEnvVar('REACT_APP_TENANT_ID');
  const siteId = getEnvVar('REACT_APP_SITE_ID');
  const listId = getEnvVar('REACT_APP_LIST_ID');

  // Validate all required variables are present
  if (!clientId || !tenantId || !siteId || !listId) {
    throw new Error('Missing required environment variables');
  }

  const config = {
    // Microsoft Graph API base URL
    baseUrl: 'https://graph.microsoft.com/v1.0',
    
    // Azure AD App Registration details
    clientId,
    tenantId,
    
    // Required scopes for the application
    scopes: [
      'Mail.Send',
      'Sites.ReadWrite.All',
      'User.Read',
      'openid',
      'profile',
      'offline_access'
    ],
    
    // SharePoint configuration
    siteId,
    newHireListId: listId,
    
    // Redirect URI
    redirectUri: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : window.location.origin
  };

  // Construct authority URL
  config.authority = `https://login.microsoftonline.com/${config.tenantId}`;

  // Log configuration (without sensitive values)
  console.log('Configuration initialized:', {
    clientId: '[CONFIGURED]',
    tenantId: '[CONFIGURED]',
    authority: config.authority,
    redirectUri: config.redirectUri,
    siteId: '[CONFIGURED]',
    listId: '[CONFIGURED]'
  });

  return config;
};

// Create configuration
let MS_GRAPH_CONFIG = null;

try {
  MS_GRAPH_CONFIG = initializeConfig();
  console.log('Configuration validated successfully');
} catch (error) {
  console.error('Failed to initialize MS Graph configuration:', error);
  throw error;
}

export default MS_GRAPH_CONFIG;
