// src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calculator, 
  DollarSign, 
  FileText, 
  Globe, 
  Calendar, 
  ArrowLeft,
  Menu,
  X, 
  Sun, 
  Moon
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { AUTHORIZED_USERS } from '../../config/appConfig';

const Sidebar = ({ 
  sidebarOpen, 
  mobileMenuOpen, 
  toggleSidebar, 
  toggleMobileMenu, 
  userEmail 
}) => {
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Check if user is authorized to see BDM calculator
  const isBdmAuthorized = userEmail && 
    AUTHORIZED_USERS.bdmCalculator.some(email => 
      email.toLowerCase() === userEmail.toLowerCase()
    );

  // Determine if a route is active
  const isActive = (path) => location.pathname === path;

  // Navigation items for the sidebar
  const navItems = [
    { 
      path: '/', 
      name: 'Dashboard', 
      icon: <Home size={20} /> 
    },
    { 
      path: '/all-cals', 
      name: 'All GP Calculators', 
      icon: <Calculator size={20} /> 
    },
    {
      path: '/aus-working-days-cal',
      name: 'AUS Working Days',
      icon: <Calendar size={20} />
    }
  ];

  // Australian calculators group
  const ausCalculators = [
    { 
      path: '/aus-contractor-gp', 
      name: 'AUS Contractor GP', 
      icon: <FileText size={20} /> 
    },
    { 
      path: '/aus-fte-gp', 
      name: 'AUS FTE GP', 
      icon: <DollarSign size={20} /> 
    }
  ];

  // PHP calculators group
  const phpCalculators = [
    { 
      path: '/php-contractor-gp', 
      name: 'PHP Contractor GP', 
      icon: <FileText size={20} /> 
    },
    { 
      path: '/php-fte-gp', 
      name: 'PHP FTE GP', 
      icon: <DollarSign size={20} /> 
    }
  ];

  // Offshore calculators
  const offshoreCalculators = [
    { 
      path: '/generic-contractor-gp', 
      name: 'Offshore Contractor', 
      icon: <Globe size={20} /> 
    }
  ];

  // BDM calculator (only if authorized)
  const bdmCalculator = isBdmAuthorized ? [
    { 
      path: '/bdm-calculator-v2', 
      name: 'BDM Commission', 
      icon: <DollarSign size={20} /> 
    }
  ] : [];

  // Mobile menu button
  const mobileMenuButton = (
    <div className="lg:hidden fixed top-4 left-4 z-50">
      <button
        onClick={toggleMobileMenu}
        className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );

  // Style classes
  const sidebarClasses = `
    ${sidebarOpen ? 'w-64' : 'w-20'} 
    ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
    fixed top-0 left-0 h-full z-40
    transition-all duration-300 ease-in-out
    ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg
    lg:relative
  `;

  const navItemClasses = (isItemActive) => `
    flex items-center px-4 py-3 mb-1 rounded-md cursor-pointer
    ${isItemActive 
      ? (darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-600') 
      : (darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}
  `;

  // Render a nav group with title
  const renderNavGroup = (title, items) => (
    <div className="mb-4">
      {sidebarOpen && (
        <h3 className={`px-4 mb-2 text-xs font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {title}
        </h3>
      )}
      {items.map((item) => (
        <Link to={item.path} key={item.path}>
          <div className={navItemClasses(isActive(item.path))}>
            <div className="flex-shrink-0">{item.icon}</div>
            {sidebarOpen && <span className="ml-3">{item.name}</span>}
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <>
      {mobileMenuButton}
      
      <aside className={sidebarClasses}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-700">
            {sidebarOpen && (
              <div className="font-bold text-xl">CloudMarc</div>
            )}
            <button 
              onClick={toggleSidebar}
              className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {sidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-2">
            {/* Main nav items */}
            <div className="mb-6">
              {navItems.map((item) => (
                <Link to={item.path} key={item.path}>
                  <div className={navItemClasses(isActive(item.path))}>
                    <div className="flex-shrink-0">{item.icon}</div>
                    {sidebarOpen && <span className="ml-3">{item.name}</span>}
                  </div>
                </Link>
              ))}
            </div>
            
            {/* Australian calculators */}
            {renderNavGroup('Australia', ausCalculators)}
            
            {/* Philippine calculators */}
            {renderNavGroup('Philippines', phpCalculators)}
            
            {/* Offshore calculators */}
            {renderNavGroup('Offshore', offshoreCalculators)}
            
            {/* BDM calculator (if authorized) */}
            {isBdmAuthorized && renderNavGroup('Commission', bdmCalculator)}
          </div>
          
          {/* Theme Toggle */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              {sidebarOpen && <span className="text-sm">Dark Mode</span>}
              <button
                onClick={toggleDarkMode}
                className={`${sidebarOpen ? 'ml-auto' : 'mx-auto'} p-2 rounded-md ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;