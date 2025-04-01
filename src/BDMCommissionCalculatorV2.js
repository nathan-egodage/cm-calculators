import { Link } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import useAuth from "./useAuth";

const BDMCommissionCalculatorV2 = () => {
  const { user, loaded } = useAuth();
  // State variables for input and results
  const [revenue, setRevenue] = useState(1500000);
  const [gp, setGp] = useState(0.35);
  const [commission, setCommission] = useState(0);
  const [tier, setTier] = useState('');
  const [commissionRate, setCommissionRate] = useState(0);
  const [fixedBonus, setFixedBonus] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState([]);
  const [profitBeforeCommission, setProfitBeforeCommission] = useState(0);
  const [profitAfterCommission, setProfitAfterCommission] = useState(0);
  const [afterCommissionGP, setAfterCommissionGP] = useState(0);
  const [commissionPercentage, setCommissionPercentage] = useState(0);

  useEffect(() => {
    if (
      loaded &&
      user &&
      ["Nathan@cloudmarc.com.au", "nathan@cloudmarc.com.au", "rocket@cloudmarc.com.au","ddallariva@cloudmarc.com.au","dnewland@cloudmarc.com.au"].includes(user.userDetails)
    ) {
      calculateCommission();
    }
  }, [loaded, user, revenue, gp]);

  if (!loaded) return <p>Loading...</p>;

  if (!user || !["Nathan@cloudmarc.com.au", "nathan@cloudmarc.com.au", "rocket@cloudmarc.com.au","ddallariva@cloudmarc.com.au","dnewland@cloudmarc.com.au"].includes(user.userDetails)) {
    return <p>You do not have access to this page.</p>;
  }

  
  // Commission structure data - Updated based on the provided Excel
  const revenueTiers = [
    { tier: 'Tier 0', minRevenue: 0, maxRevenue: 1000000, baseGP: null, baseCommissionRate: 0 },
    { tier: 'Tier 1', minRevenue: 1000000, maxRevenue: 1500000, baseGP: 0.35, baseCommissionRate: 0.045 },
    { tier: 'Tier 2', minRevenue: 1500000, maxRevenue: 4000000, baseGP: 0.33, baseCommissionRate: 0.0325 },
    { tier: 'Tier 3', minRevenue: 4000000, maxRevenue: 6000000, baseGP: 0.30, baseCommissionRate: 0.025 },
    { tier: 'Tier 4', minRevenue: 6000000, maxRevenue: Infinity, baseGP: 0.28, baseCommissionRate: 0.02 }
  ];

  // GP-based commission rates for each tier - Updated based on the provided Excel
  const tier1GPRates = [
    { gp: 0.35, commissionRate: 0.045 }, // 4.5%
    { gp: 0.36, commissionRate: 0.046 }, // 4.6%
    { gp: 0.37, commissionRate: 0.047 }, // 4.7%
    { gp: 0.38, commissionRate: 0.048 }, // 4.8%
    { gp: 0.39, commissionRate: 0.049 }, // 4.9%
    { gp: 0.40, commissionRate: 0.050 }, // 5.0%
    { gp: 0.41, commissionRate: 0.052 }, // 5.2%
    { gp: 0.42, commissionRate: 0.054 }, // 5.4%
    { gp: 0.43, commissionRate: 0.056 }, // 5.6%
    { gp: 0.44, commissionRate: 0.058 }, // 5.8%
    { gp: 0.45, commissionRate: 0.060 }, // 6.0%
    { gp: 0.46, commissionRate: 0.062 }, // 6.2%
    { gp: 0.47, commissionRate: 0.064 }, // 6.4%
    { gp: 0.48, commissionRate: 0.066 }, // 6.6%
    { gp: 0.49, commissionRate: 0.068 }, // 6.8%
    { gp: 0.50, commissionRate: 0.070 }  // 7.0%
  ];

  const tier2GPRates = [
    { gp: 0.33, commissionRate: 0.0325 }, // 3.25%
    { gp: 0.34, commissionRate: 0.0325 }, // 3.25%
    { gp: 0.35, commissionRate: 0.0350 }, // 3.50%
    { gp: 0.36, commissionRate: 0.0360 }, // 3.60%
    { gp: 0.37, commissionRate: 0.0370 }, // 3.70%
    { gp: 0.38, commissionRate: 0.0380 }, // 3.80%
    { gp: 0.39, commissionRate: 0.0390 }, // 3.90%
    { gp: 0.40, commissionRate: 0.0400 }, // 4.00%
    { gp: 0.41, commissionRate: 0.0420 }, // 4.20%
    { gp: 0.42, commissionRate: 0.0440 }, // 4.40%
    { gp: 0.43, commissionRate: 0.0460 }, // 4.60%
    { gp: 0.44, commissionRate: 0.0480 }, // 4.80%
    { gp: 0.45, commissionRate: 0.0500 }, // 5.00%
    { gp: 0.46, commissionRate: 0.0520 }, // 5.20%
    { gp: 0.47, commissionRate: 0.0540 }, // 5.40%
    { gp: 0.48, commissionRate: 0.0560 }, // 5.60%
    { gp: 0.49, commissionRate: 0.0580 }, // 5.80%
    { gp: 0.50, commissionRate: 0.0600 }  // 6.00%
  ];

  const tier3GPRates = [
    { gp: 0.30, commissionRate: 0.0250 }, // 2.50%
    { gp: 0.31, commissionRate: 0.0250 }, // 2.50%
    { gp: 0.32, commissionRate: 0.0250 }, // 2.50%
    { gp: 0.33, commissionRate: 0.0250 }, // 2.50%
    { gp: 0.34, commissionRate: 0.0250 }, // 2.50%
    { gp: 0.35, commissionRate: 0.0275 }, // 2.75%
    { gp: 0.36, commissionRate: 0.0285 }, // 2.85%
    { gp: 0.37, commissionRate: 0.0295 }, // 2.95% 
    { gp: 0.38, commissionRate: 0.0305 }, // 3.05%
    { gp: 0.39, commissionRate: 0.0315 }, // 3.15%
    { gp: 0.40, commissionRate: 0.0325 }, // 3.25%
    { gp: 0.41, commissionRate: 0.0345 }, // 3.45%
    { gp: 0.42, commissionRate: 0.0365 }, // 3.65%
    { gp: 0.43, commissionRate: 0.0385 }, // 3.85%
    { gp: 0.44, commissionRate: 0.0405 }, // 4.05%
    { gp: 0.45, commissionRate: 0.0425 }, // 4.25%
    { gp: 0.46, commissionRate: 0.0445 }, // 4.45%
    { gp: 0.47, commissionRate: 0.0465 }, // 4.65%
    { gp: 0.48, commissionRate: 0.0485 }, // 4.85%
    { gp: 0.49, commissionRate: 0.0505 }, // 5.05%
    { gp: 0.50, commissionRate: 0.0525 }  // 5.25%
  ];

  const tier4GPRates = [
    { gp: 0.28, commissionRate: 0.0200 }, // 2.00%
    { gp: 0.29, commissionRate: 0.0200 }, // 2.00%
    { gp: 0.30, commissionRate: 0.0200 }, // 2.00%
    { gp: 0.31, commissionRate: 0.0200 }, // 2.00%
    { gp: 0.32, commissionRate: 0.0200 }, // 2.00%
    { gp: 0.33, commissionRate: 0.0200 }, // 2.00%
    { gp: 0.34, commissionRate: 0.0200 }, // 2.00%
    { gp: 0.35, commissionRate: 0.0210 }, // 2.10%
    { gp: 0.36, commissionRate: 0.0220 }, // 2.20%
    { gp: 0.37, commissionRate: 0.0230 }, // 2.30%
    { gp: 0.38, commissionRate: 0.0240 }, // 2.40%
    { gp: 0.39, commissionRate: 0.0250 }, // 2.50%
    { gp: 0.40, commissionRate: 0.0260 }, // 2.60%
    { gp: 0.41, commissionRate: 0.0280 }, // 2.80%
    { gp: 0.42, commissionRate: 0.0300 }, // 3.00%
    { gp: 0.43, commissionRate: 0.0320 }, // 3.20%
    { gp: 0.44, commissionRate: 0.0340 }, // 3.40%
    { gp: 0.45, commissionRate: 0.0360 }, // 3.60%
    { gp: 0.46, commissionRate: 0.0380 }, // 3.80%
    { gp: 0.47, commissionRate: 0.0400 }, // 4.00%
    { gp: 0.48, commissionRate: 0.0420 }, // 4.20%
    { gp: 0.49, commissionRate: 0.0440 }, // 4.40%
    { gp: 0.50, commissionRate: 0.0460 }  // 4.60%
  ];

  // Updated fixed bonus rates for the formula calculations
  const fixedBonusRates = [
    { tierMin: 1, gpMin: 0.33, gpMax: 0.34, rate: 0.007 }, // Tier 1, 33%-34%, 0.7%
    { tierMin: 1, gpMin: 0.34, gpMax: 0.35, rate: 0.009 }, // Tier 1, 34%-35%, 0.9%
    { tierMin: 2, gpMin: 0.31, gpMax: 0.32, rate: 0.0015 }, // Tier 2, 31%-32%, 1.5%
    { tierMin: 2, gpMin: 0.32, gpMax: 0.33, rate: 0.0025 }, // Tier 2, 32%-33%, 2.5%
    { tierMin: 3, gpMin: 0.28, gpMax: 0.29, rate: 0.0025 }, // Tier 3, 28%-29%, 2.5%
    { tierMin: 3, gpMin: 0.29, gpMax: 0.30, rate: 0.0035 }, // Tier 3, 29%-30%, 3.5%
    { tierMin: 4, gpMin: 0.26, gpMax: 0.27, rate: 0.002 }, // Tier 4, 26%-27%, 0.2%
    { tierMin: 4, gpMin: 0.27, gpMax: 0.28, rate: 0.003 }  // Tier 4, 27%-28%, 0.3%
  ];

  // Function to get commission rate based on revenue and GP
  const getCommissionRate = (revenue, gp) => {
    // Find the applicable tier
    let applicableTier = null;
    let tierIndex = 0;
    
    for (let i = 0; i < revenueTiers.length; i++) {
      if (revenue > revenueTiers[i].minRevenue && revenue <= revenueTiers[i].maxRevenue) {
        applicableTier = revenueTiers[i];
        tierIndex = i;
        break;
      }
    }
    
    if (!applicableTier) {
      // If not found in specific range, use the last tier (for revenue > highest tier)
      applicableTier = revenueTiers[revenueTiers.length - 1];
      tierIndex = revenueTiers.length - 1;
    }
    
    // Get the GP rates for the applicable tier
    let gpRates = [];
    switch (tierIndex) {
      case 1: gpRates = tier1GPRates; break;
      case 2: gpRates = tier2GPRates; break;
      case 3: gpRates = tier3GPRates; break;
      case 4: gpRates = tier4GPRates; break;
      default: gpRates = [];
    }
    
    // Check if GP meets the minimum threshold for this tier
    let rate = 0; // Default to zero if GP threshold not met
    const minGpForTier = applicableTier.baseGP;
    
    // Only apply commission if GP meets the minimum threshold for the tier
    if (minGpForTier === null || gp >= minGpForTier) {
      // Find the applicable rate based on GP
      rate = applicableTier.baseCommissionRate || 0;
      
      for (let i = 0; i < gpRates.length; i++) {
        if (Math.abs(gp - gpRates[i].gp) < 0.005) { // Match with small tolerance
          rate = gpRates[i].commissionRate;
          break;
        }
      }
    }
    
    return { 
      tier: applicableTier.tier, 
      tierIndex, 
      rate, 
      meetsGpThreshold: minGpForTier === null || gp >= minGpForTier 
    };
  };

  // Function to get fixed bonus if applicable
  const getFixedBonus = (tierIndex, gp, revenue) => {
    let bonus = 0;
    let details = '';
    
    // Check if any fixed bonus applies
    for (let i = 0; i < fixedBonusRates.length; i++) {
      const bonusInfo = fixedBonusRates[i];
      
      // Check with exact tier match and GP range check
      if (tierIndex === bonusInfo.tierMin && 
          gp >= bonusInfo.gpMin && 
          gp < bonusInfo.gpMax) {
        
        // Calculate bonus based on the formula: (Revenue - $1,000,000) * Rate
        bonus = (revenue - 1000000) * bonusInfo.rate;
        details = `Fixed bonus calculated: (Revenue - $1,000,000) × ${(bonusInfo.rate * 100).toFixed(1)}% = $${bonus.toLocaleString(undefined, {maximumFractionDigits: 2})} for GP ${(bonusInfo.gpMin * 100).toFixed(0)}%-${((bonusInfo.gpMax) * 100).toFixed(0)}%`;
        break;
      }
    }
    
    return { bonus, details };
  };

  const calculateCommission = () => {
    const details = [];
    
    // Get the applicable tier and commission rate
    const { tier: applicableTier, tierIndex, rate, meetsGpThreshold } = getCommissionRate(revenue, gp);
    
    // Determine the commission based on revenue
    let commissionableRevenue = 0;
    let baseCommission = 0;
    
    if (tierIndex === 0) {
      commissionableRevenue = 0;
      details.push(`Tier 0: No commission for revenue up to $1,000,000`);
    } else {
      commissionableRevenue = revenue - 1000000;
      details.push(`Tier ${tierIndex}: Commission calculated on revenue above $1,000,000, which is $${commissionableRevenue.toLocaleString()}`);
      
      // Check if GP meets the minimum threshold for regular commission
      if (!meetsGpThreshold) {
        const minGpRequired = revenueTiers[tierIndex].baseGP;
        details.push(`GP of ${(gp * 100).toFixed(0)}% does not meet the minimum threshold of ${(minGpRequired * 100).toFixed(0)}% required for percentage-based commission`);
        details.push(`Commission rate: 0.00%`);
        baseCommission = 0;
      } else {
        details.push(`Commission rate for ${(gp * 100).toFixed(0)}% GP: ${(rate * 100).toFixed(2)}%`);
        baseCommission = commissionableRevenue * rate;
        details.push(`Base commission: $${commissionableRevenue.toLocaleString()} × ${(rate * 100).toFixed(2)}% = $${baseCommission.toLocaleString(undefined, {maximumFractionDigits: 2})}`);
      }
    }
    
    // Check for fixed bonuses - this applies even if GP doesn't meet the threshold for regular commission
    const { bonus, details: bonusDetails } = getFixedBonus(tierIndex, gp, revenue);
    
    if (bonus > 0) {
      details.push(bonusDetails);
    }
    
    // Calculate total commission
    const totalCommission = baseCommission + bonus;
    
    // Calculate company profit before and after commission
    const grossProfit = revenue * gp;
    const profitBeforeCommission = grossProfit;
    const profitAfterCommission = grossProfit - totalCommission;
    
    // Calculate commission as percentage of revenue
    const commissionPercentage = (totalCommission / revenue) * 100;
    
    // Calculate after-commission GP as percentage of revenue
    const afterCommissionGP = ((grossProfit - totalCommission) / revenue) * 100;
    
    details.push(`Gross Profit (${(gp * 100).toFixed(1)}% of $${revenue.toLocaleString()}): $${grossProfit.toLocaleString(undefined, {maximumFractionDigits: 2})}`);
    details.push(`Profit Before Commission: $${profitBeforeCommission.toLocaleString(undefined, {maximumFractionDigits: 2})}`);
    details.push(`Profit After Commission: $${profitAfterCommission.toLocaleString(undefined, {maximumFractionDigits: 2})}`);
    details.push(`Commission as Percentage of Revenue: ${commissionPercentage.toFixed(2)}%`);
    details.push(`After-Commission GP Percentage: ${afterCommissionGP.toFixed(2)}%`);
    
    // Update state
    setTier(applicableTier);
    setCommissionRate(meetsGpThreshold ? rate : 0);
    setFixedBonus(bonus);
    setCommission(totalCommission);
    setProfitBeforeCommission(profitBeforeCommission);
    setProfitAfterCommission(profitAfterCommission);
    setAfterCommissionGP(afterCommissionGP);
    setCommissionPercentage(commissionPercentage);
    setCalculationDetails(details);
  };

  return (
    <div className="container bdm-theme">
      <div className="nav-buttons">
        <Link to="/" className="back-button">&#8592; Back to All Calculators</Link>
      </div>
      
      <h1>BDM Commission Calculator</h1>
  
      <div className="section">
        {/* Input Section */}
        <div className="input-group">
          <label className="input-label">
            Revenue ($):
          </label>
          <input
            type="number"
            min="0"
            step="100000"
            value={revenue}
            onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">
            Gross Profit Margin (%):
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={gp * 100}
            onChange={(e) => setGp((parseFloat(e.target.value) || 0) / 100)}
          />
        </div>
        
        <button onClick={calculateCommission}>
          Calculate Commission
        </button>
      </div>
      
      {/* Results Section */}
      <div className="section">
        <h2>Commission Results</h2>
        
        <div className="result-summary">
          <table className="result-table">
            <tbody>
              <tr>
                <td>Revenue Tier:</td>
                <td>{tier}</td>
              </tr>
              <tr>
                <td>Commission Rate:</td>
                <td>{(commissionRate * 100).toFixed(2)}%</td>
              </tr>
              <tr>
                <td>Fixed Bonus:</td>
                <td>${fixedBonus.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>Profit Before Commission:</td>
                <td>${profitBeforeCommission.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>Profit After Commission:</td>
                <td>${profitAfterCommission.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>After-Commission GP%:</td>
                <td>{afterCommissionGP.toFixed(2)}%</td>
              </tr>
              <tr>
                <td>Commission % of Revenue:</td>
                <td>{commissionPercentage.toFixed(2)}%</td>
              </tr>
              <tr className="result-highlight">
                <td>Total Commission:</td>
                <td>${commission.toLocaleString(undefined, {maximumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
          
          <button 
            className="toggle-button"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Show Calculation Details"}
          </button>
          
          {showDetails && (
            <div className="details-box">
              {calculationDetails.map((detail, index) => (
                <p key={index}>{detail}</p>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Commission Structure Reference */}
      <div className="section">
        <details>
          <summary className="toggle-button">Commission Structure Reference</summary>
          <div className="details-box">
            <h3>Revenue Tiers</h3>
            <table className="result-table">
              <thead>
                <tr>
                  <td>Tier</td>
                  <td>Revenue Range</td>
                  <td>Minimum GP Required</td>
                  <td>Base Commission Rate</td>
                </tr>
              </thead>
              <tbody>
                {revenueTiers.map((tier) => (
                  <tr key={tier.tier}>
                    <td>{tier.tier}</td>
                    <td>
                      {tier.minRevenue === 0 
                        ? `Up to $${tier.maxRevenue.toLocaleString()}`
                        : tier.maxRevenue === Infinity
                          ? `Over $${tier.minRevenue.toLocaleString()}`
                          : `$${tier.minRevenue.toLocaleString()} - $${tier.maxRevenue.toLocaleString()}`
                      }
                    </td>
                    <td>{tier.baseGP !== null ? `${(tier.baseGP * 100).toFixed(0)}%` : '-'}</td>
                    <td>{(tier.baseCommissionRate * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <h3>Fixed Bonuses for Lower GP Percentages</h3>
            <table className="result-table">
              <thead>
                <tr>
                  <td>Tier</td>
                  <td>GP Range</td>
                  <td>Fixed Bonus</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tier 1</td>
                  <td>33% - 34%</td>
                  <td>(Revenue - $1,000,000) × 0.7%</td>
                </tr>
                <tr>
                  <td>Tier 1</td>
                  <td>34% - 35%</td>
                  <td>(Revenue - $1,000,000) × 0.9%</td>
                </tr>
                <tr>
                  <td>Tier 2</td>
                  <td>31% - 32%</td>
                  <td>(Revenue - $1,000,000) × 0.15%</td>
                </tr>
                <tr>
                  <td>Tier 2</td>
                  <td>32% - 33%</td>
                  <td>(Revenue - $1,000,000) × 0.25%</td>
                </tr>
                <tr>
                  <td>Tier 3</td>
                  <td>28% - 29%</td>
                  <td>(Revenue - $1,000,000) × 0.25%</td>
                </tr>
                <tr>
                  <td>Tier 3</td>
                  <td>29% - 30%</td>
                  <td>(Revenue - $1,000,000) × 0.35%</td>
                </tr>
                <tr>
                  <td>Tier 4</td>
                  <td>26% - 27%</td>
                  <td>(Revenue - $1,000,000) × 0.2%</td>
                </tr>
                <tr>
                  <td>Tier 4</td>
                  <td>27% - 28%</td>
                  <td>(Revenue - $1,000,000) × 0.3%</td>
                </tr>
              </tbody>
            </table>
            
            <p style={{color: '#DC2626', fontWeight: 'bold', marginTop: '15px'}}>Important Notes:</p>
            <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
              <li>Percentage-based commission is only awarded if the GP percentage meets or exceeds the minimum GP threshold for the tier.</li>
              <li>Fixed bonuses apply even if the GP is below the minimum threshold for percentage-based commission.</li>
              <li>For revenue tiers with overlapping GP bonus ranges, the higher bonus amount applies.</li>
            </ul>
          </div>
        </details>
         <p className="version-tag">V2.0.0 (01-Apr-2025)</p>
      </div>
    </div>
  );
};

export default BDMCommissionCalculatorV2;