// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

export const MS_GRAPH_CONFIG = {
  // Microsoft Graph API base URL
  baseUrl: 'https://graph.microsoft.com/v1.0',
  
  // Azure AD App Registration details
  clientId: process.env.REACT_APP_CLIENT_ID,
  clientSecret: process.env.REACT_APP_CLIENT_SECRET,
  tenantId: process.env.REACT_APP_TENANT_ID,
  authority: process.env.REACT_APP_MSAL_AUTHORITY,
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
  siteId: process.env.REACT_APP_SITE_ID,
  newHireListId: process.env.REACT_APP_LIST_ID,
  
  // Power Automate flow URL
  approvalFlowUrl: process.env.REACT_APP_APPROVAL_FLOW_URL || '',
  
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
