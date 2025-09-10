// import React, { useState, useEffect } from 'react';
// import { useLeaveTypeSlice } from '../slices/LeaveTypeSlice';
// import '../styles/LeaveTypeForm.css';

// const LeaveTypeForm = ({ leaveType, onClose }) => {
//   const { handleSubmit, isSubmitting, errorMessage, successMessage } = useLeaveTypeSlice();
//   const [formData, setFormData] = useState({
//     LeaveTypeID: leaveType?.LeaveTypeID || '',
//     Name: leaveType?.Name || '',
//     Description: leaveType?.Description || '',
//     LeaveWithPay: leaveType?.LeaveWithPay || false,
//     MedicalApproval: leaveType?.MedicalApproval || false,
//     HRApprovalRequired: leaveType?.HRApprovalRequired || false,
//     CreatedAt: leaveType?.CreatedAt || '',
//     UpdatedAt: leaveType?.UpdatedAt || ''
//   });
//   const [formError, setFormError] = useState('');
//   const isEditMode = !!leaveType && leaveType.LeaveTypeID;

//   useEffect(() => {
//     if (isEditMode) {
//       setFormData({
//         LeaveTypeID: leaveType.LeaveTypeID || '',
//         Name: leaveType.Name || '',
//         Description: leaveType.Description || '',
//         LeaveWithPay: leaveType.LeaveWithPay || false,
//         MedicalApproval: leaveType.MedicalApproval || false,
//         HRApprovalRequired: leaveType.HRApprovalRequired || false,
//         CreatedAt: leaveType.CreatedAt || '',
//         UpdatedAt: leaveType.UpdatedAt || ''
//       });
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         CreatedAt: new Date().toISOString(),
//         UpdatedAt: new Date().toISOString()
//       }));
//     }
//   }, [leaveType, isEditMode]);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//     setFormError('');
//   };

//   const validateForm = () => {
//     if (!formData.Name.trim()) {
//       setFormError('Name is required.');
//       return false;
//     }
//     if (formData.Name.length > 50) {
//       setFormError('Name cannot exceed 50 characters.');
//       return false;
//     }
//     if (formData.Description && formData.Description.length > 1000) {
//       setFormError('Description cannot exceed 1000 characters.');
//       return false;
//     }
//     return true;
//   };

//   const onSubmit = async (e) => {
//     e.preventDefault();
//     setFormError('');
//     if (!validateForm()) return;

//     try {
//       const leaveTypeData = {
//         LeaveTypeID: isEditMode ? formData.LeaveTypeID : null,
//         Name: formData.Name.trim(),
//         Description: formData.Description.trim() || null,
//         LeaveWithPay: formData.LeaveWithPay,
//         MedicalApproval: formData.MedicalApproval,
//         HRApprovalRequired: formData.HRApprovalRequired,
//         CreatedAt: isEditMode ? formData.CreatedAt : new Date().toISOString(),
//         UpdatedAt: new Date().toISOString()
//       };
//       console.log('LeaveTypeForm.js: Submitting payload:', leaveTypeData);
//       await handleSubmit(leaveTypeData);
//       onClose();
//     } catch (err) {
//       console.error('LeaveTypeForm.js: Form submission error:', err);
//       setFormError(err.response?.data?.errors?.join(', ') || err.message || 'Failed to submit leave type data.');
//     }
//   };

//   return (
//     <div className="leave-type-form-modal">
//       <div className="modal-overlay">
//         <div className="modal-content">
//           <h2>{isEditMode ? 'Edit Leave Type' : 'Add New Leave Type'}</h2>
//           {errorMessage && <div className="error-message">{errorMessage}</div>}
//           {formError && <div className 更新="error-message">{formError}</div>}
//           {successMessage && <div className="success-message">{successMessage}</div>}
//           <form onSubmit={onSubmit}>
//             <div className="form-group">
//               <label htmlFor="Name">Name</label>
//               <input
//                 type="text"
//                 id="Name"
//                 name="Name"
//                 value={formData.Name}
//                 onChange={handleChange}
//                 placeholder="Enter leave type name"
//                 required
//                 maxLength={50}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="Description">Description (Optional)</label>
//               <textarea
//                 id="Description"
//                 name="Description"
//                 value={formData.Description}
//                 onChange={handleChange}
//                 placeholder="Enter description"
//                 rows="4"
//                 maxLength={1000}
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="LeaveWithPay">Leave With Pay</label>
//               <select
//                 id="LeaveWithPay"
//                 name="LeaveWithPay"
//                 value={formData.LeaveWithPay.toString()}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="false">No</option>
//                 <option value="true">Yes</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="MedicalApproval">Medical Approval Required</label>
//               <select
//                 id="MedicalApproval"
//                 name="MedicalApproval"
//                 value={formData.MedicalApproval.toString()}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="false">No</option>
//                 <option value="true">Yes</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="HRApprovalRequired">HR Approval Required</label>
//               <select
//                 id="HRApprovalRequired"
//                 name="HRApprovalRequired"
//                 value={formData.HRApprovalRequired.toString()}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="false">No</option>
//                 <option value="true">Yes</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label htmlFor="CreatedAt">Created At</label>
//               <input
//                 type="text"
//                 id="CreatedAt"
//                 name="CreatedAt"
//                 value={formData.CreatedAt ? new Date(formData.CreatedAt).toLocaleString() : ''}
//                 readOnly
//                 className="readonly-field"
//               />
//             </div>
//             <div className="form-group">
//               <label htmlFor="UpdatedAt">Updated At</label>
//               <input
//                 type="text"
//                 id="UpdatedAt"
//                 name="UpdatedAt"
//                 value={formData.UpdatedAt ? new Date(formData.UpdatedAt).toLocaleString() : ''}
//                 readOnly
//                 className="readonly-field"
//               />
//             </div>
//             <div className="form-actions">
//               <button type="button" onClick={onClose} disabled={isSubmitting}>
//                 Cancel
//               </button>
//               <button type="submit" disabled={isSubmitting}>
//                 {isEditMode ? 'Update' : 'Submit'}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeaveTypeForm;



import React, { useState, useEffect } from 'react';
import { useLeaveTypeSlice } from '../slices/LeaveTypeSlice';
import '../styles/LeaveTypeForm.css';

const LeaveTypeForm = ({ leaveType, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useLeaveTypeSlice();
  const [formData, setFormData] = useState({
    leaveTypeID: '',
    name: '',
    description: '',
    status: 'Active',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (leaveType) {
      setFormData({
        leaveTypeID: leaveType.leaveTypeID || '',
        name: leaveType.name || '',
        description: leaveType.description || '',
        status: leaveType.status || 'Active',
      });
    }
  }, [leaveType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.name.length > 100) errors.name = 'Name cannot exceed 100 characters';
    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    if (!validateForm()) return;

    try {
      const payload = {
        leaveTypeID: formData.leaveTypeID || null,
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
      };
      await handleSubmit(payload);
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      const errorMessage = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(', ')
        : err.response?.data?.error || err.message || 'Failed to process leave type.';
      setFormErrors({ general: errorMessage });
    }
  };

  return (
    <div className="leave-type-form">
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>{leaveType ? 'Edit Leave Type' : 'Add Leave Type'}</h2>
          {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
          {formErrors.general && <div className="error-message" role="alert">{formErrors.general}</div>}
          {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "nameError" : "nameHelp"}
              />
              <small id="nameHelp" className="sr-only">Enter leave type name</small>
              {formErrors.name && <span id="nameError" className="error-message">{formErrors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
                className="form-control"
                maxLength={1000}
                aria-describedby="descriptionHelp"
              />
              <small id="descriptionHelp" className="sr-only">Enter leave type description</small>
              {formErrors.description && <span id="descriptionError" className="error-message">{formErrors.description}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="form-control"
                aria-describedby="statusHelp"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <small id="statusHelp" className="sr-only">Select leave type status</small>
            </div>
            <div className="form-actions">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="cancel-btn"
                aria-label="Cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="submit-btn"
                aria-label={leaveType ? 'Update leave type' : 'Add leave type'}
              >
                {isSubmitting ? 'Processing...' : leaveType ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeForm;