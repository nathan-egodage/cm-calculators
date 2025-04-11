// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

// Helper function to validate environment variables
const getEnvVar = (name) => {
  // Check if we're running in production
  const isProduction = window.location.hostname === 'internal-cm-cal.cloudmarc.au';
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Get value from window.__env__ (Production) or process.env (local)
  const value = isProduction ? window.__env__?.[name] : process.env[name];
  
  if (!value) {
    console.warn(`Environment variable ${name} is not set. Current value: ${value}`);
    console.log('Running in:', isProduction ? 'Production' : (isDevelopment ? 'Development' : 'Unknown'));
    
    // Log available environment variables
    if (window.__env__) {
      const safeEnvVars = Object.keys(window.__env__)
        .filter(key => !key.includes('SECRET'))
        .reduce((obj, key) => {
          obj[key] = window.__env__[key];
          return obj;
        }, {});
      console.log('Available production environment variables:', safeEnvVars);
    }
    
    if (isDevelopment) {
      const safeProcessEnvVars = Object.keys(process.env)
        .filter(key => key.startsWith('REACT_APP_') && !key.includes('SECRET'))
        .reduce((obj, key) => {
          obj[key] = process.env[key];
          return obj;
        }, {});
      console.log('Available development environment variables:', safeProcessEnvVars);
    }
  }
  
  return value || '';
};

export const MS_GRAPH_CONFIG = {
  // Microsoft Graph API base URL
  baseUrl: 'https://graph.microsoft.com/v1.0',
  
  // Azure AD App Registration details
  clientId: getEnvVar('REACT_APP_CLIENT_ID'),
  clientSecret: getEnvVar('REACT_APP_CLIENT_SECRET'),
  tenantId: getEnvVar('REACT_APP_TENANT_ID'),
  authority: getEnvVar('REACT_APP_MSAL_AUTHORITY'),
  redirectUri: window.location.origin,
  
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
  
  // Power Automate flow URL
  approvalFlowUrl: getEnvVar('REACT_APP_APPROVAL_FLOW_URL') || '',
  
  // Approvers configuration - Consider moving this to a separate config file or database
  approvers: [
    'nathan@cloudmarc.com.au',
    'ddallariva@cloudmarc.com.au',
    'rocket@cloudmarc.com.au'
  ]
};

// Helper function to check if a user is an approver
export const isApprover = (userEmail) => {
  if (!userEmail) return false;
  return MS_GRAPH_CONFIG.approvers.some(email => 
    email.toLowerCase() === userEmail.toLowerCase()
  );
};

// Validate required configuration
const validateConfig = () => {
  const requiredVars = [
    'REACT_APP_CLIENT_ID',
    'REACT_APP_TENANT_ID',
    'REACT_APP_MSAL_AUTHORITY',
    'REACT_APP_SITE_ID',
    'REACT_APP_LIST_ID'
  ];

  const isProduction = window.location.hostname === 'internal-cm-cal.cloudmarc.au';
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const missingVars = requiredVars.filter(varName => {
    const value = isProduction ? window.__env__?.[varName] : process.env[varName];
    return !value;
  });

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.log('Environment:', isProduction ? 'Production' : (isDevelopment ? 'Development' : 'Unknown'));
    console.log('Hostname:', window.location.hostname);
    return false;
  }

  return true;
};

// Run validation on import and log the results
const isValid = validateConfig();
if (!isValid) {
  console.log('Current MS_GRAPH_CONFIG state:', {
    ...MS_GRAPH_CONFIG,
    clientSecret: '[HIDDEN]' // Don't log sensitive data
  });
}

export default MS_GRAPH_CONFIG;
