import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import EmployeeRecordsForm from '../components/EmployeeRecordsForm';
import { useShiftScheduleSliceWithRedux } from '../slices/ShiftScheduleSlice';
import { useJobGradeSlice } from '../slices/JobGradeSlice';
import { useContractSlice } from '../slices/ContractSlice';
import { useEmployeeSlice } from '../slices/EmployeeSlice';
import '../styles/EmployeeRecordsPage.css';

const EmployeeRecordsPage = () => {
  const {
    shiftSchedules,
    fetchShiftSchedules,
    handleDelete: deleteShiftSchedule,
    successMessage: shiftSuccess,
    errorMessage: shiftError,
    isFetching: isFetchingShift,
    isSubmitting: isSubmittingShift,
    isDeleting: isDeletingShift,
    clearMessages: clearShiftMessages,
    page: shiftPage,
    pageSize: shiftPageSize,
    totalPages: shiftTotalPages,
  } = useShiftScheduleSliceWithRedux();

  const {
    jobGrades: jobGradesArray,
    fetchJobGrades,
    handleDelete: deleteJobGrade,
    successMessage: jobGradeSuccess,
    errorMessage: jobGradeError,
    isFetching: isFetchingJobGrade,
    isSubmitting: isSubmittingJobGrade,
    isDeleting: isDeletingJobGrade,
    clearMessages: clearJobGradeMessages,
    page: jobGradePage,
    pageSize: jobGradePageSize,
    totalPages: jobGradeTotalPages,
  } = useJobGradeSlice();

  const {
    contracts: contractsArray,
    fetchContracts,
    handleDelete: deleteContract,
    successMessage: contractSuccess,
    errorMessage: contractError,
    isFetching: isFetchingContract,
    isSubmitting: isSubmittingContract,
    isDeleting: isDeletingContract,
    clearMessages: clearContractMessages,
    page: contractPage,
    pageSize: contractPageSize,
    totalPages: contractTotalPages,
  } = useContractSlice();

  const {
    employees,
    fetchEmployees,
    errorMessage: employeeError,
    isFetching: isFetchingEmployees,
  } = useEmployeeSlice();

  const [filter, setFilter] = useState('ShiftSchedule');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isAuthenticated = !!localStorage.getItem('token');

  // Log authentication once
  useEffect(() => {
    console.log(
      'EmployeeRecordsPage - Authentication status:',
      isAuthenticated ? 'Authenticated' : 'Not authenticated'
    );
    console.log('EmployeeRecordsPage - Token value:', localStorage.getItem('token') || 'Missing');
  }, [isAuthenticated]);

  // Fetch data only when authenticated or page changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        await Promise.all([
          fetchShiftSchedules(currentPage, shiftPageSize),
          fetchJobGrades(currentPage, jobGradePageSize),
          fetchContracts(currentPage, contractPageSize),
          fetchEmployees(),
        ]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };

    fetchData();
  }, [fetchShiftSchedules, fetchJobGrades, fetchContracts, fetchEmployees, isAuthenticated, currentPage, shiftPageSize, jobGradePageSize, contractPageSize]);

  // Auto clear messages
  useEffect(() => {
    const hasMessage = shiftSuccess || shiftError || jobGradeSuccess || jobGradeError || contractSuccess || contractError || employeeError;
    if (!hasMessage) return;

    const timeoutId = setTimeout(() => {
      clearShiftMessages();
      clearJobGradeMessages();
      clearContractMessages();
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [shiftSuccess, shiftError, jobGradeSuccess, jobGradeError, contractSuccess, contractError, employeeError, clearShiftMessages, clearJobGradeMessages, clearContractMessages]);

  const getFullName = useCallback((employeeID) => {
    const emp = employees.find(e => e.EmployeeID === employeeID);
    return emp ? emp.FullName : `Unknown (ID: ${employeeID || 'N/A'})`;
  }, [employees]);

  const getFilteredRecords = useCallback(() => {
    let records = [];
    if (filter === 'ShiftSchedule') records = shiftSchedules.map(s => ({ ...s, FullName: getFullName(s.EmployeeID) }));
    if (filter === 'JobGrade') records = jobGradesArray.map(j => ({ ...j, FullName: getFullName(j.EmployeeID) }));
    if (filter === 'Contract') records = contractsArray.map(c => ({ ...c, FullName: getFullName(c.EmployeeID) }));

    return records.filter(r =>
      !searchTerm ||
      (r.FullName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.ShiftType?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.Grade?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.ContractType?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [filter, searchTerm, shiftSchedules, jobGradesArray, contractsArray, getFullName]);

  const filteredRecords = getFilteredRecords();
  const totalPages = filter === 'ShiftSchedule' ? shiftTotalPages : filter === 'JobGrade' ? jobGradeTotalPages : contractTotalPages;

  const handleAddOrEdit = useCallback(record => {
    setEditRecord(record);
    setShowModal(true);
  }, []);

  const handleDeleteClick = useCallback(
    id => {
      if (!id || !window.confirm(`Are you sure you want to delete this ${filter}?`)) return;
      if (filter === 'ShiftSchedule') deleteShiftSchedule(id);
      if (filter === 'JobGrade') deleteJobGrade(id);
      if (filter === 'Contract') deleteContract(id);
    },
    [filter, deleteShiftSchedule, deleteJobGrade, deleteContract]
  );

  const handleCloseModal = useCallback(async () => {
    setShowModal(false);
    setEditRecord(null);
    setCurrentPage(1);
    if (!isAuthenticated) return;

    try {
      await Promise.all([
        fetchShiftSchedules(1, shiftPageSize),
        fetchJobGrades(1, jobGradePageSize),
        fetchContracts(1, contractPageSize),
        fetchEmployees(),
      ]);
    } catch (err) {
      console.error('Error refreshing data after modal close:', err);
    }
  }, [fetchShiftSchedules, fetchJobGrades, fetchContracts, fetchEmployees, isAuthenticated, shiftPageSize, jobGradePageSize, contractPageSize]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatTimeSpan = (time) => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':').slice(0, 2);
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  };

  return (
    <div className="employee-records-page-container">
      {/* Header, filter, add button */}
      <div className="header-section">
        <h2 className="text-xl font-semibold">Employee Records</h2>
        <div className="filter-section">
          <select value={filter} onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }} className="filter-select">
            <option value="ShiftSchedule">Shift Schedule</option>
            <option value="JobGrade">Job Grade</option>
            <option value="Contract">Contract</option>
          </select>
          <button className="add-btn" onClick={() => handleAddOrEdit(null)} disabled={!isAuthenticated}>
            + Add New {filter}
          </button>
        </div>
      </div>

      {!isAuthenticated && <div style={{ color: 'red', margin: '10px 0' }}>Please log in to view or manage records.</div>}

      {showModal && <EmployeeRecordsForm record={editRecord} filter={filter} onClose={handleCloseModal} />}

      {/* Table and search */}
      <div className="table-section">
        <input type="text" placeholder="Search by name or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-bar" />
        <div className="table-wrapper">
          <table className="employee-records-table">
            <thead>
              <tr>
                <th>Full Name</th>
                {filter === 'ShiftSchedule' && <>
                  <th>Shift Type</th><th>Start Time</th><th>End Time</th><th>Created At</th><th>Updated At</th>
                </>}
                {filter === 'JobGrade' && <>
                  <th>Grade</th><th>Salary Scale</th><th>Created At</th><th>Updated At</th>
                </>}
                {filter === 'Contract' && <>
                  <th>Contract Type</th><th>Probation Period</th><th>Start Date</th><th>End Date</th><th>Created At</th><th>Updated At</th>
                </>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 && isAuthenticated ? filteredRecords.map(rec => (
                <tr key={rec.ShiftID || rec.JobGradeID || rec.ContractID || `temp-${Math.random()}`}>
                  <td>{rec.FullName}</td>
                  {filter === 'ShiftSchedule' && <>
                    <td>{rec.ShiftType || 'N/A'}</td>
                    <td>{rec.StartTime ? formatTimeSpan(rec.StartTime) : 'N/A'}</td>
                    <td>{rec.EndTime ? formatTimeSpan(rec.EndTime) : 'N/A'}</td>
                    <td>{rec.CreatedAt ? new Date(rec.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{rec.UpdatedAt ? new Date(rec.UpdatedAt).toLocaleDateString() : 'N/A'}</td>
                  </>}
                  {filter === 'JobGrade' && <>
                    <td>{rec.Grade || 'N/A'}</td>
                    <td>{rec.SalaryScale ? `$${rec.SalaryScale.toFixed(2)}` : 'N/A'}</td>
                    <td>{rec.CreatedAt ? new Date(rec.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{rec.UpdatedAt ? new Date(rec.UpdatedAt).toLocaleDateString() : 'N/A'}</td>
                  </>}
                  {filter === 'Contract' && <>
                    <td>{rec.ContractType || 'N/A'}</td>
                    <td>{rec.ProbationPeriod ? `${rec.ProbationPeriod} months` : 'N/A'}</td>
                    <td>{rec.StartDate ? new Date(rec.StartDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{rec.EndDate ? new Date(rec.EndDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{rec.CreatedAt ? new Date(rec.CreatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{rec.UpdatedAt ? new Date(rec.UpdatedAt).toLocaleDateString() : 'N/A'}</td>
                  </>}
                  <td className="actions-cell">
                    <button className="action-btn edit-btn" onClick={() => handleAddOrEdit(rec)} disabled={!isAuthenticated}><FaEdit /></button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteClick(rec.ShiftID || rec.JobGradeID || rec.ContractID)} disabled={!isAuthenticated}><FaTrash /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={filter === 'ShiftSchedule' ? 7 : filter === 'JobGrade' ? 6 : 8}>
                    {isAuthenticated ? 'No records found' : 'Please log in to view records'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <button className="nav-btn" onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1 || !isAuthenticated}>Prev</button>
          <button className="nav-btn" onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages || !isAuthenticated}>Next</button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmployeeRecordsPage);
