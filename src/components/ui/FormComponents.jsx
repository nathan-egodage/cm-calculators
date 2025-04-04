// src/components/ui/FormComponents.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export const FormGroup = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const FormLabel = ({ children, htmlFor, required = false, className = '', ...props }) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={`block text-sm font-medium mb-1 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

export const FormInput = ({ 
  id,
  name,
  type = 'text',
  placeholder = '',
  disabled = false,
  value,
  onChange,
  error,
  prefix,
  className = '',
  ...props 
}) => {
  const { darkMode } = useTheme();
  
  const baseClasses = `
    w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 
    ${darkMode 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
    }
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
  `;

  if (prefix) {
    return (
      <div className="relative">
        <div className={`absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {prefix}
        </div>
        <input
          id={id}
          name={name}
          type={type}
          className={`${baseClasses} pl-10 py-2 px-3 ${className}`}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <input
        id={id}
        name={name}
        type={type}
        className={`${baseClasses} py-2 px-3 ${className}`}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={onChange}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </>
  );
};

export const FormSelect = ({ 
  id,
  name,
  disabled = false,
  value,
  onChange,
  error,
  children,
  className = '',
  ...props 
}) => {
  const { darkMode } = useTheme();
  
  return (
    <>
      <select
        id={id}
        name={name}
        className={`
          w-full rounded-md shadow-sm py-2 px-3 appearance-none
          ${darkMode 
            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500' 
            : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
          }
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${className}
        `}
        disabled={disabled}
        value={value}
        onChange={onChange}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </>
  );
};

export const FormCheckbox = ({ 
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  error,
  className = '',
  ...props 
}) => {
  const { darkMode } = useTheme();
  
  return (
    <div className="flex items-center">
      <input
        id={id}
        name={name}
        type="checkbox"
        className={`
          h-4 w-4 rounded 
          ${darkMode 
            ? 'bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500' 
            : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500'
          }
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
          ${className}
        `}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} ${disabled ? 'opacity-60' : ''}`}
        >
          {label}
        </label>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export const FormError = ({ children, className = '', ...props }) => {
  return children ? (
    <p 
      className={`mt-1 text-sm text-red-500 ${className}`}
      {...props}
    >
      {children}
    </p>
  ) : null;
};