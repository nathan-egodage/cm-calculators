import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

const AusWorkingDaysCalculator = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workingDays, setWorkingDays] = useState(null);
  const [includeStartDate, setIncludeStartDate] = useState(true);
  const [includeEndDate, setIncludeEndDate] = useState(true);
  const [selectedState, setSelectedState] = useState('NSW');
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

  return (
    <div className="calculator-container compact">
      <div className="calculator-header">
        <Link to="/" className="back-button">← Back</Link>
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
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeStartDate}
                  onChange={() => setIncludeStartDate(!includeStartDate)}
                />
                Include start date
              </label>
            </div>
            
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeEndDate}
                  onChange={() => setIncludeEndDate(!includeEndDate)}
                />
                Include end date
              </label>
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
    </div>
  );
};

export default AusWorkingDaysCalculator;