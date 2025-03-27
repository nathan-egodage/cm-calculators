// GenericOffshoreContractorGpCalculator.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const GenericOffshoreContractorGpCalculator = () => {
  // State for country and currency
  const [country, setCountry] = useState("Sri Lanka");
  const [currency, setCurrency] = useState("LKR");
  const [exchangeRate, setExchangeRate] = useState(0.0053);

  // State for form inputs and calculated values
  const [monthlyLocalSalary, setMonthlyLocalSalary] = useState(754717);
  const [dailyRate, setDailyRate] = useState(200.00);
  const [targetMarginPercent, setTargetMarginPercent] = useState(20.00);
  const [dailyClientRate, setDailyClientRate] = useState(265.73);
  
  // State for input mode
  const [rateInputMode, setRateInputMode] = useState('dailyRate'); // 'dailyRate' or 'localSalary'
  
  // State for configuration settings
  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState('N');
  const [workcover, setWorkcover] = useState('N');
  const [leaveMovements, setLeaveMovements] = useState('N');
  const [lslMovements, setLslMovements] = useState('N');
  const [workingDays, setWorkingDays] = useState(220);
  const [extraExpenses, setExtraExpenses] = useState('Y');
  const [additionalExpenses, setAdditionalExpenses] = useState(150);
  
  // State for calculation mode
  const [calculationMode, setCalculationMode] = useState('dailyRate'); // Options: dailyRate, clientRate, targetMargin
  
  // State for calculated values
  const [annualIncome, setAnnualIncome] = useState(44000.00);
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

  // Constants for calculations
  const PAYROLL_TAX_RATE = 0.0485;
  const WORKCOVER_RATE = 0.0055;
  const LEAVE_MOVEMENTS_RATE = 0.0050;
  const LSL_MOVEMENTS_RATE = 0.0005;
  const HOURS_PER_MONTH = 160;
  const DAYS_PER_MONTH = 20;

  // Available countries and their currencies
  const COUNTRIES = {
    "Sri Lanka": "LKR",
    "Vietnam": "VND",
    "India": "INR",
    "New Zealand": "NZD"
  };

  // Exchange rates for each currency to AUD
  const EXCHANGE_RATES = {
    "LKR": 0.0053,
    "VND": 0.000062,
    "INR": 0.019,
    "NZD": 0.91
  };

  // Effect to handle country selection
  useEffect(() => {
    setCurrency(COUNTRIES[country]);
    setExchangeRate(EXCHANGE_RATES[COUNTRIES[country]]);
  }, [country]);

  // Effect to handle daily rate and monthly salary calculations
  useEffect(() => {
    if (rateInputMode === 'dailyRate' && exchangeRate > 0) {
      // Calculate monthly local salary from daily rate
      const calculatedMonthlyLocalSalary = (dailyRate * DAYS_PER_MONTH) / exchangeRate;
      setMonthlyLocalSalary(calculatedMonthlyLocalSalary);
    } else if (rateInputMode === 'localSalary' && exchangeRate > 0) {
      // Calculate daily rate based on monthly local salary
      const calculatedDailyRate = (monthlyLocalSalary * exchangeRate) / DAYS_PER_MONTH;
      setDailyRate(calculatedDailyRate);
    }
  }, [dailyRate, monthlyLocalSalary, exchangeRate, rateInputMode]);

  // Effect to handle exchange rate changes
  useEffect(() => {
    if (exchangeRate > 0) {
      // When exchange rate changes, recalculate the value that isn't in input mode
      if (rateInputMode === 'dailyRate') {
        // Recalculate local salary based on current daily rate
        const calculatedMonthlyLocalSalary = (dailyRate * DAYS_PER_MONTH) / exchangeRate;
        setMonthlyLocalSalary(calculatedMonthlyLocalSalary);
      } else {
        // Recalculate daily rate based on current local salary
        const calculatedDailyRate = (monthlyLocalSalary * exchangeRate) / DAYS_PER_MONTH;
        setDailyRate(calculatedDailyRate);
      }
    }
  }, [exchangeRate]);

  // Effect to perform all calculations
  useEffect(() => {
    calculateValues();
  }, [
    monthlyLocalSalary,
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
    calculationMode,
    exchangeRate
  ]);

  // Function to handle the main calculations
  const calculateValues = () => {
    // Calculate annual income
    const annualIncomeValue = dailyRate * workingDays;
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

    // Calculate total cost
    const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
    const totalCostValue = annualIncomeValue + extraCostValue + extraExpensesAmount;
    setTotalCost(totalCostValue);

    // Calculate daily cost
    const dailyCostValue = totalCostValue / workingDays;
    setDailyCost(dailyCostValue);

    // Perform specific calculations based on the mode
    if (calculationMode === 'dailyRate') {
      // Calculate daily client rate from daily rate and target margin
      const marginMultiplier = 1 / (1 - targetMarginPercent / 100);
      const calculatedDailyClientRate = dailyCostValue * marginMultiplier;
      setDailyClientRate(calculatedDailyClientRate);
      
      // Calculate target margin amount
      const targetMarginAmountValue = calculatedDailyClientRate - dailyCostValue;
      setTargetMarginAmount(targetMarginAmountValue);
      
      // Calculate annual profit and revenue
      const annualProfitValue = targetMarginAmountValue * workingDays;
      setAnnualProfit(annualProfitValue);
      
      const annualRevenueValue = calculatedDailyClientRate * workingDays;
      setAnnualRevenue(annualRevenueValue);
      
    } else if (calculationMode === 'clientRate') {
      // Calculate daily rate from target margin and daily client rate
      const impliedDailyCost = dailyClientRate * (1 - targetMarginPercent / 100);
      
      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
      
      const calculatedAnnualIncome = (impliedTotalCost - extraExpensesAmount) / (1 + totalExtraPercent);
      
      // Calculate daily rate
      const calculatedDailyRate = calculatedAnnualIncome / workingDays;
      
      if (Math.abs(calculatedDailyRate - dailyRate) > 1) {
        setDailyRate(calculatedDailyRate);
        
        // If in localSalary mode, also update monthly local salary
        if (rateInputMode === 'localSalary' && exchangeRate > 0) {
          const calculatedMonthlyLocalSalary = (calculatedDailyRate * DAYS_PER_MONTH) / exchangeRate;
          setMonthlyLocalSalary(calculatedMonthlyLocalSalary);
        }
      }
      
      // Calculate target margin amount
      const targetMarginAmountValue = dailyClientRate - impliedDailyCost;
      setTargetMarginAmount(targetMarginAmountValue);
      
      // Calculate annual profit and revenue
      const annualProfitValue = targetMarginAmountValue * workingDays;
      setAnnualProfit(annualProfitValue);
      
      const annualRevenueValue = dailyClientRate * workingDays;
      setAnnualRevenue(annualRevenueValue);
      
    } else if (calculationMode === 'targetMargin') {
      // Calculate target margin from daily rate and daily client rate
      const calculatedTargetMarginPercent = ((dailyClientRate - dailyCostValue) / dailyClientRate) * 100;
      
      if (Math.abs(calculatedTargetMarginPercent - targetMarginPercent) > 0.01) {
        setTargetMarginPercent(calculatedTargetMarginPercent);
      }
      
      // Calculate target margin amount
      const targetMarginAmountValue = dailyClientRate - dailyCostValue;
      setTargetMarginAmount(targetMarginAmountValue);
      
      // Calculate annual profit and revenue
      const annualProfitValue = targetMarginAmountValue * workingDays;
      setAnnualProfit(annualProfitValue);
      
      const annualRevenueValue = dailyClientRate * workingDays;
      setAnnualRevenue(annualRevenueValue);
    }
  };

  // Toggle between daily rate and local salary as input
  const toggleRateInputMode = () => {
    if (rateInputMode === 'dailyRate') {
      setRateInputMode('localSalary');
    } else {
      setRateInputMode('dailyRate');
    }
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    setCalculationMode(mode);
  };

  // Handle country change
  const handleCountryChange = (selectedCountry) => {
    setCountry(selectedCountry);
  };

  // Format currency with AUD$ prefix and 2 decimal points
  const formatCurrency = (value) => {
    return `AUD$ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format local currency with appropriate prefix and 2 decimal points
  const formatLocalCurrency = (value) => {
    const prefix = currency;
    return `${prefix} ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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
    <div className="container">
      <div className="nav-buttons">
        <Link to="/" className="back-button offshore-back-btn">← Back to All Calculators</Link>
      </div>
      

      <h1 className="offshore-title">Offshore Contractor GP Calculator</h1>
      
      <div className="offshore-calculator-card">


        <h2 className="offshore-section-title">Calculation Mode</h2>
        <div className="offshore-mode-buttons">
          <button 
            onClick={() => handleModeChange('dailyRate')}
            className={`offshore-mode-button ${calculationMode === 'dailyRate' ? 'offshore-active-blue' : ''}`}
          >
            Calculate Client Rate
          </button>
          <button 
            onClick={() => handleModeChange('clientRate')}
            className={`offshore-mode-button ${calculationMode === 'clientRate' ? 'offshore-active-blue' : ''}`}
          >
            Calculate Contractor Rate
          </button>
          <button 
            onClick={() => handleModeChange('targetMargin')}
            className={`offshore-mode-button ${calculationMode === 'targetMargin' ? 'offshore-active-blue' : ''}`}
          >
            Calculate Target Margin
          </button>
        </div>
        
        <div className="offshore-content-columns">
          <div className="offshore-column">
            <h2 className="offshore-section-title">Configuration</h2>

              <div className="offshore-form-group">
              <label>Country</label>
              <select 
                value={country} 
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                {Object.keys(COUNTRIES).map((countryName) => (
                  <option key={countryName} value={countryName}>{countryName}</option>
                ))}
              </select>
            </div>
            
          
            <div className="offshore-form-group">
              <label>Currency</label>
              <input
                type="text"
                value={currency}
                readOnly
                className="offshore-readonly-input"
                style={{ 
                    width: "15%", 
                  }}
              />
            </div>

          
            
            <div className="offshore-form-group">
              <label>Exchange Rate to AUD</label>
              <input
                type="number"
                step="0.000001"
                value={exchangeRate}
                disabled={true}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                className="offshore-readonly-input"
              />
            </div>

            <div className="offshore-form-group" style={{ display: 'none' }}>
              <label>Is Payroll Tax applicable?</label>
              <select 
                value={payrollTaxApplicable} 
                disabled={true}
                onChange={(e) => setPayrollTaxApplicable(e.target.value)}
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            
            <div className="offshore-form-group" style={{ display: 'none' }}>
              <label>Workcover</label>
              <select 
                value={workcover} 
                disabled={true}
                onChange={(e) => setWorkcover(e.target.value)}
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            
            <div className="offshore-form-group" style={{ display: 'none' }}>
              <label>Leave Movements</label>
              <select 
                value={leaveMovements} 
                disabled={true}
                onChange={(e) => setLeaveMovements(e.target.value)}
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            
            <div className="offshore-form-group" style={{ display: 'none' }}>
              <label>LSL Movements</label>
              <select 
                value={lslMovements}
                disabled={true}
                onChange={(e) => setLslMovements(e.target.value)}
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            
            <div className="offshore-form-group">
              <label>Working Days</label>
              <input
                type="number"
                min="1"
                max="365"
                value={workingDays}
                disabled={true}
                onChange={(e) => setWorkingDays(parseInt(e.target.value) || 220)}
              />
            </div>
            
            <div className="offshore-form-group">
              <label>Extra Expenses</label>
              <select 
                value={extraExpenses} 
                disabled={true}
                onChange={(e) => setExtraExpenses(e.target.value)}
              >
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </div>
            
            {extraExpenses === 'Y' && (
              <div className="offshore-form-group">
                <label>Extra Expenses Amount ($)</label>
                <input
                  type="number"
                  value={additionalExpenses}
                  disabled={true}
                  onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
                />
              </div>
            )}
            

          </div>
          
          <div className="offshore-column">
            <h2 className="offshore-section-title">Calculation Inputs</h2>

            {/* Only show the rate input type switch when not in Calculate Contractor Rate mode */}
            {calculationMode !== 'clientRate' && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-slate-700">Rate Input Type:</span>
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
                  Switch to {currency} Salary input
                </button>
              </div>
            )}
            
            
            <div className="offshore-form-group">
              <label>AUD$ Daily Rate
                            {(calculationMode === 'clientRate' || rateInputMode === 'localSalary') && 
                <span className="offshore-calculated-label">(Calculated)</span>}</label>
              <div className="offshore-input-currency-wrapper">
                <span className="offshore-currency-prefix">AUD</span>
                <input
                  type="text"
                  value={calculationMode === 'clientRate' || rateInputMode === 'localSalary' ? 
                    Math.round(dailyRate) : 
                    dailyRate === 0 ? '' : Math.round(dailyRate)}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyRate)}
                                    style={{ 
                    width: "25%", 
                  }}
                  disabled={calculationMode === 'clientRate' || rateInputMode === 'localSalary'}
                  className={calculationMode === 'clientRate' || rateInputMode === 'localSalary' ? "offshore-calculated-input" : ""}
                />
              </div>

            </div>

            <div className="offshore-form-group">
              <label>{currency} Monthly Salary (160 hours){(rateInputMode === 'dailyRate' || calculationMode === 'clientRate') && 
                <span className="offshore-calculated-label">(Calculated)</span>}</label>
              <div className="offshore-input-currency-wrapper">
                <span className="offshore-currency-prefix">{currency}</span>
                <input
                  type="text"
                  value={rateInputMode === 'dailyRate' || calculationMode === 'clientRate' ? 
                    Math.round(monthlyLocalSalary) : 
                    monthlyLocalSalary === 0 ? '' : Math.round(monthlyLocalSalary)}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setMonthlyLocalSalary)}
                                    style={{ 
                    width: "25%", 
                  }}
                  disabled={rateInputMode === 'dailyRate' || calculationMode === 'clientRate'}
                  className={rateInputMode === 'dailyRate' || calculationMode === 'clientRate' ? "offshore-calculated-input" : ""}
                />
              </div>
              
            </div>

            <div className="offshore-form-group">
              <label>Target Margin %              {calculationMode === 'targetMargin' && 
                <span className="offshore-calculated-label">(Calculated)</span>}</label>
              <input
                type="text"
                value={calculationMode === 'targetMargin' ? 
                  targetMarginPercent : 
                  targetMarginPercent === 0 ? '' : targetMarginPercent}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  setTargetMarginPercent(value === '' ? 0 : parseFloat(value));
                }}
                style={{ 
                    width: "15%", 
                }}
                disabled={calculationMode === 'targetMargin'}
                className={calculationMode === 'targetMargin' ? "offshore-calculated-input" : ""}
              />

            </div>

            <div className="offshore-form-group">
              <label>AUD$ Daily Client Rate              {calculationMode === 'dailyRate' && 
                <span className="offshore-calculated-label">(Calculated)</span>}</label>
              <div className="offshore-input-currency-wrapper">
                <span className="offshore-currency-prefix">AUD</span>
                <input
                  type="text"
                  value={calculationMode === 'dailyRate' ? 
                    dailyClientRate.toFixed(2) : 
                    dailyClientRate === 0 ? '' : dailyClientRate.toFixed(2)}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyClientRate)}
                  style={{ 
                    width: "25%", 
                  }}
                  disabled={calculationMode === 'dailyRate'}
                  className={calculationMode === 'dailyRate' ? "offshore-calculated-input" : ""}
                />
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <div className="offshore-results-card">
        <h2 className="offshore-section-title">Results</h2>
        <div className="offshore-results-table">
          <table>
            <tbody>
              <tr>
                <td>{currency} Monthly Salary ({HOURS_PER_MONTH} hours)</td>
                <td>{formatLocalCurrency(monthlyLocalSalary)}</td>
              </tr>
              <tr>
                <td>Daily Rate</td>
                <td>{formatCurrency(dailyRate)}</td>
              </tr>
              <tr>
                <td>Annual Income</td>
                <td>{formatCurrency(annualIncome)}</td>
              </tr>
              <tr>
                <td>Payroll Tax ({(PAYROLL_TAX_RATE * 100).toFixed(2)}%)</td>
                <td>{formatCurrency(payrollTax)}</td>
              </tr>
              <tr>
                <td>Workcover ({(WORKCOVER_RATE * 100).toFixed(2)}%)</td>
                <td>{formatCurrency(workCoverAmount)}</td>
              </tr>
              <tr>
                <td>Leave Movements ({(LEAVE_MOVEMENTS_RATE * 100).toFixed(2)}%)</td>
                <td>{formatCurrency(leaveMovementsAmount)}</td>
              </tr>
              <tr>
                <td>LSL Movements ({(LSL_MOVEMENTS_RATE * 100).toFixed(2)}%)</td>
                <td>{formatCurrency(lslMovementsAmount)}</td>
              </tr>
              <tr>
                <td>Total Extra Cost %</td>
                <td>{formatPercent(totalExtraCostPercent * 100)}</td>
              </tr>
              <tr>
                <td>Extra Cost</td>
                <td>{formatCurrency(extraCost)}</td>
              </tr>
              <tr>
                <td>Extra Expenses</td>
                <td>{formatCurrency(extraExpenses === 'Y' ? additionalExpenses : 0)}</td>
              </tr>
              <tr className="offshore-highlight-row">
                <td>Total Cost</td>
                <td>{formatCurrency(totalCost)}</td>
              </tr>
              <tr>
                <td>Daily Cost</td>
                <td>{formatCurrency(dailyCost)}</td>
              </tr>
              <tr className="offshore-highlight-row">
                <td>Target Margin %</td>
                <td>{formatPercent(targetMarginPercent)}</td>
              </tr>
              <tr>
                <td>Target Margin $</td>
                <td>{formatCurrency(targetMarginAmount)}</td>
              </tr>
              <tr className="offshore-highlight-row offshore-highlight-client-rate">
                <td>Daily Client Rate</td>
                <td>{formatCurrency(dailyClientRate)}</td>
              </tr>
              <tr>
                <td>Annual Profit</td>
                <td>{formatCurrency(annualProfit)}</td>
              </tr>
              <tr>
                <td>Annual Revenue</td>
                <td>{formatCurrency(annualRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="offshore-version-tag">V1.0.0 (27-Mar-2025)</p>
      </div>
    </div>
  );
};

export default GenericOffshoreContractorGpCalculator;