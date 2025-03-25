// PhpContractorGpCalculator.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PhpContractorGpCalculator = () => {
  const [dailyRate, setDailyRate] = useState(200);
  const [workingDays, setWorkingDays] = useState(220);
  const [phpToAudRate, setPhpToAudRate] = useState(0.028);
  const [targetMarginPercent, setTargetMarginPercent] = useState(20);
  const [extraExpenses, setExtraExpenses] = useState("Y");
  const [additionalExpenses, setAdditionalExpenses] = useState(0);

  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState("N");
  const [workcover, setWorkcover] = useState("N");
  const [leaveMovements, setLeaveMovements] = useState("N");
  const [lslMovements, setLslMovements] = useState("N");

  const PAYROLL_TAX_RATE = 0.0485;
  const WORKCOVER_RATE = 0.0055;
  const LEAVE_MOVEMENTS_RATE = 0.005;
  const LSL_MOVEMENTS_RATE = 0.0005;

  const [annualIncome, setAnnualIncome] = useState(0);
  const [totalExtraCostPercent, setTotalExtraCostPercent] = useState(0);
  const [extraCost, setExtraCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [dailyCost, setDailyCost] = useState(0);
  const [targetMarginAmount, setTargetMarginAmount] = useState(0);
  const [dailyClientRate, setDailyClientRate] = useState(0);
  const [annualProfit, setAnnualProfit] = useState(0);
  const [annualRevenue, setAnnualRevenue] = useState(0);

  useEffect(() => {
    calculate();
  }, [dailyRate, workingDays, phpToAudRate, targetMarginPercent, extraExpenses, additionalExpenses]);

  const calculate = () => {
    const income = (dailyRate * workingDays) / phpToAudRate;
    setAnnualIncome(income);

    const totalExtraPercent =
      (payrollTaxApplicable === "Y" ? PAYROLL_TAX_RATE : 0) +
      (workcover === "Y" ? WORKCOVER_RATE : 0) +
      (leaveMovements === "Y" ? LEAVE_MOVEMENTS_RATE : 0) +
      (lslMovements === "Y" ? LSL_MOVEMENTS_RATE : 0);
    setTotalExtraCostPercent(totalExtraPercent);

    const calculatedExtraCost = income * totalExtraPercent;
    setExtraCost(calculatedExtraCost);

    const extraExpensesAmount = extraExpenses === "Y" ? additionalExpenses : 0;
    const cost = income + calculatedExtraCost + extraExpensesAmount;
    setTotalCost(cost);

    const calculatedDailyCost = cost / workingDays;
    setDailyCost(calculatedDailyCost);

    const marginDecimal = targetMarginPercent / 100;
    const marginAmount = (calculatedDailyCost / (1 - marginDecimal)) - calculatedDailyCost;
    const clientRate = calculatedDailyCost + marginAmount;

    setTargetMarginAmount(marginAmount);
    setDailyClientRate(clientRate);
    setAnnualProfit(marginAmount * workingDays);
    setAnnualRevenue(clientRate * workingDays);
  };

  const formatCurrency = (value) => `AUD$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  const formatPercent = (value) => `${value.toFixed(2)}%`;

  return (
    <div className="container">
      <div className="nav-buttons">
        <Link to="/" className="back-button">← Back to All Calculators</Link>
      </div>

      <h1>PHP Contractor GP Calculator</h1>

      <div className="section">
        <h2>Inputs</h2>
        <div className="input-group">
          <label>Daily Rate (AUD$)</label>
          <input type="number" value={dailyRate} onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="input-group">
          <label>Working Days</label>
          <input type="number" value={workingDays} onChange={(e) => setWorkingDays(parseInt(e.target.value) || 0)} />
        </div>
        <div className="input-group">
          <label>PHP to AUD Rate</label>
          <input type="number" value={phpToAudRate} onChange={(e) => setPhpToAudRate(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="input-group">
          <label>Target Margin %</label>
          <input type="number" value={targetMarginPercent} onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="input-group">
          <label>Extra Expenses?</label>
          <select value={extraExpenses} onChange={(e) => setExtraExpenses(e.target.value)}>
            <option value="Y">Yes</option>
            <option value="N">No</option>
          </select>
        </div>
        {extraExpenses === "Y" && (
          <div className="input-group">
            <label>Additional Expenses (AUD$)</label>
            <input type="number" value={additionalExpenses} onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)} />
          </div>
        )}
      </div>

      <div className="section">
        <h2>Results</h2>
        <table className="result-table">
          <tbody>
            <tr><td>Annual Income</td><td>{formatCurrency(annualIncome)}</td></tr>
            <tr><td>Total Extra Cost %</td><td>{formatPercent(totalExtraCostPercent * 100)}</td></tr>
            <tr><td>Extra Cost</td><td>{formatCurrency(extraCost)}</td></tr>
            <tr><td>Extra Expenses</td><td>{formatCurrency(extraExpenses === 'Y' ? additionalExpenses : 0)}</td></tr>
            <tr><td>Total Cost</td><td>{formatCurrency(totalCost)}</td></tr>
            <tr><td>Daily Cost</td><td>{formatCurrency(dailyCost)}</td></tr>
            <tr><td>Target Margin $</td><td>{formatCurrency(targetMarginAmount)}</td></tr>
            <tr><td>Daily Client Rate</td><td>{formatCurrency(dailyClientRate)}</td></tr>
            <tr><td>Annual Profit</td><td>{formatCurrency(annualProfit)}</td></tr>
            <tr><td>Annual Revenue</td><td>{formatCurrency(annualRevenue)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PhpContractorGpCalculator;