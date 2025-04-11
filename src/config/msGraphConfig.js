// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

// Helper function to validate environment variables
const getEnvVar = (name) => {
  const value = process.env[name] || window.__env__?.[name];
  if (!value) {
    console.warn(`Environment variable ${name} is not set`);
  }
  return value || '';
};

// Construct the authority URL
const constructAuthorityUrl = () => {
  const tenantId = getEnvVar('REACT_APP_TENANT_ID');
  if (!tenantId) {
    console.error('Failed to construct authority URL: REACT_APP_TENANT_ID is missing or empty');
    console.log('Current environment:', {
      hostname: window.location.hostname,
      isProduction: window.location.hostname === 'internal-cm-cal.cloudmarc.au',
      isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
      hasWindowEnv: !!window.__env__,
      windowEnvKeys: Object.keys(window.__env__ || {})
    });
    return '';
  }
  return `https://login.microsoftonline.com/${tenantId}`;
};

export const MS_GRAPH_CONFIG = {
  // Microsoft Graph API base URL
  baseUrl: 'https://graph.microsoft.com/v1.0',
  
  // Azure AD App Registration details
  clientId: getEnvVar('REACT_APP_CLIENT_ID'),
  clientSecret: getEnvVar('REACT_APP_CLIENT_SECRET'),
  tenantId: getEnvVar('REACT_APP_TENANT_ID'),
  authority: constructAuthorityUrl(),
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
    'REACT_APP_SITE_ID',
    'REACT_APP_LIST_ID'
  ];

  console.log('Environment variables available:', {
    clientId: MS_GRAPH_CONFIG.clientId ? '[CONFIGURED]' : '[MISSING]',
    tenantId: MS_GRAPH_CONFIG.tenantId ? '[CONFIGURED]' : '[MISSING]',
    siteId: MS_GRAPH_CONFIG.siteId ? '[CONFIGURED]' : '[MISSING]',
    listId: MS_GRAPH_CONFIG.newHireListId ? '[CONFIGURED]' : '[MISSING]'
  });

  const missingVars = requiredVars.filter(varName => !getEnvVar(varName));
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }

  // Validate authority URL construction
  const authority = constructAuthorityUrl();
  if (!authority) {
    console.error('Failed to construct authority URL');
    return false;
  }

  return true;
};

// Run validation
const isValid = validateConfig();
if (!isValid) {
  console.error('MS Graph configuration validation failed');
}

export default MS_GRAPH_CONFIG;
