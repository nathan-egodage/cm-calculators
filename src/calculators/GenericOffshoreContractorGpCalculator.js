// GenericOffshoreContractorGpCalculator.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";

const GenericOffshoreContractorGpCalculator = () => {
  // State for country and currency
  const [country, setCountry] = useState("India");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState(0.019);
  
  // State for API status
  const [apiStatus, setApiStatus] = useState(null);
  const [apiStatusCode, setApiStatusCode] = useState(null);

  // State for form inputs and calculated values
  const [monthlyLocalSalary, setMonthlyLocalSalary] = useState(84210);
  const [dailyRate, setDailyRate] = useState(200.0);
  const [targetMarginPercent, setTargetMarginPercent] = useState(50.0);
  const [dailyClientRate, setDailyClientRate] = useState(265.73);

  // State for input mode
  const [rateInputMode, setRateInputMode] = useState("dailyRate"); // 'dailyRate' or 'localSalary'

  // State for configuration settings
  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState("N");
  const [workcover, setWorkcover] = useState("N");
  const [leaveMovements, setLeaveMovements] = useState("N");
  const [lslMovements, setLslMovements] = useState("N");
  const [workingDays, setWorkingDays] = useState(220);
  const [extraExpenses, setExtraExpenses] = useState("Y");
  const [additionalExpenses, setAdditionalExpenses] = useState(150);

  // State for calculation mode
  const [calculationMode, setCalculationMode] = useState("dailyRate"); // Options: dailyRate, clientRate, targetMargin

  // State for calculated values
  const [annualIncome, setAnnualIncome] = useState(44000.0);
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
  const LEAVE_MOVEMENTS_RATE = 0.005;
  const LSL_MOVEMENTS_RATE = 0.0005;
  const HOURS_PER_MONTH = 160;
  const DAYS_PER_MONTH = 20;

  // Available countries and their currencies
  const COUNTRIES = {
    "Sri Lanka": "LKR",
    Vietnam: "VND",
    India: "INR",
    "New Zealand": "NZD",
  };

  // Exchange rates for each currency to AUD (fallback values)
  const EXCHANGE_RATES = {
    LKR: 0.005400,
    VND: 0.000062,
    INR: 0.019000,
    NZD: 0.910000,
  };

  // Function to fetch exchange rate from API
  const fetchExchangeRate = async (currencyCode) => {
    try {
      setApiStatus('loading');
      const response = await fetch(`https://api.frankfurter.app/latest?from=AUD&to=${currencyCode}`);
      setApiStatusCode(response.status);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.rates && data.rates[currencyCode]) {
        // Calculate rate as 1/rate since we want CUR/AUD, not AUD/CUR
        const newRate = parseFloat((1 / data.rates[currencyCode]).toFixed(6));
        setExchangeRate(newRate);
        setApiStatus('success');
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setApiStatus('error');
      // Fall back to default exchange rate
      setExchangeRate(EXCHANGE_RATES[currencyCode]);
    }

  };

  // Effect to handle country selection
  useEffect(() => {
    const selectedCurrency = COUNTRIES[country];
    setCurrency(selectedCurrency);
    fetchExchangeRate(selectedCurrency);
  }, [country]);

  // Effect to handle daily rate and monthly salary calculations
  useEffect(() => {
    if (rateInputMode === "dailyRate" && exchangeRate > 0) {
      // Calculate monthly local salary from daily rate
      const calculatedMonthlyLocalSalary =
        (dailyRate * DAYS_PER_MONTH) / exchangeRate;
      setMonthlyLocalSalary(calculatedMonthlyLocalSalary);
    } else if (rateInputMode === "localSalary" && exchangeRate > 0) {
      // Calculate daily rate based on monthly local salary
      const calculatedDailyRate =
        (monthlyLocalSalary * exchangeRate) / DAYS_PER_MONTH;
      setDailyRate(calculatedDailyRate);
    }
  }, [dailyRate, monthlyLocalSalary, exchangeRate, rateInputMode]);

  // Effect to handle exchange rate changes
  useEffect(() => {
    if (exchangeRate > 0) {
      // When exchange rate changes, recalculate the value that isn't in input mode
      if (rateInputMode === "dailyRate") {
        // Recalculate local salary based on current daily rate
        const calculatedMonthlyLocalSalary =
          (dailyRate * DAYS_PER_MONTH) / exchangeRate;
        setMonthlyLocalSalary(calculatedMonthlyLocalSalary);
      } else {
        // Recalculate daily rate based on current local salary
        const calculatedDailyRate =
          (monthlyLocalSalary * exchangeRate) / DAYS_PER_MONTH;
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
    exchangeRate,
  ]);

  // Function to handle the main calculations
  const calculateValues = () => {
    // Calculate annual income
    const annualIncomeValue = dailyRate * workingDays;
    setAnnualIncome(annualIncomeValue);

    // Calculate payroll tax if applicable
    const payrollTaxValue =
      payrollTaxApplicable === "Y" ? annualIncomeValue * PAYROLL_TAX_RATE : 0;
    setPayrollTax(payrollTaxValue);

    // Calculate workcover if applicable
    const workCoverValue =
      workcover === "Y" ? annualIncomeValue * WORKCOVER_RATE : 0;
    setWorkCoverAmount(workCoverValue);

    // Calculate leave movements if applicable
    const leaveMovementsValue =
      leaveMovements === "Y" ? annualIncomeValue * LEAVE_MOVEMENTS_RATE : 0;
    setLeaveMovementsAmount(leaveMovementsValue);

    // Calculate LSL movements if applicable
    const lslMovementsValue =
      lslMovements === "Y" ? annualIncomeValue * LSL_MOVEMENTS_RATE : 0;
    setLslMovementsAmount(lslMovementsValue);

    // Calculate total extra cost percentage
    const totalExtraPercent =
      (payrollTaxApplicable === "Y" ? PAYROLL_TAX_RATE : 0) +
      (workcover === "Y" ? WORKCOVER_RATE : 0) +
      (leaveMovements === "Y" ? LEAVE_MOVEMENTS_RATE : 0) +
      (lslMovements === "Y" ? LSL_MOVEMENTS_RATE : 0);
    setTotalExtraCostPercent(totalExtraPercent);

    // Calculate extra cost
    const extraCostValue = annualIncomeValue * totalExtraPercent;
    setExtraCost(extraCostValue);

    // Calculate total cost
    const extraExpensesAmount = extraExpenses === "Y" ? additionalExpenses : 0;
    const totalCostValue =
      annualIncomeValue + extraCostValue + extraExpensesAmount;
    setTotalCost(totalCostValue);

    // Calculate daily cost
    const dailyCostValue = totalCostValue / workingDays;
    setDailyCost(dailyCostValue);

    // Perform specific calculations based on the mode
    if (calculationMode === "dailyRate") {
      // Calculate daily client rate from daily rate and target margin
      const marginMultiplier = 1 / (1 - targetMarginPercent / 100);
      const calculatedDailyClientRate = dailyCostValue * marginMultiplier;
      setDailyClientRate(calculatedDailyClientRate);

      // Calculate target margin amount
      const targetMarginAmountValue =
        calculatedDailyClientRate - dailyCostValue;
      setTargetMarginAmount(targetMarginAmountValue);

      // Calculate annual profit and revenue
      const annualProfitValue = targetMarginAmountValue * workingDays;
      setAnnualProfit(annualProfitValue);

      const annualRevenueValue = calculatedDailyClientRate * workingDays;
      setAnnualRevenue(annualRevenueValue);
    } else if (calculationMode === "clientRate") {
      // Calculate daily rate from target margin and daily client rate
      const impliedDailyCost =
        dailyClientRate * (1 - targetMarginPercent / 100);

      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount =
        extraExpenses === "Y" ? additionalExpenses : 0;

      const calculatedAnnualIncome =
        (impliedTotalCost - extraExpensesAmount) / (1 + totalExtraPercent);

      // Calculate daily rate
      const calculatedDailyRate = calculatedAnnualIncome / workingDays;

      if (Math.abs(calculatedDailyRate - dailyRate) > 1) {
        setDailyRate(calculatedDailyRate);

        // If in localSalary mode, also update monthly local salary
        if (rateInputMode === "localSalary" && exchangeRate > 0) {
          const calculatedMonthlyLocalSalary =
            (calculatedDailyRate * DAYS_PER_MONTH) / exchangeRate;
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
    } else if (calculationMode === "targetMargin") {
      // Calculate target margin from daily rate and daily client rate
      const calculatedTargetMarginPercent =
        ((dailyClientRate - dailyCostValue) / dailyClientRate) * 100;

      if (
        Math.abs(calculatedTargetMarginPercent - targetMarginPercent) > 0.01
      ) {
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
    if (rateInputMode === "dailyRate") {
      setRateInputMode("localSalary");
    } else {
      setRateInputMode("dailyRate");
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
    return `${prefix} ${value
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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
    const numericValue = value.replace(/[^0-9.]/g, "");
    // Parse to float or default to 0
    setter(numericValue === "" ? 0 : parseFloat(numericValue));
  };

  return (
    <div className="container india-theme" style={{ maxWidth: "800px", margin: "0 auto", padding: "12px" }}>
      <div className="nav-buttons" style={{ marginBottom: "8px" }}>
        <Link to="/" className="back-button">
          ← Back to All Calculators
        </Link>
      </div>

      <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Offshore Contractor GP Calculator</h1>

      <div className="calculator-card" style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Calculation Mode</h2>
        <div className="mode-buttons" style={{ display: 'flex', gap: '5px', marginBottom: "12px" }}>
          <button
            onClick={() => handleModeChange("dailyRate")}
            className={`mode-button ${
              calculationMode === "dailyRate" ? "active" : ""
            }`}
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
            onClick={() => handleModeChange("clientRate")}
            className={`mode-button ${
              calculationMode === "clientRate" ? "active" : ""
            }`}
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
            onClick={() => handleModeChange("targetMargin")}
            className={`mode-button ${
              calculationMode === "targetMargin" ? "active" : ""
            }`}
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

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Country</label>
              <select
                value={country}
                className="calculated-input"
                onChange={(e) => handleCountryChange(e.target.value)}
                style={{ padding: "6px", fontSize: "0.85rem", width: "100%", border: "1px solid #d1d5db", borderRadius: "4px" }}
              >
                {Object.keys(COUNTRIES).map((countryName) => (
                  <option key={countryName} value={countryName}>
                    {countryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Currency</label>
              <input
                type="text"
                value={currency}
                readOnly
                className="calculated-input"
                style={{ width: "15%", padding: "6px", fontSize: "0.85rem", border: "1px solid #d1d5db", borderRadius: "4px",backgroundColor: "#f3f4f6"}}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Exchange Rate ({currency}/AUD)
                {apiStatusCode && (
                  <span style={{ 
                    marginLeft: "8px", 
                    fontSize: "0.75rem", 
                    color: apiStatus === 'success' ? "green" : apiStatus === 'error' ? "red" : "gray" 
                  }}>
                    (API Status: {apiStatusCode})
                  </span>
                )}
              </label>
              <input
                type="number"
                step="0.000001"
                value={exchangeRate}
                className="calculated-input"
                onChange={(e) =>
                  setExchangeRate(parseFloat(e.target.value) || 0)
                }
                style={{ padding: "6px", fontSize: "0.85rem", width: "100%", border: "1px solid #d1d5db", borderRadius: "4px", }}
              />
            </div>

            <div className="form-group" style={{ display: "none" }}>
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

            <div className="form-group" style={{ display: "none" }}>
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

            <div className="form-group" style={{ display: "none" }}>
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

            <div className="form-group" style={{ display: "none" }}>
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

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Working Days</label>
              <input
                type="number"
                min="1"
                max="365"
                value={workingDays}
                disabled={true}
                onChange={(e) =>
                  setWorkingDays(parseInt(e.target.value) || 220)
                }
                style={{ 
                  padding: "6px", 
                  fontSize: "0.85rem", 
                  width: "100%", 
                  border: "1px solid #d1d5db", 
                  borderRadius: "4px",
                  backgroundColor: "#f3f4f6", 
                  color: "black",
                  opacity: 0.9
                }}
              />
            </div>

            <div className="form-group">
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

            {extraExpenses === "Y" && (
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Extra Expenses Amount ($)</label>
                <input
                  type="number"
                  value={additionalExpenses}
                  onChange={(e) =>
                    setAdditionalExpenses(parseFloat(e.target.value) || 0)
                  }
                  style={{ padding: "6px", fontSize: "0.85rem", width: "100%", border: "1px solid #d1d5db", borderRadius: "4px" }}
                />
              </div>
            )}
          </div>

          <div style={{ flex: "1 1 50%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Calculation Inputs</h2>

            {/* Only show the rate input type switch when not in Calculate Contractor Rate mode */}
            {calculationMode !== "clientRate" && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px"
              }}>
                <span style={{ fontSize: "0.85rem" }}>Rate Input Type:</span>
                <button
                  onClick={toggleRateInputMode}
                  className="rate-toggle-button"
                  style={{ 
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    cursor: "pointer"
                  }}
                >
                  Switch to {rateInputMode === "dailyRate" ? currency + " Salary" : "Daily Rate"} input
                </button>
              </div>
            )}

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                AUD$ Daily Rate
                {(calculationMode === "clientRate" ||
                  rateInputMode === "localSalary") && (
                  <span className="calculated-label">
                    (Calculated)
                  </span>
                )}
              </label>
              <div className="input-currency-wrapper">
                <span className="currency-prefix">AUD$</span>
                <input
                  type="text"
                  value={
                    calculationMode === "clientRate" ||
                    rateInputMode === "localSalary"
                      ? Math.round(dailyRate)
                      : dailyRate === 0
                      ? ""
                      : Math.round(dailyRate)
                  }
                  onChange={(e) =>
                    handleCurrencyInputChange(e.target.value, setDailyRate)
                  }
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
                  disabled={
                    calculationMode === "clientRate" ||
                    rateInputMode === "localSalary"
                  }
                  className={
                    calculationMode === "clientRate" ||
                    rateInputMode === "localSalary"
                      ? "calculated-input"
                      : ""
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                {currency} Monthly Salary (160 hours)
                {(rateInputMode === "dailyRate" ||
                  calculationMode === "clientRate") && (
                  <span className="calculated-label">
                    (Calculated)
                  </span>
                )}
              </label>
              <div className="input-currency-wrapper">
                <span className="currency-prefix">{currency}</span>
                <input
                  type="text"
                  value={
                    rateInputMode === "dailyRate" ||
                    calculationMode === "clientRate"
                      ? Math.round(monthlyLocalSalary)
                      : monthlyLocalSalary === 0
                      ? ""
                      : Math.round(monthlyLocalSalary)
                  }
                  onChange={(e) =>
                    handleCurrencyInputChange(
                      e.target.value,
                      setMonthlyLocalSalary
                    ) 
                  }
                  style={{
                    width: "25%",
                    paddingLeft: currency.length > 3 ? "45px" : "35px",
                    paddingTop: "6px", 
                    paddingBottom: "6px", 
                    paddingRight: "6px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    fontSize: "0.85rem"
                  }}
                  disabled={
                    rateInputMode === "dailyRate" ||
                    calculationMode === "clientRate"
                  }
                  className={
                    rateInputMode === "dailyRate" ||
                    calculationMode === "clientRate"
                      ? "calculated-input"
                      : ""
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Target Margin %{" "}
                {calculationMode === "targetMargin" && (
                  <span className="calculated-label">
                    (Calculated)
                  </span>
                )}
              </label>
              <input
                type="text"
                value={
                  calculationMode === "targetMargin"
                    ? targetMarginPercent
                    : targetMarginPercent === 0
                    ? ""
                    : targetMarginPercent
                }
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  setTargetMarginPercent(value === "" ? 0 : parseFloat(value));
                }}
                style={{
                  width: "20%",
                  padding: "6px", 
                  border: "1px solid #d1d5db", 
                  borderRadius: "4px",
                  fontSize: "0.85rem"
                }}
                disabled={calculationMode === "targetMargin"}
                className={
                  calculationMode === "targetMargin"
                    ? "calculated-input"
                    : ""
                }
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                AUD$ Daily Client Rate{" "}
                {calculationMode === "dailyRate" && (
                  <span className="calculated-label">
                    (Calculated)
                  </span>
                )}
              </label>
              <div className="input-currency-wrapper">
                <span className="currency-prefix">AUD$</span>
                <input
                  type="text"
                  value={
                    calculationMode === "dailyRate"
                      ? Math.round(dailyClientRate)
                      : dailyClientRate === 0
                      ? ""
                      : Math.round(dailyClientRate)
                  }
                  onChange={(e) =>
                    handleCurrencyInputChange(
                      e.target.value,
                      setDailyClientRate
                    )
                  }
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
                  disabled={calculationMode === "dailyRate"}
                  className={
                    calculationMode === "dailyRate"
                      ? "calculated-input"
                      : ""
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="results-card" style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px", marginBottom: "12px" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Results</h2>
        <div className="result-summary">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>
                  {currency} Monthly Salary ({HOURS_PER_MONTH} hours)
                </td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatLocalCurrency(monthlyLocalSalary)}</td>
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
                <td style={{ padding: "4px 8px" }}>Payroll Tax ({(PAYROLL_TAX_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(payrollTax)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Workcover ({(WORKCOVER_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(workCoverAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>
                  Leave Movements ({(LEAVE_MOVEMENTS_RATE * 100).toFixed(2)}%)
                </td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(leaveMovementsAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>
                  LSL Movements ({(LSL_MOVEMENTS_RATE * 100).toFixed(2)}%)
                </td>
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
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {formatCurrency(
                    extraExpenses === "Y" ? additionalExpenses : 0
                  )}
                </td>
              </tr>
              <tr className="highlight-row" style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Total Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(totalCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Daily Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyCost)}</td>
              </tr>
              <tr className="highlight-row" style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin %</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatPercent(targetMarginPercent)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin $</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(targetMarginAmount)}</td>
              </tr>
              <tr className="highlight-row highlight-client-rate" style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#e5e7eb", fontWeight: "bold" }}>
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

export default GenericOffshoreContractorGpCalculator;