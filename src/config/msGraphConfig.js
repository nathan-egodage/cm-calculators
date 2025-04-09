// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

export const MS_GRAPH_CONFIG = {
  // Microsoft Graph API base URL
  baseUrl: 'https://graph.microsoft.com/v1.0',
  
  // SharePoint site ID where the lists are stored
  // You'll need to replace this with your actual site ID
  siteId: process.env.REACT_APP_SHAREPOINT_SITE_ID || 'cloudmarc.sharepoint.com,39a7c4ff-fb3e-4031-9356-02b1de41794f,5e7dcd0c-ee5a-4cbb-9a1d-44a31122a4d8',
  
  // List ID for the New Hire Requests
  // You'll need to replace this with your actual list ID
  newHireListId: process.env.REACT_APP_NEW_HIRE_LIST_ID || '7a3d7f25-c4b0-4cdc-9c5a-fb2d714c5ea2',
  
  // URL for the Power Automate flow that handles approvals
  // This is optional and can be configured later
  approvalFlowUrl: process.env.REACT_APP_APPROVAL_FLOW_URL || 'https://prod-31.australiasoutheast.logic.azure.com:443/workflows/example-workflow-id/triggers/manual/paths/invoke',
  
  // The list of approvers who can approve/reject new hire requests
  // In production, this should come from a SharePoint list or Azure AD group
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