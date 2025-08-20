import React, { useState, useEffect } from 'react';
import { usePeriodSlice } from '../slices/PeriodSlice';
import '../styles/PeriodForm.css';

const PeriodForm = ({ period, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = usePeriodSlice();

  const [formData, setFormData] = useState({
    periodId: '',
    name: '',
    sequence: '',
    startDate: '',
    endDate: '',
    calendarType: 'Gregorian',
    cutoffDay: '',
    status: 'Open',
    createdAt: '',
    updatedAt: '',
  });

  const isEditMode = !!period && (period.periodId || period.PeriodID);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        periodId: period.periodId || period.PeriodID || '',
        name: period.name || period.PeriodName || '',
        sequence: period.sequence || period.PeriodSequence || '',
        startDate: period.startDate ? new Date(period.startDate).toISOString().split('T')[0] : '',
        endDate: period.endDate ? new Date(period.endDate).toISOString().split('T')[0] : '',
        calendarType: period.calendarType || period.CalendarType || 'Gregorian',
        cutoffDay: period.cutoffDay || period.CutoffDay || '',
        status: period.status || period.Status || 'Open',
        createdAt: period.createdAt || period.CreatedAt || '',
        updatedAt: period.updatedAt || period.UpdatedAt || '',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Open',
      }));
    }
  }, [period, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting data:', formData);
    try {
      const submitData = {
        periodId: isEditMode ? formData.periodId : undefined,
        name: formData.name,
        sequence: formData.sequence ? parseInt(formData.sequence) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        calendarType: formData.calendarType,
        cutoffDay: parseInt(formData.cutoffDay),
        status: formData.status,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: formData.updatedAt || new Date().toISOString(),
      };
      console.log('Submit data:', submitData);
      await handleSubmit(submitData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onClose();
    } catch (error) {
      console.error('Form submission error:', error.message);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditMode ? 'Edit Period' : 'Add New Period'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name">Period Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter period name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="sequence">Sequence</label>
            <input
              type="number"
              id="sequence"
              name="sequence"
              value={formData.sequence}
              onChange={handleChange}
              placeholder="Enter sequence number"
            />
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="calendarType">Calendar Type</label>
            <select
              id="calendarType"
              name="calendarType"
              value={formData.calendarType}
              onChange={handleChange}
              required
            >
              <option value="Gregorian">Gregorian</option>
              <option value="Ethiopian">Ethiopian</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cutoffDay">Cutoff Day</label>
            <input
              type="number"
              id="cutoffDay"
              name="cutoffDay"
              value={formData.cutoffDay}
              onChange={handleChange}
              placeholder="Enter cutoff day"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="Open">Open</option>
              <option value="Processing">Processing</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="createdAt">Created At</label>
            <input
              type="text"
              id="createdAt"
              name="createdAt"
              value={formData.createdAt ? new Date(formData.createdAt).toLocaleString() : ''}
              readOnly
            />
          </div>
          <div className="form-group">
            <label htmlFor="updatedAt">Updated At</label>
            <input
              type="text"
              id="updatedAt"
              name="updatedAt"
              value={formData.updatedAt ? new Date(formData.updatedAt).toLocaleString() : ''}
              readOnly
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isEditMode ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PeriodForm;