import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { ArrowLeft, Calculator } from "lucide-react";
import { APP_VERSION } from "../config/appConfig";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../components/ui/Card";
import { FormGroup, FormLabel, FormInput, FormSelect } from "../components/ui/FormComponents";

const AusContractorGpCalculator = () => {
  const { darkMode } = useTheme();
  
  // State for form inputs and calculated values
  const [dailyRate, setDailyRate] = useState(700);
  const [targetMarginPercent, setTargetMarginPercent] = useState(35);
  const [dailyClientRate, setDailyClientRate] = useState(931.04);
  
  // State for configuration settings
  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState('Y');
  const [workcover, setWorkcover] = useState('Y');
  const [leaveMovements, setLeaveMovements] = useState('N');
  const [lslMovements, setLslMovements] = useState('N');
  const [workingDays, setWorkingDays] = useState(220);
  const [extraExpenses, setExtraExpenses] = useState('N');
  const [additionalExpenses, setAdditionalExpenses] = useState(0);
  
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

  // Constants for calculations
  const PAYROLL_TAX_RATE = 0.0485;
  const WORKCOVER_RATE = 0.0055;
  const LEAVE_MOVEMENTS_RATE = 0.0050;
  const LSL_MOVEMENTS_RATE = 0.0005;

  // Perform calculations whenever inputs change
  useEffect(() => {
    calculateValues();
  }, [
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
    calculationMode
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
      // First, calculate what the daily cost would be given the target margin and daily client rate
      const impliedDailyCost = dailyClientRate * (1 - targetMarginPercent / 100);
      
      // Then, work backwards to determine what daily rate would result in this daily cost
      // totalCost = annualIncome * (1 + totalExtraPercent) + extraExpensesAmount
      // impliedDailyCost = totalCost / workingDays
      
      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
      
      // Solve for annualIncome:
      // impliedTotalCost = annualIncome * (1 + totalExtraPercent) + extraExpensesAmount
      // annualIncome = (impliedTotalCost - extraExpensesAmount) / (1 + totalExtraPercent)
      const calculatedAnnualIncome = (impliedTotalCost - extraExpensesAmount) / (1 + totalExtraPercent);
      
      // Calculate daily rate
      const calculatedDailyRate = calculatedAnnualIncome / workingDays;
      
      // Update state but avoid infinite loop by not updating if very close to current value
      if (Math.abs(calculatedDailyRate - dailyRate) > 1) {
        setDailyRate(calculatedDailyRate);
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AUS Contractor GP Calculator</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Calculate gross profit for Australian contractors</p>
      </div>
      
      {/* Calculation Mode Tabs */}
      <Card className="mb-6 border border-green-100 dark:border-green-900">
        <CardHeader className="bg-green-50 dark:bg-green-900 pb-2">
          <CardTitle>Calculation Mode</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={calculationMode === 'dailyRate' ? 'primary' : 'outline'}
              onClick={() => handleModeChange('dailyRate')}
              className="flex-1 sm:flex-none"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Client Rate
            </Button>
            <Button
              variant={calculationMode === 'clientRate' ? 'primary' : 'outline'}
              onClick={() => handleModeChange('clientRate')}
              className="flex-1 sm:flex-none"
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Contractor Rate
            </Button>
            <Button
              variant={calculationMode === 'targetMargin' ? 'primary' : 'outline'}
              onClick={() => handleModeChange('targetMargin')}
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
              {/* Payroll Tax */}
              <FormGroup>
                <FormLabel htmlFor="payroll-tax">Payroll Tax Applicable</FormLabel>
                <FormSelect
                  id="payroll-tax"
                  value={payrollTaxApplicable}
                  onChange={(e) => setPayrollTaxApplicable(e.target.value)}
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
            <div className="grid grid-cols-1 gap-4">
              {/* Daily Rate */}
              <FormGroup>
                <FormLabel htmlFor="daily-rate">
                  AUD$ Daily Rate (Including Super)
                  {calculationMode === 'clientRate' && 
                    <span className="ml-2 text-red-500 font-semibold">(Calculated)</span>
                  }
                </FormLabel>
                <FormInput
                  id="daily-rate"
                  type="number"
                  step="0.01"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                  disabled={calculationMode === 'clientRate'}
                  prefix="AUD$"
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
      <Card className="mt-6 border border-green-100 dark:border-green-900">
        <CardHeader className="bg-green-50 dark:bg-green-900">
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Daily Rate (Including Super)</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(dailyRate)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Annual Income (Including Super)</td>
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
                <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-green-50'} font-bold`}>
                  <td className="px-4 py-3 text-sm">Total Cost</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalCost)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Daily Cost</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(dailyCost)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-green-50'} font-bold`}>
                  <td className="px-4 py-3 text-sm">Target Margin %</td>
                  <td className="px-4 py-3 text-right">{formatPercent(targetMarginPercent)}</td>
                </tr>
                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className="px-4 py-3 text-sm">Target Margin $</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(targetMarginAmount)}</td>
                </tr>
                <tr className={`${darkMode ? 'bg-green-900' : 'bg-green-600 text-white'} font-bold`}>
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

export default AusContractorGpCalculator;