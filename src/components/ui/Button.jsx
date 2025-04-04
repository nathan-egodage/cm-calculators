// src/components/ui/Button.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  className = '',
  ...props 
}) => {
  const { darkMode } = useTheme();
  
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  // Variant classes (light and dark mode variations)
  const variantClasses = {
    primary: darkMode
      ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
      : 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: darkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400',
    outline: darkMode
      ? 'border border-gray-600 hover:bg-gray-700 text-gray-300 focus:ring-gray-500'
      : 'border border-gray-300 hover:bg-gray-100 text-gray-700 focus:ring-gray-400',
    success: darkMode
      ? 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
      : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: darkMode
      ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
      : 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    link: darkMode
      ? 'text-blue-400 hover:text-blue-300 underline bg-transparent'
      : 'text-blue-600 hover:text-blue-700 underline bg-transparent'
  };
  
  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';
  
  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled ? disabledClasses : ''}
    ${className}
  `;
  
  return (
    <button 
      className={buttonClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;