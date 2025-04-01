import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "./useAuth";

const Home = () => {
  // Get the authenticated user
  const { user, loaded } = useAuth();
  
  // State to track active category filter
  const [activeCategory, setActiveCategory] = useState("all");

  // Check if user is authorized to see BDM calculator
  const isBdmAuthorized = loaded && user && 
    ["Nathan@cloudmarc.com.au", "nathan@cloudmarc.com.au", "rocket@cloudmarc.com.au", 
     "ddallariva@cloudmarc.com.au", "dnewland@cloudmarc.com.au"].includes(user.userDetails);

  // Base calculator data with added category and icon properties
  const baseCalculators = [
    {
      id: "all-cals",
      title: "All GP Calculators",
      description: "Combined view with all GP calculators (AU,PH,LK,IN,VN,NZ)",
      path: "/all-cals",
      category: "combined",
      theme: "all-cals-theme",
      icon: "📊"
    },
      {
      id: "aus-working-days-cal",
      title: "Australian Working Days Calculator",
      description: "Calculate Australian Working Days",
      path: "/aus-working-days-cal",
      category: "australia",
      theme: "india-theme",
      icon: "📅"
    },
    {
      id: "aus-fte-gp",
      title: "AUS FTE GP Calculator",
      description: "Calculate Gross Profit for Australian Full-Time Employees",
      path: "/aus-fte-gp",
      category: "australia",
      theme: "aus-theme",
      icon: "🇦🇺"
    },
    {
      id: "aus-contractor-gp",
      title: "AUS Contractor GP Calculator",
      description: "Calculate Gross Profit for Australian Contractors",
      path: "/aus-contractor-gp",
      category: "australia",
      theme: "aus-theme",
      icon: "🇦🇺"
    },
    {
      id: "php-contractor-gp",
      title: "PHP Contractor GP Calculator",
      description: "Calculate Gross Profit for Philippine Contractors",
      path: "/php-contractor-gp",
      category: "philippines",
      theme: "php-theme",
      icon: "🇵🇭"
    },
    {
      id: "php-fte-gp",
      title: "PHP FTE GP Calculator",
      description: "Calculate Gross Profit for Philippine Full-Time Employees",
      path: "/php-fte-gp",
      category: "philippines",
      theme: "php-theme",
      icon: "🇵🇭"
    },
    {
      id: "generic-contractor-gp",
      title: "Offshore Contractor (Generic)",
      description: "Calculate Gross Profit for Offshore Contractors (LK,VN,IN & NZ)",
      path: "/generic-contractor-gp",
      category: "offshore",
      theme: "all-cals-theme",
      icon: "🌏"
    }
  ];

  // BDM calculator to conditionally add
  const bdmCalculator = {
    id: "bdm-calculator-v2",
    title: "BDM Commission Calculator",
    description: "Calculate BDM Commissions",
    path: "/bdm-calculator-v2",
    category: "commission",
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
    { id: "australia", label: "AU" },
    { id: "philippines", label: "PH" },
    { id: "offshore", label: "Offshore" },
    { id: "combined", label: "Combined" }
  ];

  // Add commission category only if user has access to BDM calculator
  if (isBdmAuthorized) {
    categories.push({ id: "commission", label: "Commission" });
  }

  // Filter calculators based on active category
  const filteredCalculators = activeCategory === "all" 
    ? calculators 
    : calculators.filter(calc => calc.category === activeCategory);

  return (
    <div className="container compact-home">
      <div className="compact-header">
        <h1>CloudMarc Calculators</h1>
        
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
        <span className="compact-version">Owner: Nathan Egodage | V2.0.0 (01-Apr-2025)</span>
      </div>
    </div>
  );
};

export default Home;