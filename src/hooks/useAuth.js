import { useEffect, useState } from "react";
import { PublicClientApplication } from '@azure/msal-browser';
import MS_GRAPH_CONFIG from '../config/msGraphConfig';

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [msalInstance, setMsalInstance] = useState(null);

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
              redirectUri: 'http://localhost:3000',
              navigateToLoginRequestUrl: true
            },
            cache: {
              cacheLocation: 'sessionStorage',
              storeAuthStateInCookie: false
            }
          };

          const msal = new PublicClientApplication(msalConfig);
          await msal.initialize();
          setMsalInstance(msal);

          // Check for existing accounts
          const accounts = msal.getAllAccounts();
          if (accounts.length > 0) {
            msal.setActiveAccount(accounts[0]);
            setUser({
              userDetails: accounts[0].username,
              userRoles: ["authenticated"]
            });
          } else {
            // No accounts found, set default user for local development
            setUser({
              userDetails: "nathan@cloudmarc.com.au",
              userRoles: ["authenticated"]
            });
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

      const response = await msalInstance.loginPopup(loginRequest);
      msalInstance.setActiveAccount(response.account);
      setUser({
        userDetails: response.account.username,
        userRoles: ["authenticated"]
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!msalInstance) return;

    try {
      await msalInstance.logoutPopup();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return { user, loaded, login, logout, msalInstance };
};

export default useAuth;
