import React, { useState, useEffect } from 'react';
import { useDesignationSlice } from '../slices/DesignationSlice';
import '../styles/DesignationForm.css';

const DesignationForm = ({ designation: initialDesignation, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage, fetchDepartments, departments } = useDesignationSlice();
  const [formData, setFormData] = useState({
    designationID: '',
    departmentID: '',
    designationName: '',
    status: 'Active',
    createdAt: '',
    updatedAt: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchDepartments();
        console.log('Departments after fetch:', departments.map(d => ({ DepartmentID: d?.DepartmentID, DepartmentName: d?.DepartmentName })));
      } catch (error) {
        console.error('Error loading data:', error);
        setErrors((prev) => ({ ...prev, general: `Error loading data: ${error.message}` }));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchDepartments]);

  useEffect(() => {
    if (initialDesignation) {
      setFormData({
        designationID: initialDesignation.DesignationID || initialDesignation.designationID || '',
        departmentID: initialDesignation.DepartmentID || initialDesignation.departmentID || '',
        designationName: initialDesignation.DesignationName || initialDesignation.designationName || '',
        status: initialDesignation.Status === 1 || initialDesignation.status === 'Active' ? 'Active' : 'Inactive',
        createdAt: initialDesignation.CreatedAt || initialDesignation.createdAt || new Date().toISOString(),
        updatedAt: initialDesignation.UpdatedAt || initialDesignation.updatedAt || new Date().toISOString(),
      });
    } else {
      setFormData({
        designationID: '',
        departmentID: '',
        designationName: '',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [initialDesignation]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.departmentID) newErrors.departmentID = 'Department is required';
    if (!formData.designationName.trim()) newErrors.designationName = 'Designation Name is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to ${value}`);
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const payload = {
        designationID: formData.designationID || undefined,
        departmentID: formData.departmentID,
        designationName: formData.designationName.trim(),
        status: formData.status,
      };
      console.log('Submitting form data:', JSON.stringify(payload));
      await handleSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Submission error:', error.response?.data || error);
      setErrors({ general: `An error occurred while submitting the form: ${error.message}` });
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{initialDesignation ? 'Edit Designation' : 'Add New Designation'}</h2>
        {errors.general && <div className="error-message">{errors.general}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {isLoading ? (
          <div className="loading-message">Loading data...</div>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="departmentID">Department Name</label>
              <select
                id="departmentID"
                name="departmentID"
                value={formData.departmentID}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              >
                <option value="">Select Department Name</option>
                {departments.map((dept) =>
                  dept?.DepartmentID && (
                    <option key={dept.DepartmentID} value={dept.DepartmentID}>
                      {dept.DepartmentName}
                    </option>
                  )
                )}
              </select>
              {errors.departmentID && <div className="error-message">{errors.departmentID}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="designationName">Designation Name</label>
              <input
                type="text"
                id="designationName"
                name="designationName"
                value={formData.designationName}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              />
              {errors.designationName && <div className="error-message">{errors.designationName}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="button" onClick={handleCancel} disabled={isSubmitting || isLoading}>
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? 'Submitting...' : initialDesignation ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DesignationForm;