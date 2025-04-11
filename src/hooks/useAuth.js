import { useEffect, useState } from "react";
import { PublicClientApplication } from '@azure/msal-browser';
import MS_GRAPH_CONFIG from '../config/msGraphConfig';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [msalInstance, setMsalInstance] = useState(null);
  const [error, setError] = useState(null);

  const isLocalhost = window.location.hostname === "localhost";

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isLocalhost) {
          // Initialize MSAL for local development
          const msalConfig = {
            auth: {
              clientId: MS_GRAPH_CONFIG.clientId,
              authority: MS_GRAPH_CONFIG.authority,
              redirectUri: window.location.origin,
              postLogoutRedirectUri: window.location.origin,
              navigateToLoginRequestUrl: true
            },
            cache: {
              cacheLocation: 'sessionStorage',
              storeAuthStateInCookie: true
            },
            system: {
              allowNativeBroker: false,
              windowHashTimeout: 60000,
              iframeHashTimeout: 6000,
              loadFrameTimeout: 0
            }
          };

          const msal = new PublicClientApplication(msalConfig);
          await msal.initialize();
          setMsalInstance(msal);

          // Handle redirect promise first
          const response = await msal.handleRedirectPromise();
          if (response) {
            // If we have a response, we came back from a redirect
            msal.setActiveAccount(response.account);
            setUser({
              userDetails: response.account.username,
              userRoles: ["authenticated"]
            });
          } else {
            // Check for existing accounts
            const accounts = msal.getAllAccounts();
            if (accounts.length > 0) {
              msal.setActiveAccount(accounts[0]);
              setUser({
                userDetails: accounts[0].username,
                userRoles: ["authenticated"]
              });
            } else {
              // For local development, set a default user instead of forcing login
              setUser({
                userDetails: "nathan@cloudmarc.com.au",
                userRoles: ["authenticated"]
              });
            }
          }
        } else {
          // Production: fetch real identity from Azure Static Web Apps
          const response = await fetch("/.auth/me");
          const data = await response.json();
          const principal = data?.clientPrincipal;
          if (principal) {
            setUser(principal);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setError(error);
        if (isLocalhost) {
          // Fallback for local development
          setUser({
            userDetails: "nathan@cloudmarc.com.au",
            userRoles: ["authenticated"]
          });
        }
      } finally {
        setLoaded(true);
      }
    };

    initializeAuth();
  }, [isLocalhost]);

  const login = async () => {
    if (!msalInstance) return;

    try {
      const loginRequest = {
        scopes: MS_GRAPH_CONFIG.scopes,
        prompt: 'select_account'
      };

      // Use redirect for more reliable auth flow
      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
      setError(error);
    }
  };

  const logout = async () => {
    if (!msalInstance) return;

    try {
      await msalInstance.logoutRedirect();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error);
    }
  };

  return { user, loaded, login, logout, msalInstance, error };
};

export default useAuth;
