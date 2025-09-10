// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
// import LeaveTypeForm from '../components/LeaveTypeForm';
// import { useLeaveTypeSlice } from '../slices/LeaveTypeSlice';
// import '../styles/LeaveTypePage.css';

// const LeaveTypePage = () => {
//   const { leaveTypes, handleDelete, successMessage, errorMessage, fetchLeaveTypes, isFetching } = useLeaveTypeSlice();
//   const [searchTerm, setSearchTerm] = useState('');
//   const [showFormModal, setShowFormModal] = useState(false);
//   const [editLeaveType, setEditLeaveType] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [expandedRows, setExpandedRows] = useState({});
//   const navigate = useNavigate();
//   const leaveTypesPerPage = 5;

//   useEffect(() => {
//     fetchLeaveTypes();
//     console.log('Fetching leave types, initial state:', leaveTypes);
//   }, [fetchLeaveTypes]);

//   useEffect(() => {
//     console.log('Updated leave types state:', leaveTypes);
//   }, [leaveTypes]);

//   const filteredLeaveTypes = leaveTypes?.filter((leaveType) => {
//     const matchesSearch =
//       (leaveType?.Name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
//       (leaveType?.Description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
//     return matchesSearch;
//   }) || [];

//   const indexOfLastLeaveType = currentPage * leaveTypesPerPage;
//   const indexOfFirstLeaveType = indexOfLastLeaveType - leaveTypesPerPage;
//   const currentLeaveTypes = filteredLeaveTypes.slice(indexOfFirstLeaveType, indexOfLastLeaveType);
//   const totalPages = Math.ceil(filteredLeaveTypes.length / leaveTypesPerPage);

//   const handleAddOrEditLeaveType = (leaveType) => {
//     console.log('handleAddOrEditLeaveType called, showFormModal set to true', { leaveType });
//     setEditLeaveType(leaveType);
//     setShowFormModal(true);
//   };

//   const handleDeleteClick = (leaveTypeId) => {
//     if (!leaveTypeId) {
//       console.error('Cannot delete: leaveTypeId is undefined');
//       return;
//     }
//     if (window.confirm('Are you sure you want to delete this leave type?')) {
//       handleDelete(leaveTypeId);
//     }
//   };

//   const handleCloseFormModal = async () => {
//     console.log('handleCloseFormModal called, showFormModal set to false');
//     await fetchLeaveTypes();
//     setShowFormModal(false);
//     setEditLeaveType(null);
//     setCurrentPage(1);
//   };

//   const handlePrevPage = () => {
//     if (currentPage > 1) setCurrentPage(currentPage - 1);
//   };

//   const handleNextPage = () => {
//     if (currentPage < totalPages) setCurrentPage(currentPage + 1);
//   };

//   const toggleDetails = (leaveTypeId) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [leaveTypeId]: !prev[leaveTypeId],
//     }));
//   };

//   const formatDate = (date) => {
//     return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
//   };

//   return (
//     <div className="leave-type-page-container">
//       <div className="header-section">
//         <h2>All Leave Types</h2>
//         <div className="header-actions">
//           <button
//             className="all-leaves-btn add-btn"
//             onClick={() => navigate('/leave-request')}
//             aria-label="View all leave requests"
//           >
//             All Leave Requests
//           </button>
//           <button
//             className="add-btn"
//             onClick={() => handleAddOrEditLeaveType(null)}
//             aria-label="Add new leave type"
//           >
//             + Add New Leave Type
//           </button>
//         </div>
//       </div>

//       {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
//       {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
//       {isFetching && <div className="loading-message">Loading leave types...</div>}

//       {showFormModal && (
//         <LeaveTypeForm
//           leaveType={editLeaveType}
//           onClose={handleCloseFormModal}
//         />
//       )}

