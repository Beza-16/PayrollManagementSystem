import React, { useState, useEffect } from 'react';
import { useEarningsSlice } from '../slices/EarningsSlice';
import '../styles/EarningsForm.css';
import axios from 'axios';
import Select from 'react-select';

// Assume token is stored in localStorage after login
const getAuthToken = () => localStorage.getItem('token');

const EarningsForm = ({ earning, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useEarningsSlice();

  const [formData, setFormData] = useState({
    EmployeeID: '',
    PeriodID: '',
    EarningTypeID: '',
    Amount: '',
    StartDate: '',
    EndDate: '',
    Status: 'Draft',
    Remarks: '',
    Taxability: 'Taxable',
    TaxableRate: '',
    IsBasic: false,
  });

  const [employees, setEmployees] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [earningTypes, setEarningTypes] = useState([]);
  const [isFixedAmount, setIsFixedAmount] = useState(true);
  const [calculationRule, setCalculationRule] = useState('N/A');
  const [previewAmount, setPreviewAmount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const isEditMode = !!earning && earning.EarningID;

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setIsLoading(true);
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found. Please log in.');
        }

        const [empResponse, periodResponse, earningTypeResponse] = await Promise.all([
          axios.get('https://localhost:14686/api/Employee', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('https://localhost:14686/api/Period', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('https://localhost:14686/api/EarningType', {
            headers: { Authorization: `Bearer ${token}` },
          }),
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
        setEarningTypes(
          earningTypeResponse.data.map(type => ({
            value: type.EarningTypeID,
            label: type.Name || 'N/A',
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

    if (isEditMode && earning) {
      console.log('Edit mode earning:', earning);
      setFormData({
        EmployeeID: earning.EmployeeID,
        PeriodID: earning.PeriodID,
        EarningTypeID: earning.EarningTypeID || '',
        Amount: earning.Amount || '',
        StartDate: earning.StartDate ? earning.StartDate.split('T')[0] : '',
        EndDate: earning.EndDate ? earning.EndDate.split('T')[0] : '',
        Status: earning.Status || 'Draft',
        Remarks: earning.Remarks || '',
        Taxability: earning.Taxability || 'Taxable',
        TaxableRate: earning.TaxableRate || '',
        IsBasic: earning.IsBasic || false,
      });
      setIsFixedAmount(earning.IsFixedAmount ?? true);
      setCalculationRule(earning.CalculationRule || 'N/A');
    }
  }, [earning, isEditMode]);

  useEffect(() => {
    const fetchPreviewAmount = async () => {
      if (!isFixedAmount && formData.EmployeeID && formData.PeriodID && formData.EarningTypeID) {
        try {
          const token = getAuthToken();
          const response = await axios.get(
            `https://localhost:14686/api/Earning/preview-amount?employeeId=${formData.EmployeeID}&periodId=${formData.PeriodID}&earningTypeId=${formData.EarningTypeID}`,
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
  }, [formData.EmployeeID, formData.PeriodID, formData.EarningTypeID, isFixedAmount]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
    if (name === 'EarningTypeID') {
      const selectedType = earningTypes.find(type => type.value === newValue);
      setIsFixedAmount(selectedType ? selectedType.isFixedAmount : true);
      setCalculationRule(selectedType ? selectedType.calculationRule : 'N/A');
      setFormData(prev => ({
        ...prev,
        Amount: selectedType && !selectedType.isFixedAmount ? '0' : prev.Amount,
      }));
    }
  };

  const handleTaxableRateChange = (e) => {
    const value = e.target.value ? parseFloat(e.target.value) : '';
    setFormData(prev => ({ ...prev, TaxableRate: value }));
    setFormErrors(prev => ({ ...prev, TaxableRate: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.EmployeeID) errors.EmployeeID = 'Employee is required';
    if (!formData.PeriodID) errors.PeriodID = 'Period is required';
    if (!formData.EarningTypeID) errors.EarningTypeID = 'Earning Type is required';
    if (isFixedAmount && (!formData.Amount || formData.Amount <= 0 || formData.Amount > 100000000))
      errors.Amount = 'Amount must be between 0.01 and 100,000,000 for fixed earnings';
    if (formData.Taxability === 'PartialTaxable' && (!formData.TaxableRate || formData.TaxableRate < 0 || formData.TaxableRate > 1))
      errors.TaxableRate = 'Taxable Rate must be between 0 and 1 for PartialTaxable';
    if (formData.StartDate && formData.EndDate && new Date(formData.StartDate) > new Date(formData.EndDate))
      errors.StartDate = 'Start Date cannot be after End Date';
    if (!['Draft', 'Pending', 'Approved', 'Paid', 'Cancelled'].includes(formData.Status))
      errors.Status = 'Status must be Draft, Pending, Approved, Paid, or Cancelled';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        EmployeeID: formData.EmployeeID,
        PeriodID: formData.PeriodID,
        EarningTypeID: formData.EarningTypeID,
        Amount: isFixedAmount ? parseFloat(formData.Amount) || 0 : 0,
        StartDate: formData.StartDate || null,
        EndDate: formData.EndDate || null,
        Status: formData.Status,
        Remarks: formData.Remarks || null,
        Taxability: formData.Taxability,
        TaxableRate: formData.Taxability === 'PartialTaxable' ? parseFloat(formData.TaxableRate) || null : null,
        IsBasic: formData.IsBasic,
        IsFixedAmount: isFixedAmount,
        CalculationRule: calculationRule,
      };
      console.log('Submitting payload:', payload);
      await handleSubmit(payload, isEditMode ? earning.EarningID : null);
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
        <h2>{isEditMode ? 'Edit Earning' : 'Add New Earning'}</h2>
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
                <label htmlFor="EarningTypeID">Earning Type</label>
                <Select
                  options={earningTypes}
                  value={earningTypes.find(et => et.value === formData.EarningTypeID) || null}
                  onChange={(option) => handleSelectChange('EarningTypeID', option)}
                  placeholder="Select Earning Type"
                  isClearable
                  isDisabled={isLoading}
                />
                {formErrors.EarningTypeID && <span className="error">{formErrors.EarningTypeID}</span>}
              </div>
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
            </div>
            <div className="form-column">
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
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Paid">Paid</option>
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
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="Taxability">Taxability</label>
                <select
                  id="Taxability"
                  name="Taxability"
                  value={formData.Taxability}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="Taxable">Taxable</option>
                  <option value="NonTaxable">NonTaxable</option>
                  <option value="PartialTaxable">PartialTaxable</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="TaxableRate">Taxable Rate (0-1)</label>
                <input
                  type="number"
                  id="TaxableRate"
                  name="TaxableRate"
                  value={formData.TaxableRate}
                  onChange={handleTaxableRateChange}
                  step="0.01"
                  min="0"
                  max="1"
                  disabled={formData.Taxability !== 'PartialTaxable' || isLoading}
                />
                {formErrors.TaxableRate && <span className="error">{formErrors.TaxableRate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="IsBasic">Is Basic</label>
                <input
                  type="checkbox"
                  id="IsBasic"
                  name="IsBasic"
                  checked={formData.IsBasic}
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

export default EarningsForm;