import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEmployeeSlice } from '../slices/EmployeeSlice';
import Select from 'react-select';
import axios from 'axios';
import { Country, City } from 'country-state-city';
import '../styles/EmployeeForm.css';

const recruitmentTypes = [
  { value: 'Internal', label: 'Internal' },
  { value: 'External', label: 'External' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Campus', label: 'Campus Recruitment' },
  { value: 'Agency', label: 'Agency Hire' },
  { value: 'Online', label: 'Online Job Portal' },
  { value: 'Walk-In', label: 'Walk-In' },
  { value: 'Contract', label: 'Contract-Based' },
  { value: 'Freelancer', label: 'Freelancer / Consultant' },
  { value: 'Internship', label: 'Internship' },
];

const EmployeeForm = ({ employee, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useEmployeeSlice();
  const [formData, setFormData] = useState({
    EmployeeID: '',
    CompanyID: '',
    DepartmentID: '',
    DesignationID: '',
    BranchID: '',
    FullName: '',
    PhoneNumber: '',
    Email: '',
    Photo: '',
    DOB: null,
    HireDate: null,
    Recruitment: 'Internal',
    RecruitmentType: '',
    RecruitmentOption: 'Full-Time',
    DepartmentType: 'Core',
    EmploymentType: 'Permanent',
    Status: 'Active',
    CreatedAt: new Date(),
    UpdatedAt: new Date(),
  });
  const [locationData, setLocationData] = useState({
    country: '',
    city: '',
  });
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showSpinner, setShowSpinner] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isEditMode = !!employee && employee.EmployeeID;

  const isValidGuid = (value) => {
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return value && guidRegex.test(value);
  };

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      setShowSpinner(true);
      try {
        const token = localStorage.getItem('token') || '';
        const [companyRes, deptRes, desigRes, branchRes] = await Promise.all([
          axios.get('https://localhost:14686/api/Company', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://localhost:14686/api/Department', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://localhost:14686/api/Designation', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://localhost:14686/api/Branch', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!Array.isArray(companyRes.data)) throw new Error('Company API response is not an array');
        if (!Array.isArray(deptRes.data)) throw new Error('Department API response is not an array');
        if (!Array.isArray(desigRes.data)) throw new Error('Designation API response is not an array');
        if (!Array.isArray(branchRes.data)) throw new Error('Branch API response is not an array');

        const companyOptions = companyRes.data
          .filter(c => c.CompanyID && c.CompanyName)
          .map(c => ({
            value: c.CompanyID.toString(),
            label: c.CompanyName,
          }));
        const deptOptions = deptRes.data
          .filter(d => d.DepartmentID && d.DepartmentName && d.BranchName)
          .map(d => ({
            value: d.DepartmentID.toString(),
            label: d.DepartmentName,
            BranchName: d.BranchName,
          }));
        const desigOptions = desigRes.data
          .filter(d => d.DesignationID && d.DesignationName)
          .map(d => ({
            value: d.DesignationID.toString(),
            label: d.DesignationName,
            DepartmentName: d.DepartmentName || 'N/A',
          }));
        const branchOptions = branchRes.data
          .filter(b => b.BranchID && b.BranchName && b.CompanyID)
          .map(b => ({
            value: b.BranchID.toString(),
            label: b.BranchName,
            CompanyID: b.CompanyID.toString(),
          }));

        setCompanies(companyOptions);
        setDepartments(deptOptions);
        setDesignations(desigOptions);
        setBranches(branchOptions);

        const countryOptions = Country.getAllCountries().map(country => ({
          value: country.isoCode,
          label: country.name,
        }));
        setCountries(countryOptions);

        if (isEditMode && employee && employee.location_id) {
          try {
            const locResponse = await axios.get(`https://localhost:14686/api/Location/${employee.location_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const loc = locResponse.data;
            setLocationData({
              country: loc.country || '',
              city: loc.city || '',
            });

            const selectedCountry = countryOptions.find(c => c.label === loc.country);
            if (selectedCountry) {
              const cityOptions = City.getCitiesOfCountry(selectedCountry.value).map(city => ({
                value: city.name,
                label: city.name,
              }));
              setCities(cityOptions);
            }

            setFormData({
              ...formData,
              EmployeeID: employee.EmployeeID || '',
              CompanyID: employee.CompanyID?.toString() || '',
              DepartmentID: employee.DepartmentID?.toString() || '',
              DesignationID: employee.DesignationID?.toString() || '',
              BranchID: employee.BranchID?.toString() || '',
              FullName: employee.FullName || '',
              PhoneNumber: employee.PhoneNumber || '',
              Email: employee.Email || '',
              Photo: employee.Photo || '',
              DOB: employee.DOB ? new Date(employee.DOB) : null,
              HireDate: employee.HireDate ? new Date(employee.HireDate) : null,
              Recruitment: employee.Recruitment || 'Internal',
              RecruitmentType: employee.RecruitmentType || '',
              RecruitmentOption: employee.RecruitmentOption || 'Full-Time',
              DepartmentType: employee.DepartmentType || 'Core',
              EmploymentType: employee.EmploymentType || 'Permanent',
              Status: employee.Status || 'Active',
            });
          } catch (error) {
            console.error('Error fetching location details:', error.response?.data || error.message);
            setFormErrors(prev => ({ ...prev, locationDetails: 'Failed to fetch location details' }));
          }
        }
      } catch (error) {
        console.error('Error fetching options:', error.response?.data || error.message);
        setFormErrors(prev => ({ ...prev, submit: 'Failed to load dropdown options' }));
      } finally {
        setIsLoading(false);
        setShowSpinner(false);
      }
    };

    fetchOptions();
  }, [isEditMode, employee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleDateChange = (date, name) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        setFormData(prev => ({ ...prev, Photo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectChange = (selectedOption, { name }) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: selectedOption ? selectedOption.value : '' };
      if (name === 'CompanyID') {
        newData.BranchID = '';
        newData.DepartmentID = '';
        newData.DesignationID = '';
      } else if (name === 'BranchID') {
        newData.DepartmentID = '';
        newData.DesignationID = '';
      } else if (name === 'DepartmentID') {
        newData.DesignationID = '';
      }
      return newData;
    });
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCountryChange = (selectedOption) => {
    setLocationData(prev => ({
      ...prev,
      country: selectedOption ? selectedOption.label : '',
      city: '',
    }));
    setFormErrors(prev => ({ ...prev, country: '', city: '' }));
    setCities(selectedOption ? City.getCitiesOfCountry(selectedOption.value).map(city => ({
      value: city.name,
      label: city.name,
    })) : []);
  };

  const handleCityChange = (selectedOption) => {
    setLocationData(prev => ({
      ...prev,
      city: selectedOption ? selectedOption.label : '',
    }));
    setFormErrors(prev => ({ ...prev, city: '' }));
  };

  const filteredBranches = branches.filter(branch => {
    const branchCompanyIdStr = branch.CompanyID ? branch.CompanyID.toString() : '';
    const formCompanyIdStr = formData.CompanyID ? formData.CompanyID.toString() : '';
    return !formData.CompanyID || (branchCompanyIdStr && branchCompanyIdStr !== '00000000-0000-0000-0000-000000000000' && branchCompanyIdStr === formCompanyIdStr);
  });

  const filteredDepartments = departments.filter(dept => {
    const selectedBranch = branches.find(b => b.value === formData.BranchID);
    const selectedBranchName = selectedBranch ? selectedBranch.label : '';
    return !formData.BranchID || (dept.BranchName && dept.BranchName === selectedBranchName);
  });

  const filteredDesignations = designations.filter(desig => {
    const selectedDepartment = departments.find(d => d.value === formData.DepartmentID);
    const deptName = selectedDepartment ? selectedDepartment.label : '';
    return !formData.DepartmentID || (desig.DepartmentName !== 'N/A' && desig.DepartmentName === deptName);
  });

  const validateForm = () => {
    const errors = {};
    if (!formData.FullName?.trim() || formData.FullName.length < 2) errors.FullName = 'Full Name must be at least 2 characters';
    if (!formData.CompanyID || !isValidGuid(formData.CompanyID)) errors.CompanyID = 'Valid Company ID is required';
    if (!formData.BranchID || !isValidGuid(formData.BranchID)) errors.BranchID = 'Valid Branch ID is required';
    if (!formData.DepartmentID || !isValidGuid(formData.DepartmentID)) {
      errors.DepartmentID = 'Valid Department ID is required';
    } else {
      const selectedDepartment = departments.find(d => d.value === formData.DepartmentID);
      if (!selectedDepartment) {
        errors.DepartmentID = 'Selected department not found in available options';
      }
    }
    if (!formData.DesignationID || !isValidGuid(formData.DesignationID)) {
      errors.DesignationID = 'Valid Designation ID is required';
    } else {
      const selectedDesignation = designations.find(d => d.value === formData.DesignationID);
      const selectedDepartment = departments.find(d => d.value === formData.DepartmentID);
      if (selectedDesignation && selectedDepartment && selectedDesignation.DepartmentName !== 'N/A' && selectedDesignation.DepartmentName !== selectedDepartment.label) {
        errors.DesignationID = 'Designation must match the selected department';
      }
    }
    if (!locationData.country) errors.country = 'Country is required';
    if (!locationData.city) errors.city = 'City is required';
    if (formData.PhoneNumber && !/^\+?\d{7,15}$/.test(formData.PhoneNumber)) errors.PhoneNumber = 'Invalid phone number format';
    if (!formData.Email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) errors.Email = 'Valid email is required';
    if (!formData.Recruitment) errors.Recruitment = 'Recruitment is required';
    if (!formData.RecruitmentType) errors.RecruitmentType = 'Recruitment Type is required';
    if (!formData.RecruitmentOption) errors.RecruitmentOption = 'Recruitment Option is required';
    if (!formData.DepartmentType) errors.DepartmentType = 'Department Type is required';
    if (!formData.EmploymentType) errors.EmploymentType = 'Employment Type is required';
    if (!formData.Status) errors.Status = 'Status is required';
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log('Submission blocked due to validation errors:', errors);
      return;
    }

    setIsLoading(true);
    setShowSpinner(true);
    try {
      const token = localStorage.getItem('token') || '';
      const locationPayload = {
        country: locationData.country,
        city: locationData.city,
        state_or_region: null,
        street: null,
        latitude: null,
        longitude: null,
        created_at: new Date().toISOString(),
      };
      console.log('Posting location:', locationPayload);
      const locationResponse = await axios.post('https://localhost:14686/api/Location', locationPayload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const locationId = locationResponse.data.location_id;
      if (!isValidGuid(locationId)) throw new Error('Invalid location ID');

      const payload = {
        CompanyID: formData.CompanyID,
        DepartmentID: formData.DepartmentID,
        DesignationID: formData.DesignationID,
        BranchID: formData.BranchID,
        location_id: locationId,
        FullName: formData.FullName.trim(),
        PhoneNumber: formData.PhoneNumber || null,
        Email: formData.Email,
        Photo: formData.Photo || null,
        DOB: formData.DOB ? formData.DOB.toISOString().slice(0, 10) : null,
        HireDate: formData.HireDate ? formData.HireDate.toISOString().slice(0, 10) : null,
        Recruitment: formData.Recruitment,
        RecruitmentType: formData.RecruitmentType,
        RecruitmentOption: formData.RecruitmentOption,
        DepartmentType: formData.DepartmentType,
        EmploymentType: formData.EmploymentType,
        Status: formData.Status,
      };
      if (isEditMode) payload.EmployeeID = formData.EmployeeID;
      console.log('Submitting employee payload:', payload);
      await handleSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Submission error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        errors: error.response?.data?.errors,
      });
      const validationErrors = error.response?.data?.errors || {};
      const errorMessage = error.response?.data?.error || 'Failed to submit employee';
      setFormErrors(prev => ({
        ...prev,
        ...Object.keys(validationErrors).reduce((acc, key) => {
          acc[key] = validationErrors[key][0] || validationErrors[key];
          return acc;
        }, {}),
        submit: errorMessage,
      }));
    } finally {
      setIsLoading(false);
      setShowSpinner(false);
    }
  };

  return (
    <div className="employee-form-modal">
      <div className="modal-overlay" role="dialog" aria-labelledby="form-title">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2 id="form-title">{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
          {(isLoading || isSubmitting || showSpinner) && <div className="loading-spinner" aria-live="polite">Loading...</div>}
          {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
          {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
          {formErrors.submit && <div className="error-message" role="alert">{formErrors.submit}</div>}
          <form onSubmit={onSubmit} aria-disabled={isSubmitting || isLoading}>
            <div className="form-grid">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="FullName">Full Name</label>
                  <input
                    id="FullName"
                    type="text"
                    name="FullName"
                    value={formData.FullName}
                    onChange={handleChange}
                    className={submitted && formErrors.FullName ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.FullName}
                    aria-describedby={submitted && formErrors.FullName ? 'FullName-error' : undefined}
                  />
                  {submitted && formErrors.FullName && (
                    <span id="FullName-error" className="warning-message">{formErrors.FullName}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="Email">Email</label>
                  <input
                    id="Email"
                    type="email"
                    name="Email"
                    value={formData.Email}
                    onChange={handleChange}
                    className={submitted && formErrors.Email ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.Email}
                    aria-describedby={submitted && formErrors.Email ? 'Email-error' : undefined}
                  />
                  {submitted && formErrors.Email && (
                    <span id="Email-error" className="warning-message">{formErrors.Email}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="CompanyID">Company</label>
                  <Select
                    inputId="CompanyID"
                    name="CompanyID"
                    options={companies}
                    value={companies.find(c => c.value === formData.CompanyID) || null}
                    onChange={(option) => handleSelectChange(option, { name: 'CompanyID' })}
                    className={submitted && formErrors.CompanyID ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.CompanyID}
                    aria-describedby={submitted && formErrors.CompanyID ? 'CompanyID-error' : undefined}
                    placeholder="Select a company"
                  />
                  {submitted && formErrors.CompanyID && (
                    <span id="CompanyID-error" className="warning-message">{formErrors.CompanyID}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="BranchID">Branch</label>
                  <Select
                    inputId="BranchID"
                    name="BranchID"
                    options={filteredBranches}
                    value={filteredBranches.find(b => b.value === formData.BranchID) || null}
                    onChange={(option) => handleSelectChange(option, { name: 'BranchID' })}
                    className={submitted && formErrors.BranchID ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.BranchID}
                    aria-describedby={submitted && formErrors.BranchID ? 'BranchID-error' : undefined}
                    placeholder="Select a branch"
                    isDisabled={!filteredBranches.length && formData.CompanyID}
                  />
                  {filteredBranches.length === 0 && formData.CompanyID && (
                    <span className="warning-message">No branches available for the selected company</span>
                  )}
                  {submitted && formErrors.BranchID && (
                    <span id="BranchID-error" className="warning-message">{formErrors.BranchID}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="DepartmentID">Department</label>
                  <Select
                    inputId="DepartmentID"
                    name="DepartmentID"
                    options={filteredDepartments}
                    value={filteredDepartments.find(d => d.value === formData.DepartmentID) || null}
                    onChange={(option) => handleSelectChange(option, { name: 'DepartmentID' })}
                    className={submitted && formErrors.DepartmentID ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.DepartmentID}
                    aria-describedby={submitted && formErrors.DepartmentID ? 'DepartmentID-error' : undefined}
                    placeholder="Select a department"
                    isDisabled={!filteredDepartments.length && formData.BranchID}
                  />
                  {filteredDepartments.length === 0 && formData.BranchID && (
                    <span className="warning-message">No departments available for the selected branch</span>
                  )}
                  {submitted && formErrors.DepartmentID && (
                    <span id="DepartmentID-error" className="warning-message">{formErrors.DepartmentID}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="DesignationID">Designation</label>
                  <Select
                    inputId="DesignationID"
                    name="DesignationID"
                    options={filteredDesignations}
                    value={filteredDesignations.find(d => d.value === formData.DesignationID) || null}
                    onChange={(option) => handleSelectChange(option, { name: 'DesignationID' })}
                    className={submitted && formErrors.DesignationID ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.DesignationID}
                    aria-describedby={submitted && formErrors.DesignationID ? 'DesignationID-error' : undefined}
                    placeholder="Select a designation"
                    isDisabled={!filteredDesignations.length && formData.DepartmentID}
                  />
                  {filteredDesignations.length === 0 && formData.DepartmentID && (
                    <span className="warning-message">No designations available for the selected department</span>
                  )}
                  {submitted && formErrors.DesignationID && (
                    <span id="DesignationID-error" className="warning-message">{formErrors.DesignationID}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <Select
                    inputId="country"
                    name="country"
                    options={countries}
                    value={countries.find(c => c.label === locationData.country) || null}
                    onChange={handleCountryChange}
                    className={submitted && formErrors.country ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.country}
                    aria-describedby={submitted && formErrors.country ? 'country-error' : undefined}
                    placeholder="Select a country"
                    isClearable
                  />
                  {submitted && formErrors.country && (
                    <span id="country-error" className="warning-message">{formErrors.country}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <Select
                    inputId="city"
                    name="city"
                    options={cities}
                    value={cities.find(c => c.label === locationData.city) || null}
                    onChange={handleCityChange}
                    className={submitted && formErrors.city ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.city}
                    aria-describedby={submitted && formErrors.city ? 'city-error' : undefined}
                    placeholder="Select a city"
                    isClearable
                    isDisabled={!cities.length}
                  />
                  {submitted && formErrors.city && (
                    <span id="city-error" className="warning-message">{formErrors.city}</span>
                  )}
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="PhoneNumber">Phone Number</label>
                  <input
                    id="PhoneNumber"
                    type="text"
                    name="PhoneNumber"
                    value={formData.PhoneNumber}
                    onChange={handleChange}
                    className={submitted && formErrors.PhoneNumber ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.PhoneNumber}
                    aria-describedby={submitted && formErrors.PhoneNumber ? 'PhoneNumber-error' : undefined}
                  />
                  {submitted && formErrors.PhoneNumber && (
                    <span id="PhoneNumber-error" className="warning-message">{formErrors.PhoneNumber}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="Photo">Photo</label>
                  <input
                    id="Photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="DOB">Date of Birth</label>
                  <DatePicker
                    selected={formData.DOB}
                    onChange={(date) => handleDateChange(date, 'DOB')}
                    className={submitted && formErrors.DOB ? 'warning' : ''}
                    dateFormat="yyyy-MM-dd"
                    aria-invalid={submitted && !!formErrors.DOB}
                    aria-describedby={submitted && formErrors.DOB ? 'DOB-error' : undefined}
                  />
                  {submitted && formErrors.DOB && (
                    <span id="DOB-error" className="warning-message">{formErrors.DOB}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="HireDate">Hire Date</label>
                  <DatePicker
                    selected={formData.HireDate}
                    onChange={(date) => handleDateChange(date, 'HireDate')}
                    className={submitted && formErrors.HireDate ? 'warning' : ''}
                    dateFormat="yyyy-MM-dd"
                    aria-invalid={submitted && !!formErrors.HireDate}
                    aria-describedby={submitted && formErrors.HireDate ? 'HireDate-error' : undefined}
                  />
                  {submitted && formErrors.HireDate && (
                    <span id="HireDate-error" className="warning-message">{formErrors.HireDate}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="Recruitment">Recruitment</label>
                  <select
                    id="Recruitment"
                    name="Recruitment"
                    value={formData.Recruitment}
                    onChange={handleChange}
                    className={submitted && formErrors.Recruitment ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.Recruitment}
                    aria-describedby={submitted && formErrors.Recruitment ? 'Recruitment-error' : undefined}
                  >
                    {recruitmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {submitted && formErrors.Recruitment && (
                    <span id="Recruitment-error" className="warning-message">{formErrors.Recruitment}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="RecruitmentType">Recruitment Type</label>
                  <select
                    id="RecruitmentType"
                    name="RecruitmentType"
                    value={formData.RecruitmentType}
                    onChange={handleChange}
                    className={submitted && formErrors.RecruitmentType ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.RecruitmentType}
                    aria-describedby={submitted && formErrors.RecruitmentType ? 'RecruitmentType-error' : undefined}
                  >
                    <option value="">Select Recruitment Type</option>
                    {recruitmentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {submitted && formErrors.RecruitmentType && (
                    <span id="RecruitmentType-error" className="warning-message">{formErrors.RecruitmentType}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="RecruitmentOption">Recruitment Option</label>
                  <select
                    id="RecruitmentOption"
                    name="RecruitmentOption"
                    value={formData.RecruitmentOption}
                    onChange={handleChange}
                    className={submitted && formErrors.RecruitmentOption ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.RecruitmentOption}
                    aria-describedby={submitted && formErrors.RecruitmentOption ? 'RecruitmentOption-error' : undefined}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                  {submitted && formErrors.RecruitmentOption && (
                    <span id="RecruitmentOption-error" className="warning-message">{formErrors.RecruitmentOption}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="DepartmentType">Department Type</label>
                  <select
                    id="DepartmentType"
                    name="DepartmentType"
                    value={formData.DepartmentType}
                    onChange={handleChange}
                    className={submitted && formErrors.DepartmentType ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.DepartmentType}
                    aria-describedby={submitted && formErrors.DepartmentType ? 'DepartmentType-error' : undefined}
                  >
                    <option value="Core">Core</option>
                    <option value="Support">Support</option>
                  </select>
                  {submitted && formErrors.DepartmentType && (
                    <span id="DepartmentType-error" className="warning-message">{formErrors.DepartmentType}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="EmploymentType">Employment Type</label>
                  <select
                    id="EmploymentType"
                    name="EmploymentType"
                    value={formData.EmploymentType}
                    onChange={handleChange}
                    className={submitted && formErrors.EmploymentType ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.EmploymentType}
                    aria-describedby={submitted && formErrors.EmploymentType ? 'EmploymentType-error' : undefined}
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                  {submitted && formErrors.EmploymentType && (
                    <span id="EmploymentType-error" className="warning-message">{formErrors.EmploymentType}</span>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="Status">Status</label>
                  <select
                    id="Status"
                    name="Status"
                    value={formData.Status}
                    onChange={handleChange}
                    className={submitted && formErrors.Status ? 'warning' : ''}
                    aria-invalid={submitted && !!formErrors.Status}
                    aria-describedby={submitted && formErrors.Status ? 'Status-error' : undefined}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                  {submitted && formErrors.Status && (
                    <span id="Status-error" className="warning-message">{formErrors.Status}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isLoading || showSpinner}
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoading || showSpinner}
                aria-label={isEditMode ? 'Update employee' : 'Submit employee'}
              >
                {isEditMode ? 'Update' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;