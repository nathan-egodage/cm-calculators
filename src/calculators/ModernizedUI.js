import React, { useState } from 'react';
import { ArrowLeft, Settings, Calculator, Calendar, DollarSign, Globe, Home, FileText, Menu, X } from 'lucide-react';

// This is a UI modernization showcase that demonstrates improved UI/UX patterns
// that can be applied across the entire CloudMarc Calculators application

const ModernizedUI = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sample calculator data
  const calculators = [
    { id: 'all-cals', title: 'All GP Calculators', description: 'Combined view with all GP calculators', icon: <Calculator size={20} />, theme: 'all-theme', category: 'combined' },
    { id: 'aus-working-days', title: 'Australian Working Days Calculator', description: 'Calculate working days in Australia', icon: <Calendar size={20} />, theme: 'aus-theme', category: 'australia' },
    { id: 'aus-fte-gp', title: 'AUS FTE GP Calculator', description: 'Calculate Gross Profit for Australian FTEs', icon: <DollarSign size={20} />, theme: 'aus-theme', category: 'australia' },
    { id: 'aus-contractor-gp', title: 'AUS Contractor GP Calculator', description: 'Calculate GP for Australian Contractors', icon: <FileText size={20} />, theme: 'aus-theme', category: 'australia' },
    { id: 'php-contractor-gp', title: 'PHP Contractor GP Calculator', description: 'Calculate GP for Philippine Contractors', icon: <FileText size={20} />, theme: 'php-theme', category: 'philippines' },
    { id: 'generic-contractor-gp', title: 'Offshore Contractor Calculator', description: 'Calculate GP for Offshore Contractors', icon: <Globe size={20} />, theme: 'india-theme', category: 'offshore' },
  ];

  // Filter calculators based on active category
  const [activeCategory, setActiveCategory] = useState('all');
  const filteredCalculators = activeCategory === 'all' 
    ? calculators 
    : calculators.filter(calc => calc.category === activeCategory);

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Mobile Menu Button */}
      <div className="block lg:hidden fixed top-4 left-4 z-40">
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className={`p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} ${menuOpen ? 'block' : 'hidden'} lg:block transition-all duration-300 fixed lg:relative z-30 h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
      >
        <div className="p-4 flex items-center justify-between">
          <div className={`font-bold text-xl ${sidebarOpen ? 'block' : 'hidden'}`}>CloudMarc</div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            {sidebarOpen ? <ArrowLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div 
            className={`flex items-center px-4 py-3 mb-2 ${activeTab === 'dashboard' ? (darkMode ? 'bg-blue-900' : 'bg-blue-50 text-blue-600') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} rounded-md cursor-pointer`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Home size={20} />
            <span className={`ml-4 ${sidebarOpen ? 'block' : 'hidden'}`}>Dashboard</span>
          </div>
          <div 
            className={`flex items-center px-4 py-3 mb-2 ${activeTab === 'calculators' ? (darkMode ? 'bg-blue-900' : 'bg-blue-50 text-blue-600') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} rounded-md cursor-pointer`}
            onClick={() => setActiveTab('calculators')}
          >
            <Calculator size={20} />
            <span className={`ml-4 ${sidebarOpen ? 'block' : 'hidden'}`}>Calculators</span>
          </div>
          <div 
            className={`flex items-center px-4 py-3 mb-2 ${activeTab === 'settings' ? (darkMode ? 'bg-blue-900' : 'bg-blue-50 text-blue-600') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')} rounded-md cursor-pointer`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span className={`ml-4 ${sidebarOpen ? 'block' : 'hidden'}`}>Settings</span>
          </div>
        </nav>

        {/* Theme Toggle */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <div className={`flex items-center justify-between p-2 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Dark Mode</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-12 h-6 rounded-full ${darkMode ? 'bg-blue-600' : 'bg-gray-300'} flex items-center transition-all duration-300`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto transition-all duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Top Navigation Bar */}
        <header className={`sticky top-0 z-20 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm py-4 px-6`}>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">CloudMarc Calculators</h1>
            <div className="flex items-center">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} text-blue-600 font-semibold`}>
                NE
              </div>
            </div>
          </div>
        </header>

        {/* Category Filters */}
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm ${activeCategory === 'all' 
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300')}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveCategory('australia')}
              className={`px-4 py-2 rounded-full text-sm ${activeCategory === 'australia' 
                ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-600 text-white') 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300')}`}
            >
              Australia
            </button>
            <button 
              onClick={() => setActiveCategory('philippines')}
              className={`px-4 py-2 rounded-full text-sm ${activeCategory === 'philippines' 
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300')}`}
            >
              Philippines
            </button>
            <button 
              onClick={() => setActiveCategory('offshore')}
              className={`px-4 py-2 rounded-full text-sm ${activeCategory === 'offshore' 
                ? (darkMode ? 'bg-orange-600 text-white' : 'bg-orange-600 text-white') 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300')}`}
            >
              Offshore
            </button>
            <button 
              onClick={() => setActiveCategory('combined')}
              className={`px-4 py-2 rounded-full text-sm ${activeCategory === 'combined' 
                ? (darkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white') 
                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700 border border-gray-300')}`}
            >
              Combined
            </button>
          </div>
        </div>

        {/* Calculator Cards */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalculators.map(calculator => (
              <div 
                key={calculator.id} 
                className={`relative p-6 rounded-xl shadow-md transition-all duration-300 cursor-pointer ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:shadow-lg hover:translate-y-px'}`}
              >
                <div className={`absolute top-0 left-0 w-2 h-full rounded-l-xl ${
                  calculator.theme === 'aus-theme' ? 'bg-green-500' :
                  calculator.theme === 'php-theme' ? 'bg-blue-500' :
                  calculator.theme === 'india-theme' ? 'bg-orange-500' : 'bg-purple-500'
                }`}></div>
                <div className="flex items-start">
                  <div className={`flex-shrink-0 rounded-md h-10 w-10 flex items-center justify-center mr-4 ${
                    calculator.theme === 'aus-theme' ? (darkMode ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600') :
                    calculator.theme === 'php-theme' ? (darkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-600') :
                    calculator.theme === 'india-theme' ? (darkMode ? 'bg-orange-900 text-orange-400' : 'bg-orange-100 text-orange-600') :
                    (darkMode ? 'bg-purple-900 text-purple-400' : 'bg-purple-100 text-purple-600')
                  }`}> 
                    {calculator.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{calculator.title}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{calculator.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example Calculator Interface */}
        {activeTab === 'calculators' && (
          <div className={`p-6 m-6 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">AUS Contractor GP Calculator</h2>
            
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                <button 
                  className={`px-4 py-2 rounded-md text-sm ${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}
                >
                  Calculate Client Rate
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                >
                  Calculate Contractor Rate
                </button>
                <button 
                  className={`px-4 py-2 rounded-md text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                >
                  Calculate Target Margin
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Configuration</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Is Payroll Tax applicable?</label>
                    <select className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Workcover</label>
                    <select className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} disabled>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Working Days</label>
                    <input 
                      type="number" 
                      value="220"
                      disabled
                      className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Extra Expenses</label>
                    <select className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4">Calculation Inputs</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    AUD$ Daily Rate
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">AUD$</div>
                    <input 
                      type="text"
                      value="700" 
                      className={`w-full pl-12 p-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Target Margin %
                  </label>
                  <input 
                    type="text"
                    value="35" 
                    className={`w-full p-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    AUD$ Daily Client Rate <span className="text-red-500 font-bold">(Calculated)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">AUD$</div>
                    <input 
                      type="text"
                      value="931.04"
                      disabled 
                      className={`w-full pl-12 p-2 rounded-md border ${darkMode ? 'bg-gray-700 border-gray-600 bg-gray-600' : 'bg-gray-100 border-gray-300'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Results Section */}
            <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <h3 className="font-semibold mb-4">Results</h3>
              
              <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                <table className="w-full">
                  <tbody>
                    <tr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                      <td className="p-3 text-sm">Daily Rate (Including Super)</td>
                      <td className="p-3 text-right text-sm font-medium">AUD$ 700.00</td>
                    </tr>
                    <tr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                      <td className="p-3 text-sm">Annual Income (Including Super)</td>
                      <td className="p-3 text-right text-sm font-medium">AUD$ 154,000.00</td>
                    </tr>
                    <tr className={`${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-blue-50'} border-b font-medium`}>
                      <td className="p-3 text-sm">Total Cost</td>
                      <td className="p-3 text-right text-sm">AUD$ 161,621.00</td>
                    </tr>
                    <tr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                      <td className="p-3 text-sm">Daily Cost</td>
                      <td className="p-3 text-right text-sm font-medium">AUD$ 734.64</td>
                    </tr>
                    <tr className={`${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-blue-50'} border-b font-medium`}>
                      <td className="p-3 text-sm">Target Margin %</td>
                      <td className="p-3 text-right text-sm">35.00%</td>
                    </tr>
                    <tr className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
                      <td className="p-3 text-sm">Target Margin $</td>
                      <td className="p-3 text-right text-sm font-medium">AUD$ 196.40</td>
                    </tr>
                    <tr className={`${darkMode ? 'bg-blue-900' : 'bg-blue-500 text-white'} font-bold`}>
                      <td className="p-3 text-sm">Daily Client Rate</td>
                      <td className="p-3 text-right text-sm">AUD$ 931.04</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className={`mt-auto py-4 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          <p>Owner: Nathan Egodage | V2.0.1 (01-Apr-2025)</p>
        </footer>
      </div>
    </div>
  );
};

export default ModernizedUI;