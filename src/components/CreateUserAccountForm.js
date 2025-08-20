import React, { useState, useEffect } from 'react';
import { useUserSlice } from '../slices/userSlice';
import Select from 'react-select';
import { FaSpinner } from 'react-icons/fa';
import '../styles/CreateUserAccountForm.css';

const CreateUserAccountForm = ({ onClose, onUserCreated, userToEdit }) => {
  const { employees, roles, handleSubmit, isSubmitting, errorMessage, successMessage, fetchEmployees, fetchRoles } = useUserSlice();
  const [formData, setFormData] = useState({
    Password: userToEdit?.Password || generateDefaultPassword(), // Auto-generate password for new users
    RoleId: userToEdit?.RoleId || '',
    EmployeeId: userToEdit?.EmployeeId || '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [fetchEmployees, fetchRoles]);

  useEffect(() => {
    if (userToEdit) {
      const employee = employees.find((emp) => emp.EmployeeID === userToEdit.EmployeeId);
      const email = employee && employee.Email !== 'N/A' ? employee.Email : '';
      const username = email ? email.split('@')[0] : (employee ? employee.FullName.replace(/\s+/g, '').toLowerCase() : '');
      setFormData({
        Password: userToEdit.Password || '', // Keep existing password for editing
        RoleId: userToEdit.RoleId || '',
        EmployeeId: userToEdit.EmployeeId || '',
        Email: email,
        Username: username,
      });
    } else {
      // Reset to default password for new user creation
      setFormData((prev) => ({ ...prev, Password: generateDefaultPassword() }));
    }
  }, [userToEdit, employees]);

  const handleEmployeeChange = (selectedOption) => {
    const employee = selectedOption ? employees.find((emp) => emp.EmployeeID === selectedOption.value) : null;
    const email = employee && employee.Email !== 'N/A' ? employee.Email : '';
    const username = email ? email.split('@')[0] : (employee ? employee.FullName.replace(/\s+/g, '').toLowerCase() : '');
    setFormData((prev) => ({
      ...prev,
      EmployeeId: selectedOption ? selectedOption.value : '',
      Email: email,
      Username: username,
    }));
    setFormErrors((prev) => ({ ...prev, EmployeeId: '' }));
  };

  const handleRoleChange = (selectedOption) => {
    setFormData((prev) => ({ ...prev, RoleId: selectedOption ? selectedOption.value : '' }));
    setFormErrors((prev) => ({ ...prev, RoleId: '' }));
  };

  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({ ...prev, Password: value }));
    setFormErrors((prev) => ({ ...prev, Password: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.EmployeeId) errors.EmployeeId = 'Employee is required';
    if (!formData.Password) {
      errors.Password = 'Password is required';
    } else if (formData.Password.length < 8) {
      errors.Password = 'Password must be at least 8 characters';
    }
    if (!formData.RoleId) errors.RoleId = 'Role is required';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formData.RoleId)) {
      errors.RoleId = 'Invalid Role ID format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const userData = {
        Username: formData.Username,
        Email: formData.Email,
        Password: formData.Password,
        RoleId: formData.RoleId,
        EmployeeId: formData.EmployeeId || null,
      };

      const response = await handleSubmit(userData);
      const selectedEmployee = employees.find((emp) => emp.EmployeeID === formData.EmployeeId);
      const selectedRole = roles.find((r) => r.id === formData.RoleId);
      const createdUser = {
        Username: formData.Username,
        Email: formData.Email,
        Password: response.password || formData.Password,
        RoleName: selectedRole ? selectedRole.name : 'N/A',
        Employee: selectedEmployee ? selectedEmployee.FullName : 'N/A',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };
      onUserCreated(createdUser);
      setFormData({ Password: generateDefaultPassword(), RoleId: '', EmployeeId: '' }); // Reset with new default password
    } catch (error) {
      console.error('Form submission error:', error);
      setFormErrors((prev) => ({ ...prev, submit: error.message || 'Failed to submit user' }));
    }
  };

  // Function to generate a default password
  function generateDefaultPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password; // Returns a 12-character random password
  }

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const employeeOptions = employees.map((emp) => ({
    value: emp.EmployeeID,
    label: `${emp.FullName || emp.Name || 'N/A'} - ${emp.Email}`,
  }));

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{userToEdit ? 'Edit User Account' : 'Create New User Account'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        {isSubmitting && (
          <div className="loading-message" role="status">
            <FaSpinner className="loading-spinner-icon" /> Submitting...
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label>Employee</label>
                <Select
                  options={employeeOptions}
                  onChange={handleEmployeeChange}
                  value={employeeOptions.find((option) => option.value === formData.EmployeeId) || null}
                  placeholder="Select an employee"
                  isClearable
                  isDisabled={isSubmitting}
                  aria-required="true"
                />
                {formErrors.EmployeeId && <span className="error">{formErrors.EmployeeId}</span>}
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="text" // Changed to text to allow viewing the default password
                  value={formData.Password}
                  onChange={handlePasswordChange}
                  disabled={isSubmitting}
                  aria-required="true"
                />
                {!userToEdit && <p className="password-note">Auto-generated password. Feel free to edit.</p>}
                {formErrors.Password && <span className="error">{formErrors.Password}</span>}
              </div>
              <div className="form-group">
                <label>Role</label>
                <Select
                  options={roleOptions}
                  onChange={handleRoleChange}
                  value={roleOptions.find((option) => option.value === formData.RoleId) || null}
                  placeholder="Select a role"
                  isClearable
                  isDisabled={isSubmitting}
                  aria-required="true"
                />
                {formErrors.RoleId && <span className="error">{formErrors.RoleId}</span>}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {userToEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserAccountForm;