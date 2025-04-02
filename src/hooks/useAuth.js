import { useEffect, useState } from "react";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const isLocalhost = window.location.hostname === "localhost";

  useEffect(() => {
    if (isLocalhost) {
      // Mocked user for local development
      setUser({
        userDetails: "nathan@cloudmarc.com.au",
        userRoles: ["authenticated"]
      });
      setLoaded(true);
    } else {
      // Production: fetch real identity from Azure Static Web Apps
      fetch("/.auth/me")
        .then(res => res.json())
        .then(data => {
          const principal = data?.clientPrincipal;
          if (principal) {
            setUser(principal);
          }
          setLoaded(true);
        })
        .catch(() => {
          // Optional: fail-safe to still load the app
          setLoaded(true);
        });
    }
  }, [isLocalhost]);

  return { user, loaded };
};

export default useAuth;
