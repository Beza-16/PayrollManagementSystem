import React, { useState, useEffect } from 'react';
import { useEarningTypeSlice } from '../slices/useEarningTypeSlice';
import '../styles/EarningTypeForm.css';
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('token');

const EarningTypeForm = ({ earningType, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useEarningTypeSlice();
  const [formData, setFormData] = useState({
    EarningTypeName: '',
    Description: '',
    IsTaxable: false,
    IsFixedAmount: true,
    CalculationRule: '',
    IsActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!earningType && earningType.EarningTypeID;

  useEffect(() => {
    if (isEditMode && earningType) {
      setFormData({
        EarningTypeName: earningType.EarningTypeName || '',
        Description: earningType.Description || '',
        IsTaxable: earningType.IsTaxable || false,
        IsFixedAmount: earningType.IsFixedAmount || true,
        CalculationRule: earningType.CalculationRule || '',
        IsActive: earningType.IsActive !== undefined ? earningType.IsActive : true,
      });
    }
  }, [earningType, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.EarningTypeName) errors.EarningTypeName = 'Earning Type Name is required';
    if (formData.EarningTypeName.length > 100) errors.EarningTypeName = 'Name must be 100 characters or less';
    if (formData.Description && formData.Description.length > 255) errors.Description = 'Description must be 255 characters or less';
    if (!formData.IsFixedAmount && !formData.CalculationRule)
      errors.CalculationRule = 'Calculation Rule is required for non-fixed earning types';
    if (formData.IsFixedAmount && formData.CalculationRule)
      errors.CalculationRule = 'Fixed earning types cannot have a Calculation Rule';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        EarningTypeID: isEditMode ? earningType.EarningTypeID : '00000000-0000-0000-0000-000000000000',
        EarningTypeName: formData.EarningTypeName,
        Description: formData.Description || null,
        IsTaxable: formData.IsTaxable,
        IsFixedAmount: formData.IsFixedAmount,
        CalculationRule: formData.IsFixedAmount ? null : formData.CalculationRule || null,
      };
      await handleSubmit(payload, isEditMode ? earningType.EarningTypeID : null);
      onClose();
    } catch (error) {
      setFormErrors((prev) => ({ ...prev, submit: error.response?.data?.error || 'Error submitting form' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditMode ? 'Edit Earning Type' : 'Add New Earning Type'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="EarningTypeName">Earning Type Name</label>
                <input
                  type="text"
                  id="EarningTypeName"
                  name="EarningTypeName"
                  value={formData.EarningTypeName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.EarningTypeName && <span className="error">{formErrors.EarningTypeName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="Description">Description</label>
                <input
                  type="text"
                  id="Description"
                  name="Description"
                  value={formData.Description}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.Description && <span className="error">{formErrors.Description}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="IsTaxable">Is Taxable</label>
                <input
                  type="checkbox"
                  id="IsTaxable"
                  name="IsTaxable"
                  checked={formData.IsTaxable}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="IsFixedAmount">Is Fixed Amount</label>
                <input
                  type="checkbox"
                  id="IsFixedAmount"
                  name="IsFixedAmount"
                  checked={formData.IsFixedAmount}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              {!formData.IsFixedAmount && (
                <div className="form-group">
                  <label htmlFor="CalculationRule">Calculation Rule</label>
                  <input
                    type="text"
                    id="CalculationRule"
                    name="CalculationRule"
                    value={formData.CalculationRule}
                    onChange={handleChange}
                    placeholder="e.g., 0.07 for 7% or HourlyRate"
                    disabled={isLoading}
                  />
                  {formErrors.CalculationRule && <span className="error">{formErrors.CalculationRule}</span>}
                </div>
              )}
              <div className="form-group">
                <label htmlFor="IsActive">Is Active</label>
                <input
                  type="checkbox"
                  id="IsActive"
                  name="IsActive"
                  checked={formData.IsActive}
                  onChange={handleChange}
                  disabled={isLoading}
                />
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

export default EarningTypeForm;