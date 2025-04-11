// src/services/MSListService.js
import axios from 'axios';
import { MS_GRAPH_CONFIG } from '../config/msGraphConfig';
import { PublicClientApplication } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthCodeMSALBrowserAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser';
import { AUTHORIZED_USERS } from '../config/appConfig';

class MSListService {
  constructor() {
    this.graphApiUrl = MS_GRAPH_CONFIG.baseUrl;
    this.siteId = MS_GRAPH_CONFIG.siteId;
    this.listId = MS_GRAPH_CONFIG.newHireListId;
    this.baseUrl = `${this.graphApiUrl}/sites/${this.siteId}/lists/${this.listId}`;
    
    this.msalInstance = null;
    this.graphClient = null;
  }

  async initialize() {
    try {
      // Check required configuration
      if (!MS_GRAPH_CONFIG.clientId || !MS_GRAPH_CONFIG.authority) {
        console.error('Missing configuration:', { 
          clientId: MS_GRAPH_CONFIG.clientId, 
          authority: MS_GRAPH_CONFIG.authority 
        });
        throw new Error('MS Graph configuration is missing required values');
      }

      // Initialize MSAL instance if not already initialized
      if (!this.msalInstance) {
        console.log('Initializing MSAL instance with config:', {
          clientId: MS_GRAPH_CONFIG.clientId,
          authority: MS_GRAPH_CONFIG.authority,
          redirectUri: MS_GRAPH_CONFIG.redirectUri
        });

        this.msalInstance = new PublicClientApplication({
          auth: {
            clientId: MS_GRAPH_CONFIG.clientId,
            authority: MS_GRAPH_CONFIG.authority,
            redirectUri: MS_GRAPH_CONFIG.redirectUri,
          },
          cache: {
            cacheLocation: 'sessionStorage',
            storeAuthStateInCookie: false,
          },
          system: {
            loggerOptions: {
              loggerCallback: (level, message, containsPii) => {
                if (!containsPii) console.log(message);
              },
              piiLoggingEnabled: false,
              logLevel: 3 // Info
            }
          }
        });

        await this.msalInstance.initialize();
        console.log('MSAL instance initialized successfully');
      }

      // Get active account or login
      const accounts = this.msalInstance.getAllAccounts();
      let account = accounts[0];

      if (!account) {
        console.log('No active account found, initiating login...');
        const loginResponse = await this.msalInstance.loginPopup({
          scopes: MS_GRAPH_CONFIG.scopes
        });
        account = loginResponse.account;
        this.msalInstance.setActiveAccount(account);
        console.log('Login successful, account set:', account.username);
      } else {
        console.log('Using existing account:', account.username);
        this.msalInstance.setActiveAccount(account);
      }

      // Initialize Graph client
      const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
        this.msalInstance,
        {
          account: this.msalInstance.getActiveAccount(),
          scopes: MS_GRAPH_CONFIG.scopes,
          interactionType: 'popup'
        }
      );

      this.graphClient = Client.initWithMiddleware({ authProvider });
      console.log('Graph client initialized successfully');

      return true;
    } catch (error) {
      console.error('Error in initialize:', error);
      throw error;
    }
  }

  async getAccessToken() {
    try {
      // Ensure MSAL is initialized
      await this.initialize();
      
      const request = {
        scopes: [
          'Mail.Send',
          'Sites.ReadWrite.All',
          'User.Read',
          'openid',
          'profile',
          'offline_access'
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

      const response = await this.graphClient
        .api(`${this.baseUrl}/items`)
        .post(requestData);

      // Send email notifications after successful creation
      if (response && response.id) {
        // Get the list of approvers from AUTHORIZED_USERS
        const approvers = AUTHORIZED_USERS.newHireRequestApprovers || [];
        
        // Prepare email content
        const subject = `New Hire Request Created: ${data.FirstName} ${data.LastName}`;
        
        const creatorEmailContent = `
          <h2>New Hire Request Confirmation</h2>
          <p>Your new hire request has been successfully created and is pending approval.</p>
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Submitted By:</strong> ${user?.userDetails}</li>
            <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Candidate Name:</strong> ${data.FirstName} ${data.LastName}</li>
            <li><strong>Personal Email:</strong> ${data.PersonalEmail}</li>
            <li><strong>Mobile:</strong> ${data.Mobile}</li>
            <li><strong>Address:</strong> ${data.Address}</li>
            <li><strong>Position:</strong> ${data.Position}</li>
            <li><strong>Employee Type:</strong> ${data.EmployeeType || 'AU PAYG Contractor'}</li>
            <li><strong>Client Name:</strong> ${data.ClientName}</li>
            <li><strong>Status:</strong> ${data.Status || 'Pending'}</li>
            <li><strong>Sign By Date:</strong> ${data.SignByDate}</li>
            <li><strong>Start Date:</strong> ${data.StartDate}</li>
            <li><strong>Package/Rate:</strong> ${data.PackageOrRate}</li>
            <li><strong>Gross Profit Margin:</strong> ${data.GrossProfitMargin}</li>
            <li><strong>Contract End Date:</strong> ${data.ContractEndDate}</li>
            <li><strong>Laptop Required:</strong> ${data.IsLaptopRequired || 'No'}</li>
            <li><strong>Office:</strong> ${data.Office}</li>
            <li><strong>Rehire:</strong> ${data.Rehire || 'No'}</li>
            ${data.ABNName ? `<li><strong>ABN Name:</strong> ${data.ABNName}</li>` : ''}
            ${data.ABNNumber ? `<li><strong>ABN Number:</strong> ${data.ABNNumber}</li>` : ''}
            ${data.ABNAddress ? `<li><strong>ABN Address:</strong> ${data.ABNAddress}</li>` : ''}
            <li><strong>Engagement Name:</strong> ${data.EngagementName}</li>
            <li><strong>Task Name:</strong> ${data.TaskName}</li>
            <li><strong>Billing Rate:</strong> ${data.BillingRate}</li>
            ${data.NewClientLegalName ? `<li><strong>New Client Legal Name:</strong> ${data.NewClientLegalName}</li>` : ''}
            ${data.NewClientAddress ? `<li><strong>New Client Address:</strong> ${data.NewClientAddress}</li>` : ''}
            ${data.NewClientEmailAddress ? `<li><strong>New Client Email:</strong> ${data.NewClientEmailAddress}</li>` : ''}
            <li><strong>Resource Level Code:</strong> ${data.ResourceLevelCode}</li>
            ${data.Notes ? `<li><strong>Notes:</strong> ${data.Notes}</li>` : ''}
          </ul>
          <p>You will be notified once the request is approved or if any additional information is required.</p>
        `;

        const approverEmailContent = `
          <h2>New Hire Request Pending Approval</h2>
          <p>A new hire request has been submitted and requires your approval.</p>
          <h3>Request Details:</h3>
          <ul>
            <li><strong>Submitted By:</strong> ${user?.userDetails}</li>
            <li><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Candidate Name:</strong> ${data.FirstName} ${data.LastName}</li>
            <li><strong>Personal Email:</strong> ${data.PersonalEmail}</li>
            <li><strong>Mobile:</strong> ${data.Mobile}</li>
            <li><strong>Address:</strong> ${data.Address}</li>
            <li><strong>Position:</strong> ${data.Position}</li>
            <li><strong>Employee Type:</strong> ${data.EmployeeType || 'AU PAYG Contractor'}</li>
            <li><strong>Client Name:</strong> ${data.ClientName}</li>
            <li><strong>Status:</strong> ${data.Status || 'Pending'}</li>
            <li><strong>Sign By Date:</strong> ${data.SignByDate}</li>
            <li><strong>Start Date:</strong> ${data.StartDate}</li>
            <li><strong>Package/Rate:</strong> ${data.PackageOrRate}</li>
            <li><strong>Gross Profit Margin:</strong> ${data.GrossProfitMargin}</li>
            <li><strong>Contract End Date:</strong> ${data.ContractEndDate}</li>
            <li><strong>Laptop Required:</strong> ${data.IsLaptopRequired || 'No'}</li>
            <li><strong>Office:</strong> ${data.Office}</li>
            <li><strong>Rehire:</strong> ${data.Rehire || 'No'}</li>
            ${data.ABNName ? `<li><strong>ABN Name:</strong> ${data.ABNName}</li>` : ''}
            ${data.ABNNumber ? `<li><strong>ABN Number:</strong> ${data.ABNNumber}</li>` : ''}
            ${data.ABNAddress ? `<li><strong>ABN Address:</strong> ${data.ABNAddress}</li>` : ''}
            <li><strong>Engagement Name:</strong> ${data.EngagementName}</li>
            <li><strong>Task Name:</strong> ${data.TaskName}</li>
            <li><strong>Billing Rate:</strong> ${data.BillingRate}</li>
            ${data.NewClientLegalName ? `<li><strong>New Client Legal Name:</strong> ${data.NewClientLegalName}</li>` : ''}
            ${data.NewClientAddress ? `<li><strong>New Client Address:</strong> ${data.NewClientAddress}</li>` : ''}
            ${data.NewClientEmailAddress ? `<li><strong>New Client Email:</strong> ${data.NewClientEmailAddress}</li>` : ''}
            <li><strong>Resource Level Code:</strong> ${data.ResourceLevelCode}</li>
            ${data.Notes ? `<li><strong>Notes:</strong> ${data.Notes}</li>` : ''}
          </ul>
          
          <div style="margin: 20px 0; text-align: center;">
            <p>You can quickly approve or reject this request by clicking one of the buttons below:</p>
            <div style="margin: 20px 0;">
              <a href="${window.location.origin}/approve-request/${response.id}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-right: 10px; display: inline-block;">
                Approve Request
              </a>
              <a href="${window.location.origin}/reject-request/${response.id}" 
                 style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reject Request
              </a>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              Or you can review the request in detail by visiting the application at 
              <a href="${window.location.origin}/pending-approvals">${window.location.origin}/pending-approvals</a>
            </p>
          </div>
          
          <p>Please review and approve the request at your earliest convenience.</p>
        `;

        // Send email to creator
        if (user?.userDetails) {
          await this.sendEmail([user.userDetails], subject, creatorEmailContent);
        }

        // Send email to approvers
        if (approvers.length > 0) {
          await this.sendEmail(approvers, subject, approverEmailContent);
        }
      }

      return response;
    } catch (error) {
      console.error('Error creating new hire request:', error);
      throw error;
    }
  }

  // Get all new hire requests
  async getNewHireRequests() {
    try {
      await this.refreshTokenIfNeeded();
      
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.listId}/items?$expand=fields`)
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