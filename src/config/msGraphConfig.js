// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

// Helper function to validate environment variables
const getEnvVar = (name) => {
  // Try to get from window.__env__ first (production)
  let value = window.__env__?.[name];
  
  // If not found in window.__env__, try process.env (development)
  if (!value) {
    value = process.env[name];
  }
  
  if (!value) {
    console.warn(`Environment variable ${name} is not set`);
    console.log('Current environment:', {
      windowEnv: window.__env__ ? Object.keys(window.__env__) : 'not available',
      processEnv: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
    });
  }
  
  return value || '';
};

// Initialize configuration object
const initializeConfig = () => {
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
    newHireListId: getEnvVar('REACT_APP_LIST_ID'),
    
    // Approvers configuration
    approvers: [
      'nathan@cloudmarc.com.au',
      'ddallariva@cloudmarc.com.au',
      'rocket@cloudmarc.com.au'
    ]
  };

  // Construct authority URL
  if (config.tenantId) {
    config.authority = `https://login.microsoftonline.com/${config.tenantId}`;
  } else {
    console.error('Failed to construct authority URL: tenant ID is missing');
  }

  // Set redirect URI
  config.redirectUri = window.location.origin;

  return config;
};

// Create and validate configuration
export const MS_GRAPH_CONFIG = initializeConfig();

// Helper function to check if a user is an approver
export const isApprover = (userEmail) => {
  if (!userEmail) return false;
  return MS_GRAPH_CONFIG.approvers.some(email => 
    email.toLowerCase() === userEmail.toLowerCase()
  );
};

// Validate configuration
const validateConfig = () => {
  const requiredVars = [
    'REACT_APP_CLIENT_ID',
    'REACT_APP_TENANT_ID',
    'REACT_APP_SITE_ID',
    'REACT_APP_LIST_ID'
  ];

  // Log current configuration state
  console.log('Current MS Graph configuration state:', {
    clientId: MS_GRAPH_CONFIG.clientId ? '[CONFIGURED]' : '[MISSING]',
    tenantId: MS_GRAPH_CONFIG.tenantId ? '[CONFIGURED]' : '[MISSING]',
    authority: MS_GRAPH_CONFIG.authority ? '[CONFIGURED]' : '[MISSING]',
    siteId: MS_GRAPH_CONFIG.siteId ? '[CONFIGURED]' : '[MISSING]',
    listId: MS_GRAPH_CONFIG.newHireListId ? '[CONFIGURED]' : '[MISSING]',
    redirectUri: MS_GRAPH_CONFIG.redirectUri
  });

  // Check for missing variables
  const missingVars = requiredVars.filter(name => !MS_GRAPH_CONFIG[name.replace('REACT_APP_', '').toLowerCase()]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }

  return true;
};

// Run validation
const isValid = validateConfig();
if (!isValid) {
  console.error('MS Graph configuration validation failed');
  console.log('Environment state:', {
    hostname: window.location.hostname,
    isProduction: window.location.hostname === 'internal-cm-cal.cloudmarc.au',
    isDevelopment: window.location.hostname === 'localhost',
    hasWindowEnv: !!window.__env__,
    windowEnvKeys: window.__env__ ? Object.keys(window.__env__) : []
  });
}

export default MS_GRAPH_CONFIG;
