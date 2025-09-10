import React, { useEffect, useState } from 'react';
import { useCalendarDetailSlice } from '../slices/useCalendarDetailSlice';
import { Tooltip } from 'react-tooltip';
import '../styles/CalendarDisplay.css';

const CalendarDisplay = ({ periodId }) => {
  const {
    calendarDetails,
    errorMessage,
    isFetching,
    fetchCalendarDetails,
  } = useCalendarDetailSlice();

  const [year, setYear] = useState(null);
  const [showHolidays, setShowHolidays] = useState(false);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (periodId) {
      fetchCalendarDetails(periodId);
    }
  }, [periodId, fetchCalendarDetails]);

  useEffect(() => {
    if (calendarDetails.length > 0) {
      const firstDate = new Date(calendarDetails[0].CalendarDate);
      setYear(firstDate.getFullYear());
      // Filter holidays from calendarDetails
      const holidayList = calendarDetails.filter(day => day.IsPublicHoliday && day.Description);
      setHolidays(holidayList);
    }
  }, [calendarDetails]);

  const getDaysInMonth = (month) => {
    if (!calendarDetails.length) return [];

    const days = [];
    const yearValue = year || new Date().getFullYear();
    const daysInMonth = new Date(yearValue, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(yearValue, month, 1).getDay();

    // Pad with previous month's days
    const lastMonth = new Date(yearValue, month, 0);
    const lastDayOfLastMonth = lastMonth.getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        CalendarDate: new Date(yearValue, month - 1, lastDayOfLastMonth - i).toISOString().split('T')[0],
        IsWorkingDay: false,
        IsWeekend: false,
        IsPublicHoliday: false,
        Description: null,
        isOtherMonth: true,
      });
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(yearValue, month, day);
      const detail = calendarDetails.find(d => new Date(d.CalendarDate).toDateString() === date.toDateString()) || {
        CalendarDate: date.toISOString().split('T')[0],
        DayName: date.toLocaleString('default', { weekday: 'long' }),
        IsWorkingDay: !(date.getDay() === 0 || date.getDay() === 6),
        IsWeekend: date.getDay() === 0 || date.getDay() === 6,
        IsPublicHoliday: false,
        Description: null,
      };
      days.push({ ...detail, isOtherMonth: false });
    }

    // Pad with next month's days to fill the grid (up to 6 weeks)
    const totalDays = days.length;
    const nextMonth = new Date(yearValue, month + 1, 1);
    for (let i = 1; totalDays + i <= 42; i++) {
      days.push({
        CalendarDate: nextMonth.toISOString().split('T')[0],
        IsWorkingDay: false,
        IsWeekend: false,
        IsPublicHoliday: false,
        Description: null,
        isOtherMonth: true,
      });
      nextMonth.setDate(nextMonth.getDate() + 1);
    }

    return days;
  };

  const getCellClass = (day) => {
    if (day.isOtherMonth) return 'day-cell empty-cell';
    return 'day-cell';
  };

  const getBadge = (day) => {
    if (day.isOtherMonth) return '';
    if (day.IsPublicHoliday) return '🎉';
    if (day.IsWeekend) return '🌙';
    if (day.IsWorkingDay) return '✅'; // Added Working Day badge
    return '';
  };

  const handleHolidayClick = () => {
    setShowHolidays(true);
  };

  if (isFetching) return <p className="loading-message">Loading calendar...</p>;
  if (errorMessage) return <p className="error-message">{errorMessage}</p>;
  if (!calendarDetails.length) return <p className="error-message">No calendar found for this period. Please upload one.</p>;
  if (!year) return null;

  return (
    <div className="calendar-display-container">
      <h2 className="year-header">{year} Overview</h2>
      <div className="month-grid-container">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="month-mini-grid">
            <h3 className="month-mini-header">{new Date(year, i, 1).toLocaleString('default', { month: 'short' })}</h3>
            <div className="month-mini-days">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="day-mini-header">{day[0]}</div>
              ))}
              {getDaysInMonth(i).map((day, index) => (
                <div
                  key={index}
                  className={getCellClass(day)}
                  data-tooltip-id={`tooltip-${i}-${index}`}
                  data-tooltip-content={day.Description || ''}
                  data-tooltip-place="top"
                >
                  {day.CalendarDate && !day.isOtherMonth && (
                    <span className="day-number">{new Date(day.CalendarDate).getDate()}</span>
                  )}
                  {getBadge(day) && <span className="badge">{getBadge(day)}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="legend">
        <span className="legend-item" onClick={handleHolidayClick}>
          <span className="badge">🎉</span> Holiday
        </span>
        <span><span className="badge">🌙</span> Weekend</span>
        <span><span className="badge">✅</span> Working Day</span>
      </div>
      {showHolidays && (
        <div className="holiday-modal">
          <h3>Holidays in {year}</h3>
          <ul>
            {holidays.map((holiday, index) => (
              <li key={index}>
                {new Date(holiday.CalendarDate).toLocaleDateString()} - {holiday.Description}
              </li>
            ))}
          </ul>
          <button onClick={() => setShowHolidays(false)}>Close</button>
        </div>
      )}
      <Tooltip id="tooltip" />
    </div>
  );
};

export default CalendarDisplay;