import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useWorkArrangementSlice } from '../slices/WorkArrangementSlice';
import '../styles/WorkArrangementForm.css';

const WorkArrangementForm = ({ workArrangement, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage, fetchWorkArrangements, checkWorkArrangementExists } = useWorkArrangementSlice();
  const [formData, setFormData] = useState({
    WorkArrangementID: '',
    EmployeeID: '',
    IsBasic: 'No',
    IsRetired: 'No',
    IsPension: 'No',
    CostSharing: false,
    CostSharingAmount: '',
    TerminationDate: null,
    CreatedAt: '',
    UpdatedAt: '',
    EmployeeName: '', // Add EmployeeName for error messages
  });
  const [employees, setEmployees] = useState([]);
  const [localError, setLocalError] = useState('');

  const isEditMode = !!workArrangement && workArrangement.WorkArrangementID;

  useEffect(() => {
    fetchWorkArrangements();
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await fetch('https://localhost:14686/api/Employee', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch employees');
        const data = await response.json();
        setEmployees(data || []);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
        setLocalError('Failed to load employees.');
      }
    };

    fetchEmployees();

    if (isEditMode) {
      setFormData({
        WorkArrangementID: workArrangement.WorkArrangementID || '',
        EmployeeID: workArrangement.EmployeeID || '',
        IsBasic: workArrangement.IsBasic ? 'Yes' : 'No',
        IsRetired: workArrangement.IsRetired ? 'Yes' : 'No',
        IsPension: workArrangement.IsPension ? 'Yes' : 'No',
        CostSharing: workArrangement.CostSharing || false,
        CostSharingAmount: workArrangement.CostSharingAmount || '',
        TerminationDate: workArrangement.TerminationDate ? new Date(workArrangement.TerminationDate) : null,
        CreatedAt: workArrangement.CreatedAt || '',
        UpdatedAt: workArrangement.UpdatedAt || '',
        EmployeeName: workArrangement.EmployeeName || '',
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      }));
    }
  }, [workArrangement, isEditMode, fetchWorkArrangements]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'CostSharing' ? value === 'true' : value,
      ...(name === 'EmployeeID' && {
        EmployeeName: employees.find((emp) => emp.EmployeeID === value)?.FullName || '',
      }),
    }));
    setLocalError('');
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      TerminationDate: date,
    }));
    setLocalError('');
  };

  const validateForm = async () => {
    if (!formData.EmployeeID) {
      setLocalError('Please select an employee.');
      return false;
    }
    if (formData.CostSharing && !formData.CostSharingAmount) {
      setLocalError('Cost Sharing Amount is required when Cost Sharing is enabled.');
      return false;
    }
    if (formData.CostSharingAmount && isNaN(parseFloat(formData.CostSharingAmount))) {
      setLocalError('Cost Sharing Amount must be a valid number.');
      return false;
    }
    if (!isEditMode) {
      const exists = await checkWorkArrangementExists(formData.EmployeeID);
      if (exists) {
        setLocalError(`A work arrangement already exists for ${formData.EmployeeName || 'this employee'}.`);
        return false;
      }
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!(await validateForm())) return;
    try {
      const submitData = {
        WorkArrangementID: isEditMode ? formData.WorkArrangementID : undefined,
        EmployeeID: formData.EmployeeID,
        IsBasic: formData.IsBasic === 'Yes',
        IsRetired: formData.IsRetired === 'Yes',
        IsPension: formData.IsPension === 'Yes',
        CostSharing: formData.CostSharing,
        CostSharingAmount: formData.CostSharingAmount ? parseFloat(formData.CostSharingAmount) : null,
        TerminationDate: formData.TerminationDate ? formData.TerminationDate.toISOString() : null,
        CreatedAt: formData.CreatedAt || new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
        EmployeeName: formData.EmployeeName, // Include for error handling
      };
      await handleSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditMode ? 'Edit Work Arrangement' : 'Add New Work Arrangement'}</h2>
        {(errorMessage || localError) && <div className="error-message">{errorMessage || localError}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="EmployeeID">Employee</label>
            <select
              id="EmployeeID"
              name="EmployeeID"
              value={formData.EmployeeID}
              onChange={handleChange}
              required
            >
              <option value="">Select an employee</option>
              {employees.map((employee) => (
                <option key={employee.EmployeeID} value={employee.EmployeeID}>
                  {employee.FullName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="IsBasic">Is Basic</label>
            <select
              id="IsBasic"
              name="IsBasic"
              value={formData.IsBasic}
              onChange={handleChange}
              required
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="IsRetired">Is Retired</label>
            <select
              id="IsRetired"
              name="IsRetired"
              value={formData.IsRetired}
              onChange={handleChange}
              required
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="IsPension">Is Pension</label>
            <select
              id="IsPension"
              name="IsPension"
              value={formData.IsPension}
              onChange={handleChange}
              required
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="CostSharing">Cost Sharing</label>
            <select
              id="CostSharing"
              name="CostSharing"
              value={formData.CostSharing.toString()}
              onChange={handleChange}
              required
            >
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </div>
          {formData.CostSharing && (
            <div className="form-group">
              <label htmlFor="CostSharingAmount">Cost Sharing Amount</label>
              <input
                type="number"
                id="CostSharingAmount"
                name="CostSharingAmount"
                value={formData.CostSharingAmount}
                onChange={handleChange}
                placeholder="Enter amount"
                step="0.01"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="TerminationDate">Termination Date (Optional)</label>
            <DatePicker
              id="TerminationDate"
              selected={formData.TerminationDate}
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select termination date"
              className="form-control"
              isClearable
            />
          </div>
          <div className="form-group">
            <label htmlFor="CreatedAt">Created At</label>
            <input
              type="text"
              id="CreatedAt"
              name="CreatedAt"
              value={formData.CreatedAt ? new Date(formData.CreatedAt).toLocaleString() : ''}
              readOnly
            />
          </div>
          <div className="form-group">
            <label htmlFor="UpdatedAt">Updated At</label>
            <input
              type="text"
              id="UpdatedAt"
              name="UpdatedAt"
              value={formData.UpdatedAt ? new Date(formData.UpdatedAt).toLocaleString() : ''}
              readOnly
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
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

export default WorkArrangementForm;