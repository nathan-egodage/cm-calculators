// src/components/ui/Card.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const Card = ({ children, className = '', ...props }) => {
  const { darkMode } = useTheme();
  
  return (
    <div 
      className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '', ...props }) => {
  const { darkMode } = useTheme();
  
  return (
    <div 
      className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3 
      className={`text-lg font-semibold ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardFooter = ({ children, className = '', ...props }) => {
  const { darkMode } = useTheme();
  
  return (
    <div 
      className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};