import { useEffect, useState } from "react";
import MSListService from '../services/MSListService';

const mockUser = {
  userDetails: 'Nathan@cloudmarc.com.au',
  name: 'Nathan Egodage',
  email: 'Nathan@cloudmarc.com.au'
};

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  const isLocalhost = window.location.hostname === "localhost";

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isDevelopment) {
          setUser(mockUser);
          setLoading(false);
          return;
        }

        if (isLocalhost) {
          // Mocked user for local development
          setUser({
            userDetails: "nathan@cloudmarc.com.au",
            userRoles: ["authenticated"]
          });
          setLoading(false);
        } else {
          // Production: fetch real identity from Azure Static Web Apps
          const response = await fetch("/.auth/me");
          
          if (response.status === 401 || response.status === 403) {
            // User is not authenticated, redirect to login
            window.location.href = "/.auth/login/aad?post_login_redirect_uri=" + encodeURIComponent(window.location.pathname);
            return;
          }

          const data = await response.json();
          const principal = data?.clientPrincipal;
          
          if (!principal) {
            // No user data, redirect to login
            window.location.href = "/.auth/login/aad?post_login_redirect_uri=" + encodeURIComponent(window.location.pathname);
            return;
          }

          setUser(principal);
          setLoading(false);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isLocalhost]);

  return { user, loading, error };
}

export { useAuth };
export default useAuth;