//       <div className="table-section">
//         <input
//           type="text"
//           placeholder="Search by name or description..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="search-bar"
//           aria-label="Search leave types"
//         />
//         <div className="table-wrapper">
//           <table className="leave-type-table" aria-label="Leave types table">
//             <thead>
//               <tr>
//                 <th style={{ width: '50px' }}></th>
//                 <th>Name</th>
//                 <th>Description</th>
//                 <th>Created At</th>
//                 <th>Updated At</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentLeaveTypes.length > 0 ? (
//                 currentLeaveTypes.map((leaveType) => (
//                   <React.Fragment key={leaveType.LeaveTypeID || `temp-${Math.random()}`}>
//                     <tr>
//                       <td>
//                         <button
//                           className="action-btn details-btn"
//                           onClick={() => toggleDetails(leaveType.LeaveTypeID)}
//                           title={expandedRows[leaveType.LeaveTypeID] ? 'Hide Details' : 'View Details'}
//                           aria-label={`${expandedRows[leaveType.LeaveTypeID] ? 'Hide' : 'Show'} details for ${leaveType.Name || 'unknown'}`}
//                         >
//                           {expandedRows[leaveType.LeaveTypeID] ? <FaChevronUp /> : <FaChevronDown />}
//                         </button>
//                       </td>
//                       <td>{leaveType.Name || 'N/A'}</td>
//                       <td>{leaveType.Description || 'N/A'}</td>
//                       <td>{formatDate(leaveType.CreatedAt)}</td>
//                       <td>{formatDate(leaveType.UpdatedAt)}</td>
//                       <td className="actions-cell">
//                         <button
//                           className="action-btn edit-btn"
//                           onClick={() => handleAddOrEditLeaveType(leaveType)}
//                           title="Edit leave type"
//                           aria-label={`Edit leave type ${leaveType.Name || 'unknown'}`}
//                         >
//                           <FaEdit />
//                         </button>
//                         <button
//                           className="action-btn delete-btn"
//                           onClick={() => handleDeleteClick(leaveType.LeaveTypeID)}
//                           title="Delete leave type"
//                           aria-label={`Delete leave type ${leaveType.Name || 'unknown'}`}
//                         >
//                           <FaTrash />
//                         </button>
//                       </td>
//                     </tr>
//                     {expandedRows[leaveType.LeaveTypeID] && (
//                       <tr className="details-row">
//                         <td colSpan="6">
//                           <div className="details-content">
//                             <p><strong>Leave With Pay:</strong> {leaveType.LeaveWithPay ? 'Yes' : 'No'}</p>
//                             <p><strong>Medical Approval:</strong> {leaveType.MedicalApproval ? 'Yes' : 'No'}</p>
//                             <p><strong>HR Approval Required:</strong> {leaveType.HRApprovalRequired ? 'Yes' : 'No'}</p>
//                           </div>
//                         </td>
//                       </tr>
//                     )}
//                   </React.Fragment>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="6">No leave types found</td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//         <div className="table-footer">
//           <button
//             className="nav-btn"
//             onClick={handlePrevPage}
//             disabled={currentPage === 1}
//             aria-label="Previous page"
//           >
//             Prev
//           </button>
//           <button
//             className="nav-btn"
//             onClick={handleNextPage}
//             disabled={currentPage === totalPages}
//             aria-label="Next page"
//           >
//             Next
//           </button>
//           <span>Page {currentPage} of {totalPages || 1}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LeaveTypePage;


import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import LeaveTypeForm from '../components/LeaveTypeForm';
import { useLeaveTypeSlice } from '../slices/LeaveTypeSlice';
import '../styles/LeaveTypePage.css';

