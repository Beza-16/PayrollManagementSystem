import React, { useState, useEffect } from 'react';
import { useEmployeeSlice } from '../slices/EmployeeSlice';
import { useShiftScheduleSliceWithRedux } from '../slices/ShiftScheduleSlice';
import { useJobGradeSlice } from '../slices/JobGradeSlice';
import { useContractSlice } from '../slices/ContractSlice';
import '../styles/EmployeeRecordsForm.css';

const EmployeeRecordsForm = ({ record, filter, onClose }) => {
  const { employees } = useEmployeeSlice();
  const {
    handleSubmit: submitShiftSchedule,
    isSubmitting: isSubmittingShift,
    errorMessage: shiftError,
  } = useShiftScheduleSliceWithRedux();
  const {
    handleSubmit: submitJobGrade,
    isSubmitting: isSubmittingJobGrade,
    errorMessage: jobGradeError,
  } = useJobGradeSlice();
  const {
    handleSubmit: submitContract,
    isSubmitting: isSubmittingContract,
    errorMessage: contractError,
  } = useContractSlice();

  const [formData, setFormData] = useState({
    ShiftID: record?.ShiftID || '',
    EmployeeID: record?.EmployeeID || '',
    ShiftType: record?.ShiftType || '',
    StartTime: record?.StartTime ? record.StartTime.split(':').slice(0, 2).join(':') : '',
    EndTime: record?.EndTime ? record.EndTime.split(':').slice(0, 2).join(':') : '',
    JobGradeID: record?.JobGradeID || '',
    Grade: record?.Grade || '',
    SalaryScale: record?.SalaryScale || '',
    ContractID: record?.ContractID || '',
    ContractType: record?.ContractType || '',
    ProbationPeriod: record?.ProbationPeriod || '',
    StartDate: record?.StartDate ? new Date(record.StartDate).toISOString().split('T')[0] : '',
    EndDate: record?.EndDate ? new Date(record.EndDate).toISOString().split('T')[0] : '',
  });

  const [errors, setErrors] = useState({});
  const isEditMode = !!record;

  useEffect(() => {
    if (shiftError || jobGradeError || contractError) {
      setErrors({ form: shiftError || jobGradeError || contractError });
    }
  }, [shiftError, jobGradeError, contractError]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.EmployeeID) newErrors.EmployeeID = 'Employee is required';
    if (filter === 'ShiftSchedule') {
      if (!formData.ShiftType) newErrors.ShiftType = 'Shift type is required';
      if (!formData.StartTime) newErrors.StartTime = 'Start time is required';
      if (!formData.EndTime) newErrors.EndTime = 'End time is required';
      if (formData.StartTime && !/^\d{2}:\d{2}$/.test(formData.StartTime)) {
        newErrors.StartTime = 'Start time must be in HH:mm format';
      }
      if (formData.EndTime && !/^\d{2}:\d{2}$/.test(formData.EndTime)) {
        newErrors.EndTime = 'End time must be in HH:mm format';
      }
    } else if (filter === 'JobGrade') {
      if (!formData.Grade) newErrors.Grade = 'Grade is required';
      if (!formData.SalaryScale) newErrors.SalaryScale = 'Salary scale is required';
      if (formData.SalaryScale && isNaN(formData.SalaryScale)) {
        newErrors.SalaryScale = 'Salary scale must be a number';
      }
    } else if (filter === 'Contract') {
      if (!formData.ContractType) newErrors.ContractType = 'Contract type is required';
      if (!formData.StartDate) newErrors.StartDate = 'Start date is required';
      if (formData.ProbationPeriod && isNaN(formData.ProbationPeriod)) {
        newErrors.ProbationPeriod = 'Probation period must be a number';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem('token');
    console.log('EmployeeRecordsForm - Token:', token || 'Missing');

    try {
      if (filter === 'ShiftSchedule') {
        const payload = {
          ShiftID: formData.ShiftID || crypto.randomUUID(),
          EmployeeID: formData.EmployeeID,
          ShiftType: formData.ShiftType,
          StartTime: formData.StartTime ? `${formData.StartTime}:00` : null,
          EndTime: formData.EndTime ? `${formData.EndTime}:00` : null,
          CreatedAt: isEditMode ? record.CreatedAt : new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
        };
        console.log('EmployeeRecordsForm - ShiftSchedule Payload:', JSON.stringify(payload, null, 2));
        await submitShiftSchedule(payload, isEditMode);
      } else if (filter === 'JobGrade') {
        const payload = {
          JobGradeID: formData.JobGradeID || crypto.randomUUID(),
          EmployeeID: formData.EmployeeID,
          Grade: formData.Grade,
          SalaryScale: parseFloat(formData.SalaryScale),
          CreatedAt: isEditMode ? record.CreatedAt : new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
        };
        console.log('EmployeeRecordsForm - JobGrade Payload:', JSON.stringify(payload, null, 2));
        await submitJobGrade(payload, isEditMode);
      } else if (filter === 'Contract') {
        const payload = {
          ContractID: formData.ContractID || crypto.randomUUID(),
          EmployeeID: formData.EmployeeID,
          ContractType: formData.ContractType,
          ProbationPeriod: formData.ProbationPeriod ? parseInt(formData.ProbationPeriod) : null,
          StartDate: formData.StartDate || null,
          EndDate: formData.EndDate || null,
          CreatedAt: isEditMode ? record.CreatedAt : new Date().toISOString(),
          UpdatedAt: new Date().toISOString(),
        };
        console.log('EmployeeRecordsForm - Contract Payload:', JSON.stringify(payload, null, 2));
        await submitContract(payload, isEditMode);
      }
      onClose();
    } catch (error) {
      console.error('EmployeeRecordsForm - Submission error:', error);
      setErrors({ form: 'Failed to submit form. Please try again.' });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditMode ? 'Edit' : 'Add'} {filter}</h2>
        <form onSubmit={handleSubmit} className="employee-records-form">
          {errors.form && <div className="error" style={{ color: 'red' }}>{errors.form}</div>}
          {(isSubmittingShift || isSubmittingJobGrade || isSubmittingContract) && (
            <div className="loading">Submitting...</div>
          )}

          <div className="form-group">
            <label htmlFor="EmployeeID">Full Name</label>
            <select
              name="EmployeeID"
              value={formData.EmployeeID}
              onChange={handleInputChange}
              className={errors.EmployeeID ? 'error-input' : ''}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.EmployeeID} value={emp.EmployeeID}>
                  {emp.FullName}
                </option>
              ))}
            </select>
            {errors.EmployeeID && <span className="error-text">{errors.EmployeeID}</span>}
          </div>

          {filter === 'ShiftSchedule' && (
            <>
              <div className="form-group">
                <label htmlFor="ShiftType">Shift Type</label>
                <input
                  type="text"
                  name="ShiftType"
                  value={formData.ShiftType}
                  onChange={handleInputChange}
                  placeholder="e.g., Morning"
                  className={errors.ShiftType ? 'error-input' : ''}
                />
                {errors.ShiftType && <span className="error-text">{errors.ShiftType}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="StartTime">Start Time</label>
                <input
                  type="time"
                  name="StartTime"
                  value={formData.StartTime}
                  onChange={handleInputChange}
                  className={errors.StartTime ? 'error-input' : ''}
                />
                {errors.StartTime && <span className="error-text">{errors.StartTime}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="EndTime">End Time</label>
                <input
                  type="time"
                  name="EndTime"
                  value={formData.EndTime}
                  onChange={handleInputChange}
                  className={errors.EndTime ? 'error-input' : ''}
                />
                {errors.EndTime && <span className="error-text">{errors.EndTime}</span>}
              </div>
            </>
          )}

          {filter === 'JobGrade' && (
            <>
              <div className="form-group">
                <label htmlFor="Grade">Grade</label>
                <input
                  type="text"
                  name="Grade"
                  value={formData.Grade}
                  onChange={handleInputChange}
                  placeholder="e.g., Senior"
                  className={errors.Grade ? 'error-input' : ''}
                />
                {errors.Grade && <span className="error-text">{errors.Grade}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="SalaryScale">Salary Scale</label>
                <input
                  type="number"
                  name="SalaryScale"
                  value={formData.SalaryScale}
                  onChange={handleInputChange}
                  placeholder="e.g., 75000"
                  className={errors.SalaryScale ? 'error-input' : ''}
                />
                {errors.SalaryScale && <span className="error-text">{errors.SalaryScale}</span>}
              </div>
            </>
          )}

          {filter === 'Contract' && (
            <>
              <div className="form-group">
                <label htmlFor="ContractType">Contract Type</label>
                <input
                  type="text"
                  name="ContractType"
                  value={formData.ContractType}
                  onChange={handleInputChange}
                  placeholder="e.g., Permanent"
                  className={errors.ContractType ? 'error-input' : ''}
                />
                {errors.ContractType && <span className="error-text">{errors.ContractType}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="ProbationPeriod">Probation Period (months)</label>
                <input
                  type="number"
                  name="ProbationPeriod"
                  value={formData.ProbationPeriod}
                  onChange={handleInputChange}
                  placeholder="e.g., 6"
                  className={errors.ProbationPeriod ? 'error-input' : ''}
                />
                {errors.ProbationPeriod && <span className="error-text">{errors.ProbationPeriod}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="StartDate">Start Date</label>
                <input
                  type="date"
                  name="StartDate"
                  value={formData.StartDate}
                  onChange={handleInputChange}
                  className={errors.StartDate ? 'error-input' : ''}
                />
                {errors.StartDate && <span className="error-text">{errors.StartDate}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="EndDate">End Date</label>
                <input
                  type="date"
                  name="EndDate"
                  value={formData.EndDate}
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmittingShift || isSubmittingJobGrade || isSubmittingContract}
            >
              {isEditMode ? 'Update' : 'Add'} {filter}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmittingShift || isSubmittingJobGrade || isSubmittingContract}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeRecordsForm;