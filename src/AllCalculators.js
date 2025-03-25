// PhpContractorGpCalculator.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PhpContractorGpCalculator = () => {
  // State for calculator type
  const [calculatorType, setCalculatorType] = useState('FTE'); // Options: 'FTE', 'Contractor'
  
  // State for form inputs and calculated values
  const [salaryPackage, setSalaryPackage] = useState(120000); // For FTE
  const [dailyRate, setDailyRate] = useState(700); // For Contractor
  const [targetMarginPercent, setTargetMarginPercent] = useState(20);
  const [dailyClientRate, setDailyClientRate] = useState(0);
  
  // State for configuration settings
  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState('Y');
  const [workcover, setWorkcover] = useState('Y');
  const [leaveMovements, setLeaveMovements] = useState('Y');
  const [lslMovements, setLslMovements] = useState('Y');
  const [workingDays, setWorkingDays] = useState(220);
  const [extraExpenses, setExtraExpenses] = useState('N');
  const [additionalExpenses, setAdditionalExpenses] = useState(0);
  
  // State for calculation mode
  const [calculationMode, setCalculationMode] = useState('dailyRate'); // Options depend on calculatorType
  
  // State for calculated values
  const [annualIncome, setAnnualIncome] = useState(0); // For Contractor
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

  // Effect for calculator type changes
  useEffect(() => {
    // Reset calculation mode when calculator type changes
    if (calculatorType === 'FTE') {
      setCalculationMode('dailyRate');
      // Set defaults for FTE
      setLeaveMovements('Y');
      setLslMovements('Y');
      if (dailyClientRate === 0) setDailyClientRate(1057.95);
    } else {
      setCalculationMode('dailyRate');
      // Set defaults for Contractor
      setLeaveMovements('N');
      setLslMovements('N');
      if (dailyClientRate === 0) setDailyClientRate(931.04);
    }
  }, [calculatorType]);

  // Perform calculations whenever inputs change
  useEffect(() => {
    calculateValues();
  }, [
    salaryPackage, 
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
    calculatorType
  ]);

  // Function to handle the main calculations
  const calculateValues = () => {
    // Determine input based on calculator type
    const inputAmount = calculatorType === 'FTE' ? salaryPackage : dailyRate * workingDays;
    
    // Set annual income for Contractor
    if (calculatorType === 'Contractor') {
      setAnnualIncome(inputAmount);
    }

    // Calculate payroll tax if applicable
    const payrollTaxValue = payrollTaxApplicable === 'Y' ? inputAmount * PAYROLL_TAX_RATE : 0;
    setPayrollTax(payrollTaxValue);

    // Calculate workcover if applicable
    const workCoverValue = workcover === 'Y' ? inputAmount * WORKCOVER_RATE : 0;
    setWorkCoverAmount(workCoverValue);

    // Calculate leave movements if applicable
    const leaveMovementsValue = leaveMovements === 'Y' ? inputAmount * LEAVE_MOVEMENTS_RATE : 0;
    setLeaveMovementsAmount(leaveMovementsValue);

    // Calculate LSL movements if applicable
    const lslMovementsValue = lslMovements === 'Y' ? inputAmount * LSL_MOVEMENTS_RATE : 0;
    setLslMovementsAmount(lslMovementsValue);

    // Calculate total extra cost percentage
    const totalExtraPercent = 
      (payrollTaxApplicable === 'Y' ? PAYROLL_TAX_RATE : 0) +
      (workcover === 'Y' ? WORKCOVER_RATE : 0) +
      (leaveMovements === 'Y' ? LEAVE_MOVEMENTS_RATE : 0) +
      (lslMovements === 'Y' ? LSL_MOVEMENTS_RATE : 0);
    setTotalExtraCostPercent(totalExtraPercent);

    // Calculate extra cost
    const extraCostValue = inputAmount * totalExtraPercent;
    setExtraCost(extraCostValue);

    // Calculate total cost
    const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
    const totalCostValue = inputAmount + extraCostValue + extraExpensesAmount;
    setTotalCost(totalCostValue);

    // Calculate daily cost
    const dailyCostValue = totalCostValue / workingDays;
    setDailyCost(dailyCostValue);

    // Perform specific calculations based on the mode and calculator type
    if (calculationMode === 'dailyRate') {
      // Calculate daily client rate
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
      
    } else if ((calculatorType === 'FTE' && calculationMode === 'salaryPackage') || 
              (calculatorType === 'Contractor' && calculationMode === 'clientRate')) {
      // Calculate salary package or daily rate from target margin and daily client rate
      // First, calculate what the daily cost would be given the target margin and daily rate
      const impliedDailyCost = dailyClientRate * (1 - targetMarginPercent / 100);
      
      // Then, work backwards to determine what input would result in this daily cost
      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
      
      // Solve for salaryPackage or annualIncome:
      const calculatedInput = (impliedTotalCost - extraExpensesAmount) / (1 + totalExtraPercent);
      
      if (calculatorType === 'FTE') {
        // Update salary package
        if (Math.abs(calculatedInput - salaryPackage) > 1) {
          setSalaryPackage(calculatedInput);
        }
      } else {
        // Update daily rate
        const calculatedDailyRate = calculatedInput / workingDays;
        if (Math.abs(calculatedDailyRate - dailyRate) > 1) {
          setDailyRate(calculatedDailyRate);
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
      // Calculate target margin from input and daily client rate
      // targetMargin = (dailyClientRate - dailyCost) / dailyClientRate * 100
      const calculatedTargetMarginPercent = ((dailyClientRate - dailyCostValue) / dailyClientRate) * 100;
      
      // Update state but avoid infinite loop by not updating if very close to current value
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

  // Handle calculator type change
  const handleCalculatorTypeChange = (type) => {
    setCalculatorType(type);
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    setCalculationMode(mode);
  };

  // Format currency with AUD$ prefix and 2 decimal points
  const formatCurrency = (value) => {
    return `AUD$ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format percentage with 2 decimal points
  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Format input as currency with thousand separator
  const formatCurrencyInput = (value) => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle currency input changes by removing commas before parsing
  const handleCurrencyInputChange = (value, setter) => {
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;
    setter(numericValue);
  };

  // Get calculation mode buttons based on calculator type
  const getCalculationModeButtons = () => {
    if (calculatorType === 'FTE') {
      return (
        <>
          <button 
            onClick={() => handleModeChange('dailyRate')}
            className={calculationMode === 'dailyRate' ? 'active' : ''}
            style={{ 
              flex: 1, 
              backgroundColor: calculationMode === 'dailyRate' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Calculate Daily Rate
          </button>
          <button 
            onClick={() => handleModeChange('salaryPackage')}
            className={calculationMode === 'salaryPackage' ? 'active' : ''}
            style={{ 
              flex: 1, 
              backgroundColor: calculationMode === 'salaryPackage' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Calculate Salary Package
          </button>
          <button 
            onClick={() => handleModeChange('targetMargin')}
            className={calculationMode === 'targetMargin' ? 'active' : ''}
            style={{ 
              flex: 1, 
              backgroundColor: calculationMode === 'targetMargin' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Calculate Target Margin
          </button>
        </>
      );
    } else {
      return (
        <>
          <button 
            onClick={() => handleModeChange('dailyRate')}
            className={calculationMode === 'dailyRate' ? 'active' : ''}
            style={{ 
              flex: 1, 
              backgroundColor: calculationMode === 'dailyRate' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
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
              backgroundColor: calculationMode === 'clientRate' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
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
              backgroundColor: calculationMode === 'targetMargin' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Calculate Target Margin
          </button>
        </>
      );
    }
  };

  // Get primary input field based on calculator type
  const getPrimaryInputField = () => {
    if (calculatorType === 'FTE') {
      return (
        <div style={{ marginBottom: "8px" }}>
          <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
            AUD$ Salary Package (Including Super)
            {calculationMode === 'salaryPackage' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "8px", top: "7px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
            <input
              type="text"
              value={formatCurrencyInput(salaryPackage.toFixed(2))}
              onChange={(e) => handleCurrencyInputChange(e.target.value, setSalaryPackage)}
              style={{ 
                width: "100%", 
                paddingLeft: "45px", 
                paddingTop: "6px", 
                paddingBottom: "6px", 
                paddingRight: "6px", 
                border: "1px solid #d1d5db", 
                borderRadius: "4px",
                fontSize: "0.85rem"
              }}
              disabled={calculationMode === 'salaryPackage'}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ marginBottom: "8px" }}>
          <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
            AUD$ Daily Rate (Including Super)
            {calculationMode === 'clientRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "8px", top: "7px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
            <input
              type="text"
              value={formatCurrencyInput(dailyRate.toFixed(2))}
              onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyRate)}
              style={{ 
                width: "100%", 
                paddingLeft: "45px", 
                paddingTop: "6px", 
                paddingBottom: "6px", 
                paddingRight: "6px", 
                border: "1px solid #d1d5db", 
                borderRadius: "4px",
                fontSize: "0.85rem"
              }}
              disabled={calculationMode === 'clientRate'}
            />
          </div>
        </div>
      );
    }
  };

  // Get results rows based on calculator type
  const getCalculatorTypeSpecificRows = () => {
    if (calculatorType === 'Contractor') {
      return (
        <>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <td style={{ padding: "4px 8px" }}>Daily Rate (Including Super)</td>
            <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyRate)}</td>
          </tr>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <td style={{ padding: "4px 8px" }}>Annual Income (Including Super)</td>
            <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(annualIncome)}</td>
          </tr>
        </>
      );
    }
    return null;
  };

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "12px" }}>
      <div className="nav-buttons" style={{ marginBottom: "8px" }}>
        <Link to="/" className="back-button">&#8592; Back to All Calculators</Link>
      </div>
      
      <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>AUS GP Calculator</h1>
      
      <div style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Calculator Type</h2>
        <div style={{ display: 'flex', gap: '5px', marginBottom: "12px" }}>
          <button 
            onClick={() => handleCalculatorTypeChange('FTE')}
            style={{ 
              flex: 1, 
              backgroundColor: calculatorType === 'FTE' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            FTE Calculator
          </button>
          <button 
            onClick={() => handleCalculatorTypeChange('Contractor')}
            style={{ 
              flex: 1, 
              backgroundColor: calculatorType === 'Contractor' ? '#2563eb' : '#3478f6',
              padding: "8px 0",
              fontSize: "0.9rem",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Contractor Calculator
          </button>
        </div>
        
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Calculation Mode</h2>
        <div style={{ display: 'flex', gap: '5px', marginBottom: "12px" }}>
          {getCalculationModeButtons()}
        </div>
        
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: "1 1 50%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Configuration</h2>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Is Payroll Tax applicable?</label>
                <select 
                  value={payrollTaxApplicable} 
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
                    backgroundColor: "white", 
                    color: "black",
                    appearance: "menulist",
                    opacity: 0.9
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
                    backgroundColor: "white", 
                    color: "black",
                    appearance: "menulist",
                    opacity: 0.9
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
                    backgroundColor: "white", 
                    color: "black",
                    appearance: "menulist",
                    opacity: 0.9
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
                    backgroundColor: "white", 
                    color: "black",
                    opacity: 0.9
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
          </div>
          
          <div style={{ flex: "1 1 50%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Calculation Inputs</h2>

            {getPrimaryInputField()}

            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                Target Margin
                {calculationMode === 'targetMargin' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={targetMarginPercent.toFixed(2)}
                  onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)}
                  style={{ 
                    width: "100%", 
                    padding: "6px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    fontSize: "0.85rem"
                  }}
                  disabled={calculationMode === 'targetMargin'}
                  step="0.01"
                />
              </div>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                AUD$ Daily Client Rate
                {(calculationMode === 'dailyRate' || 
                 (calculatorType === 'Contractor' && calculationMode === 'dailyRate')) && 
                 <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
              </label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "8px", top: "7px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
                <input
                  type="text"
                  value={formatCurrencyInput(dailyClientRate.toFixed(2))}
                  onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyClientRate)}
                  style={{ 
                    width: "100%", 
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
      
      <div style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px", backgroundColor: "#f9fafb" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Results</h2>
        <div className="result-summary">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <tbody>
              {getCalculatorTypeSpecificRows()}
              {calculatorType === 'FTE' && (
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "4px 8px" }}>Salary Package (Including Super)</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(salaryPackage)}</td>
                </tr>
              )}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Payroll Tax ({(PAYROLL_TAX_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(payrollTax)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Workcover ({(WORKCOVER_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(workCoverAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Leave Movements ({(LEAVE_MOVEMENTS_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(leaveMovementsAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>LSL Movements ({(LSL_MOVEMENTS_RATE * 100).toFixed(2)}%)</td>
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
              <tr style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Total Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(totalCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Daily Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin %</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatPercent(targetMarginPercent)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin $</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(targetMarginAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#e5e7eb", fontWeight: "bold" }}>
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
      </div>
    </div>
  );
};

export default PhpContractorGpCalculator;