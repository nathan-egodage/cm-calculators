// src/services/MSListService.js
import axios from 'axios';
import MS_GRAPH_CONFIG from '../config/msGraphConfig';
import { PublicClientApplication, BrowserCacheLocation, InteractionType, LogLevel } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { AUTHORIZED_USERS } from '../config/appConfig';

class MSListService {
  constructor() {
    this.msalInstance = null;
    this.graphClient = null;
    this.initialized = false;
    
    // Set up base URLs from config
    this.graphApiUrl = MS_GRAPH_CONFIG.baseUrl;
    this.siteId = MS_GRAPH_CONFIG.siteId;
    this.listId = MS_GRAPH_CONFIG.newHireListId;
    this.baseUrl = `${this.graphApiUrl}/sites/${this.siteId}/lists/${this.listId}`;
    
    // Initialize MSAL immediately
    this.initializePromise = this.initialize();
  }

  getMsalConfig() {
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:63892'  // Use the actual port your app is running on
      : window.location.origin;

    return {
      auth: {
        clientId: MS_GRAPH_CONFIG.clientId,
        authority: MS_GRAPH_CONFIG.authority,
        redirectUri: redirectUri,
        navigateToLoginRequestUrl: true,
        postLogoutRedirectUri: redirectUri
      },
      cache: {
        cacheLocation: BrowserCacheLocation.SessionStorage,
        storeAuthStateInCookie: true,
        secureCookies: process.env.NODE_ENV !== 'development'
      },
      system: {
        allowNativeBroker: false,
        windowHashTimeout: 60000,
        iframeHashTimeout: 6000,
        loadFrameTimeout: 0,
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) {
              return;
            }
            switch (level) {
              case LogLevel.Error:
                console.error('MSAL:', message);
                break;
              case LogLevel.Info:
                console.info('MSAL:', message);
                break;
              case LogLevel.Verbose:
                console.debug('MSAL:', message);
                break;
              case LogLevel.Warning:
                console.warn('MSAL:', message);
                break;
              default:
                console.log('MSAL:', message);
            }
          },
          piiLoggingEnabled: false,
          logLevel: LogLevel.Verbose
        }
      }
    };
  }

  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      console.log('Initializing MSAL...');

      // Ensure environment variables are loaded
      if (!window.__env__) {
        throw new Error('Environment variables not loaded. Make sure env.js is loaded before the application.');
      }

      // Create and initialize MSAL instance
      const msalConfig = this.getMsalConfig();
      this.msalInstance = new PublicClientApplication(msalConfig);
      await this.msalInstance.initialize();
      
      console.log('MSAL instance initialized');

      // Handle redirect response if present
      const response = await this.msalInstance.handleRedirectPromise();
      if (response) {
        console.log('Redirect response received:', response);
        this.msalInstance.setActiveAccount(response.account);
      }

      // Get active account or login
      const accounts = this.msalInstance.getAllAccounts();
      let account = accounts[0];

      if (!account) {
        console.log('No active account found, initiating login...');
        const loginRequest = {
          scopes: MS_GRAPH_CONFIG.scopes,
          prompt: 'select_account'
        };

        // Always use redirect for login
        console.log('Starting redirect login flow...');
        await this.msalInstance.loginRedirect(loginRequest);
        return false; // Function will be called again after redirect
      }

      this.msalInstance.setActiveAccount(account);
      console.log('Active account set:', account.username);

      // Initialize Graph client
      const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
        this.msalInstance,
        {
          account: account,
          scopes: MS_GRAPH_CONFIG.scopes,
          interactionType: InteractionType.Redirect // Change to redirect-based interaction
        }
      );

      this.graphClient = Client.initWithMiddleware({
        authProvider: authProvider
      });

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize MSListService:', error);
      this.initialized = false;
      throw error;
    }
  }

  async getNewHireRequests() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.graphClient) {
        throw new Error('Graph client is not initialized');
      }

      console.log('Fetching new hire requests...');
      const response = await this.graphClient
        .api(`${this.baseUrl}/items`)
        .expand('fields')
        .get();

      console.log('New hire requests response:', response);
      return response.value.map(item => ({
        id: item.id,
        ...item.fields
      }));
    } catch (error) {
      console.error('Error fetching new hire requests:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch new hire requests: ${error.message}`);
      } else {
        throw new Error('Failed to fetch new hire requests: Unknown error');
      }
    }
  }

  async createNewHireRequest(data) {
    try {
      // Wait for initialization to complete
      await this.initializePromise;

      if (!this.initialized || !this.graphClient) {
        throw new Error('Service not properly initialized');
      }

      const response = await this.graphClient
        .api(`${this.baseUrl}/items`)
        .post({
          fields: data
        });

      return response;
    } catch (error) {
      console.error('Error creating new hire request:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to create new hire request: ${error.message}`);
      } else {
        throw new Error('Failed to create new hire request: Unknown error');
      }
    }
  }

  async getAccessToken() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this.msalInstance) {
        throw new Error('MSAL instance is not initialized');
      }

      const account = this.msalInstance.getActiveAccount();
      if (!account) {
        throw new Error('No active account');
      }

      const response = await this.msalInstance.acquireTokenSilent({
        scopes: MS_GRAPH_CONFIG.scopes,
        account: account
      });

      return response.accessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Send email using Microsoft Graph API
  async sendEmail(to, subject, body) {
    try {
      await this.refreshTokenIfNeeded();

      const message = {
        message: {
          subject: subject,
          body: {
            contentType: "HTML",
            content: body
          },
          toRecipients: to.map(email => ({
            emailAddress: {
              address: email
            }
          }))
        }
      };

      await this.graphClient
        .api('/me/sendMail')
        .post(message);

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async getNewHireRequestById(id) {
    try {
      await this.refreshTokenIfNeeded();
      
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listId}/items/${id}`)
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
        .api(`/sites/${this.siteId}/lists/${this.listId}/items/${id}`)
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
      
      // First get the request details to get the creator's email
      const request = await this.getNewHireRequestById(itemId);
      const creatorEmail = request.field_30; // CreateBy field contains the creator's email
      
      const updateData = {
        fields: {
          field_8: 'Approved', // ApprovalStatus
          field_31: approverEmail, // ApprovedBy
          field_32: new Date().toISOString() // ApprovedDate
        }
      };

      console.log('Approving request with URL:', `${this.baseUrl}/items/${itemId}?$expand=fields`);
      console.log('Update data:', updateData);

      const response = await this.graphClient
        .api(`${this.baseUrl}/items/${itemId}?$expand=fields`)
        .update(updateData);

      // Send confirmation email to the creator
      if (creatorEmail) {
        console.log('Sending approval email to:', creatorEmail);
        const subject = 'New Hire Request Approved';
        const content = `
          <h2>Your New Hire Request Has Been Approved</h2>
          <p>Your new hire request has been approved by ${approverEmail}.</p>
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Candidate Name:</strong> ${request.field_1} ${request.field_2}</li>
            <li><strong>Position:</strong> ${request.field_6}</li>
            <li><strong>Client Name:</strong> ${request.field_7}</li>
            <li><strong>Personal Email:</strong> ${request.field_3}</li>
            <li><strong>Mobile:</strong> ${request.field_4}</li>
            <li><strong>Address:</strong> ${request.field_5}</li>
            <li><strong>Employee Type:</strong> ${request.field_33}</li>
            <li><strong>Status:</strong> ${request.field_8}</li>
            <li><strong>Sign By Date:</strong> ${request.field_9}</li>
            <li><strong>Start Date:</strong> ${request.field_10}</li>
            <li><strong>Package/Rate:</strong> ${request.field_11}</li>
            <li><strong>Gross Profit Margin:</strong> ${request.field_12}</li>
            <li><strong>Contract End Date:</strong> ${request.field_13}</li>
            <li><strong>Laptop Required:</strong> ${request.field_14}</li>
            <li><strong>Office:</strong> ${request.field_15}</li>
            <li><strong>Rehire:</strong> ${request.field_16}</li>
            ${request.field_18 ? `<li><strong>ABN Name:</strong> ${request.field_18}</li>` : ''}
            ${request.field_19 ? `<li><strong>ABN Number:</strong> ${request.field_19}</li>` : ''}
            ${request.field_20 ? `<li><strong>ABN Address:</strong> ${request.field_20}</li>` : ''}
            <li><strong>Engagement Name:</strong> ${request.field_21}</li>
            <li><strong>Task Name:</strong> ${request.field_22}</li>
            <li><strong>Billing Rate:</strong> ${request.field_23}</li>
            ${request.field_24 ? `<li><strong>New Client Legal Name:</strong> ${request.field_24}</li>` : ''}
            ${request.field_25 ? `<li><strong>New Client Address:</strong> ${request.field_25}</li>` : ''}
            ${request.field_26 ? `<li><strong>New Client Email:</strong> ${request.field_26}</li>` : ''}
            <li><strong>Resource Level Code:</strong> ${request.field_27}</li>
            ${request.field_17 ? `<li><strong>Notes:</strong> ${request.field_17}</li>` : ''}
            </br><li><strong>Approved By:</strong> ${approverEmail}</li>
            <li><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>You can view the full details of this request in the application.</p>
        `;
        await this.sendEmail([creatorEmail], subject, content);
      } else {
        console.log('No creator email found, skipping email sending.');
      }

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
      
      // First get the request details to get the creator's email
      const request = await this.getNewHireRequestById(itemId);
      const creatorEmail = request.field_30; // CreateBy field contains the creator's email
      
      const updateData = {
        fields: {
          field_8: 'Rejected', // ApprovalStatus
          field_31: approverEmail, // ApprovedBy
          field_32: new Date().toISOString(), // ApprovedDate
          field_17: rejectionReason // Notes
        }
      };

      console.log('Rejecting request with URL:', `${this.baseUrl}/items/${itemId}?$expand=fields`);
      console.log('Update data:', updateData);

      const response = await this.graphClient
        .api(`${this.baseUrl}/items/${itemId}?$expand=fields`)
        .update(updateData);

      // Send rejection email to the creator
      if (creatorEmail) {
        console.log('Sending rejection email to:', creatorEmail);
        const subject = 'New Hire Request Rejected';
        const content = `
          <h2>Your New Hire Request Has Been Rejected</h2>
          <p>Your new hire request has been rejected by ${approverEmail}.</p>
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Candidate Name:</strong> ${request.field_1} ${request.field_2}</li>
            <li><strong>Position:</strong> ${request.field_6}</li>
            <li><strong>Client Name:</strong> ${request.field_7}</li>
            <li><strong>Personal Email:</strong> ${request.field_3}</li>
            <li><strong>Mobile:</strong> ${request.field_4}</li>
            <li><strong>Address:</strong> ${request.field_5}</li>
            <li><strong>Employee Type:</strong> ${request.field_33}</li>
            <li><strong>Status:</strong> ${request.field_8}</li>
            <li><strong>Sign By Date:</strong> ${request.field_9}</li>
            <li><strong>Start Date:</strong> ${request.field_10}</li>
            <li><strong>Package/Rate:</strong> ${request.field_11}</li>
            <li><strong>Gross Profit Margin:</strong> ${request.field_12}</li>
            <li><strong>Contract End Date:</strong> ${request.field_13}</li>
            <li><strong>Laptop Required:</strong> ${request.field_14}</li>
            <li><strong>Office:</strong> ${request.field_15}</li>
            <li><strong>Rehire:</strong> ${request.field_16}</li>
            ${request.field_18 ? `<li><strong>ABN Name:</strong> ${request.field_18}</li>` : ''}
            ${request.field_19 ? `<li><strong>ABN Number:</strong> ${request.field_19}</li>` : ''}
            ${request.field_20 ? `<li><strong>ABN Address:</strong> ${request.field_20}</li>` : ''}
            <li><strong>Engagement Name:</strong> ${request.field_21}</li>
            <li><strong>Task Name:</strong> ${request.field_22}</li>
            <li><strong>Billing Rate:</strong> ${request.field_23}</li>
            ${request.field_24 ? `<li><strong>New Client Legal Name:</strong> ${request.field_24}</li>` : ''}
            ${request.field_25 ? `<li><strong>New Client Address:</strong> ${request.field_25}</li>` : ''}
            ${request.field_26 ? `<li><strong>New Client Email:</strong> ${request.field_26}</li>` : ''}
            <li><strong>Resource Level Code:</strong> ${request.field_27}</li>
            ${request.field_17 ? `<li><strong>Notes:</strong> ${request.field_17}</li>` : ''}
            </br><li><strong>Rejected By:</strong> ${approverEmail}</li>
            <li><strong>Rejection Date:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Reason for Rejection:</strong> ${rejectionReason}</li>
          </ul>
          <p>You can view the full details of this request in the application.</p>
        `;
        await this.sendEmail([creatorEmail], subject, content);
      } else {
        console.log('No creator email found, skipping email sending.');
      }

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
      
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listId}/items?$expand=fields&$filter=fields/field_8 eq 'Pending'`)
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
        id: item.id
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
        // Use redirect for login
        await this.msalInstance.loginRedirect({
          scopes: ['https://graph.microsoft.com/Sites.ReadWrite.All']
        });
        return; // Function will be called again after redirect
      }

      const request = {
        scopes: ['https://graph.microsoft.com/Sites.ReadWrite.All'],
        account: this.msalInstance.getAllAccounts()[0]
      };

      try {
        // Try silent token acquisition first
        await this.msalInstance.acquireTokenSilent(request);
      } catch (error) {
        console.log('Silent token acquisition failed, using redirect:', error);
        await this.msalInstance.acquireTokenRedirect(request);
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }
}

// Create singleton instance
const msListService = new MSListService();

export default msListService;