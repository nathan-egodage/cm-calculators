import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { APP_VERSION, AUTHORIZED_USERS, isUserAuthorized } from "../config/appConfig";

const Home = () => {
  // Get the authenticated user
  const { user, loading, error } = useAuth();
  
  // State to track active category filter
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Check if loading is still in progress
  if (loading) {
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

  // Base calculator data with added category and icon properties
  const baseCalculators = [
    {
      id: "all-cals",
      title: "All GP Calculators",
      description: "Combined view with all GP calculators (AU,PH,LK,IN,VN,NZ)",
      path: "/all-cals",
      category: ["combined", "australia", "philippines", "offshore"],
      theme: "all-cals-theme",
      icon: "📊"
    },
    {
      id: "cv-converter",
      title: "CV Converter",
      description: "Convert CVs to CloudMarc branded template using AI",
      path: "/cv-converter",
      category: ["tools", "documents"],
      theme: "cloudmarc-theme",
      icon: "📄"
    },
    {
      id: "hello-sign-documents",
      title: "HelloSign Document Status",
      description: "View and manage HelloSign document statuses",
      path: "/hello-sign-documents",
      category: ["tools", "documents"],
      theme: "cloudmarc-theme",
      icon: "📝"
    },
    {
      id: "aus-working-days-cal",
      title: "Australian Working Days Calculator",
      description: "Calculate Australian Working Days",
      path: "/aus-working-days-cal",
      category: ["australia", "tools"],
      theme: "india-theme",
      icon: "📅"
    }
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

  // Combine calculators based on authorization
  const calculators = isBdmAuthorized 
    ? [bdmCalculator,...baseCalculators] 
    : baseCalculators;

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

  // Add commission category only if user has access to BDM calculator
  if (isBdmAuthorized) {
    categories.push({ id: "commission", label: "Commission" });
  }

  // Filter calculators based on active category
  const filteredCalculators = activeCategory === "all" 
    ? calculators 
    : calculators.filter(calc => calc.category.includes(activeCategory));

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