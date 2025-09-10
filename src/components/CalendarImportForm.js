import React, { useState } from 'react';
import { useCalendarDetailSlice } from '../slices/useCalendarDetailSlice';
import '../styles/CalendarImportForm.css';

const CalendarImportForm = ({ periodId, onClose }) => {
  const { importCalendar, checkCalendarExists, isImporting, errorMessage, successMessage } = useCalendarDetailSlice();
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      console.error('No file selected');
      return;
    }
    try {
      const exists = await checkCalendarExists(periodId);
      if (exists) {
        return; // Error message is set in checkCalendarExists
      }
      const success = await importCalendar(periodId, file);
      if (success) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onClose();
      }
    } catch (error) {
      console.error('Import error:', error.message);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Import Calendar</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="excelFile">Excel File</label>
            <input
              type="file"
              id="excelFile"
              name="excelFile"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="periodId">Period ID</label>
            <input
              type="text"
              id="periodId"
              name="periodId"
              value={periodId}
              readOnly
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleClose} disabled={isImporting}>
              Cancel
            </button>
            <button type="submit" disabled={isImporting}>
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarImportForm;