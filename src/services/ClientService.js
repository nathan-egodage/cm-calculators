// src/services/ClientService.js
import axios from 'axios';
import { CLIENT_API_CONFIG } from '../config/apiConfig';

class ClientService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: CLIENT_API_CONFIG.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLIENT_API_CONFIG.apiKey
      }
    });
    
    // For development purposes, we'll provide mock client data
    this.mockClients = [
      {
        id: '1',
        name: 'Microsoft',
        legalName: 'Microsoft Corporation',
        address: '1 Microsoft Way, Redmond, WA 98052, United States',
        email: 'contracts@microsoft.com'
      },
      {
        id: '2',
        name: 'ANZ Bank',
        legalName: 'Australia and New Zealand Banking Group Limited',
        address: 'ANZ Centre, 833 Collins Street, Docklands, VIC 3008',
        email: 'procurement@anz.com.au'
      },
      {
        id: '3',
        name: 'Telstra',
        legalName: 'Telstra Corporation Limited',
        address: '242 Exhibition St, Melbourne VIC 3000',
        email: 'vendor.management@team.telstra.com'
      },
      {
        id: '4',
        name: 'NAB',
        legalName: 'National Australia Bank Limited',
        address: '800 Bourke Street, Docklands, VIC 3008',
        email: 'procurement@nab.com.au'
      },
      {
        id: '5',
        name: 'CBA',
        legalName: 'Commonwealth Bank of Australia',
        address: 'Tower 1, 201 Sussex St, Sydney NSW 2000',
        email: 'supplier.management@cba.com.au'
      }
    ];
  }
  
  // Get all clients
  async getClients() {
    try {
      // For development, return mock clients
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost') {
        console.log('Development mode - using mock client data');
        return this.mockClients;
      }
      
      // For production, call the real API
      const response = await this.apiClient.get('/clients');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      
      // Fallback to mock data if API fails
      console.log('API failed - falling back to mock client data');
      return this.mockClients;
    }
  }
  
  // Get client details by ID
  async getClientDetails(clientId) {
    try {
      // For development, return mock client details
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost') {
        console.log(`Development mode - using mock client data for ID: ${clientId}`);
        const client = this.mockClients.find(c => c.id === clientId);
        
        if (!client) {
          throw new Error(`Client with ID ${clientId} not found in mock data`);
        }
        
        return client;
      }
      
      // For production, call the real API
      const response = await this.apiClient.get(`/clients/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching client with ID ${clientId}:`, error);
      
      // Fallback to mock data if API fails
      console.log('API failed - checking mock client data');
      const client = this.mockClients.find(c => c.id === clientId);
      
      if (client) {
        return client;
      }
      
      throw error;
    }
  }
  
  // Search clients by name or other criteria
  async searchClients(searchTerm) {
    try {
      // For development, filter mock clients
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost') {
        console.log(`Development mode - searching mock clients for: ${searchTerm}`);
        
        if (!searchTerm) {
          return this.mockClients;
        }
        
        const term = searchTerm.toLowerCase();
        
        return this.mockClients.filter(client => 
          client.name.toLowerCase().includes(term) || 
          client.legalName.toLowerCase().includes(term)
        );
      }
      
      // For production, call the real API
      const response = await this.apiClient.get('/clients/search', {
        params: { q: searchTerm }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error searching clients with term "${searchTerm}":`, error);
      
      // Fallback to mock data if API fails
      console.log('API failed - searching mock client data');
      
      if (!searchTerm) {
        return this.mockClients;
      }
      
      const term = searchTerm.toLowerCase();
      
      return this.mockClients.filter(client => 
        client.name.toLowerCase().includes(term) || 
        client.legalName.toLowerCase().includes(term)
      );
    }
  }
}

// Create singleton instance
const clientService = new ClientService();

export default clientService;