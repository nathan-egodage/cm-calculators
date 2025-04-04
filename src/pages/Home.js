import React, { useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import { APP_VERSION, AUTHORIZED_USERS, isUserAuthorized } from "../config/appConfig";
import { 
  Calculator, 
  Calendar, 
  FileText, 
  DollarSign, 
  Globe, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from "../components/ui/Card";

const Home = () => {
  // Get the authenticated user
  const { user, loaded } = useAuth();
  const { darkMode } = useTheme();
  
  // State to track active category filter
  const [activeCategory, setActiveCategory] = useState("all");
  
  // Check if loading is still in progress
  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full flex-col">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Verifying your access permissions...</p>
      </div>
    );
  }
  
  // Check if user is authorized to access the home page
  const isHomeAuthorized = user && 
    AUTHORIZED_USERS.homeAccess.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );
    
  // Check if user is authorized to see BDM calculator
  const isBdmAuthorized = user && 
    AUTHORIZED_USERS.bdmCalculator.some(email => 
      email.toLowerCase() === user.userDetails.toLowerCase()
    );

  // Base calculator data with added category and icon properties
  const baseCalculators = [
    {
      id: "all-cals",
      title: "All GP Calculators",
      description: "Combined view with all GP calculators (AU,PH,LK,IN,VN,NZ)",
      path: "/all-cals",
      category: ["combined", "australia", "philippines", "offshore"],
      theme: "all",
      icon: <Calculator size={20} />
    },
    {
      id: "aus-working-days-cal",
      title: "Australian Working Days Calculator",
      description: "Calculate Australian Working Days",
      path: "/aus-working-days-cal",
      category: ["australia", "tools"],
      theme: "aus",
      icon: <Calendar size={20} />
    },
    {
      id: "generic-contractor-gp",
      title: "Offshore Contractor (Generic)",
      description: "Calculate Gross Profit for Offshore Contractors (LK,VN,IN & NZ)",
      path: "/generic-contractor-gp",
      category: ["offshore"],
      theme: "india",
      icon: <Globe size={20} />
    },
    {
      id: "aus-fte-gp",
      title: "AUS FTE GP Calculator",
      description: "Calculate Gross Profit for Australian Full-Time Employees",
      path: "/aus-fte-gp",
      category: ["australia"],
      theme: "aus",
      icon: <DollarSign size={20} />
    },
    {
      id: "aus-contractor-gp",
      title: "AUS Contractor GP Calculator",
      description: "Calculate Gross Profit for Australian Contractors",
      path: "/aus-contractor-gp",
      category: ["australia"],
      theme: "aus",
      icon: <FileText size={20} />
    },
    {
      id: "php-contractor-gp",
      title: "PHP Contractor GP Calculator",
      description: "Calculate Gross Profit for Philippine Contractors",
      path: "/php-contractor-gp",
      category: ["philippines", "offshore"],
      theme: "php",
      icon: <FileText size={20} />
    },
    {
      id: "php-fte-gp",
      title: "PHP FTE GP Calculator",
      description: "Calculate Gross Profit for Philippine Full-Time Employees",
      path: "/php-fte-gp",
      category: ["philippines", "offshore"],
      theme: "php",
      icon: <DollarSign size={20} />
    }
  ];

  // BDM calculator to conditionally add
  const bdmCalculator = {
    id: "bdm-calculator-v2",
    title: "BDM Commission Calculator",
    description: "Calculate BDM Commissions",
    path: "/bdm-calculator-v2",
    category: ["commission"],
    theme: "commission",
    icon: <DollarSign size={20} />
  };

  // Combine calculators based on authorization
  const calculators = isBdmAuthorized 
    ? [bdmCalculator, ...baseCalculators] 
    : baseCalculators;

  // Filter calculators based on active category
  const filteredCalculators = activeCategory === "all" 
    ? calculators 
    : calculators.filter(calc => calc.category.includes(activeCategory));

  // Category data with labels, colors, and icons
  const categories = [
    { 
      id: "all", 
      label: "All", 
      color: darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
      activeColor: 'bg-blue-600 text-white'
    },
    { 
      id: "australia", 
      label: "Australia", 
      color: darkMode ? 'bg-green-900 hover:bg-green-800' : 'bg-green-100 hover:bg-green-200',
      activeColor: 'bg-green-600 text-white'
    },
    { 
      id: "philippines", 
      label: "Philippines", 
      color: darkMode ? 'bg-blue-900 hover:bg-blue-800' : 'bg-blue-100 hover:bg-blue-200',
      activeColor: 'bg-blue-600 text-white'
    },
    { 
      id: "offshore", 
      label: "Offshore", 
      color: darkMode ? 'bg-orange-900 hover:bg-orange-800' : 'bg-orange-100 hover:bg-orange-200',
      activeColor: 'bg-orange-600 text-white'
    },
    { 
      id: "combined", 
      label: "Combined", 
      color: darkMode ? 'bg-purple-900 hover:bg-purple-800' : 'bg-purple-100 hover:bg-purple-200',
      activeColor: 'bg-purple-600 text-white'
    },
    { 
      id: "tools", 
      label: "Tools", 
      color: darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
      activeColor: 'bg-gray-700 text-white'
    }
  ];

  // Add commission category only if user has access to BDM calculator
  if (isBdmAuthorized) {
    categories.push({ 
      id: "commission", 
      label: "Commission", 
      color: darkMode ? 'bg-yellow-900 hover:bg-yellow-800' : 'bg-yellow-100 hover:bg-yellow-200',
      activeColor: 'bg-yellow-600 text-white'
    });
  }

  // Get theme color based on calculator theme
  const getThemeColors = (theme) => {
    switch(theme) {
      case 'aus':
        return {
          iconBg: darkMode ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600',
          accent: 'border-l-4 border-green-600'
        };
      case 'php':
        return {
          iconBg: darkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-600',
          accent: 'border-l-4 border-blue-600'
        };
      case 'india':
        return {
          iconBg: darkMode ? 'bg-orange-900 text-orange-400' : 'bg-orange-100 text-orange-600',
          accent: 'border-l-4 border-orange-600'
        };
      case 'commission':
        return {
          iconBg: darkMode ? 'bg-yellow-900 text-yellow-400' : 'bg-yellow-100 text-yellow-600',
          accent: 'border-l-4 border-yellow-600'
        };
      case 'all':
        return {
          iconBg: darkMode ? 'bg-purple-900 text-purple-400' : 'bg-purple-100 text-purple-600',
          accent: 'border-l-4 border-purple-600'
        };
      default:
        return {
          iconBg: darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600',
          accent: 'border-l-4 border-gray-600'
        };
    }
  };

  return (
    <div className="px-4 py-6 max-w-7xl mx-auto animate-fade-in">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">CloudMarc Calculators</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select a calculator to get started or use the filters to narrow down your options.
        </p>
      </div>
      
      {/* Category Filters */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(category => (
            <button 
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                activeCategory === category.id 
                  ? category.activeColor
                  : `${category.color} ${darkMode ? 'text-gray-200' : 'text-gray-700'}`
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Calculators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCalculators.map(calculator => {
          const themeColors = getThemeColors(calculator.theme);
          
          return (
            <Link to={calculator.path} key={calculator.id} className="block">
              <Card className={`h-full transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1 ${themeColors.accent}`}>
                <CardContent className="p-5">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 rounded-md w-10 h-10 flex items-center justify-center mr-4 ${themeColors.iconBg}`}>
                      {calculator.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 flex items-center justify-between">
                        {calculator.title}
                        <ArrowRight size={16} className="text-gray-400" />
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {calculator.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      
      {/* App Version */}
      <div className="mt-8 text-right text-xs text-gray-500">
        <p>Owner: {APP_VERSION.owner} | {APP_VERSION.number} ({APP_VERSION.date})</p>
      </div>
    </div>
  );
};

export default Home;