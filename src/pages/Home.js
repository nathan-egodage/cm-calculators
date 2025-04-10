import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { APP_VERSION, AUTHORIZED_USERS, isUserAuthorized } from "../config/appConfig";

const Home = () => {
  // Get the authenticated user
  const { user, loaded } = useAuth();
  
  // State to track active category filter
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Check if loading is still in progress
  if (!loaded) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-spinner"></div>
        <p>Verifying your access permissions...</p>
      </div>
    );
  }
  
  // Check if user is authorized to access the home page
  const isHomeAuthorized = user && 
    AUTHORIZED_USERS.homeAccess.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
    
  // If user is not authorized, redirect to login page
  if (!isHomeAuthorized) {
    return <Navigate to="/.auth/login/aad" state={{ from: '/' }} replace />;
  }

  // Check if user is authorized to see BDM calculator
  const isBdmAuthorized = user && 
    AUTHORIZED_USERS.bdmCalculator.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
    
  // Check if user is authorized to create or approve new hire requests
  const canCreateHireRequests = user && 
    AUTHORIZED_USERS.newHireRequestCreators.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
    
  const canApproveHireRequests = user && 
    AUTHORIZED_USERS.newHireRequestApprovers.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );

  // Base calculator data with added category and icon properties
  const baseCalculators = [
    // Document Management
    {
      id: "hello-sign-documents",
      title: "HelloSign Document Status",
      description: "View and manage HelloSign document statuses",
      path: "/hello-sign-documents",
      category: ["tools", "documents"],
      theme: "cloudmarc-theme",
      icon: "📝"
    },
        // Utility Tools
    {
          id: "aus-working-days-cal",
          title: "Australian Working Days Calculator",
          description: "Calculate Australian Working Days",
          path: "/aus-working-days-cal",
          category: ["australia", "tools"],
          theme: "india-theme",
          icon: "📅"
    },
    // GP Calculators - Combined View
    {
      id: "all-cals",
      title: "All GP Calculators",
      description: "Combined view with all GP calculators (AU,PH,LK,IN,VN,NZ)",
      path: "/all-cals",
      category: ["combined", "australia", "philippines", "offshore"],
      theme: "all-cals-theme",
      icon: "📊"
    },
    // GP Calculators - Australia
    {
      id: "aus-fte-gp",
      title: "AUS FTE GP Calculator",
      description: "Calculate Gross Profit for Australian Full-Time Employees",
      path: "/aus-fte-gp",
      category: ["australia"],
      theme: "aus-theme",
      icon: "🇦🇺"
    },
    {
      id: "aus-contractor-gp",
      title: "AUS Contractor GP Calculator",
      description: "Calculate Gross Profit for Australian Contractors",
      path: "/aus-contractor-gp",
      category: ["australia"],
      theme: "aus-theme",
      icon: "🇦🇺"
    },
    // GP Calculators - Philippines
    {
      id: "php-fte-gp",
      title: "PHP FTE GP Calculator",
      description: "Calculate Gross Profit for Philippine Full-Time Employees",
      path: "/php-fte-gp",
      category: ["philippines", "offshore"],
      theme: "php-theme",
      icon: "🇵🇭"
    },
    {
      id: "php-contractor-gp",
      title: "PHP Contractor GP Calculator",
      description: "Calculate Gross Profit for Philippine Contractors",
      path: "/php-contractor-gp",
      category: ["philippines", "offshore"],
      theme: "php-theme",
      icon: "🇵🇭"
    },
    // GP Calculators - Offshore
    {
      id: "generic-contractor-gp",
      title: "Offshore Contractor (Generic)",
      description: "Calculate Gross Profit for Offshore Contractors (LK,VN,IN & NZ)",
      path: "/generic-contractor-gp",
      category: ["offshore"],
      theme: "all-cals-theme",
      icon: "🌏"
    },

  ];

  // BDM calculator to conditionally add
  const bdmCalculator = {
    id: "bdm-calculator-v2",
    title: "BDM Commission Calculator",
    description: "Calculate BDM Commissions",
    path: "/bdm-calculator-v2",
    category: ["commission"],
    theme: "bdm-theme",
    icon: "💰"
  };

  // HR tools to conditionally add
  const newHireRequestTools = [
    {
      id: "new-hire-request",
      title: "New Hire Request",
      description: "Create a new hire request for approval",
      path: "/new-hire-request",
      category: ["hr", "tools"],
      theme: "cloudmarc-theme",
      icon: "👤"
    },
    {
      id: "pending-approvals",
      title: "Pending Approvals",
      description: "View and manage pending hire request approvals",
      path: "/pending-approvals",
      category: ["hr", "tools"],
      theme: "cloudmarc-theme",
      icon: "✅"
    },
    {
      id: "new-hire-requests-list",
      title: "New Hire Requests List",
      description: "View all new hire requests",
      path: "/new-hire-requests-list",
      category: ["hr", "tools"],
      theme: "cloudmarc-theme",
      icon: "📋"
    }
  ];
  
  // Combine calculators based on authorization
  let allTools = [...baseCalculators];
  
  if (isBdmAuthorized) {
    allTools = [bdmCalculator, ...allTools];
  }
  
  // Temporarily comment out HR tools for production deployment
  /*
  if (canCreateHireRequests) {
    allTools.push(newHireRequestTools[0]);
    allTools.push(newHireRequestTools[2]);
  }
  
  if (canApproveHireRequests) {
    allTools.push(newHireRequestTools[1]);
  }
  */

  // Category definitions for filtering
  const categories = [
    { id: "all", label: "All" },
    { id: "documents", label: "Documents" },
    { id: "australia", label: "AU" },
    { id: "philippines", label: "PH" },
    { id: "offshore", label: "Offshore" },
    { id: "combined", label: "Combined" },
    { id: "tools", label: "Tools" }
  ];

  // Add HR category if user has access to hire request features
  if (canCreateHireRequests || canApproveHireRequests) {
    categories.push({ id: "hr", label: "HR" });
  }
  
  // Add commission category only if user has access to BDM calculator
  if (isBdmAuthorized) {
    categories.push({ id: "commission", label: "Commission" });
  }

  // Filter calculators based on active category
  const filteredCalculators = activeCategory === "all" 
    ? allTools 
    : allTools.filter(calc => calc.category.includes(activeCategory));

  return (
    <div className="container compact-home">
      <div className="compact-header">
        <h1>CloudMarc Calculators & Tools</h1>
        
        <div className="compact-category-filter">
          {categories.map(category => (
            <button
              key={category.id}
              className={`compact-category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="compact-calculator-menu">
        {filteredCalculators.map(calculator => (
          <Link to={calculator.path} className="compact-calculator-link" key={calculator.id}>
            <div className={`compact-calculator-card ${calculator.theme}`}>
              <div className="compact-calculator-icon">{calculator.icon}</div>
              <div className="compact-calculator-content">
                <h2>{calculator.title}</h2>
                <p>{calculator.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="compact-footer">
        <span className="compact-version">
          Owner: {APP_VERSION.owner} | {APP_VERSION.number} ({APP_VERSION.date})
        </span>
      </div>
    </div>
  );
};

export default Home;