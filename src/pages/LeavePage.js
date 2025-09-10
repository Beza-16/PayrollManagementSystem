import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import LeaveForm from '../components/LeaveForm';
import { useLeaveSlice } from '../slices/LeaveSlice';
import '../styles/LeavePage.css';

const LeavePage = () => {
  const { leaves, handleAction, successMessage, errorMessage, fetchAllLeaves, fetchPendingLeaves, isFetching } = useLeaveSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const leavesPerPage = 5;

  useEffect(() => {
    fetchAllLeaves(); // Fetch all leaves by default
  }, [fetchAllLeaves]);

  useEffect(() => {
    console.log('Current leaves state:', leaves);
    leaves?.forEach((leave, index) => {
      console.log(`Leave ${index}:`, JSON.stringify(leave, null, 2));
    });
  }, [leaves]);

  const filteredLeaves = leaves?.filter((leave) => {
    const matchesSearch =
      (leave?.EmployeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (leave?.LeaveTypeName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesEmployee = !employeeFilter || (leave?.EmployeeName?.toLowerCase() || '').includes(employeeFilter.toLowerCase());
    const matchesLeaveType = !leaveTypeFilter || (leave?.LeaveTypeName?.toLowerCase() || '').includes(leaveTypeFilter.toLowerCase());
    const matchesStatus = !statusFilter || (leave?.Status === parseInt(statusFilter));
    return matchesSearch && matchesEmployee && matchesLeaveType && matchesStatus;
  }) || [];

  const indexOfLastLeave = currentPage * leavesPerPage;
  const indexOfFirstLeave = indexOfLastLeave - leavesPerPage;
  const currentLeaves = filteredLeaves.slice(indexOfFirstLeave, indexOfLastLeave);
  const totalPages = Math.ceil(filteredLeaves.length / leavesPerPage);

  const handleManageLeave = (leave) => {
    setSelectedLeave(leave);
    setShowLeaveModal(true);
  };

  const handleCloseLeaveModal = async () => {
    await fetchAllLeaves(); // Refresh all leaves after managing
    setShowLeaveModal(false);
    setSelectedLeave(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="leave-page-container">
      <div className="header-section">
        <h2>Leave Management</h2>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading leaves...</div>}

      {showLeaveModal && (
        <LeaveForm
          leave={selectedLeave}
          onClose={handleCloseLeaveModal}
        />
      )}

      <div className="table-section">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by employee or leave type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <input
            type="text"
            placeholder="Filter by Employee..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="filter-input"
          />
          <input
            type="text"
            placeholder="Filter by Leave Type..."
            value={leaveTypeFilter}
            onChange={(e) => setLeaveTypeFilter(e.target.value)}
            className="filter-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">Filter by Status...</option>
            <option value="0">Pending</option>
            <option value="1">Approved</option>
            <option value="2">Rejected</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Start - End</th>
                <th>Days</th>
                <th>Half Day</th>
                <th>Description</th>
                <th>Attachment</th>
                <th>Status</th>
                <th>Rejection Reason</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentLeaves.length > 0 ? (
                currentLeaves.map((leave) => (
                  <tr key={leave.LeaveID || `temp-${Math.random()}`}>
                    <td>{leave.EmployeeName || 'N/A'}</td>
                    <td>{leave.LeaveTypeName || 'N/A'}</td>
                    <td>{`${leave.StartDate ? new Date(leave.StartDate).toLocaleDateString() : 'N/A'} - ${leave.EndDate ? new Date(leave.EndDate).toLocaleDateString() : 'N/A'}`}</td>
                    <td>{leave.NumberOfDays || 'N/A'}</td>
                    <td>{leave.IsHalfDay ? 'Yes' : 'No'}</td>
                    <td>{leave.LeaveDescription || 'N/A'}</td>
                    <td>{leave.AttachmentFilePath ? <a href={leave.AttachmentFilePath} target="_blank" rel="noopener noreferrer">Download</a> : 'N/A'}</td>
                    <td>{leave.Status === 0 ? 'Pending' : leave.Status === 1 ? 'Approved' : 'Rejected'}</td>
                    <td>{leave.RejectionReason || 'N/A'}</td>
                    <td>{leave.ApprovedByName || 'N/A'}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn manage-btn"
                        onClick={() => handleManageLeave(leave)}
                        title="Manage"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11">No leaves found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button className="nav-btn" onClick={handlePrevPage} disabled={currentPage === 1}>
            Prev
          </button>
          <button className="nav-btn" onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default LeavePage;