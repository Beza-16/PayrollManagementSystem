import React, { useState, useEffect } from 'react';
import { useDeductionTypeSlice } from '../slices/DeductionTypeSlice';
import '../styles/DeductionTypeForm.css';
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('token');

const DeductionTypeForm = ({ deductionType, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useDeductionTypeSlice();
  const [formData, setFormData] = useState({
    DeductionTypeName: '',
    Description: '',
    IsTaxable: false,
    IsFixedAmount: true,
    CalculationRule: '',
    IsActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!deductionType && deductionType.DeductionTypeID;

  useEffect(() => {
    if (isEditMode && deductionType) {
      setFormData({
        DeductionTypeName: deductionType.DeductionTypeName || '',
        Description: deductionType.Description || '',
        IsTaxable: deductionType.IsTaxable || false,
        IsFixedAmount: deductionType.IsFixedAmount || true,
        CalculationRule: deductionType.CalculationRule || '',
        IsActive: deductionType.IsActive || true,
      });
    }
  }, [deductionType, isEditMode]);

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
    if (!formData.DeductionTypeName) errors.DeductionTypeName = 'Deduction Type Name is required';
    if (formData.DeductionTypeName.length > 100) errors.DeductionTypeName = 'Name must be 100 characters or less';
    if (!formData.IsFixedAmount && !formData.CalculationRule)
      errors.CalculationRule = 'Calculation Rule is required for non-fixed deductions';
    if (formData.IsFixedAmount && formData.CalculationRule)
      errors.CalculationRule = 'Fixed deductions cannot have a Calculation Rule';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        DeductionTypeID: isEditMode ? deductionType.DeductionTypeID : '00000000-0000-0000-0000-000000000000',
        DeductionTypeName: formData.DeductionTypeName,
        Description: formData.Description || null,
        IsTaxable: formData.IsTaxable,
        IsFixedAmount: formData.IsFixedAmount,
        CalculationRule: formData.IsFixedAmount ? null : formData.CalculationRule || null,
        IsActive: formData.IsActive,
      };
      await handleSubmit(payload, isEditMode ? deductionType.DeductionTypeID : null);
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
        <h2>{isEditMode ? 'Edit Deduction Type' : 'Add New Deduction Type'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="DeductionTypeName">Deduction Type Name</label>
                <input
                  type="text"
                  id="DeductionTypeName"
                  name="DeductionTypeName"
                  value={formData.DeductionTypeName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.DeductionTypeName && <span className="error">{formErrors.DeductionTypeName}</span>}
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
                    placeholder="e.g., 0.07 for 7% or Progressive"
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

export default DeductionTypeForm;