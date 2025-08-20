import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useLeaveSlice } from '../slices/LeaveSlice';
import { useLeaveTypeSlice } from '../slices/LeaveTypeSlice';
import '../styles/LeaveForm.css';

const LeaveForm = ({ leave, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage, employees, fetchEmployees } = useLeaveSlice();
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypeSlice();
  const [formData, setFormData] = useState({
    LeaveID: '',
    EmployeeID: '',
    LeaveTypeID: '',
    StartDate: new Date(),
    EndDate: new Date(),
    LeaveDescription: '',
    Status: 0, // 0=Pending, 1=Approved, 2=Denied
    MedicalDocument: '',
    LeaveOfficesFiled: false,
    AnnualLeaveDate: null,
    RejectionReason: '',
    ApprovedBy: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const isEditMode = !!leave && leave.LeaveID;

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchEmployees(), fetchLeaveTypes()]);
        if (isEditMode) {
          setFormData({
            LeaveID: leave.LeaveID || '',
            EmployeeID: leave.EmployeeID || '',
            LeaveTypeID: leave.LeaveTypeID || '',
            StartDate: leave.StartDate ? new Date(leave.StartDate) : new Date(),
            EndDate: leave.EndDate ? new Date(leave.EndDate) : new Date(),
            LeaveDescription: leave.LeaveDescription || '',
            Status: leave.Status === 'Pending' ? 0 : leave.Status === 'Approved' ? 1 : leave.Status === 'Denied' ? 2 : 0,
            MedicalDocument: leave.MedicalDocument || '',
            LeaveOfficesFiled: leave.LeaveOfficesFiled || false,
            AnnualLeaveDate: leave.AnnualLeaveDate ? new Date(leave.AnnualLeaveDate) : null,
            RejectionReason: leave.RejectionReason || '',
            ApprovedBy: leave.ApprovedBy || '',
          });
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setFormErrors({ general: 'Failed to load form options. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [leave, isEditMode, fetchEmployees, fetchLeaveTypes]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (date, name) => {
    const validDate = date instanceof Date && !isNaN(date) ? date : null;
    setFormData(prev => ({ ...prev, [name]: validDate }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.EmployeeID) errors.EmployeeID = 'Employee is required';
    if (!formData.LeaveTypeID) errors.LeaveTypeID = 'Leave Type is required';
    if (!formData.StartDate || !(formData.StartDate instanceof Date) || isNaN(formData.StartDate))
      errors.StartDate = 'Start date is required';
    if (!formData.EndDate || !(formData.EndDate instanceof Date) || isNaN(formData.EndDate))
      errors.EndDate = 'End date is required';
    if (formData.EndDate && formData.StartDate && formData.EndDate < formData.StartDate)
      errors.EndDate = 'End date cannot be earlier than start date';
    if (!formData.LeaveDescription.trim()) errors.LeaveDescription = 'Description is required';
    if (formData.LeaveDescription.length > 1000) errors.LeaveDescription = 'Description cannot exceed 1000 characters';
    const selectedLeaveType = leaveTypes.find(lt => lt.LeaveTypeID === formData.LeaveTypeID);
    if (selectedLeaveType?.MedicalApproval && !formData.MedicalDocument.trim())
      errors.MedicalDocument = 'Medical document is required for this leave type';
    if (formData.Status === 2 && !formData.RejectionReason.trim())
      errors.RejectionReason = 'Rejection reason is required for Denied status';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    if (!validateForm()) return;

    try {
      await handleSubmit(formData);
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err.response?.data?.errors
        ? Array.isArray(err.response.data.errors)
          ? err.response.data.errors.join(', ')
          : JSON.stringify(err.response.data.errors)
        : err.message || 'Failed to submit leave data.';
      setFormErrors({ general: errorMessage });
    }
  };

  if (isLoading) {
    return <div className="leave-form loading-message">Loading...</div>;
  }

  return (
    <div className="leave-form">
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>{isEditMode ? 'Edit Leave Request' : 'Add New Leave Request'}</h2>
          {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
          {formErrors.general && <div className="error-message" role="alert">{formErrors.general}</div>}
          {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
          <form onSubmit={onSubmit}>
            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="EmployeeID">Employee</label>
                  <select
                    id="EmployeeID"
                    name="EmployeeID"
                    value={formData.EmployeeID}
                    onChange={handleChange}
                    required
                    aria-invalid={!!formErrors.EmployeeID}
                  >
                    <option value="">Select an employee</option>
                    {employees && Array.isArray(employees) && employees.length > 0 ? (
                      employees.map((employee) => (
                        <option key={employee.EmployeeID} value={employee.EmployeeID}>
                          {employee.FullName}
                        </option>
                      ))
                    ) : (
                      <option disabled>No employees available</option>
                    )}
                  </select>
                  {formErrors.EmployeeID && <span className="error-message">{formErrors.EmployeeID}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="LeaveTypeID">Leave Type</label>
                  <select
                    id="LeaveTypeID"
                    name="LeaveTypeID"
                    value={formData.LeaveTypeID}
                    onChange={handleChange}
                    required
                    aria-invalid={!!formErrors.LeaveTypeID}
                  >
                    <option value="">Select leave type</option>
                    {leaveTypes.map((lt) => (
                      <option key={lt.LeaveTypeID} value={lt.LeaveTypeID}>
                        {lt.Name}
                      </option>
                    ))}
                  </select>
                  {formErrors.LeaveTypeID && <span className="error-message">{formErrors.LeaveTypeID}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="StartDate">Start Date</label>
                  <DatePicker
                    id="StartDate"
                    selected={formData.StartDate}
                    onChange={(date) => handleDateChange(date, 'StartDate')}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select start date"
                    className="form-control"
                    required
                    aria-invalid={!!formErrors.StartDate}
                  />
                  {formErrors.StartDate && <span className="error-message">{formErrors.StartDate}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="EndDate">End Date</label>
                  <DatePicker
                    id="EndDate"
                    selected={formData.EndDate}
                    onChange={(date) => handleDateChange(date, 'EndDate')}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select end date"
                    className="form-control"
                    required
                    aria-invalid={!!formErrors.EndDate}
                  />
                  {formErrors.EndDate && <span className="error-message">{formErrors.EndDate}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="AnnualLeaveDate">Annual Leave Date (Optional)</label>
                  <DatePicker
                    id="AnnualLeaveDate"
                    selected={formData.AnnualLeaveDate}
                    onChange={(date) => handleDateChange(date, 'AnnualLeaveDate')}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select annual leave date"
                    className="form-control"
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="LeaveDescription">Description</label>
                  <textarea
                    id="LeaveDescription"
                    name="LeaveDescription"
                    value={formData.LeaveDescription}
                    onChange={handleChange}
                    placeholder="Enter reason for leave"
                    required
                    maxLength={1000}
                    aria-invalid={!!formErrors.LeaveDescription}
                  />
                  {formErrors.LeaveDescription && <span className="error-message">{formErrors.LeaveDescription}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="Status">Status</label>
                  <select
                    id="Status"
                    name="Status"
                    value={formData.Status}
                    onChange={handleChange}
                    required
                    aria-invalid={!!formErrors.Status}
                  >
                    <option value={0}>Pending</option>
                    <option value={1}>Approved</option>
                    <option value={2}>Denied</option>
                  </select>
                  {formErrors.Status && <span className="error-message">{formErrors.Status}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="MedicalDocument">Medical Document (Optional)</label>
                  <input
                    id="MedicalDocument"
                    name="MedicalDocument"
                    value={formData.MedicalDocument}
                    onChange={handleChange}
                    placeholder="Enter medical document URL/path"
                    maxLength={1000}
                    aria-invalid={!!formErrors.MedicalDocument}
                  />
                  {formErrors.MedicalDocument && <span className="error-message">{formErrors.MedicalDocument}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="RejectionReason">Rejection Reason (Optional)</label>
                  <textarea
                    id="RejectionReason"
                    name="RejectionReason"
                    value={formData.RejectionReason}
                    onChange={handleChange}
                    placeholder="Enter rejection reason (if denied)"
                    maxLength={1000}
                    aria-invalid={!!formErrors.RejectionReason}
                  />
                  {formErrors.RejectionReason && <span className="error-message">{formErrors.RejectionReason}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="LeaveOfficesFiled">Offices Filed</label>
                  <select
                    id="LeaveOfficesFiled"
                    name="LeaveOfficesFiled"
                    value={formData.LeaveOfficesFiled.toString()}
                    onChange={handleChange}
                    required
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="ApprovedBy">Approved By (Optional)</label>
                  <select
                    id="ApprovedBy"
                    name="ApprovedBy"
                    value={formData.ApprovedBy}
                    onChange={handleChange}
                  >
                    <option value="">Select approver</option>
                    {employees && Array.isArray(employees) && employees.length > 0 ? (
                      employees.map((employee) => (
                        <option key={employee.EmployeeID} value={employee.EmployeeID}>
                          {employee.FullName}
                        </option>
                      ))
                    ) : (
                      <option disabled>No employees available</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" onClick={onClose} disabled={isSubmitting} aria-label="Cancel">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} aria-label={isEditMode ? 'Update leave' : 'Submit leave'}>
                {isEditMode ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;