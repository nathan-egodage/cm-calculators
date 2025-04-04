// src/components/layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { APP_VERSION } from '../../config/appConfig';

const Layout = ({ children, userEmail }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { darkMode } = useTheme();
  const location = useLocation();

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handle window resize to auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state based on screen size
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        mobileMenuOpen={mobileMenuOpen}
        toggleSidebar={toggleSidebar} 
        toggleMobileMenu={toggleMobileMenu}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          toggleSidebar={toggleSidebar} 
          toggleMobileMenu={toggleMobileMenu}
          sidebarOpen={sidebarOpen}
          userEmail={userEmail}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4">
          {children}
        </main>

        {/* Footer */}
        <footer className={`py-4 px-6 text-center text-sm ${darkMode ? 'text-gray-500 border-t border-gray-800' : 'text-gray-500 border-t border-gray-200'}`}>
          <p>Owner: {APP_VERSION.owner} | {APP_VERSION.number} ({APP_VERSION.date})</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;