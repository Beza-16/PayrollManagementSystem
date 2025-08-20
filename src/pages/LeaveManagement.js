// import React from 'react';
// import { Link } from 'react-router-dom';
// import { FaCalendarAlt, FaListAlt, FaCheckCircle, FaClipboardList } from 'react-icons/fa';
// import './LeaveManagement.css';

// const LeaveManagement = () => {
//   return (
//     <div className="leave-management">
//       <h2>Leave Management</h2>
//       <div className="cards-container">
//         <div className="card">
//           <FaListAlt className="card-icon leave-types-icon" />
//           <h3>Leave Type</h3>
//           <Link to="/leave-types">Go to Form</Link> {/* Ensure this points to /leave-types */}
//         </div>
//         <div className="card">
//           <FaCalendarAlt className="card-icon leaves-icon" />
//           <h3>Employee Leave Request</h3>
//           <Link to="/employee-leave-request/add">Go to Form</Link>
//         </div>
//         <div className="card">
//           <FaCheckCircle className="card-icon leave-approvals-icon" />
//           <h3>My Leave Requests</h3>
//           <Link to="/my-leave-requests">Go to Form</Link>
//         </div>
//         <div className="card">
//           <FaClipboardList className="card-icon leave-list-icon" />
//           <h3>Leave</h3>
//           <Link to="/leaves-list">Go to Form</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeaveManagement;