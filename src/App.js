import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BDMCommissionCalculatorV2 from "./BDMCommissionCalculatorV2";
import AusFteGpCalculator from "./AusFteGpCalculator";
import AusContractorGpCalculator from "./AusContractorGpCalculator";
import PhpContractorGpCalculator from "./PhpContractorGpCalculator";
import PhpFteGpCalculator from "./PhpFteGpCalculator";
import ConsolidatedGpCalculator from "./ConsolidatedGpCalculator";
import Home from "./Home";
import "./App.css";

function App() {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const authCheck = async () => {
      // Skip auth in development
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === "localhost") {
        setIsAuthorized(true);
        return;
      }

      try {
        const response = await fetch('/.auth/me');
        const authData = await response.json();
        
        const ALLOWED_USERS = [
          'nathan@cloudmarc.com.au',
          'ddallariva@cloudmarc.com.au',
          'rocket@cloudmarc.com.au'
        ].map(email => email.toLowerCase());

        const userEmail = authData.clientPrincipal?.userDetails?.toLowerCase();
        setIsAuthorized(!!userEmail && ALLOWED_USERS.includes(userEmail));

      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthorized(false);
      }
    };

    authCheck();
  }, []);

  // Show loading state while checking auth
  if (isAuthorized === null) {
    return <div className="auth-loading">Verifying access...</div>;
  }

  // Render routes only after auth check
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          isAuthorized ? <Home /> : <Navigate to="/.auth/login/aad" replace />
        } />
        <Route path="/bdm-calculator-v2" element={
          isAuthorized ? <BDMCommissionCalculatorV2 /> : <Navigate to="/.auth/login/aad" replace />
        } />
        <Route path="/aus-fte-gp" element={
          isAuthorized ? <AusFteGpCalculator /> : <Navigate to="/.auth/login/aad" replace />
        } />
        <Route path="/aus-contractor-gp" element={
          isAuthorized ? <AusContractorGpCalculator /> : <Navigate to="/.auth/login/aad" replace />
        } />
        <Route path="/php-contractor-gp" element={
          isAuthorized ? <PhpContractorGpCalculator /> : <Navigate to="/.auth/login/aad" replace />
        } />
        <Route path="/php-fte-gp" element={
          isAuthorized ? <PhpFteGpCalculator /> : <Navigate to="/.auth/login/aad" replace />
        } />
        <Route path="/all-cals" element={
          isAuthorized ? <ConsolidatedGpCalculator /> : <Navigate to="/.auth/login/aad" replace />
        } />
        <Route path="*" element={
          isAuthorized ? <Navigate to="/" replace /> : <Navigate to="/.auth/login/aad" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;