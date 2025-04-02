// PhpFteGpCalculator.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";

const PhpFteGpCalculator = () => {
  // State for form inputs and calculated values
  const [phpRate, setPhpRate] = useState(0.028);
  const [dailyRate, setDailyRate] = useState(210);
  const [targetMarginPercent, setTargetMarginPercent] = useState(50);
  const [dailyClientRate, setDailyClientRate] = useState(286.28);
  const [phpMonthlySalary, setPhpMonthlySalary] = useState(142857.14);
  
  // API status tracking
  const [apiStatus, setApiStatus] = useState(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  
  // State for input mode
  const [rateInputMode, setRateInputMode] = useState('dailyRate'); // 'dailyRate' or 'phpSalary'
  
  // State for configuration settings
  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState('N');
  const [workcover, setWorkcover] = useState('N');
  const [leaveMovements, setLeaveMovements] = useState('N');
  const [lslMovements, setLslMovements] = useState('N');
  const [workingDays, setWorkingDays] = useState(220);
  const [phpFteWorkingDays, setPhpFteWorkingDays] = useState(240);
  const [extraExpenses, setExtraExpenses] = useState('N');
  const [additionalExpenses, setAdditionalExpenses] = useState(0);
  const [thirteenthMonthPay, setThirteenthMonthPay] = useState('Y');
  const [hmo, setHmo] = useState(150);
  
  // State for calculation mode
  const [calculationMode, setCalculationMode] = useState('dailyRate'); // Options: dailyRate, clientRate, targetMargin
  
  // State for calculated values
  const [annualIncome, setAnnualIncome] = useState(0);
  const [payrollTax, setPayrollTax] = useState(0);
  const [workCoverAmount, setWorkCoverAmount] = useState(0);
  const [leaveMovementsAmount, setLeaveMovementsAmount] = useState(0);
  const [lslMovementsAmount, setLslMovementsAmount] = useState(0);
  const [totalExtraCostPercent, setTotalExtraCostPercent] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [dailyCost, setDailyCost] = useState(0);
  const [targetMarginAmount, setTargetMarginAmount] = useState(0);
  const [annualProfit, setAnnualProfit] = useState(0);
  const [annualRevenue, setAnnualRevenue] = useState(0);
  const [thirteenthMonthPayAmount, setThirteenthMonthPayAmount] = useState(0);

  // Constants for calculations
  const PAYROLL_TAX_RATE = 0.0485;
  const WORKCOVER_RATE = 0.0055;
  const LEAVE_MOVEMENTS_RATE = 0.0050;
  const LSL_MOVEMENTS_RATE = 0.0005;
  const HOURS_PER_MONTH = 160;
  const DAYS_PER_MONTH = 20;

  // Fetch exchange rate from API when component mounts
  useEffect(() => {
    const fetchExchangeRate = async () => {
      setIsApiLoading(true);
      try {
        const response = await fetch('https://api.frankfurter.app/latest?from=AUD&to=PHP');
        setApiStatus(response.status);
        
        if (response.ok) {
          const data = await response.json();
          // Calculate PHP/AUD rate as 1 / (rate from API)
          const newRate = 1 / data.rates.PHP;
          setPhpRate(parseFloat(newRate.toFixed(5)));
        } else {
          // If API call fails, use the default rate
          console.error('API returned error status:', response.status);
          // Keep the default rate (0.02800)
        }
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        setApiStatus(500);
        // Keep the default rate (0.02800)
      } finally {
        setIsApiLoading(false);
      }
    };

    fetchExchangeRate();
  }, []);

  // Effect to handle conversion between daily rate and PHP monthly salary
  useEffect(() => {
    if (rateInputMode === 'dailyRate' && phpRate > 0) {
      const calculatedPhpMonthlySalary = (dailyRate * DAYS_PER_MONTH) / phpRate;
      setPhpMonthlySalary(calculatedPhpMonthlySalary);
    } else if (rateInputMode === 'phpSalary' && phpRate > 0) {
      const calculatedDailyRate = (phpMonthlySalary * phpRate) / DAYS_PER_MONTH;
      setDailyRate(calculatedDailyRate);
    }
  }, [dailyRate, phpMonthlySalary, phpRate, rateInputMode]);

  // Effect to handle PHP rate changes
  useEffect(() => {
    if (phpRate > 0) {
      if (rateInputMode === 'dailyRate') {
        const calculatedPhpMonthlySalary = (dailyRate * DAYS_PER_MONTH) / phpRate;
        setPhpMonthlySalary(calculatedPhpMonthlySalary);
      } else {
        const calculatedDailyRate = (phpMonthlySalary * phpRate) / DAYS_PER_MONTH;
        setDailyRate(calculatedDailyRate);
      }
    }
  }, [phpRate]);

  // Perform calculations whenever inputs change
  useEffect(() => {
    calculateValues();
  }, [
    phpRate, 
    dailyRate, 
    targetMarginPercent, 
    dailyClientRate, 
    payrollTaxApplicable, 
    workcover, 
    leaveMovements, 
    lslMovements, 
    workingDays, 
    extraExpenses,
    additionalExpenses,
    thirteenthMonthPay,
    hmo,
    calculationMode
  ]);

  // Function to handle the main calculations
  const calculateValues = () => {
    // Calculate annual income
    const annualIncomeValue = dailyRate * phpFteWorkingDays;
    setAnnualIncome(annualIncomeValue);

    // Calculate payroll tax if applicable
    const payrollTaxValue = payrollTaxApplicable === 'Y' ? annualIncomeValue * PAYROLL_TAX_RATE : 0;
    setPayrollTax(payrollTaxValue);

    // Calculate workcover if applicable
    const workCoverValue = workcover === 'Y' ? annualIncomeValue * WORKCOVER_RATE : 0;
    setWorkCoverAmount(workCoverValue);

    // Calculate leave movements if applicable
    const leaveMovementsValue = leaveMovements === 'Y' ? annualIncomeValue * LEAVE_MOVEMENTS_RATE : 0;
    setLeaveMovementsAmount(leaveMovementsValue);

    // Calculate LSL movements if applicable
    const lslMovementsValue = lslMovements === 'Y' ? annualIncomeValue * LSL_MOVEMENTS_RATE : 0;
    setLslMovementsAmount(lslMovementsValue);

    // Calculate total extra cost percentage
    const totalExtraPercent = 
      (payrollTaxApplicable === 'Y' ? PAYROLL_TAX_RATE : 0) +
      (workcover === 'Y' ? WORKCOVER_RATE : 0) +
      (leaveMovements === 'Y' ? LEAVE_MOVEMENTS_RATE : 0) +
      (lslMovements === 'Y' ? LSL_MOVEMENTS_RATE : 0);
    setTotalExtraCostPercent(totalExtraPercent);

    // Calculate extra cost
    const extraCostValue = annualIncomeValue * totalExtraPercent;
    setExtraCost(extraCostValue);

    // Calculate 13th month pay if applicable
    const thirteenthMonthValue = thirteenthMonthPay === 'Y' ? annualIncomeValue / 12 : 0;
    setThirteenthMonthPayAmount(thirteenthMonthValue);

    // Calculate total cost
    const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
    const totalCostValue = annualIncomeValue + extraCostValue + extraExpensesAmount + thirteenthMonthValue + hmo;
    setTotalCost(totalCostValue);

    // Calculate daily cost
    const dailyCostValue = totalCostValue / workingDays;
    setDailyCost(dailyCostValue);

    // Perform specific calculations based on the mode
    if (calculationMode === 'dailyRate') {
      const marginMultiplier = 1 / (1 - targetMarginPercent / 100);
      const calculatedDailyClientRate = dailyCostValue * marginMultiplier;
      setDailyClientRate(calculatedDailyClientRate);
      
      const targetMarginAmountValue = calculatedDailyClientRate - dailyCostValue;
      setTargetMarginAmount(targetMarginAmountValue);
      
      const annualProfitValue = targetMarginAmountValue * workingDays;
      setAnnualProfit(annualProfitValue);
      
      const annualRevenueValue = calculatedDailyClientRate * workingDays;
      setAnnualRevenue(annualRevenueValue);
      
    } else if (calculationMode === 'clientRate') {
      const impliedDailyCost = dailyClientRate * (1 - targetMarginPercent / 100);
      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
      
      const calculatedAnnualIncome = (impliedTotalCost - extraExpensesAmount - thirteenthMonthValue - hmo) / (1 + totalExtraPercent);
      const calculatedDailyRate = calculatedAnnualIncome / workingDays;
      
      if (Math.abs(calculatedDailyRate - dailyRate) > 1) {
        setDailyRate(calculatedDailyRate);
        
        if (rateInputMode === 'phpSalary' && phpRate > 0) {
          const calculatedPhpMonthlySalary = (calculatedDailyRate * DAYS_PER_MONTH) / phpRate;
          setPhpMonthlySalary(calculatedPhpMonthlySalary);
        }
      }
      
      const targetMarginAmountValue = dailyClientRate - impliedDailyCost;
      setTargetMarginAmount(targetMarginAmountValue);
      
      const annualProfitValue = targetMarginAmountValue * workingDays;
      setAnnualProfit(annualProfitValue);
      
      const annualRevenueValue = dailyClientRate * workingDays;
      setAnnualRevenue(annualRevenueValue);
      
    } else if (calculationMode === 'targetMargin') {
      const calculatedTargetMarginPercent = ((dailyClientRate - dailyCostValue) / dailyClientRate) * 100;
      
      if (Math.abs(calculatedTargetMarginPercent - targetMarginPercent) > 0.01) {
        setTargetMarginPercent(calculatedTargetMarginPercent);
      }
      
      const targetMarginAmountValue = dailyClientRate - dailyCostValue;
      setTargetMarginAmount(targetMarginAmountValue);
      
      const annualProfitValue = targetMarginAmountValue * workingDays;
      setAnnualProfit(annualProfitValue);
      
      const annualRevenueValue = dailyClientRate * workingDays;
      setAnnualRevenue(annualRevenueValue);
    }
  };

  // Toggle between daily rate and PHP salary as input
  const toggleRateInputMode = () => {
    setRateInputMode(prevMode => prevMode === 'dailyRate' ? 'phpSalary' : 'dailyRate');
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    setCalculationMode(mode);
  };
  
  // Handle PHP rate change
  const handlePhpRateChange = (value) => {
    const rate = parseFloat(value);
    if (rate > 0) {
      setPhpRate(rate);
    } else {
      setPhpRate(0.02800); // Default fallback
    }
  };

  // Get API status indicator to display alongside the exchange rate
  const getApiStatusIndicator = () => {
    if (isApiLoading) return '(Loading...)';
    if (apiStatus === null) return '';
    return `(API Status: ${apiStatus})`;
  };

  // Format currency with AUD$ prefix and 2 decimal points
  const formatCurrency = (value) => {
    return `AUD$ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format PHP currency with ₱ prefix and 2 decimal points
  const formatPhpCurrency = (value) => {
    return `₱${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format percentage with 2 decimal points
  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Format input as currency with thousand separator
  const formatCurrencyInput = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle currency input changes
  const handleCurrencyInputChange = (value, setter) => {
    // Remove all non-digit characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Parse to float or default to 0
    setter(numericValue === '' ? 0 : parseFloat(numericValue));
  };

  return (
    <div className="container php-theme" style={{ maxWidth: "800px", margin: "0 auto", padding: "12px" }}>
      <div className="nav-buttons" style={{ marginBottom: "8px" }}>
        <Link to="/" className="back-button">&#8592; Back to All Calculators</Link>
      </div>
      
      <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>PHP FTE GP Calculator</h1>
      
      <div className="calculator-card php-theme" style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Calculation Mode</h2>
        <div className="input-group" style={{ display: 'flex', gap: '5px', marginBottom: "12px" }}>
          <button 
            onClick={() => handleModeChange('dailyRate')}
            className={calculationMode === 'dailyRate' ? 'active' : ''}
            style={{ 
              flex: 1, 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            Calculate Client Rate
          </button>
          <button 
            onClick={() => handleModeChange('clientRate')}
            className={calculationMode === 'clientRate' ? 'active' : ''}
            style={{ 
              flex: 1, 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            Calculate Contractor Rate
          </button>
          <button 
            onClick={() => handleModeChange('targetMargin')}
            className={calculationMode === 'targetMargin' ? 'active' : ''}
            style={{ 
              flex: 1, 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            Calculate Target Margin
          </button>
        </div>
        
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: "1 1 50%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Configuration</h2>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Is Payroll Tax applicable?</label>
                <select 
                  value={payrollTaxApplicable} 
                  disabled={true}
                  onChange={(e) => setPayrollTaxApplicable(e.target.value)}
                  style={{ padding: "6px", fontSize: "0.85rem", width: "100%", border: "1px solid #d1d5db", borderRadius: "4px" }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
              
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Workcover</label>
                <select 
                  value={workcover} 
                  disabled={true}
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280"
                  }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Leave Movements</label>
                <select 
                  value={leaveMovements} 
                  disabled={true}
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280"
                  }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
              
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>LSL Movements</label>
                <select 
                  value={lslMovements}
                  disabled={true}
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280"
                  }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Working Days</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={workingDays}
                  disabled={true}
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280"
                  }}
                />
              </div>
              
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Extra Expenses</label>
                <select 
                  value={extraExpenses} 
                  onChange={(e) => setExtraExpenses(e.target.value)}
                  style={{ padding: "6px", fontSize: "0.85rem", width: "100%", border: "1px solid #d1d5db", borderRadius: "4px" }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                  PHP/AUD <span style={{ 
                    color: apiStatus === 200 ? "#22c55e" : (apiStatus ? "#ef4444" : "#6b7280")
                  }}>{getApiStatusIndicator()}</span>
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={phpRate.toFixed(5)}
                  onChange={(e) => handlePhpRateChange(e.target.value)}
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "white",
                    color: "black"
                  }}
                />
                {isApiLoading && (
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>
                    Fetching latest exchange rate...
                  </div>
                )}
              </div>
              
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>13th Month Pay</label>
                <select 
                  value={thirteenthMonthPay} 
                  disabled={true}
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280"
                  }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            {extraExpenses === 'Y' && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Extra Expenses Amount ($)</label>
                <input
                  type="number"
                  value={additionalExpenses}
                  onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
                  style={{ padding: "6px", fontSize: "0.85rem", width: "100%", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>
            )}

            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>HMO ($)</label>
              <input
                type="number"
                value={hmo}
                disabled={true}
                onChange={(e) => setHmo(parseFloat(e.target.value) || 0)}
                style={{ padding: "6px", fontSize: "0.85rem", width: "100%", border: "1px solid #d1d5db", borderRadius: "4px" }}
              />
            </div>
          </div>
          
          <div style={{ flex: "1 1 50%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Calculation Inputs</h2>
            
            {calculationMode !== 'clientRate' && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "0.85rem" }}>Rate Input Type:</span>
                <button 
                  onClick={toggleRateInputMode}
                  style={{ 
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  Switch to {rateInputMode === 'dailyRate' ? 'PHP Salary' : 'Daily Rate'} input
                </button>
              </div>
            )}

            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                AUD$ Daily Rate
                {calculationMode === 'clientRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
                {rateInputMode === 'phpSalary' && calculationMode !== 'clientRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "8px", top: "6px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
                <input
                  type="text"
                  value={calculationMode === 'clientRate' || rateInputMode === 'phpSalary' ? 
                    Math.round(dailyRate) : 
                    dailyRate === 0 ? '' : Math.round(dailyRate)}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyRate)}
                  style={{ 
                    width: "25%", 
                    paddingLeft: "45px", 
                    paddingTop: "6px", 
                    paddingBottom: "6px", 
                    paddingRight: "6px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    fontSize: "0.85rem"
                  }}
                  disabled={calculationMode === 'clientRate' || rateInputMode === 'phpSalary'}
                />
              </div>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                PHP Monthly Salary (FTE)
                {rateInputMode === 'dailyRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
                {calculationMode === 'clientRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "8px", top: "6px", color: "#6b7280", fontSize: "0.85rem" }}>₱</div>
                <input
                  type="text"
                  value={rateInputMode === 'dailyRate' || calculationMode === 'clientRate' ? 
                    Math.round(phpMonthlySalary) : 
                    phpMonthlySalary === 0 ? '' : Math.round(phpMonthlySalary)}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setPhpMonthlySalary)}
                  style={{ 
                    width: "25%", 
                    paddingLeft: "25px", 
                    paddingTop: "6px", 
                    paddingBottom: "6px", 
                    paddingRight: "6px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    fontSize: "0.85rem"
                  }}
                  disabled={rateInputMode === 'dailyRate' || calculationMode === 'clientRate'}
                />
              </div>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Target Margin %
                {calculationMode === 'targetMargin' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={calculationMode === 'targetMargin' ? 
                    Math.round(targetMarginPercent) : 
                    targetMarginPercent === 0 ? '' : Math.round(targetMarginPercent)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    setTargetMarginPercent(value === '' ? 0 : parseFloat(value));
                  }}
                  style={{ 
                    width: "20%", 
                    padding: "6px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    fontSize: "0.85rem"
                  }}
                  disabled={calculationMode === 'targetMargin'}
                />
              </div>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                AUD$ Daily Client Rate
                {calculationMode === 'dailyRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "8px", top: "6px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
                <input
                  type="text"
                  value={calculationMode === 'dailyRate' ? 
                    Math.round(dailyClientRate) : 
                    dailyClientRate === 0 ? '' : Math.round(dailyClientRate)}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyClientRate)}
                  style={{ 
                    width: "20%", 
                    paddingLeft: "45px", 
                    paddingTop: "6px", 
                    paddingBottom: "6px", 
                    paddingRight: "6px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    fontSize: "0.85rem"
                  }}
                  disabled={calculationMode === 'dailyRate'}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="highlight-box php-theme" style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px", backgroundColor: "#f9fafb" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Results</h2>
        <div className="result-summary">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>PHP Monthly Salary (FTE)</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatPhpCurrency(phpMonthlySalary)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Daily Rate</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyRate)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Annual Income</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(annualIncome)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Payroll Tax ({formatPercent(PAYROLL_TAX_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(payrollTax)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Workcover ({formatPercent(WORKCOVER_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(workCoverAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Leave Movements ({formatPercent(LEAVE_MOVEMENTS_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(leaveMovementsAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>LSL Movements ({formatPercent(LSL_MOVEMENTS_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(lslMovementsAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Total Extra Cost %</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatPercent(totalExtraCostPercent * 100)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Extra Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(extraCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Extra Expenses</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(extraExpenses === 'Y' ? additionalExpenses : 0)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>HMO</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(hmo)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>13th Month Pay</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(thirteenthMonthPayAmount)}</td>
              </tr>
              <tr className="result-highlight" style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Total Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(totalCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Daily Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyCost)}</td>
              </tr>
              <tr className="result-highlight" style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin %</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatPercent(targetMarginPercent)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin $</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(targetMarginAmount)}</td>
              </tr>
              <tr className="result-highlight" style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Daily Client Rate</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyClientRate)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Annual Profit</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(annualProfit)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Annual Revenue</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(annualRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="section">
         <p className="version-tag">{APP_VERSION.number} ({APP_VERSION.date})</p>
        </div>
      </div>
    </div>
  );
};

export default PhpFteGpCalculator;