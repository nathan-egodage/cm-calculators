// appConfig.js - Central configuration file for the application

// Version information
export const APP_VERSION = {
  number: "1.0.0",
  date: "2024-04-11",
  owner: "Nathan Egodage",
  repository: "https://github.com/nathan-egodage/cm-calculators.git"
};

// Environment settings and other global configurations can also be added here
export const ENV_CONFIG = {
  apiEndpoints: {
    // Example - not used in current application
    holidayApi: "https://date.nager.at/api/v3/PublicHolidays",
    // HelloSign API endpoint
    helloSignApi: "https://api.hellosign.com/v3"
  }
};

// Contact information
export const CONTACT_INFO = {
  owner: "Nathan Egodage",
  email: "nathan@cloudmarc.com.au"
};

// Authorized users for specific features and pages
export const AUTHORIZED_USERS = {
  // Users who can access the home page
  homeAccess: [
    "ddallariva@cloudmarc.com.au",
    "dnewland@cloudmarc.com.au",
    "dscanlon@cloudmarc.com.au",
    "jgregory@cloudmarc.com.au",
    "nathan@cloudmarc.com.au",
    "Nathan@cloudmarc.com.au",
    "rocket@cloudmarc.com.au",
    "sbrownbill@cloudmarc.com.au"
  ],
  
  // Users who can access the BDM calculator
  bdmCalculator: [
    "ddallariva@cloudmarc.com.au",
    "nathan@cloudmarc.com.au",
    "Nathan@cloudmarc.com.au",
    "rocket@cloudmarc.com.au"
  ],
  
  // Users who can access the HelloSign document status
  helloSignDocuments: [
    "ddallariva@cloudmarc.com.au",
    "dnewland@cloudmarc.com.au",
    "dscanlon@cloudmarc.com.au",
    "jgregory@cloudmarc.com.au",
    "nathan@cloudmarc.com.au",
    "Nathan@cloudmarc.com.au",
    "rocket@cloudmarc.com.au",
    "sbrownbill@cloudmarc.com.au"
  ],

  newHireRequestCreators: [
    "nathan@cloudmarc.com.au",
    "darren@cloudmarc.com.au",
    "david@cloudmarc.com.au",
    "Nathan@cloudmarc.com.au"
  ],
  newHireRequestApprovers: [
    "nathan@cloudmarc.com.au",
    "darren@cloudmarc.com.au",
    "david@cloudmarc.com.au",
    "Nathan@cloudmarc.com.au"
  ],
  cvConverterUsers: [
    "nathan@cloudmarc.com.au",
    "darren@cloudmarc.com.au",
    "david@cloudmarc.com.au",
    "rocket@cloudmarc.com.au",
    "simon@cloudmarc.com.au",
    "Nathan@cloudmarc.com.au"
  ]
};

// Helper function to check if a user is authorized
export const isUserAuthorized = (userEmail, authType) => {
  if (!userEmail) return false;
  
  // Convert email to lowercase for case-insensitive comparison
  const normalizedEmail = userEmail.toLowerCase();
  
  // Get the appropriate authorization list
  const authList = AUTHORIZED_USERS[authType] || [];
  
  // Check if user email is in the list (case-insensitive)
  return authList.some(email => email.toLowerCase() === normalizedEmail);
};