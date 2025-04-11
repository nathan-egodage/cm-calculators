// src/config/msGraphConfig.js
// Configuration for Microsoft Graph API and SharePoint Lists

// Helper function to get environment variables with retry
const getEnvVar = (name, maxRetries = 10, retryInterval = 100) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryGetVar = () => {
      // Try window.__env__ first (production)
      let value = window.__env__?.[name];
      
      // Fallback to process.env (development)
      if (!value && process.env[name]) {
        value = process.env[name];
      }
      
      if (value) {
        resolve(value);
      } else if (attempts < maxRetries) {
        attempts++;
        setTimeout(tryGetVar, retryInterval);
      } else {
        reject(new Error(`Environment variable ${name} not found after ${maxRetries} attempts`));
      }
    };

    tryGetVar();
  });
};

// Initialize configuration object
const initializeConfig = async () => {
  try {
    // Log initialization start
    console.log('Validating configuration in:', process.env.NODE_ENV);
    console.log('window.__env__ available:', !!window.__env__);

    // Wait for all required environment variables
    const [clientId, tenantId, siteId, listId] = await Promise.all([
      getEnvVar('REACT_APP_CLIENT_ID'),
      getEnvVar('REACT_APP_TENANT_ID'),
      getEnvVar('REACT_APP_SITE_ID'),
      getEnvVar('REACT_APP_LIST_ID')
    ]);

    const config = {
      // Microsoft Graph API base URL
      baseUrl: 'https://graph.microsoft.com/v1.0',
      
      // Azure AD App Registration details
      clientId,
      tenantId,
      
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
      siteId,
      newHireListId: listId,
      
      // Redirect URI
      redirectUri: window.location.origin
    };

    // Construct authority URL
    config.authority = `https://login.microsoftonline.com/${config.tenantId}`;

    // Log success
    console.log('Configuration validated successfully');
    
    return config;
  } catch (error) {
    console.error('Failed to initialize MS Graph configuration:', error);
    throw error;
  }
};

// Create and validate configuration
let MS_GRAPH_CONFIG = null;

const getConfig = async () => {
  if (!MS_GRAPH_CONFIG) {
    MS_GRAPH_CONFIG = await initializeConfig();
  }
  return MS_GRAPH_CONFIG;
};

export { getConfig };
export default getConfig;
