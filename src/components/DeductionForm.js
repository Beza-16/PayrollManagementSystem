import React, { useState, useEffect } from 'react';
import { useDeductionSlice } from '../slices/DeductionSlice';
import '../styles/DeductionForm.css';
import axios from 'axios';
import Select from 'react-select';

const getAuthToken = () => localStorage.getItem('token');

const DeductionForm = ({ deduction, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useDeductionSlice();
  const [formData, setFormData] = useState({
    EmployeeID: '',
    PeriodID: '',
    DeductionTypeID: '',
    Amount: '',
    StartDate: '',
    EndDate: '',
    Status: 'Draft',
    Remarks: '',
  });
  const [employees, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [deductionTypes, setDeductionTypes] = useState([]);
  const [isFixedAmount, setIsFixedAmount] = useState(true);
  const [calculationRule, setCalculationRule] = useState('N/A');
  const [previewAmount, setPreviewAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const isEditMode = !!deduction && deduction.DeductionID;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const [empResponse, periodResponse, deductionTypeResponse] = await Promise.all([
          axios.get('https://localhost:14686/api/Employee', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://localhost:14686/api/Period', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://localhost:14686/api/DeductionType', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setEmployees(
          empResponse.data.map(emp => ({
            value: emp.EmployeeID,
            label: emp.FullName || `${emp.FirstName || ''} ${emp.LastName || ''}`.trim() || 'N/A',
          }))
        );
        setPeriods(
          periodResponse.data.map(period => ({
            value: period.PeriodId || period.PeriodID,
            label: period.Name || period.PeriodName || 'N/A',
          }))
        );
        setDeductionTypes(
          deductionTypeResponse.data.map(type => ({
            value: type.DeductionTypeID,
            label: type.Name || type.DeductionTypeName || 'N/A',
            isFixedAmount: type.IsFixedAmount ?? true,
            calculationRule: type.CalculationRule || 'N/A',
          }))
        );
      } catch (error) {
        console.error('Fetch error:', error);
        setFormErrors(prev => ({
          ...prev,
          fetch: `Failed to load options: ${error.message}`,
        }));
      } finally {
        setIsLoading(false);
      }
    };
    fetchOptions();

    if (isEditMode && deduction) {
      setFormData({
        EmployeeID: deduction.EmployeeID,
        PeriodID: deduction.PeriodID,
        DeductionTypeID: deduction.DeductionTypeID,
        Amount: deduction.Amount || '',
        StartDate: deduction.StartDate ? deduction.StartDate.split('T')[0] : '',
        EndDate: deduction.EndDate ? deduction.EndDate.split('T')[0] : '',
        Status: deduction.Status || 'Draft',
        Remarks: deduction.Remarks || '',
      });
      setIsFixedAmount(deduction.IsFixedAmount ?? true);
      setCalculationRule(deduction.CalculationRule || 'N/A');
    }
  }, [deduction, isEditMode]);

  useEffect(() => {
    const fetchPreviewAmount = async () => {
      if (!isFixedAmount && formData.EmployeeID && formData.PeriodID && formData.DeductionTypeID) {
        try {
          const token = getAuthToken();
          const response = await axios.get(
            `https://localhost:14686/api/Deduction/preview-amount?employeeId=${formData.EmployeeID}&periodId=${formData.PeriodID}&deductionTypeId=${formData.DeductionTypeID}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPreviewAmount(response.data.amount);
        } catch (error) {
          console.error('Failed to fetch preview amount:', error);
          setPreviewAmount(null);
        }
      } else {
        setPreviewAmount(null);
      }
    };
    fetchPreviewAmount();
  }, [formData.EmployeeID, formData.PeriodID, formData.DeductionTypeID, isFixedAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (name, selectedOption) => {
    const newValue = selectedOption ? selectedOption.value : '';
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'DeductionTypeID') {
      const selectedType = deductionTypes.find(type => type.value === newValue);
      setIsFixedAmount(selectedType ? selectedType.isFixedAmount : true);
      setCalculationRule(selectedType ? selectedType.calculationRule : 'N/A');
      setFormData(prev => ({
        ...prev,
        Amount: selectedType && !selectedType.isFixedAmount ? '0' : prev.Amount,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.EmployeeID) errors.EmployeeID = 'Employee is required';
    if (!formData.PeriodID) errors.PeriodID = 'Period is required';
    if (!formData.DeductionTypeID) errors.DeductionTypeID = 'Deduction Type is required';
    if (isFixedAmount && (!formData.Amount || formData.Amount <= 0 || formData.Amount > 100000000))
      errors.Amount = 'Amount must be between 0.01 and 100,000,000 for fixed deductions';
    if (formData.StartDate && formData.EndDate && new Date(formData.StartDate) > new Date(formData.EndDate))
      errors.StartDate = 'Start Date cannot be after End Date';
    if (!['Draft', 'Pending Approval', 'Approved', 'Applied', 'Cancelled'].includes(formData.Status))
      errors.Status = 'Status must be Draft, Pending Approval, Approved, Applied, or Cancelled';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        DeductionID: isEditMode ? deduction.DeductionID : '00000000-0000-0000-0000-000000000000',
        EmployeeID: formData.EmployeeID,
        PeriodID: formData.PeriodID,
        DeductionTypeID: formData.DeductionTypeID,
        Amount: isFixedAmount ? parseFloat(formData.Amount) || 0 : 0,
        IsFixedAmount: isFixedAmount,
        CalculationRule: calculationRule,
        StartDate: formData.StartDate || null,
        EndDate: formData.EndDate || null,
        Status: formData.Status,
        Remarks: formData.Remarks || null,
      };
      await handleSubmit(payload, isEditMode ? deduction.DeductionID : null);
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
        <h2>{isEditMode ? 'Edit Deduction' : 'Add New Deduction'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        {formErrors.fetch && <div className="error-message">{formErrors.fetch}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="EmployeeID">Employee</label>
                <Select
                  options={employees}
                  value={employees.find(e => e.value === formData.EmployeeID) || null}
                  onChange={(option) => handleSelectChange('EmployeeID', option)}
                  placeholder="Select Employee"
                  isClearable
                  isDisabled={isLoading}
                />
                {formErrors.EmployeeID && <span className="error">{formErrors.EmployeeID}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="PeriodID">Period</label>
                <Select
                  options={periods}
                  value={periods.find(p => p.value === formData.PeriodID) || null}
                  onChange={(option) => handleSelectChange('PeriodID', option)}
                  placeholder="Select Period"
                  isClearable
                  isDisabled={isLoading}
                />
                {formErrors.PeriodID && <span className="error">{formErrors.PeriodID}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="DeductionTypeID">Deduction Type</label>
                <Select
                  options={deductionTypes}
                  value={deductionTypes.find(dt => dt.value === formData.DeductionTypeID) || null}
                  onChange={(option) => handleSelectChange('DeductionTypeID', option)}
                  placeholder="Select Deduction Type"
                  isClearable
                  isDisabled={isLoading}
                />
                {formErrors.DeductionTypeID && <span className="error">{formErrors.DeductionTypeID}</span>}
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="Amount">Amount (ETB)</label>
                {isFixedAmount ? (
                  <input
                    type="number"
                    id="Amount"
                    name="Amount"
                    value={formData.Amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    max="100000000"
                    disabled={isLoading}
                  />
                ) : (
                  <div className="calculation-rule">
                    {calculationRule}
                    {previewAmount !== null && (
                      <span className="preview-amount"> (Preview: {previewAmount.toFixed(2)} ETB)</span>
                    )}
                  </div>
                )}
                {formErrors.Amount && <span className="error">{formErrors.Amount}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="StartDate">Start Date</label>
                <input
                  type="date"
                  id="StartDate"
                  name="StartDate"
                  value={formData.StartDate}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                {formErrors.StartDate && <span className="error">{formErrors.StartDate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="EndDate">End Date</label>
                <input
                  type="date"
                  id="EndDate"
                  name="EndDate"
                  value={formData.EndDate}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="Status">Status</label>
                <select
                  id="Status"
                  name="Status"
                  value={formData.Status}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Applied">Applied</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {formErrors.Status && <span className="error">{formErrors.Status}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="Remarks">Remarks</label>
                <input
                  type="text"
                  id="Remarks"
                  name="Remarks"
                  value={formData.Remarks}
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

export default DeductionForm;