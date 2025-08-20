import React, { useState, useEffect } from 'react';
import { useDepartmentSlice } from '../slices/DepartmentSlice';
import '../styles/DepartmentForm.css';

const DepartmentForm = ({ department: initialDepartment, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage, fetchCompanies, fetchBranches, branches, companies } = useDepartmentSlice();
  const [formData, setFormData] = useState({
    departmentID: '',
    companyID: '',
    branchID: '',
    departmentName: '',
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
        await Promise.all([fetchCompanies(), fetchBranches()]);
        console.log('Companies after fetch:', companies.map(c => ({ CompanyID: c?.CompanyID, CompanyName: c?.CompanyName })));
        console.log('Branches after fetch:', branches.map(b => ({ BranchID: b.BranchID, CompanyID: b?.CompanyID, BranchName: b.BranchName })));
      } catch (error) {
        console.error('Error loading data:', error);
        setErrors((prev) => ({ ...prev, general: `Error loading data: ${error.message}` }));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchCompanies, fetchBranches]);

  useEffect(() => {
    if (initialDepartment) {
      setFormData({
        departmentID: initialDepartment.DepartmentID || initialDepartment.departmentID || '',
        companyID: initialDepartment.CompanyID || initialDepartment.companyID || '',
        branchID: initialDepartment.BranchID || initialDepartment.branchID || '',
        departmentName: initialDepartment.DepartmentName || initialDepartment.departmentName || '',
        status: initialDepartment.Status === 1 || initialDepartment.status === 'Active' ? 'Active' : 'Inactive',
        createdAt: initialDepartment.CreatedAt || initialDepartment.createdAt || new Date().toISOString(),
        updatedAt: initialDepartment.UpdatedAt || initialDepartment.updatedAt || new Date().toISOString(),
      });
    } else {
      setFormData({
        departmentID: '',
        companyID: '',
        branchID: '',
        departmentName: '',
        status: 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [initialDepartment]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.companyID) newErrors.companyID = 'Company is required';
    if (!formData.departmentName.trim()) newErrors.departmentName = 'Department Name is required';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to ${value}`);
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === 'companyID') {
        newData.branchID = ''; // Reset branchID when company changes
      }
      return newData;
    });
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
        departmentID: formData.departmentID || undefined,
        companyID: formData.companyID,
        branchID: formData.branchID || null,
        departmentName: formData.departmentName.trim(),
        status: formData.status,
      };
      console.log('Submitting form data:', JSON.stringify(payload));
      await handleSubmit(payload);
      onClose(); // Close the modal after successful submission
    } catch (error) {
      console.error('Submission error:', error.response?.data || error);
      setErrors({ general: `An error occurred while submitting the form: ${error.message}` });
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const filteredBranches = branches.filter(branch => {
    const branchCompanyIdStr = branch?.CompanyID ? branch.CompanyID.toString() : '';
    const formCompanyIdStr = formData.companyID ? formData.companyID.toString() : '';
    const isValidCompany = branchCompanyIdStr && branchCompanyIdStr !== '00000000-0000-0000-0000-000000000000';
    const matchesCompany = isValidCompany && branchCompanyIdStr === formCompanyIdStr;
    console.log(`Filtering branch: BranchCompanyID=${branchCompanyIdStr}, FormCompanyID=${formCompanyIdStr}, Matches=${matchesCompany}`);
    return matchesCompany || !formData.companyID;
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{initialDepartment ? 'Edit Department' : 'Add New Department'}</h2>
        {errors.general && <div className="error-message">{errors.general}</div>}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {isLoading ? (
          <div className="loading-message">Loading data...</div>
        ) : (
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="companyID">Company Name</label>
              <select
                id="companyID"
                name="companyID"
                value={formData.companyID}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              >
                <option value="">Select Company Name</option>
                {companies && companies.map((company) => (
                  company?.CompanyID && (
                    <option key={company.CompanyID} value={company.CompanyID}>
                      {company.CompanyName}
                    </option>
                  )
                ))}
              </select>
              {errors.companyID && <div className="error-message">{errors.companyID}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="branchID">Branch Name (Optional)</label>
              <select
                id="branchID"
                name="branchID"
                value={formData.branchID || ''}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              >
                <option value="">No Branch</option>
                {filteredBranches.map((branch) => {
                  const company = companies && companies.find(c => c?.CompanyID?.toString() === branch?.CompanyID?.toString());
                  const companyName = company ? company.CompanyName : 'Unknown Company';
                  return (
                    <option key={branch.BranchID} value={branch.BranchID}>
                      {branch.BranchName} (Company: {companyName})
                    </option>
                  );
                })}
              </select>
              {filteredBranches.length === 0 && formData.companyID && <div className="error-message">No branches available for the selected company.</div>}
              {branches.length === 0 && <div className="error-message">No branches available. Check API response or console logs.</div>}
            </div>
            <div className="form-group">
              <label htmlFor="departmentName">Department Name</label>
              <input
                type="text"
                id="departmentName"
                name="departmentName"
                value={formData.departmentName}
                onChange={handleChange}
                disabled={isSubmitting || isLoading}
              />
              {errors.departmentName && <div className="error-message">{errors.departmentName}</div>}
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
                {isSubmitting ? 'Submitting...' : initialDepartment ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DepartmentForm;