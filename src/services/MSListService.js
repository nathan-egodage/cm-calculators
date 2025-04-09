// src/services/MSListService.js
import axios from 'axios';
import { MS_GRAPH_CONFIG } from '../config/msGraphConfig';

class MSListService {
  constructor() {
    this.graphClient = axios.create({
      baseURL: MS_GRAPH_CONFIG.baseUrl,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Initialize auth - will be called before any request
    this.initializeAuth();
  }
  
  // Initialize authentication token
  async initializeAuth() {
    try {
      // For development on localhost, using a stored token
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost') {
        console.log('Development mode - using stored token');
        this.token = localStorage.getItem('ms_graph_token') || '';
        return;
      }
      
      // For production, get token from Azure Functions or SWA Auth
      const response = await fetch('/.auth/me');
      const authData = await response.json();
      
      if (authData && authData.clientPrincipal) {
        // Use Azure AD token if available
        this.token = authData.clientPrincipal.idToken || '';
        
        // Set token in Authorization header for future requests
        if (this.token) {
          this.graphClient.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        }
      }
    } catch (error) {
      console.error('Failed to initialize authentication for MS Graph API:', error);
    }
  }
  
  // Get token for MS Graph API requests
  async getToken() {
    // If no token is available, try to initialize auth again
    if (!this.token) {
      await this.initializeAuth();
    }
    
    return this.token;
  }
  
  // Refresh token if expired
  async refreshTokenIfNeeded() {
    // In real implementation, check token expiration and refresh if needed
    // For simplicity, we'll just re-initialize auth
    await this.initializeAuth();
  }
  
  // Get all new hire requests
  async getNewHireRequests() {
    try {
      await this.refreshTokenIfNeeded();
      
      const response = await this.graphClient.get(
        `/sites/${MS_GRAPH_CONFIG.siteId}/lists/${MS_GRAPH_CONFIG.newHireListId}/items?expand=fields`
      );
      
      return response.data.value.map(item => item.fields);
    } catch (error) {
      console.error('Error fetching new hire requests:', error);
      throw error;
    }
  }
  
  // Get new hire request by ID
  async getNewHireRequestById(id) {
    try {
      await this.refreshTokenIfNeeded();
      
      const response = await this.graphClient.get(
        `/sites/${MS_GRAPH_CONFIG.siteId}/lists/${MS_GRAPH_CONFIG.newHireListId}/items/${id}?expand=fields`
      );
      
      return response.data.fields;
    } catch (error) {
      console.error(`Error fetching new hire request with ID ${id}:`, error);
      throw error;
    }
  }
  
  // Create new hire request
  async createNewHireRequest(requestData) {
    try {
      await this.refreshTokenIfNeeded();
      
      // Convert the data format to match MS List expectations
      const fieldsToSubmit = {
        fields: {
          Title: `${requestData.FirstName} ${requestData.LastName}`,
          AccountManager: requestData.AccountManager,
          FirstName: requestData.FirstName,
          LastName: requestData.LastName,
          PersonalEmail: requestData.PersonalEmail,
          Mobile: requestData.Mobile.toString(),
          Address: requestData.Address,
          Position: requestData.Position,
          ClientName: requestData.ClientName,
          Status: 'Pending',
          SignByDate: requestData.SignByDate ? new Date(requestData.SignByDate).toISOString() : null,
          StartDate: requestData.StartDate ? new Date(requestData.StartDate).toISOString() : null,
          PackageOrRate: requestData.PackageOrRate,
          GrossProfitMargin: requestData.GrossProfitMargin,
          ContractEndDate: requestData.ContractEndDate ? new Date(requestData.ContractEndDate).toISOString() : null,
          IsLaptopRequired: requestData.IsLaptopRequired,
          Rehire: requestData.Rehire,
          Notes: requestData.Notes,
          ABNName: requestData.ABNName,
          ABNNumber: requestData.ABNNumber ? requestData.ABNNumber.toString() : '',
          ABNAddress: requestData.ABNAddress,
          EngagementName: requestData.EngagementName,
          TaskName: requestData.TaskName,
          BillingRate: requestData.BillingRate,
          NewClientLegalName: requestData.NewClientLegalName,
          NewClientAddress: requestData.NewClientAddress,
          NewClientEmailAddress: requestData.NewClientEmailAddress,
          ResourceLevelCode: requestData.ResourceLevelCode,
          ApprovalStatus: 'Pending',
          CreateDate: new Date().toISOString(),
          CreateBy: requestData.CreateBy
        }
      };
      
      const response = await this.graphClient.post(
        `/sites/${MS_GRAPH_CONFIG.siteId}/lists/${MS_GRAPH_CONFIG.newHireListId}/items`,
        fieldsToSubmit
      );
      
      // After creating the item, trigger the approval workflow
      await this.triggerApprovalWorkflow(response.data.id);
      
      return response.data;
    } catch (error) {
      console.error('Error creating new hire request:', error);
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
      
      const response = await this.graphClient.patch(
        `/sites/${MS_GRAPH_CONFIG.siteId}/lists/${MS_GRAPH_CONFIG.newHireListId}/items/${id}`,
        fieldsToUpdate
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error updating new hire request with ID ${id}:`, error);
      throw error;
    }
  }
  
  // Approve new hire request
  async approveNewHireRequest(id, approverEmail) {
    try {
      await this.refreshTokenIfNeeded();
      
      const updateData = {
        ApprovalStatus: 'Approved',
        ApprovedBy: approverEmail,
        ApprovedDate: new Date().toISOString(),
        Status: 'Approved'
      };
      
      return await this.updateNewHireRequest(id, updateData);
    } catch (error) {
      console.error(`Error approving new hire request with ID ${id}:`, error);
      throw error;
    }
  }
  
  // Reject new hire request
  async rejectNewHireRequest(id, approverEmail, rejectionReason) {
    try {
      await this.refreshTokenIfNeeded();
      
      const updateData = {
        ApprovalStatus: 'Rejected',
        ApprovedBy: approverEmail,
        ApprovedDate: new Date().toISOString(),
        Status: 'Rejected',
        Notes: rejectionReason
      };
      
      return await this.updateNewHireRequest(id, updateData);
    } catch (error) {
      console.error(`Error rejecting new hire request with ID ${id}:`, error);
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
      
      // Filter the list for items where ApprovalStatus is 'Pending'
      const response = await this.graphClient.get(
        `/sites/${MS_GRAPH_CONFIG.siteId}/lists/${MS_GRAPH_CONFIG.newHireListId}/items?expand=fields&$filter=fields/ApprovalStatus eq 'Pending'`
      );
      
      return response.data.value.map(item => item.fields);
    } catch (error) {
      console.error(`Error fetching pending approvals for user ${userEmail}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const msListService = new MSListService();

export default msListService;