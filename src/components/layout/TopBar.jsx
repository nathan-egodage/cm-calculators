// src/components/layout/TopBar.jsx
import React from 'react';
import { Menu, User, ChevronDown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

const TopBar = ({ toggleSidebar, toggleMobileMenu, sidebarOpen, userEmail }) => {
  const { darkMode } = useTheme();
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/all-cals':
        return 'All GP Calculators';
      case '/aus-contractor-gp':
        return 'AUS Contractor GP Calculator';
      case '/aus-fte-gp':
        return 'AUS FTE GP Calculator';
      case '/php-contractor-gp':
        return 'PHP Contractor GP Calculator';
      case '/php-fte-gp':
        return 'PHP FTE GP Calculator';
      case '/generic-contractor-gp':
        return 'Offshore Contractor GP Calculator';
      case '/aus-working-days-cal':
        return 'Australian Working Days Calculator';
      case '/bdm-calculator-v2':
        return 'BDM Commission Calculator';
      default:
        return 'CloudMarc Calculators';
    }
  };

  // Get user initials for the avatar
  const getUserInitials = () => {
    if (!userEmail) return 'U';
    
    const parts = userEmail.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <header className={`sticky top-0 z-20 ${darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-white border-b border-gray-200'}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden mr-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu size={20} />
          </button>
          
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="flex items-center space-x-1 focus:outline-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-blue-100'} text-blue-600`}>
                <User size={16} />
              </div>
              
              {userEmail && (
                <>
                  <span className="hidden md:block text-sm">{userEmail}</span>
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;