import React, { useState, useEffect } from 'react';
import { useOvertimeRateSlice } from '../slices/useOvertimeRateSlice';
import '../styles/OvertimeRateForm.css';

const OvertimeRateForm = ({ overtimeRate, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useOvertimeRateSlice();
  const [formData, setFormData] = useState({
    overtimeRateID: '',
    dayType: '',
    startTime: '',
    endTime: '',
    multiplier: '',
    createdAt: '',
    updatedAt: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const isEditMode = !!overtimeRate && overtimeRate.overtimeRateID;

  useEffect(() => {
    if (isEditMode && overtimeRate) {
      console.log('Edit mode overtime rate:', overtimeRate);
      setFormData({
        overtimeRateID: overtimeRate.overtimeRateID,
        dayType: overtimeRate.dayType || '',
        startTime: overtimeRate.startTime || '',
        endTime: overtimeRate.endTime || '',
        multiplier: overtimeRate.multiplier ? overtimeRate.multiplier.toString() : '',
        createdAt: overtimeRate.createdAt || '',
        updatedAt: overtimeRate.updatedAt || ''
      });
    }
  }, [overtimeRate, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.dayType || formData.dayType.trim().length === 0) errors.dayType = 'Day Type is required';
    if (formData.dayType.length > 50) errors.dayType = 'Day Type must not exceed 50 characters';
    if (!formData.startTime) errors.startTime = 'Start Time is required';
    if (!formData.endTime) errors.endTime = 'End Time is required';
    if (!formData.multiplier || isNaN(formData.multiplier) || parseFloat(formData.multiplier) <= 0) {
      errors.multiplier = 'Multiplier must be a positive number';
    } else if (parseFloat(formData.multiplier) > 10) {
      errors.multiplier = 'Multiplier must not exceed 10.00';
    }
    if (formData.dayType !== 'Rest' && formData.dayType !== 'Public Holiday' && formData.startTime >= formData.endTime) {
      errors.endTime = 'End Time must be after Start Time for non-Rest/Public Holiday day types';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        dayType: formData.dayType.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
        multiplier: parseFloat(formData.multiplier)
      };
      console.log('Submitting payload:', payload);
      await handleSubmit(payload, isEditMode ? formData.overtimeRateID : null);
      onClose();
    } catch (error) {
      setFormErrors(prev => ({ ...prev, submit: error.response?.data?.error || 'Error submitting form' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditMode ? 'Edit Overtime Rate' : 'Add New Overtime Rate'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="dayType">Day Type</label>
                <input
                  type="text"
                  id="dayType"
                  name="dayType"
                  value={formData.dayType}
                  onChange={handleChange}
                  maxLength={50}
                  disabled={isLoading}
                />
                {formErrors.dayType && <span className="error">{formErrors.dayType}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  type="time"
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.startTime && <span className="error">{formErrors.startTime}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  type="time"
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.endTime && <span className="error">{formErrors.endTime}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="multiplier">Multiplier</label>
                <input
                  type="number"
                  id="multiplier"
                  name="multiplier"
                  value={formData.multiplier}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  max="10.00"
                  disabled={isLoading}
                />
                {formErrors.multiplier && <span className="error">{formErrors.multiplier}</span>}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting || isLoading}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || isLoading}>
              {isEditMode ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OvertimeRateForm;