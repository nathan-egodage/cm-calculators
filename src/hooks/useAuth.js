import { useEffect, useState } from "react";
import { PublicClientApplication } from '@azure/msal-browser';
import MS_GRAPH_CONFIG from '../config/msGraphConfig';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [msalInstance, setMsalInstance] = useState(null);
  const [error, setError] = useState(null);

  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // For development, use a mock user
        if (isDevelopment) {
          setUser({
            userDetails: 'nathan@cloudmarc.com.au',
            userRoles: ['authenticated']
          });
          setLoaded(true);
          return;
        }

        // Production authentication
        const msalConfig = {
          auth: {
            clientId: MS_GRAPH_CONFIG.clientId,
            authority: MS_GRAPH_CONFIG.authority,
            redirectUri: window.location.origin,
            navigateToLoginRequestUrl: false
          },
          cache: {
            cacheLocation: 'sessionStorage',
            storeAuthStateInCookie: true
          }
        };

        const msal = new PublicClientApplication(msalConfig);
        await msal.initialize();
        setMsalInstance(msal);

        // Check if we're handling a redirect
        const response = await msal.handleRedirectPromise();
        
        if (response) {
          // We have a response from a redirect
          msal.setActiveAccount(response.account);
          setUser({
            userDetails: response.account.username,
            userRoles: ['authenticated']
          });
        } else {
          // Check for existing accounts
          const accounts = msal.getAllAccounts();
          if (accounts.length > 0) {
            msal.setActiveAccount(accounts[0]);
            setUser({
              userDetails: accounts[0].username,
              userRoles: ['authenticated']
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error);
      } finally {
        setLoaded(true);
      }
    };

    initializeAuth();
  }, [isDevelopment]);

  const login = async () => {
    if (isDevelopment) {
      setUser({
        userDetails: 'nathan@cloudmarc.com.au',
        userRoles: ['authenticated']
      });
      return;
    }

    if (!msalInstance) return;

    try {
      const loginRequest = {
        scopes: MS_GRAPH_CONFIG.scopes
      };

      // Check if we're already handling a redirect
      if (!window.location.hash.includes('code=') && !window.location.hash.includes('error=')) {
        await msalInstance.loginRedirect(loginRequest);
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error);
    }
  };

  const logout = async () => {
    if (isDevelopment) {
      setUser(null);
      return;
    }

    if (!msalInstance) return;

    try {
      await msalInstance.logoutRedirect();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error);
    }
  };

  return {
    user,
    loaded,
    login,
    logout,
    msalInstance,
    error,
    isAuthenticated: !!user
  };
};

export default useAuth;
