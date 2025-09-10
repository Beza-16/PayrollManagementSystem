// import React, { useState, useEffect } from 'react';
// import { useEmployeeSalaryMappingSlice } from '../slices/EmployeeSalaryMappingSlice';
// import '../styles/EmployeeSalaryMappingForm.css';

// // Simulated auth context or hook (replace with your actual auth solution)
// const useAuth = () => {
//   const token = localStorage.getItem('token');
//   const userId = localStorage.getItem('userId') || (token ? JSON.parse(atob(token.split('.')[1])).sub : null); // Extract from token if available
//   return { userId, isAuthenticated: !!token };
// };

// const EmployeeSalaryMappingForm = ({ mapping, onClose }) => {
//   const { createMapping, updateMapping } = useEmployeeSalaryMappingSlice();
//   const { userId } = useAuth(); // Kept for potential future use
//   const [formData, setFormData] = useState({
//     MappingID: mapping?.MappingID || '',
//     EmployeeID: mapping?.EmployeeID || '',
//     EarningID: mapping?.EarningID || '',
//     DeductionID: mapping?.DeductionID || '',
//     Amount: mapping?.Amount || 0,
//     StartDate: mapping?.StartDate || '',
//     EndDate: mapping?.EndDate || '',
//   });

//   useEffect(() => {
//     setFormData({
//       MappingID: mapping?.MappingID || '',
//       EmployeeID: mapping?.EmployeeID || '',
//       EarningID: mapping?.EarningID || '',
//       DeductionID: mapping?.DeductionID || '',
//       Amount: mapping?.Amount || 0,
//       StartDate: mapping?.StartDate || '',
//       EndDate: mapping?.EndDate || '',
//     });
//   }, [mapping]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const payload = {
//         MappingID: formData.MappingID,
//         EmployeeID: formData.EmployeeID,
//         EarningID: formData.EarningID || null,
//         DeductionID: formData.DeductionID || null,
//         Amount: parseFloat(formData.Amount),
//         StartDate: formData.StartDate || null,
//         EndDate: formData.EndDate || null,
//       };
//       console.log('Sending payload:', payload);
//       if (formData.MappingID) {
//         await updateMapping(formData.MappingID, payload);
//       } else {
//         await createMapping(payload);
//       }
//       onClose();
//     } catch (error) {
//       console.error('Action failed:', error.response?.data || error);
//     }
//   };

//   return (
//     <div className="mapping-form-overlay">
//       <div className="mapping-form-container">
//         <h2>{formData.MappingID ? 'Edit' : 'Add'} Salary Mapping</h2>
//         <form onSubmit={handleSubmit} className="mapping-form">
//           <div className="form-group">
//             <label>Employee ID</label>
//             <input type="text" name="EmployeeID" value={formData.EmployeeID} onChange={handleChange} required />
//           </div>
//           <div className="form-group">
//             <label>Earning ID (optional)</label>
//             <input type="text" name="EarningID" value={formData.EarningID} onChange={handleChange} />
//           </div>
//           <div className="form-group">
//             <label>Deduction ID (optional)</label>
//             <input type="text" name="DeductionID" value={formData.DeductionID} onChange={handleChange} />
//           </div>
//           <div className="form-group">
//             <label>Amount</label>
//             <input type="number" name="Amount" value={formData.Amount} onChange={handleChange} required />
//           </div>
//           <div className="form-group">
//             <label>Start Date (optional)</label>
//             <input type="date" name="StartDate" value={formData.StartDate} onChange={handleChange} />
//           </div>
//           <div className="form-group">
//             <label>End Date (optional)</label>
//             <input type="date" name="EndDate" value={formData.EndDate} onChange={handleChange} />
//           </div>
//           <div className="form-actions">
//             <button type="button" onClick={onClose} className="cancel-btn">
//               Cancel
//             </button>
//             <button type="submit" className="submit-btn">
//               {formData.MappingID ? 'Update' : 'Create'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EmployeeSalaryMappingForm;