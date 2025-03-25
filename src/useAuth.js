import { useEffect, useState } from "react";

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/.auth/me")
      .then(res => res.json())
      .then(data => {
        const principal = data?.clientPrincipal;
        if (principal) {
          setUser(principal);
        }
        setLoaded(true);
      });
  }, []);

  return { user, loaded };
};

export default useAuth;
