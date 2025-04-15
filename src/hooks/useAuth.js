import { useEffect, useState } from "react";
import MSListService from '../services/MSListService';

const mockUser = {
  userDetails: 'Nathan@cloudmarc.com.au',
  name: 'Nathan Egodage',
  email: 'Nathan@cloudmarc.com.au'
};

export function useAuth() {
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
          fetch("/.auth/me")
            .then(res => res.json())
            .then(data => {
              const principal = data?.clientPrincipal;
              if (principal) {
                setUser(principal);
              }
              setLoading(false);
            })
            .catch(() => {
              // Optional: fail-safe to still load the app
              setLoading(false);
            });
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [isLocalhost]);

  return { user, loading, error };
}
