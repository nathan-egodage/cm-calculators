import { PublicClientApplication } from '@azure/msal-browser';

// Mock storage for development mode
const mockStorage = {
  items: [],
  nextId: 1
};

export default class MSListService {
  constructor() {
    this.initialized = false;
    this.initializationRequired = true;
    this.initializationInProgress = false;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    if (!this.initializationRequired) {
      return true;
    }

    this.initializationInProgress = true;

    try {
      if (this.isDevelopment) {
        console.log('Using mock MSListService in development mode');
        this.initialized = true;
        return true;
      }

      console.log('Initializing MSAL...');
      // ... existing code for production mode ...
    } catch (error) {
      console.error('Error initializing MSListService:', error);
      throw error;
    } finally {
      this.initializationInProgress = false;
    }
  }

  async getItems() {
    await this.initialize();
    
    if (this.isDevelopment) {
      return mockStorage.items;
    }

    // ... existing production code ...
  }

  async createItem(item) {
    await this.initialize();

    if (this.isDevelopment) {
      const newItem = {
        ...item,
        id: mockStorage.nextId++,
        createdAt: new Date().toISOString()
      };
      mockStorage.items.push(newItem);
      return newItem;
    }

    // ... existing production code ...
  }

  async updateItem(id, item) {
    await this.initialize();

    if (this.isDevelopment) {
      const index = mockStorage.items.findIndex(i => i.id === id);
      if (index === -1) {
        throw new Error(`Item with id ${id} not found`);
      }
      const updatedItem = {
        ...mockStorage.items[index],
        ...item,
        updatedAt: new Date().toISOString()
      };
      mockStorage.items[index] = updatedItem;
      return updatedItem;
    }

    // ... existing production code ...
  }

  async deleteItem(id) {
    await this.initialize();

    if (this.isDevelopment) {
      const index = mockStorage.items.findIndex(i => i.id === id);
      if (index === -1) {
        throw new Error(`Item with id ${id} not found`);
      }
      mockStorage.items.splice(index, 1);
      return true;
    }

    // ... existing production code ...
  }
} 