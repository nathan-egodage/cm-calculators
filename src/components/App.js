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
import NewHireRequest from '../pages/NewHireRequest';
import PendingApprovals from '../pages/PendingApprovals';
import ApproveRequest from '../pages/ApproveRequest';
import NewHireRequestsList from '../pages/NewHireRequestsList';

import Home from '../pages/Home';
import '../styles/App.css';
import '../styles/HelloSignStyles.css';
import '../styles/NewHireRequest.css';
import '../styles/ApproveRequest.css';
import '../styles/PendingApprovals.css';

// Define routes that require Microsoft authentication
const MS_AUTH_REQUIRED_ROUTES = [
  '/new-hire-request',
  '/pending-approvals',
  '/approve-request',
  '/new-hire-requests-list'
];

function App() {
  const [authStatus, setAuthStatus] = useState({
    loading: true,
    isAuthorized: false,
    userEmail: null
  });

  useEffect(() => {
    const verifyAuthentication = async () => {
      // Check if current path requires authentication
      const currentPath = window.location.pathname;
      const requiresAuth = MS_AUTH_REQUIRED_ROUTES.some(route => currentPath.startsWith(route));

      // If path doesn't require auth, or in development mode, bypass authentication
      if (!requiresAuth || 
          process.env.NODE_ENV === 'development' || 
          window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1') {
        console.log('Authentication not required or development mode');
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

  // Helper function to determine if a route needs authentication
  const needsAuth = (path) => {
    return MS_AUTH_REQUIRED_ROUTES.some(route => path.startsWith(route));
  };

  // Render loading state only for routes that need authentication
  if (authStatus.loading && needsAuth(window.location.pathname)) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Verifying your access permissions...</p>
      </div>
    );
  }

  // Helper function to render route element based on auth requirements
  const renderRouteElement = (Component, path) => {
    if (!needsAuth(path)) {
      return <Component />;
    }
    return authStatus.isAuthorized ? 
      <Component /> : 
      <Navigate to="/.auth/login/aad" state={{ from: path }} replace />;
  };

  return (
    <Router>
      <Routes>
        {/* Calculator Routes - No Authentication Required */}
        <Route path="/" element={<Home />} />
        <Route path="/bdm-calculator-v2" element={<BDMCommissionCalculatorV2 />} />
        <Route path="/aus-fte-gp" element={<AusFteGpCalculator />} />
        <Route path="/aus-contractor-gp" element={<AusContractorGpCalculator />} />
        <Route path="/php-contractor-gp" element={<PhpContractorGpCalculator />} />
        <Route path="/php-fte-gp" element={<PhpFteGpCalculator />} />
        <Route path="/all-cals" element={<ConsolidatedGpCalculator />} />
        <Route path="/generic-contractor-gp" element={<GenericOffshoreContractorGpCalculator />} />
        <Route path="/aus-working-days-cal" element={<AusWorkingDaysCalculator />} />
        <Route path="/hello-sign-documents" element={<HelloSignDocuments />} />
        
        {/* Routes that require Microsoft Authentication */}
        <Route path="/new-hire-request" element={renderRouteElement(NewHireRequest, '/new-hire-request')} />
        <Route path="/pending-approvals" element={renderRouteElement(PendingApprovals, '/pending-approvals')} />
        <Route path="/approve-request/:requestId" element={renderRouteElement(ApproveRequest, '/approve-request')} />
        <Route path="/new-hire-requests-list" element={renderRouteElement(NewHireRequestsList, '/new-hire-requests-list')} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;