import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";

// Define theme classes for different calculator types
const themeClasses = {
  aus: 'aus-theme',
  php: 'php-theme',
  offshore: 'india-theme' // Using india-theme as default for offshore
};

const ConsolidatedGpCalculator = () => {
  // Calculator type selection
  const [calculatorType, setCalculatorType] = useState('ausContractor'); // 'ausContractor', 'ausFte', 'phpContractor', 'phpFte', 'offshore'
  
  // Common state for form inputs and calculated values
  const [dailyRate, setDailyRate] = useState(700);
  const [salaryPackage, setSalaryPackage] = useState(110000);
  const [targetMarginPercent, setTargetMarginPercent] = useState(35);
  const [dailyClientRate, setDailyClientRate] = useState(950);
  
  // PHP specific state with API integration
  const [phpRate, setPhpRate] = useState(0.02800); // Default rate
  const [phpMonthlySalary, setPhpMonthlySalary] = useState(150000);
  const [rateInputMode, setRateInputMode] = useState('dailyRate'); // 'dailyRate' or 'phpSalary'/'localSalary'
  
  // Offshore specific state
  const [country, setCountry] = useState("India");
  const [currency, setCurrency] = useState("INR");
  const [monthlyLocalSalary, setMonthlyLocalSalary] = useState(84210);
  
  // Available countries and their currencies for offshore
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
    PHP: 0.02800,
  };
  
  // API status tracking
  const [apiStatus, setApiStatus] = useState(null);
  const [isApiLoading, setIsApiLoading] = useState(false);
  
  // Additional state for FTE calculators
  const [thirteenthMonthPay, setThirteenthMonthPay] = useState('Y');
  const [hmo, setHmo] = useState(150);
  
  // State for configuration settings
  const [payrollTaxApplicable, setPayrollTaxApplicable] = useState('Y');
  const [workcover, setWorkcover] = useState('Y');
  const [leaveMovements, setLeaveMovements] = useState('N');
  const [lslMovements, setLslMovements] = useState('N');
  const [workingDays, setWorkingDays] = useState(220);
  const [phpFteWorkingDays, setPhpFteWorkingDays] = useState(240);
  const [extraExpenses, setExtraExpenses] = useState('N');
  const [additionalExpenses, setAdditionalExpenses] = useState(0);
  
  // State for calculation mode
  const [calculationMode, setCalculationMode] = useState('dailyRate'); // 'dailyRate', 'clientRate', 'targetMargin', 'salaryPackage'
  
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

  // Function to handle country change
  const handleCountryChange = (selectedCountry) => {
    setCountry(selectedCountry);
    const selectedCurrency = COUNTRIES[selectedCountry];
    setCurrency(selectedCurrency);
    fetchExchangeRate(selectedCurrency);
  };

  // Fetch exchange rate from API when component mounts or calculator type changes
  useEffect(() => {
    if (calculatorType.startsWith('php')) {
      fetchExchangeRate('PHP');
    } else if (calculatorType === 'offshore') {
      fetchExchangeRate(currency);
    }
  }, [calculatorType, currency]);

  // Function to fetch exchange rate from API
  const fetchExchangeRate = async (currencyCode) => {
    if (!currencyCode) return;
    
    setIsApiLoading(true);
    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=AUD&to=${currencyCode}`);
      setApiStatus(response.status);
      
      if (response.ok) {
        const data = await response.json();
        // Calculate currency/AUD rate as 1 / (rate from API)
        const newRate = 1 / data.rates[currencyCode];
        
        if (calculatorType.startsWith('php') || currencyCode === 'PHP') {
          setPhpRate(parseFloat(newRate.toFixed(5)));
        } else if (calculatorType === 'offshore') {
          // For offshore, we use the common exchange rate variable
          setPhpRate(parseFloat(newRate.toFixed(5))); // We're reusing the phpRate variable
        }
      } else {
        console.error('API returned error status:', response.status);
        // Use the default fallback rate
        if (calculatorType.startsWith('php') || currencyCode === 'PHP') {
          setPhpRate(EXCHANGE_RATES.PHP);
        } else if (calculatorType === 'offshore') {
          setPhpRate(EXCHANGE_RATES[currencyCode] || 0.01); // Fallback rate
        }
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setApiStatus(500);
      // Use the default fallback rate
      if (calculatorType.startsWith('php') || currencyCode === 'PHP') {
        setPhpRate(EXCHANGE_RATES.PHP);
      } else if (calculatorType === 'offshore') {
        setPhpRate(EXCHANGE_RATES[currencyCode] || 0.01); // Fallback rate
      }
    } finally {
      setIsApiLoading(false);
    }
  };

  // Set initial values based on calculator type
  useEffect(() => {
    resetDefaults();
  }, [calculatorType]);

  const resetDefaults = () => {
    switch (calculatorType) {
      case 'ausContractor':
        setDailyRate(700);
        setTargetMarginPercent(35);
        setDailyClientRate(950);
        setPayrollTaxApplicable('Y');
        setWorkcover('Y');
        setLeaveMovements('N');
        setLslMovements('N');
        setWorkingDays(220);
        setExtraExpenses('N');
        setAdditionalExpenses(0);
        break;
      case 'ausFte':
        setSalaryPackage(110000);
        setTargetMarginPercent(35);
        setDailyClientRate(1050);
        setPayrollTaxApplicable('Y');
        setWorkcover('Y');
        setLeaveMovements('Y');
        setLslMovements('Y');
        setWorkingDays(220);
        setExtraExpenses('N');
        setAdditionalExpenses(0);
        break;
      case 'phpContractor':
        // Don't reset phpRate here as it's now coming from the API
        setDailyRate(200);
        setTargetMarginPercent(50);
        setDailyClientRate(266);
        setPhpMonthlySalary(150000);
        setRateInputMode('dailyRate');
        setPayrollTaxApplicable('N');
        setWorkcover('N');
        setLeaveMovements('N');
        setLslMovements('N');
        setWorkingDays(220);
        setExtraExpenses('Y');
        setAdditionalExpenses(100);
        break;
      case 'phpFte':
        // Don't reset phpRate here as it's now coming from the API
        setDailyRate(210);
        setTargetMarginPercent(50);
        setDailyClientRate(286);
        setPhpMonthlySalary(142857);
        setRateInputMode('dailyRate');
        setPayrollTaxApplicable('N');
        setWorkcover('N');
        setLeaveMovements('N');
        setLslMovements('N');
        setWorkingDays(220);
        setPhpFteWorkingDays(240);
        setExtraExpenses('N');
        setAdditionalExpenses(0);
        setThirteenthMonthPay('Y');
        setHmo(150);
        break;
      case 'offshore':
        setDailyRate(200);
        setTargetMarginPercent(50);
        setDailyClientRate(265.73);
        setMonthlyLocalSalary(84210);
        setRateInputMode('dailyRate');
        setPayrollTaxApplicable('N');
        setWorkcover('N');
        setLeaveMovements('N');
        setLslMovements('N');
        setWorkingDays(220);
        setExtraExpenses('Y');
        setAdditionalExpenses(150);
        setCountry('India');
        setCurrency('INR');
        break;
      default:
        break;
    }
  };

  // Effect to handle conversion between daily rate and monthly salary in local currency
  useEffect(() => {
    if (calculatorType.startsWith('php') || calculatorType === 'offshore') {
      if (rateInputMode === 'dailyRate' && phpRate > 0) {
        // Calculate monthly salary from daily rate
        const calculatedMonthlySalary = (dailyRate * DAYS_PER_MONTH) / phpRate;
        
        if (calculatorType.startsWith('php')) {
          setPhpMonthlySalary(calculatedMonthlySalary);
        } else if (calculatorType === 'offshore') {
          setMonthlyLocalSalary(calculatedMonthlySalary);
        }
      } else if ((rateInputMode === 'phpSalary' || rateInputMode === 'localSalary') && phpRate > 0) {
        // Calculate daily rate from monthly salary
        let calculatedDailyRate;
        
        if (calculatorType.startsWith('php')) {
          calculatedDailyRate = (phpMonthlySalary * phpRate) / DAYS_PER_MONTH;
        } else if (calculatorType === 'offshore') {
          calculatedDailyRate = (monthlyLocalSalary * phpRate) / DAYS_PER_MONTH;
        }
        
        setDailyRate(calculatedDailyRate);
      }
    }
  }, [dailyRate, phpMonthlySalary, monthlyLocalSalary, phpRate, rateInputMode, calculatorType]);

  // Effect to handle exchange rate changes
  useEffect(() => {
    if (phpRate <= 0) return;
    
    if (calculatorType.startsWith('php') || calculatorType === 'offshore') {
      if (rateInputMode === 'dailyRate') {
        // Recalculate monthly salary based on current daily rate
        const calculatedMonthlySalary = (dailyRate * DAYS_PER_MONTH) / phpRate;
        
        if (calculatorType.startsWith('php')) {
          setPhpMonthlySalary(calculatedMonthlySalary);
        } else if (calculatorType === 'offshore') {
          setMonthlyLocalSalary(calculatedMonthlySalary);
        }
      } else {
        // Recalculate daily rate based on current monthly salary
        let calculatedDailyRate;
        
        if (calculatorType.startsWith('php')) {
          calculatedDailyRate = (phpMonthlySalary * phpRate) / DAYS_PER_MONTH;
        } else if (calculatorType === 'offshore') {
          calculatedDailyRate = (monthlyLocalSalary * phpRate) / DAYS_PER_MONTH;
        }
        
        setDailyRate(calculatedDailyRate);
      }
    }
  }, [phpRate, calculatorType, rateInputMode]);

  // Perform calculations whenever inputs change
  useEffect(() => {
    calculateValues();
  }, [
    calculatorType,
    dailyRate,
    salaryPackage,
    phpRate,
    phpMonthlySalary,
    monthlyLocalSalary,
    targetMarginPercent,
    dailyClientRate,
    payrollTaxApplicable,
    workcover,
    leaveMovements,
    lslMovements,
    workingDays,
    phpFteWorkingDays,
    extraExpenses,
    additionalExpenses,
    thirteenthMonthPay,
    hmo,
    calculationMode,
    country,
    currency
  ]);

  // Function to handle the main calculations
  const calculateValues = () => {
    // Calculate annual income based on calculator type
    let annualIncomeValue = 0;
    if (calculatorType === 'ausContractor' || calculatorType.startsWith('php') || calculatorType === 'offshore') {
      const effectiveWorkingDays = calculatorType === 'phpFte' ? phpFteWorkingDays : workingDays;
      annualIncomeValue = dailyRate * effectiveWorkingDays;
    } else if (calculatorType === 'ausFte') {
      annualIncomeValue = salaryPackage;
    }
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

    // Calculate 13th month pay if applicable (PHP FTE only)
    let thirteenthMonthValue = 0;
    if (calculatorType === 'phpFte' && thirteenthMonthPay === 'Y') {
      thirteenthMonthValue = annualIncomeValue / 12;
    }
    setThirteenthMonthPayAmount(thirteenthMonthValue);

    // Calculate total cost
    const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
    const hmoAmount = calculatorType === 'phpFte' ? hmo : 0;
    const totalCostValue = annualIncomeValue + extraCostValue + extraExpensesAmount + thirteenthMonthValue + hmoAmount;
    setTotalCost(totalCostValue);

    // Calculate daily cost
    const dailyCostValue = totalCostValue / workingDays;
    setDailyCost(dailyCostValue);

    // Perform specific calculations based on the calculation mode and calculator type
    if (calculationMode === 'dailyRate') {
      // Calculate daily client rate from daily rate/salary and target margin
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
      
    } else if (calculationMode === 'salaryPackage' && calculatorType === 'ausFte') {
      // Calculate salary package from target margin and daily client rate
      const impliedDailyCost = dailyClientRate * (1 - targetMarginPercent / 100);
      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
      
      // Determine the salary package needed to result in the implied daily cost
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
      
    } else if (calculationMode === 'clientRate') {
      // Calculate daily rate from target margin and daily client rate
      const impliedDailyCost = dailyClientRate * (1 - targetMarginPercent / 100);
      const impliedTotalCost = impliedDailyCost * workingDays;
      const extraExpensesAmount = extraExpenses === 'Y' ? additionalExpenses : 0;
      const hmoAmount = calculatorType === 'phpFte' ? hmo : 0;
      
      // Determine the income value needed to result in the implied daily cost
      const calculatedAnnualIncome = (impliedTotalCost - extraExpensesAmount - thirteenthMonthValue - hmoAmount) / (1 + totalExtraPercent);
      
      if (calculatorType === 'ausFte') {
        // For AUS FTE, update salary package
        if (Math.abs(calculatedAnnualIncome - salaryPackage) > 1) {
          setSalaryPackage(calculatedAnnualIncome);
        }
      } else {
        // For other calculators, update daily rate
        const calculatedDailyRate = calculatedAnnualIncome / workingDays;
        
        if (Math.abs(calculatedDailyRate - dailyRate) > 1) {
          setDailyRate(calculatedDailyRate);
          
          // Update monthly salary based on rate input mode and calculator type
          if (rateInputMode !== 'dailyRate' && phpRate > 0) {
            if (calculatorType.startsWith('php')) {
              const calculatedPhpMonthlySalary = (calculatedDailyRate * DAYS_PER_MONTH) / phpRate;
              setPhpMonthlySalary(calculatedPhpMonthlySalary);
            } else if (calculatorType === 'offshore') {
              const calculatedLocalMonthlySalary = (calculatedDailyRate * DAYS_PER_MONTH) / phpRate;
              setMonthlyLocalSalary(calculatedLocalMonthlySalary);
            }
          }
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

  // Toggle between daily rate and local currency salary as input
  const toggleRateInputMode = () => {
    if (calculatorType.startsWith('php')) {
      setRateInputMode(currentMode => currentMode === 'dailyRate' ? 'phpSalary' : 'dailyRate');
    } else if (calculatorType === 'offshore') {
      setRateInputMode(currentMode => currentMode === 'dailyRate' ? 'localSalary' : 'dailyRate');
    }
  };

  // Handle calculator type change
  const handleCalculatorTypeChange = (type) => {
    setCalculatorType(type);
    
    // Reset calculation mode based on type
    if (type === 'ausFte') {
      setCalculationMode(currentMode => 
        currentMode === 'clientRate' ? 'salaryPackage' : currentMode
      );
    } else if (calculationMode === 'salaryPackage') {
      setCalculationMode('dailyRate');
    }
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    setCalculationMode(mode);
  };

  // Handle PHP rate change
  const handleRateChange = (value) => {
    const rate = parseFloat(value);
    if (rate > 0) {
      setPhpRate(rate);
    } else {
      // Set default fallback based on calculator type and currency
      if (calculatorType.startsWith('php')) {
        setPhpRate(0.02800);
      } else if (calculatorType === 'offshore') {
        setPhpRate(EXCHANGE_RATES[currency] || 0.01);
      }
    }
  };

  // Format currency with prefixes and 2 decimal points
  const formatCurrency = (value) => {
    return `AUD$ ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format local currency with appropriate prefix and 2 decimal points
  const formatLocalCurrency = (value) => {
    if (calculatorType.startsWith('php')) {
      return `₱${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    } else if (calculatorType === 'offshore') {
      return `${currency} ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    }
    return `${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Format percentage with 2 decimal points
  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Handle currency input changes
  const handleCurrencyInputChange = (value, setter) => {
    // Remove all non-digit characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    // Parse to float or default to 0
    setter(numericValue === '' ? 0 : parseFloat(numericValue));
  };

  // Generate page title based on calculator type
  const getPageTitle = () => {
    switch (calculatorType) {
      case 'ausContractor': return 'AUS Contractor GP Calculator';
      case 'ausFte': return 'AUS FTE GP Calculator';
      case 'phpContractor': return 'PHP Contractor GP Calculator';
      case 'phpFte': return 'PHP FTE GP Calculator';
      case 'offshore': return `${country} Offshore Contractor GP Calculator`;
      default: return 'GP Calculator';
    }
  };

  // Determine which calculation modes are available based on calculator type
  const getAvailableCalcModes = () => {
    if (calculatorType === 'ausFte') {
      return [
        { id: 'dailyRate', label: 'Calculate Client Rate' },
        { id: 'salaryPackage', label: 'Calculate Salary Package' },
        { id: 'targetMargin', label: 'Calculate Target Margin' }
      ];
    } else {
      return [
        { id: 'dailyRate', label: 'Calculate Client Rate' },
        { id: 'clientRate', label: 'Calculate Contractor Rate' },
        { id: 'targetMargin', label: 'Calculate Target Margin' }
      ];
    }
  };

  // Determine current theme based on calculator type
  const getCurrentTheme = () => {
    if (calculatorType.startsWith('aus')) {
      return themeClasses.aus;
    } else if (calculatorType.startsWith('php')) {
      return themeClasses.php;
    } else if (calculatorType === 'offshore') {
      return themeClasses.offshore;
    }
    return themeClasses.aus; // Default
  };

  // Get API status indicator to display alongside the exchange rate
  const getApiStatusIndicator = () => {
    if (isApiLoading) return '(Loading...)';
    if (apiStatus === null) return '';
    return `(Status: ${apiStatus})`;
  };

  const currentTheme = getCurrentTheme();

  return (
    <div className={`container ${currentTheme}`} style={{ maxWidth: "800px", margin: "0 auto", padding: "12px" }}>
      <div className="nav-buttons" style={{ marginBottom: "8px" }}>
        <Link to="/" className="back-button">&#8592; Back to All Calculators</Link>
      </div>
      
      <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Offshore Contractor GP Calculator</h1>
      
      <div className={`calculator-card ${currentTheme}`} style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Calculator Type</h2>
        <div className="input-group" style={{ display: 'flex', gap: '5px', marginBottom: "12px", flexWrap: "wrap" }}>
          <button 
            onClick={() => handleCalculatorTypeChange('ausContractor')}
            className={calculatorType === 'ausContractor' ? 'active' : ''}
            style={{ 
              flex: "1 1 18%", 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            AUS Contractor
          </button>
          <button 
            onClick={() => handleCalculatorTypeChange('ausFte')}
            className={calculatorType === 'ausFte' ? 'active' : ''}
            style={{ 
              flex: "1 1 18%", 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            AUS FTE
          </button>
          <button 
            onClick={() => handleCalculatorTypeChange('phpContractor')}
            className={calculatorType === 'phpContractor' ? 'active' : ''}
            style={{ 
              flex: "1 1 18%", 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            PHP Contractor
          </button>
          <button 
            onClick={() => handleCalculatorTypeChange('phpFte')}
            className={calculatorType === 'phpFte' ? 'active' : ''}
            style={{ 
              flex: "1 1 18%", 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            PHP FTE
          </button>
          <button 
            onClick={() => handleCalculatorTypeChange('offshore')}
            className={calculatorType === 'offshore' ? 'active' : ''}
            style={{ 
              flex: "1 1 18%", 
              padding: "8px 0",
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            Offshore Contractor (LK,IN,VN,NZ)
          </button>
        </div>
        
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>{getPageTitle()}</h2>
        
        {/* Country selection for offshore calculator */}
        {calculatorType === 'offshore' && (
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Country</label>
            <select 
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              style={{ 
                padding: "6px", 
                fontSize: "0.85rem", 
                width: "100%", 
                maxWidth: "200px",
                border: "1px solid #d1d5db", 
                borderRadius: "4px"
              }}
            >
              {Object.keys(COUNTRIES).map((countryName) => (
                <option key={countryName} value={countryName}>
                  {countryName}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Calculation Mode</h2>
        <div className="input-group" style={{ display: 'flex', gap: '5px', marginBottom: "12px" }}>
          {getAvailableCalcModes().map(mode => (
            <button 
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={calculationMode === mode.id ? 'active' : ''}
              style={{ 
                flex: 1, 
                padding: "8px 0",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
        
        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: "1 1 50%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Configuration</h2>
            
            {/* Show currency for offshore */}
            {calculatorType === 'offshore' && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Currency</label>
                <input
                  type="text"
                  value={currency}
                  readOnly
                  style={{ 
                    width: "15%", 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "#f3f4f6"
                  }}
                />
              </div>
            )}
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <div style={{ flex: "1 1 50%" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Is Payroll Tax applicable?</label>
                <select 
                  value={payrollTaxApplicable} 
                  onChange={(e) => setPayrollTaxApplicable(e.target.value)}
                  disabled={calculatorType.startsWith('php') || calculatorType === 'offshore'}
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: (calculatorType.startsWith('php') || calculatorType === 'offshore') ? "#f3f4f6" : "white",
                    color: (calculatorType.startsWith('php') || calculatorType === 'offshore') ? "#6b7280" : "black"
                  }}
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
                  style={{ 
                    padding: "6px", 
                    fontSize: "0.85rem", 
                    width: "100%", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "4px",
                    backgroundColor: "white",
                    color: "black"
                  }}
                >
                  <option value="Y">Yes</option>
                  <option value="N">No</option>
                </select>
              </div>
            </div>
            
            {/* Exchange rate field for PHP and offshore calculators */}
            {(calculatorType.startsWith('php') || calculatorType === 'offshore') && (
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <div style={{ flex: "1 1 50%" }}>
                  <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                    {calculatorType.startsWith('php') ? 'PHP/AUD' : `${currency}/AUD`} <span style={{ 
                      color: apiStatus === 200 ? "#22c55e" : (apiStatus ? "#ef4444" : "#6b7280")
                    }}>{getApiStatusIndicator()}</span>
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={phpRate.toFixed(5)}
                    onChange={(e) => handleRateChange(e.target.value)}
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
                
                {calculatorType === 'phpFte' && (
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
                )}
              </div>
            )}
            
            {extraExpenses === 'Y' && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>Extra Expenses Amount ($)</label>
                <input
                  type="number"
                  value={additionalExpenses}
                  onChange={(e) => setAdditionalExpenses(parseFloat(e.target.value) || 0)}
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
              </div>
            )}

            {calculatorType === 'phpFte' && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>HMO ($)</label>
                <input
                  type="number"
                  value={hmo}
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
            )}
          </div>
          
          <div style={{ flex: "1 1 50%" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Calculation Inputs</h2>
            
            {/* Rate input switch for PHP and offshore calculators */}
            {(calculatorType.startsWith('php') || calculatorType === 'offshore') && calculationMode !== 'clientRate' && (
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
                  Switch to {rateInputMode === 'dailyRate' ? 
                    (calculatorType.startsWith('php') ? 'PHP Salary' : `${currency} Salary`) : 
                    'Daily Rate'} input
                </button>
              </div>
            )}

            {/* AUS FTE specific Salary Package input */}
            {calculatorType === 'ausFte' && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                  AUD$ Salary Package (Including Super)
                  {calculationMode === 'salaryPackage' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "8px", top: "6px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
                  <input
                    type="text"
                    value={calculationMode === 'salaryPackage' ? 
                      Math.round(salaryPackage) : 
                      salaryPackage === 0 ? '' : Math.round(salaryPackage)}
                    onChange={(e) => handleCurrencyInputChange(e.target.value, setSalaryPackage)}
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
                    disabled={calculationMode === 'salaryPackage'}
                  />
                </div>
              </div>
            )}

            {/* Daily Rate input for all calculators except AUS FTE */}
            {calculatorType !== 'ausFte' && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                  AUD$ Daily Rate
                  {calculationMode === 'clientRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
                  {(calculatorType.startsWith('php') || calculatorType === 'offshore') && rateInputMode !== 'dailyRate' && calculationMode !== 'clientRate' && 
                    <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "8px", top: "6px", color: "#6b7280", fontSize: "0.85rem" }}>AUD$</div>
                  <input
                    type="text"
                    value={calculationMode === 'clientRate' || 
                          ((calculatorType.startsWith('php') || calculatorType === 'offshore') && rateInputMode !== 'dailyRate') ? 
                      Math.round(dailyRate) : 
                      dailyRate === 0 ? '' : Math.round(dailyRate)}
                    onChange={(e) => handleCurrencyInputChange(e.target.value, setDailyRate)}
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
                    disabled={calculationMode === 'clientRate' || 
                             ((calculatorType.startsWith('php') || calculatorType === 'offshore') && rateInputMode !== 'dailyRate')}
                  />
                </div>
              </div>
            )}

            {/* Monthly Salary input for PHP calculators */}
            {calculatorType.startsWith('php') && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                  PHP Monthly Salary {calculatorType === 'phpFte' ? '(FTE)' : '(160 hours)'}
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
            )}

            {/* Monthly Salary input for offshore calculators */}
            {calculatorType === 'offshore' && (
              <div style={{ marginBottom: "8px" }}>
                <label style={{ fontSize: "0.85rem", marginBottom: "4px", display: "block" }}>
                  {currency} Monthly Salary (160 hours)
                  {rateInputMode === 'dailyRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
                  {calculationMode === 'clientRate' && <span style={{ marginLeft: "4px", color: "#dc2626", fontWeight: "bold" }}>(Calculated)</span>}
                </label>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "8px", top: "6px", color: "#6b7280", fontSize: "0.85rem" }}>{currency}</div>
                  <input
                    type="text"
                    value={rateInputMode === 'dailyRate' || calculationMode === 'clientRate' ? 
                      Math.round(monthlyLocalSalary) : 
                      monthlyLocalSalary === 0 ? '' : Math.round(monthlyLocalSalary)}
                    onChange={(e) => handleCurrencyInputChange(e.target.value, setMonthlyLocalSalary)}
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
                    disabled={rateInputMode === 'dailyRate' || calculationMode === 'clientRate'}
                  />
                </div>
              </div>
            )}

            {/* Target Margin field common to all calculator types */}
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

            {/* Daily Client Rate field common to all calculator types */}
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
      
      <div className={`highlight-box ${currentTheme}`} style={{ marginBottom: "12px", border: "1px solid #e5e7eb", borderRadius: "4px", padding: "12px", backgroundColor: "#f9fafb" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Results</h2>
        <div className="result-summary">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <tbody>
              {/* Monthly Salary for PHP Calculators */}
              {calculatorType.startsWith('php') && (
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "4px 8px" }}>
                    PHP Monthly Salary {calculatorType === 'phpFte' ? '(FTE)' : '(160 hours)'}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {formatLocalCurrency(phpMonthlySalary)}
                  </td>
                </tr>
              )}
              
              {/* Monthly Salary for Offshore Calculators */}
              {calculatorType === 'offshore' && (
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "4px 8px" }}>
                    {currency} Monthly Salary (160 hours)
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {formatLocalCurrency(monthlyLocalSalary)}
                  </td>
                </tr>
              )}
              
              {/* Salary Package for AUS FTE */}
              {calculatorType === 'ausFte' && (
                <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "4px 8px" }}>Salary Package (Including Super)</td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(salaryPackage)}</td>
                </tr>
              )}
              
              {/* Daily Rate for all calculators */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Daily Rate</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyRate)}</td>
              </tr>
              
              {/* Annual Income */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Annual Income</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(annualIncome)}</td>
              </tr>
              
              {/* Payroll Tax */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Payroll Tax ({formatPercent(PAYROLL_TAX_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(payrollTax)}</td>
              </tr>
              
              {/* Workcover */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Workcover ({formatPercent(WORKCOVER_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(workCoverAmount)}</td>
              </tr>
              
              {/* Leave Movements */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Leave Movements ({formatPercent(LEAVE_MOVEMENTS_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(leaveMovementsAmount)}</td>
              </tr>
              
              {/* LSL Movements */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>LSL Movements ({formatPercent(LSL_MOVEMENTS_RATE * 100)})</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(lslMovementsAmount)}</td>
              </tr>
              
              {/* Total Extra Cost Percentage */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Total Extra Cost %</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatPercent(totalExtraCostPercent * 100)}</td>
              </tr>
              
              {/* Extra Cost */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Extra Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(extraCost)}</td>
              </tr>
              
              {/* Extra Expenses */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Extra Expenses</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(extraExpenses === 'Y' ? additionalExpenses : 0)}</td>
              </tr>
              
              {/* HMO and 13th Month Pay for PHP FTE */}
              {calculatorType === 'phpFte' && (
                <>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "4px 8px" }}>HMO</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(hmo)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "4px 8px" }}>13th Month Pay</td>
                    <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(thirteenthMonthPayAmount)}</td>
                  </tr>
                </>
              )}
              
              {/* Total Cost */}
              <tr className="result-highlight" style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Total Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(totalCost)}</td>
              </tr>
              
              {/* Daily Cost */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Daily Cost</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyCost)}</td>
              </tr>
              
              {/* Target Margin % */}
              <tr className="result-highlight" style={{ borderBottom: "1px solid #e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin %</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatPercent(targetMarginPercent)}</td>
              </tr>
              
              {/* Target Margin $ */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Target Margin $</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(targetMarginAmount)}</td>
              </tr>
              
              {/* Daily Client Rate */}
              <tr className="result-highlight" style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: "#e5e7eb", fontWeight: "bold" }}>
                <td style={{ padding: "4px 8px" }}>Daily Client Rate</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(dailyClientRate)}</td>
              </tr>
              
              {/* Annual Profit */}
              <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "4px 8px" }}>Annual Profit</td>
                <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(annualProfit)}</td>
              </tr>
              
              {/* Annual Revenue */}
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

export default ConsolidatedGpCalculator;