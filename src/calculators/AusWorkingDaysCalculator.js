import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';
import { APP_VERSION, AUTHORIZED_USERS } from "../config/appConfig";

const AusWorkingDaysCalculator = () => {
  // Initialize start date to today
  const today = new Date().toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState('');
  const [workingDays, setWorkingDays] = useState(null);
  const [includeStartDate, setIncludeStartDate] = useState(true);
  const [includeEndDate, setIncludeEndDate] = useState(true);
  const [selectedState, setSelectedState] = useState('VIC');
  const [publicHolidays, setPublicHolidays] = useState([]);
  const [customHolidays, setCustomHolidays] = useState([]);
  const [newCustomHoliday, setNewCustomHoliday] = useState({ 
    startDate: '', 
    endDate: '', 
    name: '' 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workHours, setWorkHours] = useState(8);
  
  // Australian states and territories
  const australianStates = [
    { code: 'NSW', name: 'New South Wales' },
    { code: 'VIC', name: 'Victoria' },
    { code: 'QLD', name: 'Queensland' },
    { code: 'SA', name: 'South Australia' },
    { code: 'WA', name: 'Western Australia' },
    { code: 'TAS', name: 'Tasmania' },
    { code: 'NT', name: 'Northern Territory' },
    { code: 'ACT', name: 'Australian Capital Territory' }
  ];

  // Helper function to check if a date is a weekday
  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // Not Sunday (0) and not Saturday (6)
  };

  // Helper function to get next working day
  const getNextWorkingDay = (date) => {
    const nextDay = new Date(date);
    nextDay.setHours(0, 0, 0, 0);
    while (!isWeekday(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    return nextDay;
  };

  // FIXED: Next Month 1st Weekday function
  const getNextMonthFirstWeekday = () => {
    // Get current date
    const now = new Date();
    
    // Create date for first day of next month
    // Uses string manipulation to avoid timezone issues
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    
    let nextMonthYear = year;
    let nextMonth = month + 1;
    
    if (nextMonth > 12) {
      nextMonth = 1;
      nextMonthYear++;
    }
    
    // Format month with leading zero if needed
    const nextMonthStr = nextMonth.toString().padStart(2, '0');
    
    // Create exact date string for first of next month
    const firstOfNextMonthStr = `${nextMonthYear}-${nextMonthStr}-01`;
    
    // Convert to date object and find first weekday
    const firstOfNextMonth = new Date(firstOfNextMonthStr);
    let firstWeekday = new Date(firstOfNextMonth);
    
    // Find first weekday
    while (!isWeekday(firstWeekday)) {
      firstWeekday.setDate(firstWeekday.getDate() + 1);
    }
    
    // Return date in YYYY-MM-DD format
    return firstWeekday.toISOString().split('T')[0];
  };

  const getDatePlus = (baseDate, days) => {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    // Ensure it's a working day
    return getNextWorkingDay(date).toISOString().split('T')[0];
  };

  // FIXED: Calculate exact number of working days
  const getDatePlusWorkingDays = (baseDate, workDays) => {
    // Parse input date and ensure hours/minutes/seconds are zeroed
    const startingDate = new Date(baseDate);
    startingDate.setHours(0, 0, 0, 0);
    
    // We want to track the actual days calculated
    let workingDaysCount = 0;
    
    // Start with the next day after the base date
    let currentDate = new Date(startingDate);
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Loop until we have the exact number of working days
    while (workingDaysCount < workDays) {
      if (isWeekday(currentDate)) {
        workingDaysCount++;
      }
      
      // If we haven't reached our target, move to next day
      if (workingDaysCount < workDays) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    // Convert to YYYY-MM-DD format
    return currentDate.toISOString().split('T')[0];
  };

  // FIXED: Hard-coded exact date format for mid-year
  const getMidYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Create June 30 for the current year
    const june30 = `${currentYear}-06-30`;
    
    // If we're past June 30, use next year
    if (now > new Date(june30)) {
      return `${currentYear + 1}-06-30`;
    }
    
    return june30;
  };

  // FIXED: Hard-coded exact date format for year-end
  const getYearEnd = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Create December 31 for the current year
    const dec31 = `${currentYear}-12-31`;
    
    // If we're past December 31, use next year
    if (now > new Date(dec31)) {
      return `${currentYear + 1}-12-31`;
    }
    
    return dec31;
  };

  // Apply start date shortcut
  const applyStartDateShortcut = (shortcut) => {
    let newStartDate;
    
    switch(shortcut) {
      case 'today':
        // Get today if it's a working day, otherwise get next working day
        const todayDate = new Date(today);
        newStartDate = isWeekday(todayDate) 
          ? today 
          : getNextWorkingDay(todayDate).toISOString().split('T')[0];
        break;
      case 'nextMonth':
        newStartDate = getNextMonthFirstWeekday();
        break;
      case 'plus7':
        newStartDate = getDatePlus(today, 7);
        break;
      case 'plus14':
        newStartDate = getDatePlus(today, 14);
        break;
      default:
        // Ensure default is also a working day
        const defaultDate = new Date(today);
        newStartDate = isWeekday(defaultDate)
          ? today
          : getNextWorkingDay(defaultDate).toISOString().split('T')[0];
    }
    
    setStartDate(newStartDate);
  };

  // Apply end date shortcut (uses selected start date instead of today)
  const applyEndDateShortcut = (shortcut) => {
    let newEndDate;
    
    switch(shortcut) {
      case 'plus120':
        // Add exactly 120 working days from the selected start date
        newEndDate = getDatePlusWorkingDays(startDate, 120);
        break;
      case 'plus180':
        // Add exactly 180 working days from the selected start date
        newEndDate = getDatePlusWorkingDays(startDate, 180);
        break;
      case 'midYear':
        // Use exact June 30th
        newEndDate = getMidYear();
        break;
      case 'yearEnd':
        // Use exact December 31st
        newEndDate = getYearEnd();
        break;
      default:
        // Default to selected start date + 30 working days
        newEndDate = getDatePlusWorkingDays(startDate, 30);
    }
    
    setEndDate(newEndDate);
  };

  // Initialize with Christmas mandatory shutdown period
  useEffect(() => {
    const year = new Date().getFullYear();
    const christmasStart = `${year}-12-25`;
    const newYearEnd = `${year + 1}-01-07`;
    
    // Add the Christmas Mandatory Shutdown as a date range
    setCustomHolidays([{
      startDate: christmasStart,
      endDate: newYearEnd,
      name: 'Christmas Mandatory Shutdown'
    }]);
    
    // Set a default end date to today + 30 working days
    setEndDate(getDatePlusWorkingDays(today, 30));
    
    // Ensure start date is a working day
    const todayDate = new Date(today);
    if (!isWeekday(todayDate)) {
      setStartDate(getNextWorkingDay(todayDate).toISOString().split('T')[0]);
    }
  }, []);

  // Fetch public holidays from Nager.Date API
  const fetchPublicHolidays = async () => {
    if (!startDate || !endDate) return;
    
    setIsLoading(true);
    setError(null);
    
    const startYear = new Date(startDate).getFullYear();
    const endYear = new Date(endDate).getFullYear();
    const years = [];
    
    // Create array of years to fetch
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    
    try {
      // Fetch holidays for each year in range
      const holidaysPromises = years.map(year => 
        fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/AU`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to fetch holidays for ${year}`);
            }
            return response.json();
          })
      );
      
      const holidaysResults = await Promise.all(holidaysPromises);
      // Flatten array of holiday arrays
      const allHolidays = holidaysResults.flat();
      
      // Filter holidays by state if needed
      // National holidays have 'National' in their counties
      // State-specific holidays will have the state code in their counties
      const filteredHolidays = allHolidays.filter(holiday => 
        holiday.counties === null || 
        holiday.counties.includes('National') || 
        holiday.counties.includes(selectedState)
      );
      
      setPublicHolidays(filteredHolidays);
    } catch (err) {
      console.error('Error fetching public holidays:', err);
      setError('Failed to fetch public holidays. Using built-in holiday data instead.');
      
      // Fallback to built-in holidays if API fails
      setPublicHolidays([
        { date: '2025-01-01', localName: "New Year's Day" },
        { date: '2025-01-27', localName: "Australia Day (observed)" },
        { date: '2025-04-18', localName: "Good Friday" },
        { date: '2025-04-19', localName: "Easter Saturday" },
        { date: '2025-04-21', localName: "Easter Monday" },
        { date: '2025-04-25', localName: "Anzac Day" },
        { date: '2025-06-09', localName: "King's Birthday" },
        { date: '2025-12-25', localName: "Christmas Day" },
        { date: '2025-12-26', localName: "Boxing Day" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch holidays when dates or state changes
  useEffect(() => {
    fetchPublicHolidays();
  }, [startDate, endDate, selectedState]);

  // Check if a date is a public holiday
  const isPublicHoliday = (date) => {
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    // Format date as YYYY-MM-DD for comparison with API data
    const dateString = formattedDate.toISOString().split('T')[0];
    
    return publicHolidays.some(holiday => holiday.date === dateString);
  };

  // Check if a date is within any custom holiday range
  const isCustomHoliday = (date) => {
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);
    
    return customHolidays.some(holiday => {
      const start = new Date(holiday.startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(holiday.endDate);
      end.setHours(0, 0, 0, 0);
      
      return formattedDate >= start && formattedDate <= end;
    });
  };

  // Check if a date is a weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  // Calculate working days between two dates
  const calculateWorkingDays = () => {
    if (!startDate || !endDate) {
      return null;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Validate date range
    if (end < start) {
      return { error: 'End date must be after start date' };
    }
    
    let workingDaysCount = 0;
    let weekendDaysCount = 0;
    let publicHolidaysCount = 0;
    let customHolidaysCount = 0;
    let totalDaysCount = 0;
    
    let current = new Date(start);
    
    // Skip start date if not included
    if (!includeStartDate) {
      current.setDate(current.getDate() + 1);
    }
    
    // Count days
    while (current <= end) {
      // If it's the end date and we don't want to include it, break
      if (current.getTime() === end.getTime() && !includeEndDate) {
        break;
      }
      
      totalDaysCount++;
      
      if (isWeekend(current)) {
        weekendDaysCount++;
      } else if (isPublicHoliday(current)) {
        publicHolidaysCount++;
      } else if (isCustomHoliday(current)) {
        customHolidaysCount++;
      } else {
        workingDaysCount++;
      }
      
      // Move to next day
      current.setDate(current.getDate() + 1);
    }
    
    return {
      workingDays: workingDaysCount,
      weekendDays: weekendDaysCount,
      publicHolidays: publicHolidaysCount,
      customHolidays: customHolidaysCount,
      totalDays: totalDaysCount,
      workHours: workingDaysCount * workHours
    };
  };

  // Handle adding a new custom holiday
  const handleAddCustomHoliday = () => {
    if (!newCustomHoliday.startDate || !newCustomHoliday.endDate || !newCustomHoliday.name) {
      alert('Please provide start date, end date, and name for the custom holiday');
      return;
    }
    
    // Ensure start date is before or equal to end date
    const start = new Date(newCustomHoliday.startDate);
    const end = new Date(newCustomHoliday.endDate);
    
    if (end < start) {
      alert('End date must be after or equal to start date');
      return;
    }
    
    setCustomHolidays([...customHolidays, { ...newCustomHoliday }]);
    setNewCustomHoliday({ startDate: '', endDate: '', name: '' });
  };

  // Handle removing a custom holiday
  const handleRemoveCustomHoliday = (index) => {
    const updatedHolidays = [...customHolidays];
    updatedHolidays.splice(index, 1);
    setCustomHolidays(updatedHolidays);
  };

  // Calculate working days when inputs change
  useEffect(() => {
    if (startDate && endDate) {
      const result = calculateWorkingDays();
      setWorkingDays(result);
    } else {
      setWorkingDays(null);
    }
  }, [startDate, endDate, includeStartDate, includeEndDate, selectedState, publicHolidays, customHolidays, workHours]);

  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="calculator-container compact aus-calculator">
      <div className="calculator-header">
        <Link to="/" className="back-button">← Back to Home</Link>
        <h2>Australian Working Days Calculator</h2>
      </div>
      
      <div className="calculator-form">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>State/Territory:</label>
              <select 
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {australianStates.map(state => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Work hours per day:</label>
              <input
                type="number"
                min="1"
                max="24"
                value={workHours}
                onChange={(e) => setWorkHours(parseInt(e.target.value))}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group date-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <div className="date-display">{formatDate(startDate)}</div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeStartDate}
                  onChange={() => setIncludeStartDate(!includeStartDate)}
                />
                Include start date
              </label>
              
              <div className="date-shortcuts">
                <h4>Quick Select:</h4>
                <div className="shortcut-buttons">
                  <button type="button" onClick={() => applyStartDateShortcut('today')} className="shortcut-btn">Today (Weekday)</button>
                  <button type="button" onClick={() => applyStartDateShortcut('nextMonth')} className="shortcut-btn">Next Month 1st Weekday</button>
                  <button type="button" onClick={() => applyStartDateShortcut('plus7')} className="shortcut-btn">Today + 7 Days (Weekday)</button>
                  <button type="button" onClick={() => applyStartDateShortcut('plus14')} className="shortcut-btn">Today + 14 Days (Weekday)</button>
                </div>
              </div>
            </div>
            
            <div className="form-group date-group">
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <div className="date-display">{formatDate(endDate)}</div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeEndDate}
                  onChange={() => setIncludeEndDate(!includeEndDate)}
                />
                Include end date
              </label>
              
              <div className="date-shortcuts">
                <h4>Quick Select:</h4>
                <div className="shortcut-buttons">
                  <button type="button" onClick={() => applyEndDateShortcut('plus120')} className="shortcut-btn">Start Date + 120 Working Days</button>
                  <button type="button" onClick={() => applyEndDateShortcut('plus180')} className="shortcut-btn">Start Date + 180 Working Days</button>
                  <button type="button" onClick={() => applyEndDateShortcut('midYear')} className="shortcut-btn">30-Jun</button>
                  <button type="button" onClick={() => applyEndDateShortcut('yearEnd')} className="shortcut-btn">31-Dec</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {isLoading && <div className="loading">Loading holiday data...</div>}
        {error && <div className="error">{error}</div>}
        
        {workingDays && workingDays.error ? (
          <div className="error">{workingDays.error}</div>
        ) : workingDays && (
          <div className="result">
            <div className="results-grid">
              <div className="result-item">
                <span className="result-label">▼ Days</span>
                <span className="result-value">{workingDays.totalDays}</span>
              </div>
              <div className="result-item">
                <span className="result-label">▼ Working days</span>
                <span className="result-value highlight">{workingDays.workingDays}</span>
              </div>
              <div className="result-item">
                <span className="result-label">▼ Weekend days</span>
                <span className="result-value">{workingDays.weekendDays}</span>
              </div>
              <div className="result-item">
                <span className="result-label">▼ Public holidays</span>
                <span className="result-value">{workingDays.publicHolidays}</span>
              </div>
              <div className="result-item">
                <span className="result-label">▼ Custom holidays</span>
                <span className="result-value">{workingDays.customHolidays}</span>
              </div>
              <div className="result-item">
                <span className="result-label">▼ Work hours</span>
                <span className="result-value">{workingDays.workHours}h</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Public Holidays Information */}
      {publicHolidays.length > 0 && (
        <div className="holidays-section">
          <h3>Public Holidays</h3>
          <div className="holidays-table-container">
            <table className="holidays-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Holiday</th>
                </tr>
              </thead>
              <tbody>
                {publicHolidays.map((holiday, index) => (
                  <tr key={index}>
                    <td>{new Date(holiday.date).toLocaleDateString()}</td>
                    <td>{holiday.localName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Custom Holidays Management */}
      <div className="holidays-section">
        <h3>Custom Holidays</h3>
        <div className="note">
          <p><strong>Note:</strong> By default, Christmas Mandatory Shutdown (Dec 25 - Jan 7) is added as a custom holiday.</p>
        </div>
        
        <div className="add-holiday-form">
          <div className="form-row">
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={newCustomHoliday.startDate}
                onChange={(e) => setNewCustomHoliday({...newCustomHoliday, startDate: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={newCustomHoliday.endDate}
                onChange={(e) => setNewCustomHoliday({...newCustomHoliday, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Holiday Name:</label>
              <input
                type="text"
                value={newCustomHoliday.name}
                onChange={(e) => setNewCustomHoliday({...newCustomHoliday, name: e.target.value})}
                placeholder="Enter holiday name"
              />
            </div>
            <div className="form-group button-group">
              <button onClick={handleAddCustomHoliday} className="btn-add">Add Custom Holiday</button>
            </div>
          </div>
        </div>
        
        {customHolidays.length > 0 && (
          <div className="holidays-table-container">
            <table className="holidays-table">
              <thead>
                <tr>
                  <th>Date Range</th>
                  <th>Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customHolidays.map((holiday, index) => (
                  <tr key={index}>
                    <td>{formatDateRange(holiday.startDate, holiday.endDate)}</td>
                    <td>{holiday.name}</td>
                    <td>
                      <button 
                        onClick={() => handleRemoveCustomHoliday(index)}
                        className="btn-remove"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="section"> <p className="version-tag">{APP_VERSION.number} ({APP_VERSION.date})</p> </div>
    </div>
  );
};

export default AusWorkingDaysCalculator;