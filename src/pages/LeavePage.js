import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import LeaveForm from '../components/LeaveForm';
import { useLeaveSlice } from '../slices/LeaveSlice';
import { useLeaveTypeSlice } from '../slices/LeaveTypeSlice';
import '../styles/LeavePage.css';

const LeavePage = () => {
  const { leaves, handleDelete, successMessage, errorMessage, fetchLeaves, isFetching, employees } = useLeaveSlice();
  const { leaveTypes, fetchLeaveTypes } = useLeaveTypeSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editLeave, setEditLeave] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'StartDate', direction: 'desc' });
  const leavesPerPage = 5;
  const location = useLocation();
  const navigate = useNavigate();
  const isMyLeaves = location.pathname === '/my-leave-requests';

  useEffect(() => {
    fetchLeaves(isMyLeaves);
    fetchLeaveTypes();
  }, [fetchLeaves, fetchLeaveTypes, isMyLeaves]);

  useEffect(() => {
    console.log('Current leaves state:', leaves);
    console.log('Current employees state:', employees);
    console.log('Current leave types state:', leaveTypes);
  }, [leaves, employees, leaveTypes]);

  const filteredLeaves = useMemo(() => {
    return leaves?.filter((leave) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        (leave?.EmployeeFullName?.toLowerCase() || '').includes(searchLower) ||
        (leave?.LeaveTypeName?.toLowerCase() || '').includes(searchLower) ||
        (leave?.StartDate?.toLowerCase() || '').includes(searchLower) ||
        (leave?.EndDate?.toLowerCase() || '').includes(searchLower) ||
        (leave?.LeaveDescription?.toLowerCase() || '').includes(searchLower) ||
        (leave?.Status?.toLowerCase() || '').includes(searchLower) ||
        (leave?.RejectionReason?.toLowerCase() || '').includes(searchLower) ||
        (leave?.MedicalDocument?.toLowerCase() || '').includes(searchLower)
      ) && (leaveTypeFilter ? leave.LeaveTypeID === leaveTypeFilter : true);
    }) || [];
  }, [leaves, searchTerm, leaveTypeFilter]);

  const sortedLeaves = useMemo(() => {
    const sortableLeaves = [...filteredLeaves];
    sortableLeaves.sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableLeaves;
  }, [filteredLeaves, sortConfig]);

  const indexOfLastLeave = currentPage * leavesPerPage;
  const indexOfFirstLeave = indexOfLastLeave - leavesPerPage;
  const currentLeaves = sortedLeaves.slice(indexOfFirstLeave, indexOfLastLeave);
  const totalPages = Math.ceil(sortedLeaves.length / leavesPerPage);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleAddOrEditLeave = (leave) => {
    setEditLeave(leave);
    setShowLeaveModal(true);
  };

  const handleDeleteClick = (leaveId) => {
    if (!leaveId) {
      console.error('Cannot delete: leaveId is undefined');
      return;
    }
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      handleDelete(leaveId);
    }
  };

  const handleCloseLeaveModal = async () => {
    await fetchLeaves(isMyLeaves);
    setShowLeaveModal(false);
    setEditLeave(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const toggleDetails = (leaveId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [leaveId]: !prev[leaveId],
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort />;
    return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleLeaveTypeClick = () => {
    navigate('/leave-types');
  };

  return (
    <div className="leave-page-container">
      <div className="header-section">
        <h2>{isMyLeaves ? 'My Leave Requests' : 'All Leave Requests'}</h2>
        <div className="header-actions">
          <select
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            onClick={handleLeaveTypeClick}
            className="leave-type-filter add-btn"
            aria-label="Filter by leave type or navigate to leave types"
          >
            <option value="">All Leave Types</option>
            {leaveTypes.map((lt) => (
              <option key={lt.LeaveTypeID} value={lt.LeaveTypeID}>
                {lt.Name}
              </option>
            ))}
          </select>
          <button
            className="manage-leave-types-btn add-btn"
            onClick={() => navigate('/leave-types')}
            aria-label="Manage leave types"
          >
            Manage Leave Types
          </button>
          <button
            className="add-btn"
            onClick={() => handleAddOrEditLeave(null)}
            aria-label="Add new leave request"
          >
            + Add New Leave
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading leaves...</div>}

      {showLeaveModal && (
        <LeaveForm
          leave={editLeave}
          onClose={handleCloseLeaveModal}
        />
      )}

      <div className="table-section">
        <input
          type="text"
          placeholder="Search by employee, leave type, dates, status, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
          aria-label="Search leave requests"
        />
        <div className="table-wrapper">
          <table className="leave-table" aria-label="Leave requests table">
            <thead>
              <tr>
                <th onClick={() => handleSort('EmployeeFullName')} aria-sort={sortConfig.key === 'EmployeeFullName' ? sortConfig.direction : 'none'}>
                  Employee Name {getSortIcon('EmployeeFullName')}
                </th>
                <th onClick={() => handleSort('LeaveTypeName')} aria-sort={sortConfig.key === 'LeaveTypeName' ? sortConfig.direction : 'none'}>
                  Leave Type {getSortIcon('LeaveTypeName')}
                </th>
                <th onClick={() => handleSort('StartDate')} aria-sort={sortConfig.key === 'StartDate' ? sortConfig.direction : 'none'}>
                  Start Date {getSortIcon('StartDate')}
                </th>
                <th onClick={() => handleSort('EndDate')} aria-sort={sortConfig.key === 'EndDate' ? sortConfig.direction : 'none'}>
                  End Date {getSortIcon('EndDate')}
                </th>
                <th onClick={() => handleSort('Status')} aria-sort={sortConfig.key === 'Status' ? sortConfig.direction : 'none'}>
                  Status {getSortIcon('Status')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLeaves.length > 0 ? (
                currentLeaves.map((leave) => (
                  <React.Fragment key={leave.LeaveID || `temp-${Math.random()}`}>
                    <tr>
                      <td>{leave.EmployeeFullName || 'N/A'}</td>
                      <td>{leave.LeaveTypeName || 'N/A'}</td>
                      <td>{formatDate(leave.StartDate)}</td>
                      <td>{formatDate(leave.EndDate)}</td>
                      <td>{leave.Status || 'N/A'}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleAddOrEditLeave(leave)}
                          title="Edit leave"
                          aria-label={`Edit leave for ${leave.EmployeeFullName || 'unknown'}`}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteClick(leave.LeaveID)}
                          title="Delete leave"
                          aria-label={`Delete leave for ${leave.EmployeeFullName || 'unknown'}`}
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="action-btn details-btn"
                          onClick={() => toggleDetails(leave.LeaveID)}
                          title={expandedRows[leave.LeaveID] ? 'Hide Details' : 'View Details'}
                          aria-label={`${expandedRows[leave.LeaveID] ? 'Hide' : 'Show'} details for ${leave.EmployeeFullName || 'unknown'}`}
                        >
                          {expandedRows[leave.LeaveID] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[leave.LeaveID] && (
                      <tr className="details-row">
                        <td colSpan="6">
                          <div className="details-content">
                            <p><strong>Description:</strong> {leave.LeaveDescription || 'N/A'}</p>
                            <p><strong>Leave With Pay:</strong> {leave.LeaveWithPay ? 'Yes' : 'No'}</p>
                            <p><strong>Medical Approval:</strong> {leave.MedicalApproval ? 'Yes' : 'No'}</p>
                            <p><strong>HR Approval Required:</strong> {leave.HRApprovalRequired ? 'Yes' : 'No'}</p>
                            <p><strong>Offices Filed:</strong> {leave.LeaveOfficesFiled ? 'Yes' : 'No'}</p>
                            <p><strong>Annual Leave Date:</strong> {formatDate(leave.AnnualLeaveDate)}</p>
                            <p><strong>Rejection Reason:</strong> {leave.RejectionReason || 'N/A'}</p>
                            <p><strong>Medical Document:</strong> {leave.MedicalDocument || 'N/A'}</p>
                            <p><strong>Approved By:</strong> {leave.ApprovedBy || 'N/A'}</p>
                            <p><strong>Created At:</strong> {formatDate(leave.CreatedAt)}</p>
                            <p><strong>Updated At:</strong> {formatDate(leave.UpdatedAt)}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No leave requests found</td>
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

export default LeavePage;