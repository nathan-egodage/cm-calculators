// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

export const MS_GRAPH_CONFIG = {
  // Microsoft Graph API base URL
  baseUrl: 'https://graph.microsoft.com/v1.0',
  
  // Azure AD App Registration details
  clientId: process.env.REACT_APP_AAD_CLIENT_ID,
  tenantId: process.env.REACT_APP_AAD_CLIENT_ID,
  authority: `https://login.microsoftonline.com/${process.env.REACT_APP_AAD_CLIENT_ID}`,
  redirectUri: window.location.origin,
  scopes: [
    'Mail.Send',
    'Sites.ReadWrite.All',
    'User.Read',
    'openid',
    'profile',
    'offline_access'
  ],
  
  // SharePoint site ID where the lists are stored
  siteId: 'cloudmarc.sharepoint.com,a1e3c62a-f735-4ee2-a5a7-9412e863c617,f6ba5e0b-6ec1-43d8-98de-28e8c2517d38',
  
  // List ID for the New Hire Requests
  newHireListId: '4ac9d268-cbfc-455a-8b9b-cf09547e8bd4',
  
  // URL for the Power Automate flow that handles approvals
  approvalFlowUrl: process.env.REACT_APP_APPROVAL_FLOW_URL || '',
  
  // The list of approvers who can approve/reject new hire requests
  approvers: [
    'nathan@cloudmarc.com.au',
    'ddallariva@cloudmarc.com.au',
    'rocket@cloudmarc.com.au'
  ]
};

// Helper function to check if a user is an approver
export const isApprover = (userEmail) => {
  if (!userEmail) return false;
  
  // Convert email to lowercase for case-insensitive comparison
  const normalizedEmail = userEmail.toLowerCase();
  
  // Check if user email is in the approvers list
  return MS_GRAPH_CONFIG.approvers.some(email => 
    email.toLowerCase() === normalizedEmail
  );
};
