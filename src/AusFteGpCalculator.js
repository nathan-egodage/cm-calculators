// AusFteGpCalculator.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const AusFteGpCalculator = () => {
  // State for form inputs and calculated values
  const [salaryPackage, setSalaryPackage] = useState(120000);
  const [targetMarginPercent, setTargetMarginPercent] = useState(20);
  const [dailyClientRate, setDailyClientRate] = useState(1057.95);
  
  // State for configuration settings
  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState('Y');
  const [workcover, setWorkcover] = useState('Y');
  const [leaveMovements, setLeaveMovements] = useState('Y');
  const [lslMovements, setLslMovements] = useState('Y');
  const [workingDays, setWorkingDays] = useState(220);
  const [extraExpenses, setExtraExpenses] = useState('N');
  const [additionalExpenses, setAdditionalExpenses] = useState(0);
  
  // State for calculation mode
  const [calculationMode, setCalculationMode] = useState('dailyRate'); // Options: dailyRate, salaryPackage, targetMargin
  
  // State for calculated values
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

  // Perform calculations whenever inputs change
  useEffect(() => {
    calculateValues();
  }, [
    salaryPackage, 
    targetMarginPercent, 
    dailyClientRate, 
    payrollTaxApplicable, 
    workcover, 
    leaveMovements, 
    lslMovements, 
    workingDays, 
    extraExpenses,
    additionalExpenses,
    calculationMode
  ]);

  // Function to handle the main calculations
  const calculateValues = () => {
    // Calculate payroll tax if applicable
    const payrollTaxValue = payrollTaxApplicable === 'Y' ? salaryPackage * PAYROLL_TAX_RATE : 0;
    setPayrollTax(payrollTaxValue);

    // Calculate workcover if applicable
    const workCoverValue = workcover === 'Y' ? salaryPackage * WORKCOVER_RATE : 0;
    setWorkCoverAmount(workCoverValue);

    // Calculate leave movements if applicable
    const leaveMovementsValue = leaveMovements === 'Y' ? salaryPackage * LEAVE_MOVEMENTS_RATE : 0;
    setLeaveMovementsAmount(leaveMovementsValue);

    // Calculate LSL movements if applicable
    const lslMovementsValue = lslMovements === 'Y' ? salaryPackage * LSL_MOVEMENTS_RATE : 0;
    setLslMovementsAmount(lslMovementsValue);

    // Calculate total extra cost percentage
    const totalExtraPercent = 
      (payrollTaxApplicable === 'Y' ? PAYROLL_TAX_RATE : 0) +
      (workcover === 'Y' ? WORKCOVER_RATE : 0) +
      (leaveMovements === 'Y' ? LEAVE_MOVEMENTS_RATE : 0) +
      (lslMovements === 'Y' ? LSL_MOVEMENTS_RATE : 0);
    setTotalExtraCostPercent(totalExtraPercent);

    // Calculate extra cost
    const extraCostValue = salaryPackage * totalExtraPercent;
    setExtraCost(extraCostValue);

    // Calculate total cost
    const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
    const totalCostValue = salaryPackage + extraCostValue + extraExpensesAmount;
    setTotalCost(totalCostValue);

    // Calculate daily cost
    const dailyCostValue = totalCostValue / workingDays;
    setDailyCost(dailyCostValue);

    // Perform specific calculations based on the mode
    if (calculationMode === 'dailyRate') {
      // Calculate daily client rate from salary package and target margin
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
      
    } else if (calculationMode === 'salaryPackage') {
      // Calculate salary package from target margin and daily client rate
      // First, calculate what the daily cost would be given the target margin and daily rate
      const impliedDailyCost = dailyClientRate * (1 - targetMarginPercent / 100);
      
      // Then, work backwards to determine what salary package would result in this daily cost
      // totalCost = salaryPackage * (1 + totalExtraPercent) + extraExpensesAmount
      // impliedDailyCost = totalCost / workingDays
      
      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
      
      // Solve for salaryPackage:
      // impliedTotalCost = salaryPackage * (1 + totalExtraPercent) + extraExpensesAmount
      const calculatedSalaryPackage = (impliedTotalCost - extraExpensesAmount) / (1 + totalExtraPercent);
      
      // Update state but avoid infinite loop by not updating if very close to current value
      if (Math.abs(calculatedSalaryPackage - salaryPackage) > 1) {
        setSalaryPackage(calculatedSalaryPackage);
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
      // Calculate target margin from salary package and daily client rate
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

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="nav-buttons" style={{ marginBottom: "8px" }}>
        <Link to="/" className="back-button">&#8592; Back to All Calculators</Link>
      </div>
      
      <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>AUS FTE GP Calculator</h1>
      
      <div className="section" style={{ marginBottom: "12px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "4px" }}>Calculation Mode</h2>
        <div className="input-group" style={{ display: 'flex', gap: '5px', marginBottom: "8px" }}>
          <button 
            onClick={() => handleModeChange('dailyRate')}
            className={calculationMode === 'dailyRate' ? 'active' : ''}
            style={{ 
              flex: 1, 
              backgroundColor: calculationMode === 'dailyRate' ? '#2563eb' : '#3478f6',
              padding: "6px 0",
              fontSize: "0.9rem"
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
              padding: "6px 0",
              fontSize: "0.9rem"
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
              padding: "6px 0",
              fontSize: "0.9rem"
            }}
          >
            Calculate Target Margin
          </button>
        </div>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ flex: "1 1 48%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Configuration</h2>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label className="input-label" style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>Payroll Tax?</label>
                <select 
                  value={payrollTaxApplicable} 
                  onChange={(e) => setPayrollTaxApplicable(e.target.value)}
                  className="w-full border rounded"
                  style={{ padding: "4px", fontSize: "0.85rem", width: "100%" }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
              
              <div style={{ flex: "1 1 50%" }}>
                <label className="input-label" style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>Workcover</label>
                <select 
                  value={workcover} 
                  disabled={true}
                  onChange={(e) => setWorkcover(e.target.value)}
                  className="border rounded"
                  style={{ padding: "4px", fontSize: "0.85rem", width: "100%" }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label className="input-label" style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>Leave Movements</label>
                <select 
                  value={leaveMovements} 
                  disabled={true}
                  onChange={(e) => setLeaveMovements(e.target.value)}
                  className="border rounded"
                  style={{ padding: "4px", fontSize: "0.85rem", width: "100%" }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
              
              <div style={{ flex: "1 1 50%" }}>
                <label className="input-label" style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>LSL Movements</label>
                <select 
                  value={lslMovements} 
                  disabled={true}
                  onChange={(e) => setLslMovements(e.target.value)}
                  className="border rounded"
                  style={{ padding: "4px", fontSize: "0.85rem", width: "100%" }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label className="input-label" style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>Working Days</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={workingDays}
                  disabled={true}
                  onChange={(e) => setWorkingDays(parseInt(e.target.value) || 0)}
                  className="border rounded"
                  style={{ padding: "4px", fontSize: "0.85rem", width: "100%" }}
                />
              </div>
              
              <div style={{ flex: "1 1 50%" }}>
                <label className="input-label" style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>Extra Expenses</label>
                <select 
                  value={extraExpenses} 
                  onChange={(e) => setExtraExpenses(e.target.value)}
                  className="border rounded"
                  style={{ padding: "4px", fontSize: "0.85rem", width: "100%" }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            {extraExpenses === 'Y' && (
              <div style={{ marginBottom: "4px" }}>
                <label className="input-label" style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>Extra Expenses Amount ($)</label>
                <input
                  type="number"
                  value={additionalExpenses}
                  onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
                  className="border rounded"
                  style={{ padding: "4px", fontSize: "0.85rem", width: "100%" }}
                />
              </div>
            )}
          </div>
          
          <div style={{ flex: "1 1 48%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Calculation Inputs</h2>

        <div style={{ marginBottom: "4px" }}>
          <label style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>
            AUD$ Salary Package (Including Super)
            {calculationMode === 'salaryPackage' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "6px", top: "5px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
            <input
              type="text"
              value={formatCurrencyInput(salaryPackage.toFixed(2))}
              onChange={(e) => handleCurrencyInputChange(e.target.value, setSalaryPackage)}
              style={{ 
                width: "20%", 
                paddingLeft: "40px", 
                paddingTop: "4px", 
                paddingBottom: "4px", 
                paddingRight: "4px", 
                border: "1px solid #d1d5db", 
                borderRadius: "0.25rem",
                fontSize: "0.85rem"
              }}
              disabled={calculationMode === 'salaryPackage'}
            />
          </div>
        </div>

        <div style={{ marginBottom: "4px" }}>
          <label style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>
            Target Margin
            {calculationMode === 'targetMargin' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={targetMarginPercent.toFixed(2)}
              onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)}
              style={{ 
                width: "15%", 
                padding: "4px", 
                border: "1px solid #d1d5db", 
                borderRadius: "0.25rem",
                fontSize: "0.85rem"
              }}
              disabled={calculationMode === 'targetMargin'}
              step="0.01"
            />
          </div>
        </div>

        <div style={{ marginBottom: "4px" }}>
          <label style={{ fontSize: "0.85rem", marginBottom: "2px", display: "block" }}>
            AUD$ Daily Client Rate
            {calculationMode === 'dailyRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold"}}>(Calculated)</span>}
          </label>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "6px", top: "5px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
            <input
              type="text"
              value={formatCurrencyInput(dailyClientRate.toFixed(2))}
              onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyClientRate)}
              style={{ 
                width: "20%", 
                paddingLeft: "40px", 
                paddingTop: "4px", 
                paddingBottom: "4px", 
                paddingRight: "4px", 
                border: "1px solid #d1d5db", 
                borderRadius: "0.25rem",
                fontSize: "0.85rem"
              }}
              disabled={calculationMode === 'dailyRate'}
            />
          </div>
        </div>

          </div>
        </div>
      </div>
      
      <div className="section" style={{ marginBottom: "12px" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Results</h2>
        <div className="result-summary">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Payroll Tax ({(PAYROLL_TAX_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(payrollTax)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Workcover ({(WORKCOVER_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(workCoverAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Leave Movements ({(LEAVE_MOVEMENTS_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(leaveMovementsAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>LSL Movements ({(LSL_MOVEMENTS_RATE * 100).toFixed(2)}%)</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(lslMovementsAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Total Extra Cost %</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatPercent(totalExtraCostPercent * 100)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Extra Cost</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(extraCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Extra Expenses</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(extraExpenses === 'Y' ? additionalExpenses : 0)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" , fontWeight: "bold" }}>
                <td style={{ padding: "2px 4px" }}>Total Cost</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(totalCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Daily Cost</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(dailyCost)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold"  }}>
                <td style={{ padding: "2px 4px" }}>Target Margin %</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatPercent(targetMarginPercent)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Target Margin $</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(targetMarginAmount)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
                <td style={{ padding: "2px 4px" }}>Daily Client Rate</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(dailyClientRate)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Annual Profit</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(annualProfit)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "2px 4px" }}>Annual Revenue</td>
                <td style={{ padding: "2px 4px", textAlign: "right" }}>{formatCurrency(annualRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AusFteGpCalculator;