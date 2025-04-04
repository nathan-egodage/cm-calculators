// src/calculators/PhpFteGpCalculator.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, DollarSign, Calculator } from 'lucide-react';
import { useTheme } from "../contexts/ThemeContext";
import { APP_VERSION } from "../config/appConfig";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/Card";
import { FormGroup, FormLabel, FormInput, FormSelect } from "../components/ui/FormComponents";

const PhpFteGpCalculator = () => {
  const { darkMode } = useTheme();
  
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

  // Refresh exchange rate from API
  const refreshExchangeRate = async () => {
    setIsApiLoading(true);
    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=AUD&to=PHP');
      setApiStatus(response.status);
      
      if (response.ok) {
        const data = await response.json();
        const newRate = 1 / data.rates.PHP;
        setPhpRate(parseFloat(newRate.toFixed(5)));
      }
    } catch (error) {
      console.error('Error refreshing exchange rate:', error);
      setApiStatus(500);
    } finally {
      setIsApiLoading(false);
    }
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">PHP FTE GP Calculator</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Calculate gross profit for Philippine full-time employees</p>
      </div>
      
      {/* Calculation Mode Tabs */}
      <Card className="mb-6 border border-blue-100 dark:border-blue-900">
        <CardHeader className="bg-blue-50 dark:bg-blue-900 pb-2">
          <CardTitle>Calculation Mode</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={calculationMode === 'dailyRate' ? 'primary' : 'outline'}
              onClick={() => setCalculationMode('dailyRate')}
              className="flex-1 sm:flex-none"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Client Rate
            </Button>
            <Button
              variant={calculationMode === 'clientRate' ? 'primary' : 'outline'}
              onClick={() => setCalculationMode('clientRate')}
              className="flex-1 sm:flex-none"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Contractor Rate
            </Button>
            <Button
              variant={calculationMode === 'targetMargin' ? 'primary' : 'outline'}
              onClick={() => setCalculationMode('targetMargin')}
              className="flex-1 sm:flex-none"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Target Margin
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PHP/AUD Rate */}
              <FormGroup className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <FormLabel htmlFor="php-rate">
                    PHP/AUD Rate 
                    <span className={`ml-2 text-xs ${
                      apiStatus === 200 ? 'text-green-500' : 
                      apiStatus ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {isApiLoading ? 'Loading...' : apiStatus ? `(API: ${apiStatus})` : ''}
                    </span>
                  </FormLabel>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshExchangeRate}
                    disabled={isApiLoading}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                <FormInput
                  id="php-rate"
                  type="number"
                  step="0.00001"
                  value={phpRate}
                  onChange={(e) => setPhpRate(Math.max(0.00001, parseFloat(e.target.value) || 0))}
                />
              </FormGroup>

              {/* Payroll Tax */}
              <FormGroup>
                <FormLabel htmlFor="payroll-tax">Payroll Tax Applicable</FormLabel>
                <FormSelect
                  id="payroll-tax"
                  value={payrollTaxApplicable}
                  onChange={(e) => setPayrollTaxApplicable(e.target.value)}
                  disabled={true}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </FormSelect>
              </FormGroup>

              {/* Workcover */}
              <FormGroup>
                <FormLabel htmlFor="workcover">Workcover</FormLabel>
                <FormSelect
                  id="workcover"
                  value={workcover}
                  onChange={(e) => setWorkcover(e.target.value)}
                  disabled={true}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </FormSelect>
              </FormGroup>

              {/* Leave Movements */}
              <FormGroup>
                <FormLabel htmlFor="leave-movements">Leave Movements</FormLabel>
                <FormSelect
                  id="leave-movements"
                  value={leaveMovements}
                  onChange={(e) => setLeaveMovements(e.target.value)}
                  disabled={true}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </FormSelect>
              </FormGroup>

              {/* LSL Movements */}
              <FormGroup>
                <FormLabel htmlFor="lsl-movements">LSL Movements</FormLabel>
                <FormSelect
                  id="lsl-movements"
                  value={lslMovements}
                  onChange={(e) => setLslMovements(e.target.value)}
                  disabled={true}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </FormSelect>
              </FormGroup>

              {/* Working Days */}
              <FormGroup>
                <FormLabel htmlFor="working-days">Working Days</FormLabel>
                <FormInput
                  id="working-days"
                  type="number"
                  min="1"
                  max="365"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(parseInt(e.target.value) || 220)}
                  disabled={true}
                />
              </FormGroup>

              {/* 13th Month Pay */}
              <FormGroup>
                <FormLabel htmlFor="thirteenth-month">13th Month Pay</FormLabel>
                <FormSelect
                  id="thirteenth-month"
                  value={thirteenthMonthPay}
                  onChange={(e) => setThirteenthMonthPay(e.target.value)}
                  disabled={true}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </FormSelect>
              </FormGroup>

              {/* HMO */}
              <FormGroup>
                <FormLabel htmlFor="hmo">HMO ($)</FormLabel>
                <FormInput
                  id="hmo"
                  type="number"
                  value={hmo}
                  onChange={(e) => setHmo(parseFloat(e.target.value) || 0)}
                  disabled={true}
                  prefix="$"
                />
              </FormGroup>

              {/* Extra Expenses */}
              <FormGroup>
                <FormLabel htmlFor="extra-expenses">Extra Expenses</FormLabel>
                <FormSelect
                  id="extra-expenses"
                  value={extraExpenses}
                  onChange={(e) => setExtraExpenses(e.target.value)}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </FormSelect>
              </FormGroup>

              {/* Additional Expenses Amount */}
              {extraExpenses === 'Y' && (
                <FormGroup className="sm:col-span-2">
                  <FormLabel htmlFor="additional-expenses">Extra Expenses Amount ($)</FormLabel>
                  <FormInput
                    id="additional-expenses"
                    type="number"
                    value={additionalExpenses}
                    onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
                    prefix="$"
                  />
                </FormGroup>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calculation Inputs Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Calculation Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Rate Input Toggle */}
            {calculationMode !== 'clientRate' && (
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium">Rate Input Type:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRateInputMode}
                >
                  Switch to {rateInputMode === 'dailyRate' ? 'PHP Salary' : 'Daily Rate'} input
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {/* Daily Rate */}
              <FormGroup>
                <FormLabel htmlFor="daily-rate">
                  AUD$ Daily Rate
                  {(calculationMode === 'clientRate' || 
                    (rateInputMode === 'phpSalary' && calculationMode !== 'clientRate')) && 
                    <span className="ml-2 text-red-500 font-semibold">(Calculated)</span>
                  }
                </FormLabel>
                <FormInput
                  id="daily-rate"
                  type="number"
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                  disabled={calculationMode === 'clientRate' || rateInputMode === 'phpSalary'}
                  prefix="AUD$"
                />
              </FormGroup>

              {/* PHP Monthly Salary */}
              <FormGroup>
                <FormLabel htmlFor="php-monthly-salary">
                  PHP Monthly Salary (FTE)
                  {(rateInputMode === 'dailyRate' || calculationMode === 'clientRate') && 
                    <span className="ml-2 text-red-500 font-semibold">(Calculated)</span>
                  }
                </FormLabel>
                <FormInput
                  id="php-monthly-salary"
                  type="number"
                  step="0.01"
                  value={phpMonthlySalary}
                  onChange={(e) => setPhpMonthlySalary(parseFloat(e.target.value) || 0)}
                  disabled={rateInputMode === 'dailyRate' || calculationMode === 'clientRate'}
                  prefix="₱"
                />
              </FormGroup>

              {/* Target Margin */}
              <FormGroup>
                <FormLabel htmlFor="target-margin">
                  Target Margin %
                  {calculationMode === 'targetMargin' && 
                    <span className="ml-2 text-red-500 font-semibold">(Calculated)</span>
                  }
                </FormLabel>
                <FormInput
                  id="target-margin"
                  type="number"
                  step="0.01"
                  value={targetMarginPercent}
                  onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)}
                  disabled={calculationMode === 'targetMargin'}
                />
              </FormGroup>

              {/* Daily Client Rate */}
              <FormGroup>
                <FormLabel htmlFor="daily-client-rate">
                  AUD$ Daily Client Rate
                  {calculationMode === 'dailyRate' && 
                    <span className="ml-2 text-red-500 font-semibold">(Calculated)</span>
                  }
                </FormLabel>
                <FormInput
                  id="daily-client-rate"
                  type="number"
                  step="0.01"
                  value={dailyClientRate}
                  onChange={(e) => setDailyClientRate(parseFloat(e.target.value) || 0)}
                  disabled={calculationMode === 'dailyRate'}
                  prefix="AUD$"
                />
              </FormGroup>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <Card className="mt-6 border border-blue-100 dark:border-blue-900">
        <CardHeader className="bg-blue-50 dark:bg-blue-900">
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">PHP Monthly Salary (FTE)</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPhpCurrency(phpMonthlySalary)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Daily Rate</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(dailyRate)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Annual Income</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(annualIncome)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Payroll Tax ({formatPercent(PAYROLL_TAX_RATE * 100)})</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(payrollTax)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Workcover ({formatPercent(WORKCOVER_RATE * 100)})</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(workCoverAmount)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Leave Movements ({formatPercent(LEAVE_MOVEMENTS_RATE * 100)})</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(leaveMovementsAmount)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">LSL Movements ({formatPercent(LSL_MOVEMENTS_RATE * 100)})</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(lslMovementsAmount)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Total Extra Cost %</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPercent(totalExtraCostPercent * 100)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Extra Cost</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(extraCost)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Extra Expenses</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(extraExpenses === 'Y' ? additionalExpenses : 0)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">HMO</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(hmo)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">13th Month Pay</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(thirteenthMonthPayAmount)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-blue-50'} font-bold`}>
                  <td className="px-4 py-3 text-sm">Total Cost</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalCost)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Daily Cost</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(dailyCost)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-blue-50'} font-bold`}>
                  <td className="px-4 py-3 text-sm">Target Margin %</td>
                  <td className="px-4 py-3 text-right">{formatPercent(targetMarginPercent)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Target Margin $</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(targetMarginAmount)}</td>
                </tr>
                <tr className={`${darkMode ? 'bg-blue-900' : 'bg-blue-600 text-white'} font-bold`}>
                  <td className="px-4 py-3 text-sm">Daily Client Rate</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(dailyClientRate)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Annual Profit</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(annualProfit)}</td>
                </tr>
                <tr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Annual Revenue</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(annualRevenue)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end text-sm text-gray-500">
          <p>Version: {APP_VERSION.number} ({APP_VERSION.date})</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PhpFteGpCalculator;