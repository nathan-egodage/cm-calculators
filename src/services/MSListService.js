// src/services/MSListService.js
import axios from 'axios';
import { MS_GRAPH_CONFIG } from '../config/msGraphConfig';
import { PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';

class MSListService {
  constructor() {
    this.graphApiUrl = 'https://graph.microsoft.com/v1.0';
    // Use the /sites endpoint for team sites
    this.baseUrl = `${this.graphApiUrl}/sites/cloudmarc.sharepoint.com,a1e3c62a-f735-4ee2-a5a7-9412e863c617,f6ba5e0b-6ec1-43d8-98de-28e8c2517d38/lists/${process.env.REACT_APP_LIST_ID}`;
    
    // Initialize MSAL
    this.msalConfig = {
      auth: {
        clientId: process.env.REACT_APP_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.REACT_APP_TENANT_ID}`,
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false,
      }
    };
    
    this.msalInstance = new PublicClientApplication(this.msalConfig);
    this.initialized = false;

    // Initialize graphClient
    const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(this.msalInstance, {
      account: this.msalInstance.getAllAccounts()[0],
      scopes: ['https://graph.microsoft.com/Sites.ReadWrite.All']
    });

    this.graphClient = Client.initWithMiddleware({
      authProvider
    });
  }

  async initialize() {
    if (!this.initialized) {
      await this.msalInstance.initialize();
      this.initialized = true;
    }
  }

  async getAccessToken() {
    try {
      console.log('Attempting to get access token...');
      
      // Ensure MSAL is initialized
      await this.initialize();
      
      const request = {
        scopes: [
          'https://graph.microsoft.com/Sites.ReadWrite.All'
        ]
      };

      // Try silent token acquisition first
      try {
        const response = await this.msalInstance.acquireTokenSilent(request);
        return response.accessToken;
      } catch (silentError) {
        // If silent acquisition fails, fall back to interactive method
        console.log('Silent token acquisition failed, trying interactive...');
        const response = await this.msalInstance.acquireTokenPopup(request);
        return response.accessToken;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  async createNewHireRequest(data, user) {
    try {
      console.log('Initializing MSAL...');
      // Ensure MSAL is initialized before any operation
      await this.initialize();
      
      console.log('Getting access token...');
      const token = await this.getAccessToken();
      if (!token) {
        throw new Error('Failed to get access token');
      }
      
      console.log('Preparing request data...');
      const requestData = {
        fields: {
          Title: data.AccountManager || user?.userDetails || '',
          field_1: data.FirstName,
          field_2: data.LastName,
          field_3: data.PersonalEmail,
          field_4: data.Mobile,
          field_5: data.Address,
          field_6: data.Position,
          field_7: data.ClientName,
          field_8: data.Status || 'Pending',
          field_9: data.SignByDate,
          field_10: data.StartDate,
          field_11: data.PackageOrRate,
          field_12: data.GrossProfitMargin,
          field_13: data.ContractEndDate,
          field_14: data.IsLaptopRequired || 'No',
          field_15: data.Office,
          field_16: data.Rehire || 'No',
          field_17: data.Notes,
          field_18: data.ABNName,
          field_19: data.ABNNumber,
          field_20: data.ABNAddress,
          field_21: data.EngagementName,
          field_22: data.TaskName,
          field_23: data.BillingRate,
          field_24: data.NewClientLegalName,
          field_25: data.NewClientAddress,
          field_26: data.NewClientEmailAddress,
          field_27: data.ResourceLevelCode,
          field_29: new Date().toISOString(),
          field_30: user?.userDetails || '',
          field_31: data.ApprovedBy || '',
          field_32: data.ApprovedDate || '',
          field_33: data.EmployeeType || 'AU PAYG Contractor'
        }
      };
      
      console.log('Sending request to:', `${this.baseUrl}/items`);
      console.log('Request data:', requestData);
      
      const response = await fetch(`${this.baseUrl}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('List request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(`List request failed: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const responseData = await response.json();
      console.log('New hire request created successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('Detailed error in createNewHireRequest:', error);
      throw error;
    }
  }

  // Get all new hire requests
  async getNewHireRequests() {
    try {
      await this.refreshTokenIfNeeded();
      
      const response = await this.graphClient
        .api('/sites/cloudmarc.sharepoint.com,a1e3c62a-f735-4ee2-a5a7-9412e863c617,f6ba5e0b-6ec1-43d8-98de-28e8c2517d38/lists/4ac9d268-cbfc-455a-8b9b-cf09547e8bd4/items?$expand=fields')
        .get();
      
      return response.value.map(item => item.fields);
    } catch (error) {
      console.error('Error fetching new hire requests:', error);
      throw error;
    }
  }
  
  // Get new hire request by ID
  async getNewHireRequestById(id) {
    try {
      await this.refreshTokenIfNeeded();
      
      const response = await this.graphClient
        .api(`/sites/${MS_GRAPH_CONFIG.siteId}/lists/${MS_GRAPH_CONFIG.newHireListId}/items/${id}`)
        .expand('fields')
        .get();
      
      return response.fields;
    } catch (error) {
      console.error(`Error fetching new hire request with ID ${id}:`, error);
      throw error;
    }
  }
  
  // Update new hire request
  async updateNewHireRequest(id, updateData) {
    try {
      await this.refreshTokenIfNeeded();
      
      // Convert the data format to match MS List expectations
      const fieldsToUpdate = {
        fields: { ...updateData }
      };
      
      const response = await this.graphClient
        .api(`/sites/${MS_GRAPH_CONFIG.siteId}/lists/${MS_GRAPH_CONFIG.newHireListId}/items/${id}`)
        .update(fieldsToUpdate);
      
      return response;
    } catch (error) {
      console.error(`Error updating new hire request with ID ${id}:`, error);
      throw error;
    }
  }
  
  // Approve new hire request
  async approveNewHireRequest(itemId, approverEmail) {
    try {
      await this.refreshTokenIfNeeded();

      const siteId = 'cloudmarc.sharepoint.com,a1e3c62a-f735-4ee2-a5a7-9412e863c617,f6ba5e0b-6ec1-43d8-98de-28e8c2517d38';
      const listId = '4ac9d268-cbfc-455a-8b9b-cf09547e8bd4';

      const updateData = {
        fields: {
          field_8: 'Approved', // ApprovalStatus
          field_31: approverEmail, // ApprovedBy
          field_32: new Date().toISOString() // ApprovedDate
        }
      };

      const response = await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items/${itemId}`)
        .update(updateData);

      return response;
    } catch (error) {
      console.error(`Error approving request with ID ${itemId}:`, error);
      throw error;
    }
  }
  
  // Reject new hire request
  async rejectNewHireRequest(itemId, approverEmail, rejectionReason) {
    try {
      await this.refreshTokenIfNeeded();

      const siteId = 'cloudmarc.sharepoint.com,a1e3c62a-f735-4ee2-a5a7-9412e863c617,f6ba5e0b-6ec1-43d8-98de-28e8c2517d38';
      const listId = '4ac9d268-cbfc-455a-8b9b-cf09547e8bd4';

      const updateData = {
        fields: {
          field_8: 'Rejected', // ApprovalStatus
          field_31: approverEmail, // ApprovedBy
          field_32: new Date().toISOString(), // ApprovedDate
          field_17: rejectionReason // Notes
        }
      };

      const response = await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items/${itemId}`)
        .update(updateData);

      return response;
    } catch (error) {
      console.error(`Error rejecting request with ID ${itemId}:`, error);
      throw error;
    }
  }
  
  // Trigger the approval workflow
  async triggerApprovalWorkflow(itemId) {
    try {
      // In real implementation, you would call a Power Automate flow or Azure Function
      // For development, we'll simulate sending emails to approvers
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode - simulating approval workflow for item ${itemId}`);
        
        // Get the item details
        const item = await this.getNewHireRequestById(itemId);
        
        // Log the notification that would be sent
        console.log(`Approval request would be sent to approvers for: ${item.Title}`);
        console.log(`Approval link would be: ${window.location.origin}/approve-request/${itemId}`);
        
        return true;
      }
      
      // For production, call the Power Automate flow or Azure Function
      const response = await axios.post(
        MS_GRAPH_CONFIG.approvalFlowUrl,
        { itemId }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error triggering approval workflow for item ${itemId}:`, error);
      // Don't throw this error - we want the create operation to succeed even if workflow fails
      return false;
    }
  }
  
  // Get pending approvals for a user
  async getPendingApprovalsForUser(userEmail) {
    try {
      await this.refreshTokenIfNeeded();
      
      console.log('Fetching pending approvals for user:', userEmail);
      
      const siteId = 'cloudmarc.sharepoint.com,a1e3c62a-f735-4ee2-a5a7-9412e863c617,f6ba5e0b-6ec1-43d8-98de-28e8c2517d38';
      const listId = '4ac9d268-cbfc-455a-8b9b-cf09547e8bd4';

      const response = await this.graphClient
        .api(`/sites/${siteId}/lists/${listId}/items?$expand=fields&$filter=fields/field_8 eq 'Pending'`)
        .header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly')
        .get();
      
      return response.value.map(item => ({
        AccountManager: item.fields.Title,
        FirstName: item.fields.field_1,
        LastName: item.fields.field_2,
        PersonalEmail: item.fields.field_3,
        Mobile: item.fields.field_4,
        Position: item.fields.field_6,
        ClientName: item.fields.field_7,
        PackageOrRate: item.fields.field_11,
        GrossProfitMargin: item.fields.field_12,
        ContractEndDate: item.fields.field_13,
        IsLaptopRequired: item.fields.field_14,
        Notes: item.fields.field_17,
        BillingRate: item.fields.field_23,
        NewClientLegalName: item.fields.field_24,
        ApprovalStatus: item.fields.field_8,
        CreateBy: item.fields.field_30,
        EmployeeType: item.fields.field_33,
        id: item.id // Ensure the ID is included for actions like approving/rejecting
      }));
    } catch (error) {
      console.error(`Error fetching pending approvals for user ${userEmail}:`, error);
      throw error;
    }
  }

  async refreshTokenIfNeeded() {
    try {
      // Ensure MSAL is initialized
      await this.initialize();

      const accounts = this.msalInstance.getAllAccounts();
      if (accounts.length === 0) {
        // Prompt user to log in
        await this.msalInstance.loginPopup({
          scopes: ['https://graph.microsoft.com/Sites.ReadWrite.All']
        });
      }

      const request = {
        scopes: ['https://graph.microsoft.com/Sites.ReadWrite.All'],
        account: this.msalInstance.getAllAccounts()[0]
      };

      // Attempt to acquire a token silently
      await this.msalInstance.acquireTokenSilent(request);
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
}

// Create singleton instance
const msListService = new MSListService();

export default msListService;