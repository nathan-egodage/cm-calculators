import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="container">
      <h1>CloudMarc Calculators</h1>
      
      <div className="calculator-menu">                
        <Link to="/aus-fte-gp" className="calculator-link">
          <div className="calculator-card">
            <h2>AUS FTE GP Calculator</h2>
            <p>Calculate Gross Profit for Australian Full-Time Employees</p>
          </div>
        </Link>
        
        <Link to="/aus-contractor-gp" className="calculator-link">
          <div className="calculator-card">
            <h2>AUS Contractor GP Calculator</h2>
            <p>Calculate Gross Profit for Australian Contractors</p>
          </div>
        </Link>
        
        <Link to="/php-contractor-gp" className="calculator-link">
          <div className="calculator-card">
            <h2>PHP Contractor GP Calculator</h2>
            <p>Calculate Gross Profit for Philippine Contractors</p>
          </div>
        </Link>
        
        <Link to="/php-fte-gp" className="calculator-link">
          <div className="calculator-card">
            <h2>PHP FTE GP Calculator</h2>
            <p>Calculate Gross Profit for Philippine Full-Time Employees</p>
          </div>
        </Link>
      </div>
      <p className="version-tag">Owner : Nathan Egodage</p>
      <p className="version-tag">Azure Static Web App | https://github.com/nathan-egodage/cm-calculators.git</p>
      <p className="version-tag">V1.0.0 (26-Mar-2025)</p>
    </div>
  );
};

export default Home;