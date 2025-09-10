import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { usePeriodSlice } from '../slices/PeriodSlice';
import { useCalendarDetailSlice } from '../slices/useCalendarDetailSlice';
import CalendarImportForm from '../components/CalendarImportForm';
import CalendarDisplay from '../components/CalendarDisplay';
import '../styles/CalendarPage.css';

const CalendarPage = () => {
  const { periods, fetchPeriods, isFetching: isFetchingPeriods, errorMessage: periodError, successMessage: periodSuccess } = usePeriodSlice();
  const { errorMessage: calendarError, needsLogin, handleLoginRedirect } = useCalendarDetailSlice();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return; // Only fetch periods if logged in
    console.log('CalendarPage: Fetching periods, isAuthenticated:', isAuthenticated);
    fetchPeriods();
  }, [fetchPeriods, isAuthenticated]);

  const handleImportClick = () => {
    if (!selectedPeriodId || selectedPeriodId === '00000000-0000-0000-0000-000000000000') {
      alert('Please select a valid period');
      return;
    }
    setShowImportModal(true);
  };

  const handleCloseImportModal = () => setShowImportModal(false);

  if (!isAuthenticated || needsLogin) {
    return (
      <div className="login-prompt">
        <p>{calendarError || 'Please log in to continue.'}</p>
        <button onClick={handleLoginRedirect} className="login-button">Log In</button>
      </div>
    );
  }

  return (
    <div className="calendar-page-container">
      <div className="header-section">
        <h2>Calendar Management</h2>
        <div>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="period-select"
          >
            <option value="">Select a Period</option>
            {periods.map(period => (
              <option key={period.periodId} value={period.periodId}>
                {period.name} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
              </option>
            ))}
          </select>
          <button className="add-btn" onClick={handleImportClick} disabled={!selectedPeriodId}>
            Import Calendar
          </button>
        </div>
      </div>

      {periodError && <div className="error-message">{periodError}</div>}
      {periodSuccess && <div className="success-message">{periodSuccess}</div>}
      {isFetchingPeriods && <div className="loading-message">Loading periods...</div>}

      {showImportModal && (
        <CalendarImportForm periodId={selectedPeriodId} onClose={handleCloseImportModal} />
      )}

      {selectedPeriodId && selectedPeriodId !== '00000000-0000-0000-0000-000000000000' && (
        <CalendarDisplay periodId={selectedPeriodId} />
      )}
    </div>
  );
};

export default CalendarPage;
