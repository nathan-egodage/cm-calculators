// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

export const MS_GRAPH_CONFIG = {
  // Microsoft Graph API base URL
  baseUrl: 'https://graph.microsoft.com/v1.0',
  
  // Azure AD App Registration details
  clientId: process.env.REACT_APP_CLIENT_ID,
  tenantId: process.env.REACT_APP_TENANT_ID,
  
  // SharePoint site ID where the lists are stored
  siteId: process.env.REACT_APP_SITE_ID,
  
  // List ID for the New Hire Requests
  newHireListId: process.env.REACT_APP_LIST_ID,
  
  // URL for the Power Automate flow that handles approvals
  approvalFlowUrl: process.env.REACT_APP_APPROVAL_FLOW_URL,
  
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