const LeaveTypePage = () => {
  const { leaveTypes, handleDelete, successMessage, errorMessage, fetchLeaveTypes, isFetching } = useLeaveTypeSlice();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editLeaveType, setEditLeaveType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const leaveTypesPerPage = 5;

  useEffect(() => {
    fetchLeaveTypes();
    console.log('Fetching leave types, initial state:', leaveTypes);
  }, [fetchLeaveTypes]);

  useEffect(() => {
    console.log('Updated leave types state:', leaveTypes);
  }, [leaveTypes]);

  const indexOfLastLeaveType = currentPage * leaveTypesPerPage;
  const indexOfFirstLeaveType = indexOfLastLeaveType - leaveTypesPerPage;
  const currentLeaveTypes = leaveTypes.slice(indexOfFirstLeaveType, indexOfLastLeaveType);
  const totalPages = Math.ceil(leaveTypes.length / leaveTypesPerPage);

  const handleAddOrEditLeaveType = (leaveType) => {
    console.log('handleAddOrEditLeaveType called, showFormModal set to true', { leaveType });
    setEditLeaveType(leaveType);
    setShowFormModal(true);
  };

  const handleDeleteClick = (leaveTypeId) => {
    if (!leaveTypeId) {
      console.error('Cannot delete: leaveTypeId is undefined');
      return;
    }
    if (window.confirm('Are you sure you want to delete this leave type?')) {
      handleDelete(leaveTypeId);
    }
  };

  const handleCloseFormModal = async () => {
    console.log('handleCloseFormModal called, showFormModal set to false');
    await fetchLeaveTypes();
    setShowFormModal(false);
    setEditLeaveType(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const toggleDetails = (leaveTypeId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [leaveTypeId]: !prev[leaveTypeId],
    }));
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  };

  return (
    <div className="leave-type-page-container">
      <div className="header-section">
        <h2>All Leave Types</h2>
        <div className="header-actions">
          <button
            className="add-btn"
            onClick={() => handleAddOrEditLeaveType(null)}
            aria-label="Add new leave type"
          >
            + Add New Leave Type
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading leave types...</div>}

      {showFormModal && (
        <LeaveTypeForm
          leaveType={editLeaveType}
          onClose={handleCloseFormModal}
        />
      )}

      <div className="table-section">
        <div className="table-wrapper">
          <table className="leave-type-table" aria-label="Leave types table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th>Name</th>
                <th>Description</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLeaveTypes.length > 0 ? (
                currentLeaveTypes.map((leaveType) => (
                  <React.Fragment key={leaveType.LeaveTypeID || `temp-${Math.random()}`}>
                    <tr>
                      <td>
                        <button
                          className="action-btn details-btn"
                          onClick={() => toggleDetails(leaveType.LeaveTypeID)}
                          title={expandedRows[leaveType.LeaveTypeID] ? 'Hide Details' : 'View Details'}
                          aria-label={`${expandedRows[leaveType.LeaveTypeID] ? 'Hide' : 'Show'} details for ${leaveType.Name || 'unknown'}`}
                        >
                          {expandedRows[leaveType.LeaveTypeID] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                      <td>{leaveType.Name || 'N/A'}</td>
                      <td>{leaveType.Description || 'N/A'}</td>
                      <td>{formatDate(leaveType.CreatedAt)}</td>
                      <td>{formatDate(leaveType.UpdatedAt)}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleAddOrEditLeaveType(leaveType)}
                          title="Edit leave type"
                          aria-label={`Edit leave type ${leaveType.Name || 'unknown'}`}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteClick(leaveType.LeaveTypeID)}
                          title="Delete leave type"
                          aria-label={`Delete leave type ${leaveType.Name || 'unknown'}`}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                    {expandedRows[leaveType.LeaveTypeID] && (
                      <tr className="details-row">
                        <td colSpan="6">
                          <div className="details-content">
                            <p><strong>Leave With Pay:</strong> {leaveType.LeaveWithPay ? 'Yes' : 'No'}</p>
                            <p><strong>Medical Approval:</strong> {leaveType.MedicalApproval ? 'Yes' : 'No'}</p>
                            <p><strong>HR Approval Required:</strong> {leaveType.HRApprovalRequired ? 'Yes' : 'No'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No leave types found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button
            className="nav-btn"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            Prev
          </button>
          <button
            className="nav-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypePage;