import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BDMCommissionCalculatorV2 from '../calculators/BDMCommissionCalculatorV2';
import AusFteGpCalculator from '../calculators/AusFteGpCalculator';
import AusContractorGpCalculator from '../calculators/AusContractorGpCalculator';
import PhpContractorGpCalculator from '../calculators/PhpContractorGpCalculator';
import PhpFteGpCalculator from '../calculators/PhpFteGpCalculator';
import ConsolidatedGpCalculator from '../calculators/ConsolidatedGpCalculator';
import GenericOffshoreContractorGpCalculator from '../calculators/GenericOffshoreContractorGpCalculator';
import AusWorkingDaysCalculator from '../calculators/AusWorkingDaysCalculator';
import HelloSignDocuments from '../pages/HelloSignDocuments';
import CVConverter from '../pages/CVConverter';
import Home from '../pages/Home';
import '../styles/App.css';
import '../styles/HelloSignStyles.css';

function App() {
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    isAuthorized: false,
    userEmail: null
  });

  useEffect(() => {
    const verifyAuthentication = async () => {
      // Bypass auth in development
      if (process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1') {
        console.log('Development mode - authentication bypassed');
        setAuthStatus({
          loading: false,
          isAuthorized: true,
          userEmail: 'dev-user@localhost'
        });
        return;
      }

      try {
        const response = await fetch('/.auth/me');
        
        if (!response.ok) {
          throw new Error(`Auth endpoint returned ${response.status}`);
        }

        const authData = await response.json();
        const userEmail = authData.clientPrincipal?.userDetails?.toLowerCase();

        const ALLOWED_USERS = [
          'Nathan@cloudmarc.com.au',
          'nathan@cloudmarc.com.au',
          'ddallariva@cloudmarc.com.au',
          'rocket@cloudmarc.com.au',
          'dnewland@cloudmarc.com.au',
          'dscanlon@cloudmarc.com.au',
          'jgregory@cloudmarc.com.au',
          'sbrownbill@cloudmarc.com.au'
        ].map(email => email.toLowerCase());

        const authorized = userEmail && ALLOWED_USERS.includes(userEmail);
        
        setAuthStatus({
          loading: false,
          isAuthorized: authorized,
          userEmail: userEmail
        });

        if (!authorized) {
          console.warn(`Unauthorized access attempt by: ${userEmail || 'unknown user'}`);
        }

      } catch (error) {
        console.error('Authentication verification failed:', error);
        setAuthStatus({
          loading: false,
          isAuthorized: false,
          userEmail: null
        });
      }
    };

    verifyAuthentication();
  }, []);

  // Render loading state
  if (authStatus.loading) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Verifying your access permissions...</p>
      </div>
    );
  }

  // Render application routes or redirect to login
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          authStatus.isAuthorized ? <Home /> : <Navigate to="/.auth/login/aad" state={{ from: '/' }} replace />
        } />
        
        <Route path="/cv-converter" element={
          authStatus.isAuthorized ? <CVConverter /> : <Navigate to="/.auth/login/aad" state={{ from: '/cv-converter' }} replace />
        } />
        
        <Route path="/bdm-calculator-v2" element={
          authStatus.isAuthorized ? <BDMCommissionCalculatorV2 /> : <Navigate to="/.auth/login/aad" state={{ from: '/bdm-calculator-v2' }} replace />
        } />
        
        <Route path="/aus-fte-gp" element={
          authStatus.isAuthorized ? <AusFteGpCalculator /> : <Navigate to="/.auth/login/aad" state={{ from: '/aus-fte-gp' }} replace />
        } />
        
        <Route path="/aus-contractor-gp" element={
          authStatus.isAuthorized ? <AusContractorGpCalculator /> : <Navigate to="/.auth/login/aad" state={{ from: '/aus-contractor-gp' }} replace />
        } />
        
        <Route path="/php-contractor-gp" element={
          authStatus.isAuthorized ? <PhpContractorGpCalculator /> : <Navigate to="/.auth/login/aad" state={{ from: '/php-contractor-gp' }} replace />
        } />
        
        <Route path="/php-fte-gp" element={
          authStatus.isAuthorized ? <PhpFteGpCalculator /> : <Navigate to="/.auth/login/aad" state={{ from: '/php-fte-gp' }} replace />
        } />
        
        <Route path="/all-cals" element={
          authStatus.isAuthorized ? <ConsolidatedGpCalculator /> : <Navigate to="/.auth/login/aad" state={{ from: '/all-cals' }} replace />
        } />
        
        <Route path="/generic-contractor-gp" element={
          authStatus.isAuthorized ? <GenericOffshoreContractorGpCalculator /> : <Navigate to="/.auth/login/aad" state={{ from: '/generic-contractor-gp' }} replace />
        } />

        <Route path="/aus-working-days-cal" element={
          authStatus.isAuthorized ? <AusWorkingDaysCalculator /> : <Navigate to="/.auth/login/aad" state={{ from: '/aus-working-days-cal' }} replace />
        } />
        
        <Route path="/hello-sign-documents" element={
          authStatus.isAuthorized ? <HelloSignDocuments /> : <Navigate to="/.auth/login/aad" state={{ from: '/hello-sign-documents' }} replace />
        } />

        <Route path="*" element={
          <Navigate to={authStatus.isAuthorized ? '/' : '/.auth/login/aad'} replace />
        } />

      </Routes>
    </Router>
  );
}

export default App;