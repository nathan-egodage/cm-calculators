// AusFteGpCalculator.js
import React from "react";
import { Link } from "react-router-dom";

const AusFteGpCalculator = () => {
  return (
    <div className="container">
      <div className="nav-buttons">
        <Link to="/" className="back-button">&#8592; Back to All Calculators</Link>
      </div>
      
      <h1>AUS FTE GP Calculator</h1>
      
      <div className="section">
        <p>This calculator is under development. Check back soon!</p>
        
        {/* You'll add the actual calculator functionality here later */}
      </div>
    </div>
  );
};

export default AusFteGpCalculator;