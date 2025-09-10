import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { FaPlus, FaMinus, FaEdit, FaTrash, FaSync } from 'react-icons/fa';
import { useEmployeeSlice } from '../slices/EmployeeSlice';
import debounce from 'lodash.debounce';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import API_BASE_URL from '../config'; // Import the config file
import '../styles/EmployeePage.css';

const EmployeeForm = lazy(() => import('../components/EmployeeForm'));

const EmployeePage = () => {
  const { employees, handleDelete, successMessage, errorMessage, fetchEmployees, isFetching } = useEmployeeSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const employeesPerPage = 5;

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const debouncedSearch = useMemo(() => debounce((value) => setSearchTerm(value), 300), []);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const filteredEmployees = useMemo(() =>
    employees.filter((employee) =>
      Object.values(employee).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [employees, searchTerm]
  );

  const sortedEmployees = useCallback(() => {
    if (!sortConfig.key) return filteredEmployees;
    return [...filteredEmployees].sort((a, b) => {
      const av = a?.[sortConfig.key] ?? '';
      const bv = b?.[sortConfig.key] ?? '';
      if (av < bv) return sortConfig.direction === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredEmployees, sortConfig]);

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = sortedEmployees().slice(indexOfFirstEmployee, indexOfLastEmployee);
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / employeesPerPage));

  const handleAddOrEditEmployee = (employee) => {
    setEditEmployee(employee ? { ...employee, location_id: employee.location_id || '' } : null);
    setShowEmployeeModal(true);
  };

  const handleDeleteClick = async (employeeId) => {
    if (!employeeId) {
      console.error('Cannot delete: employeeId is undefined');
      return;
    }
    if (window.confirm(`Are you sure you want to delete employee with ID ${employeeId}?`)) {
      await handleDelete(employeeId);
    }
  };

  const handleCloseEmployeeModal = async () => {
    await fetchEmployees();
    setShowEmployeeModal(false);
    setEditEmployee(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const toggleDetails = (employeeId) => {
    setExpandedRows((prev) => ({ ...prev, [employeeId]: !prev[employeeId] }));
  };

  const handleViewDetails = (employee) => setSelectedEmployee(employee);
  const handleCloseDetails = () => setSelectedEmployee(null);

  const formatDate = (date) => {
    try {
      if (!date) return 'N/A';
      const d = new Date(date);
      return isNaN(d) ? date : d.toISOString().split('T')[0];
    } catch {
      return 'N/A';
    }
  };

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById('employee-profile');
    if (!input) {
      console.error('Employee profile element not found');
      return;
    }

    const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: '#fff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pdfWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight > pdfHeight - margin * 2 ? (pdfHeight - margin * 2) * (imgWidth / imgHeight) : imgWidth, imgHeight > pdfHeight - margin * 2 ? pdfHeight - margin * 2 : imgHeight);
    const fileName = `${(selectedEmployee?.FullName || 'employee').replace(/\s+/g, '_')}_profile.pdf`;
    pdf.save(fileName);
  };

  const renderPagination = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
      <button
        key={page}
        className={`nav-btn ${currentPage === page ? 'bg-blue-500' : ''}`}
        onClick={() => handlePageChange(page)}
        aria-label={`Go to page ${page}`}
      >
        {page}
      </button>
    ));
  }, [totalPages, currentPage]);

  const SkeletonRow = () => (
    <tr>
      {Array(5).fill().map((_, i) => (
        <td key={i} className="skeleton" style={{ width: i === 0 ? '20%' : i === 4 ? '25%' : '15%' }}>
          <div className="skeleton-bar" />
        </td>
      ))}
    </tr>
  );

  if (errorMessage && !employees.length) {
    return (
      <div className="error-container" role="alert">
        <p>{errorMessage}</p>
        <button onClick={fetchEmployees} aria-label="Retry fetching employees">
          <FaSync /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="employee-page-container" role="main" aria-label="Employee Management">
      <div className="header-section">
        <h2>All Employees</h2>
        <button
          className="add-btn"
          onClick={() => handleAddOrEditEmployee(null)}
          aria-label="Add new employee"
        >
          <FaPlus /> Add New Employee
        </button>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && (
        <div className="loading-message" role="status">
          <div className="loading-spinner">Loading employees...</div>
        </div>
      )}

      <Suspense fallback={<div className="loading-spinner">Loading form...</div>}>
        {showEmployeeModal && (
          <EmployeeForm employee={editEmployee} onClose={handleCloseEmployeeModal} />
        )}
      </Suspense>

      <div className="table-section">
        <input
          type="text"
          placeholder="Search by any field..."
          onChange={(e) => debouncedSearch(e.target.value)}
          className="search-bar"
          aria-label="Search employees"
        />
        <div className="table-wrapper">
          <table className="employee-table" aria-label="Employee list">
            <thead>
              <tr>
                <th
                  onClick={() => requestSort('FullName')}
                  aria-sort={sortConfig.key === 'FullName' ? sortConfig.direction : 'none'}
                >
                  Full Name {sortConfig.key === 'FullName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => requestSort('DesignationName')}
                  aria-sort={sortConfig.key === 'DesignationName' ? sortConfig.direction : 'none'}
                >
                  Designation {sortConfig.key === 'DesignationName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => requestSort('DepartmentName')}
                  aria-sort={sortConfig.key === 'DepartmentName' ? sortConfig.direction : 'none'}
                >
                  Department {sortConfig.key === 'DepartmentName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => requestSort('Email')}
                  aria-sort={sortConfig.key === 'Email' ? sortConfig.direction : 'none'}
                >
                  Email {sortConfig.key === 'Email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching ? (
                Array(employeesPerPage).fill().map((_, i) => <SkeletonRow key={i} />)
              ) : currentEmployees.length > 0 ? (
                currentEmployees.map((employee) => (
                  <React.Fragment key={employee.EmployeeID || `temp-${Math.random()}`}>
                    <tr>
                      <td>
                        <button
                          className="action-btn details-btn"
                          onClick={() => toggleDetails(employee.EmployeeID)}
                          aria-expanded={!!expandedRows[employee.EmployeeID]}
                          aria-label={expandedRows[employee.EmployeeID] ? 'Hide details' : 'View details'}
                        >
                          {expandedRows[employee.EmployeeID] ? <FaMinus color="#3498db" size="14px" /> : <FaPlus color="#3498db" size="14px" />}
                        </button>
                        {employee.FullName || 'N/A'}
                      </td>
                      <td>{employee.DesignationName || 'N/A'}</td>
                      <td>{employee.DepartmentName || 'N/A'}</td>
                      <td>{employee.Email || 'N/A'}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(employee)}
                          aria-label={`View details for ${employee.FullName}`}
                        >
                          View
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleAddOrEditEmployee(employee)}
                          aria-label={`Edit ${employee.FullName}`}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteClick(employee.EmployeeID)}
                          aria-label={`Delete ${employee.FullName}`}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                    {expandedRows[employee.EmployeeID] && (
                      <tr className="details-row">
                        <td colSpan="5">
                          <div className="details-content">
                            <p><strong>Phone:</strong> {employee.PhoneNumber || employee.Phone || 'N/A'}</p>
                            <p><strong>City:</strong> {employee.City || 'N/A'}</p>
                            <p><strong>Country:</strong> {employee.Country || 'N/A'}</p>
                            <p><strong>Email:</strong> {employee.Email || 'N/A'}</p>
                            <p><strong>DOB:</strong> {formatDate(employee.DOB)}</p>
                            <p><strong>Hire Date:</strong> {formatDate(employee.HireDate)}</p>
                            <p><strong>Recruitment:</strong> {employee.Recruitment || 'N/A'}</p>
                            <p><strong>Status:</strong> {employee.Status || 'N/A'}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="5" role="status">No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button
            className="nav-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            Prev
          </button>
          {renderPagination}
          <button
            className="nav-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            Next
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>

      {selectedEmployee && (
        <div
          className="modal-overlay"
          onClick={handleCloseDetails}
          role="dialog"
          aria-labelledby="employee-details-title"
        >
          <div
            className="modal-content pdf-style profile-pdf"
            onClick={(e) => e.stopPropagation()}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Escape' && handleCloseDetails()}
          >
            <div id="employee-profile" className="employee-profile">
              <div className="left-col">
                {selectedEmployee.Photo ? (
                  <img
                    src={`${API_BASE_URL}${selectedEmployee.Photo}`} // Updated to https://localhost:14686
                    alt={`${selectedEmployee.FullName || 'Employee'} photo`}
                    className="employee-photo"
                    onError={(e) => {
                      console.error(`Failed to load photo for ${selectedEmployee.FullName} at ${API_BASE_URL}${selectedEmployee.Photo}`, e);
                      e.currentTarget.style.display = 'none'; // Hide image on error
                    }}
                    onLoad={() => console.log(`Successfully loaded photo for ${selectedEmployee.FullName} at ${API_BASE_URL}${selectedEmployee.Photo}`)}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="employee-photo placeholder">No Photo</div>
                )}
                <div className="company-branch-dept">
                  <p><strong>Company:</strong> {selectedEmployee.CompanyName || selectedEmployee.Company || 'N/A'}</p>
                  <p><strong>Branch:</strong> {selectedEmployee.BranchName || selectedEmployee.Branch || 'N/A'}</p>
                  <p><strong>Department:</strong> {selectedEmployee.DepartmentName || selectedEmployee.Department || 'N/A'}</p>
                </div>
              </div>
              <div className="right-col">
                <div className="right-top" style={{ textAlign: 'left' }}>
                  <p style={{ fontSize: '18px', fontWeight: 700 }}><strong>Employee Name:</strong> {selectedEmployee.FullName || 'N/A'}</p>
                  <p><strong>DOB:</strong> {formatDate(selectedEmployee.DOB)}</p>
                  <p><strong>Employment Type:</strong> {selectedEmployee.EmploymentType || 'N/A'}</p>
                  <p><strong>Job Title:</strong> {selectedEmployee.DesignationName || selectedEmployee.JobTitle || 'N/A'}</p>
                  <p><strong>City:</strong> {selectedEmployee.City || 'N/A'}</p>
                  <p><strong>Country:</strong> {selectedEmployee.Country || 'N/A'}</p>
                  <p><strong>Hire Date:</strong> {formatDate(selectedEmployee.HireDate)}</p>
                </div>
                <div className="right-bottom" style={{ textAlign: 'left', marginTop: 12 }}>
                  <p style={{ fontWeight: 700 }}><strong>Contact:</strong></p>
                  <p><strong>Phone:</strong> {selectedEmployee.PhoneNumber || selectedEmployee.Phone || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedEmployee.Email || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="download-pdf-btn" onClick={handleDownloadPDF} aria-label="Download employee profile as PDF">
                Download PDF
              </button>
              <button className="close-btn" onClick={handleCloseDetails} aria-label="Close employee details">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeePage;



