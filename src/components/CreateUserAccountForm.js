import React, { useState, useEffect } from 'react';
import { useUserSlice } from '../slices/userSlice';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRole } from '../slices/roleSlice';
import Select from 'react-select';
import { FaSpinner } from 'react-icons/fa';
import '../styles/CreateUserAccountForm.css';

const CreateUserAccountForm = ({ onClose, onUserCreated, userToEdit }) => {
  const dispatch = useDispatch();
  const { employees, handleSubmit, isSubmitting, errorMessage, successMessage, fetchEmployees } = useUserSlice();
  const { roles, loading: roleLoading, error: roleError } = useSelector((state) => state.role || {
    roles: [],
    loading: false,
    error: null,
  });
  const [formData, setFormData] = useState({
    Username: '',
    Email: '',
    Password: userToEdit?.Password || generateDefaultPassword(),
    RoleId: userToEdit?.RoleId || '',
    EmployeeId: userToEdit?.EmployeeId || '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
    dispatch(fetchRole());
  }, [fetchEmployees, dispatch]);

  useEffect(() => {
    if (userToEdit) {
      const employee = employees.find((emp) => emp.EmployeeID === userToEdit.EmployeeId);
      const email = employee && employee.Email !== 'N/A' ? employee.Email : userToEdit.Email || '';
      const username = userToEdit.Username || (email ? email.split('@')[0] : (employee ? employee.FullName.replace(/\s+/g, '').toLowerCase() : ''));
      setFormData({
        Username: username,
        Email: email,
        Password: userToEdit.Password || generateDefaultPassword(),
        RoleId: userToEdit.RoleId || '',
        EmployeeId: userToEdit.EmployeeId || '',
      });
    } else {
      setFormData({
        Username: '',
        Email: '',
        Password: generateDefaultPassword(),
        RoleId: '',
        EmployeeId: '',
      });
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
      const response = await handleSubmit(formData);
      const selectedEmployee = employees.find((emp) => emp.EmployeeID === formData.EmployeeId);
      const selectedRole = roles.find((r) => r.value === formData.RoleId);
      const createdUser = {
        UserID: response.userId,
        Username: formData.Username,
        Email: formData.Email,
        Password: response.password || formData.Password,
        RoleId: formData.RoleId,
        RoleName: selectedRole ? selectedRole.label : 'N/A',
        EmployeeId: formData.EmployeeId,
        Employee: selectedEmployee ? selectedEmployee.FullName : 'N/A',
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      };
      onUserCreated(createdUser);
      setFormData({
        Username: '',
        Email: '',
        Password: generateDefaultPassword(),
        RoleId: '',
        EmployeeId: '',
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setFormErrors((prev) => ({ ...prev, submit: error.message || 'Failed to submit user' }));
    }
  };

  function generateDefaultPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  const roleOptions = roles.map((role) => ({
    value: role.value,
    label: role.label,
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
        {roleError && <div className="error-message">{roleError}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        {(isSubmitting || roleLoading) && (
          <div className="loading-message" role="status">
            <FaSpinner className="loading-spinner-icon" /> Loading...
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
                  type="text"
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