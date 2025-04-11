// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

// Helper function to get environment variables
const getEnvVar = (name) => {
  // Try window.__env__ first (production)
  let value = window.__env__?.[name];
  
  // Fallback to process.env (development)
  if (!value && process.env[name]) {
    value = process.env[name];
  }
  
  if (!value) {
    console.warn(`Environment variable ${name} not found`);
  }
  
  return value;
};

// Initialize configuration object
const initializeConfig = () => {
  // Log initialization start
  console.log('Initializing MS Graph configuration...');
  console.log('Environment state:', {
    windowEnv: window.__env__,
    hostname: window.location.hostname,
    isDevelopment: window.location.hostname === 'localhost'
  });

  const config = {
    // Microsoft Graph API base URL
    baseUrl: 'https://graph.microsoft.com/v1.0',
    
    // Azure AD App Registration details
    clientId: getEnvVar('REACT_APP_CLIENT_ID'),
    tenantId: getEnvVar('REACT_APP_TENANT_ID'),
    
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
    siteId: getEnvVar('REACT_APP_SITE_ID'),
    newHireListId: getEnvVar('REACT_APP_LIST_ID')
  };

  // Log the loaded configuration
  console.log('Loaded configuration:', {
    clientId: config.clientId ? '[CONFIGURED]' : '[MISSING]',
    tenantId: config.tenantId ? '[CONFIGURED]' : '[MISSING]',
    siteId: config.siteId ? '[CONFIGURED]' : '[MISSING]',
    listId: config.newHireListId ? '[CONFIGURED]' : '[MISSING]'
  });

  // Construct authority URL
  if (config.tenantId) {
    config.authority = `https://login.microsoftonline.com/${config.tenantId}`;
    console.log('Authority URL constructed successfully');
  } else {
    console.error('Failed to construct authority URL: tenant ID is missing');
  }

  return config;
};

// Create configuration
export const MS_GRAPH_CONFIG = initializeConfig();

// Validate configuration
const validateConfig = () => {
  const requiredVars = [
    'clientId',
    'tenantId',
    'siteId',
    'newHireListId'
  ];

  const missingVars = requiredVars.filter(name => !MS_GRAPH_CONFIG[name]);
  
  if (missingVars.length > 0) {
    console.error('Missing required configuration:', missingVars);
    return false;
  }

  return true;
};

// Run validation
const isValid = validateConfig();
if (!isValid) {
  console.error('MS Graph configuration validation failed. Current config:', {
    clientId: MS_GRAPH_CONFIG.clientId ? '[CONFIGURED]' : '[MISSING]',
    tenantId: MS_GRAPH_CONFIG.tenantId ? '[CONFIGURED]' : '[MISSING]',
    siteId: MS_GRAPH_CONFIG.siteId ? '[CONFIGURED]' : '[MISSING]',
    listId: MS_GRAPH_CONFIG.newHireListId ? '[CONFIGURED]' : '[MISSING]'
  });
}

export default MS_GRAPH_CONFIG;
