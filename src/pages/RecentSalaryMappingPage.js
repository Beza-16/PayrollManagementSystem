import React, { useState, useEffect } from 'react';
import { useEmployeeSalaryMappingSlice } from '../slices/EmployeeSalaryMappingSlice';
import Modal from 'react-modal';
import '../styles/EmployeeSalaryMappingPage.css';

// Set up modal for accessibility
Modal.setAppElement('#root');

const RecentSalaryMappingPage = () => {
  const {
    mappings,
    successMessage,
    errorMessage,
    isFetching,
    fetchEmployeeSalaryMappings,
  } = useEmployeeSalaryMappingSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const mappingsPerPage = 5;

  useEffect(() => {
    fetchEmployeeSalaryMappings({ periodId: periodFilter || null });
  }, [fetchEmployeeSalaryMappings, periodFilter]);

  useEffect(() => {
    console.log('Recent mappings state:', mappings);
    mappings?.forEach((mapping, index) => {
      console.log(`Recent Mapping ${index}:`, JSON.stringify(mapping, null, 2));
    });
  }, [mappings]);

  // Filter and sort mappings to show only the most recent per employee
  const recentMappings = mappings
    ?.reduce((acc, mapping) => {
      // Find existing mapping for the same employee
      const existing = acc.find(m => m.EmployeeID === mapping.EmployeeID);
      if (!existing) {
        acc.push(mapping);
      } else if (new Date(mapping.UpdatedAt || mapping.CreatedAt) > new Date(existing.UpdatedAt || existing.CreatedAt)) {
        // Replace with more recent mapping
        acc = acc.filter(m => m.EmployeeID !== mapping.EmployeeID);
        acc.push(mapping);
      }
      return acc;
    }, [])
    ?.filter(mapping => {
      const matchesSearch =
        (mapping?.FullName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesEmployee =
        !employeeFilter || (mapping?.FullName?.toLowerCase() || '').includes(employeeFilter.toLowerCase());
      return matchesSearch && matchesEmployee;
    })
    ?.sort((a, b) => new Date(b.UpdatedAt || b.CreatedAt) - new Date(a.UpdatedAt || a.CreatedAt))
    .slice(0, 10); // Limit to 10 most recent mappings

  const indexOfLastMapping = currentPage * mappingsPerPage;
  const indexOfFirstMapping = indexOfLastMapping - mappingsPerPage;
  const currentMappings = recentMappings?.slice(indexOfFirstMapping, indexOfLastMapping) || [];
  const totalPages = Math.ceil((recentMappings?.length || 0) / mappingsPerPage);

  const handleViewDetails = (mapping) => {
    setSelectedMapping(mapping);
    setShowDetailsModal(true);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedMapping(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="salary-mapping-page-container">
      <div className="header-section">
        <h2>Recent Salary Mappings</h2>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading recent salary mappings...</div>}

      {showDetailsModal && (
        <Modal
          isOpen={showDetailsModal}
          onRequestClose={handleCloseDetailsModal}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          {selectedMapping && (
            <div>
              <h2>{selectedMapping.FullName} Salary Details</h2>
              <h3>Earnings</h3>
              <ul>
                {selectedMapping.EarningsDetail.length > 0 ? (
                  selectedMapping.EarningsDetail.map(e => (
                    <li key={e.EarningID}>
                      {e.EarningTypeName}: {e.Amount} ({e.Taxability}, {e.IsBasic ? 'Basic' : 'Non-Basic'})
                      <br />
                      Period: {e.StartDate ? new Date(e.StartDate).toLocaleDateString() : 'N/A'} -{' '}
                      {e.EndDate ? new Date(e.EndDate).toLocaleDateString() : 'N/A'}
                    </li>
                  ))
                ) : (
                  <li>No earnings for this period</li>
                )}
              </ul>
              <h3>Deductions</h3>
              <ul>
                {selectedMapping.DeductionsDetail.length > 0 ? (
                  selectedMapping.DeductionsDetail.map(d => (
                    <li key={d.DeductionID}>
                      {d.DeductionTypeName}: {d.Amount}
                      <br />
                      Period: {d.StartDate ? new Date(d.StartDate).toLocaleDateString() : 'N/A'} -{' '}
                      {d.EndDate ? new Date(d.EndDate).toLocaleDateString() : 'N/A'}
                    </li>
                  ))
                ) : (
                  <li>No deductions for this period</li>
                )}
              </ul>
              <button className="modal-close-btn" onClick={handleCloseDetailsModal}>
                Close
              </button>
            </div>
          )}
        </Modal>
      )}

      <div className="table-section">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by employee..."
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
            placeholder="Filter by Period Name..."
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="table-wrapper">
          <table className="salary-mapping-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Total Earnings</th>
                <th>Total Deductions</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentMappings.length > 0 ? (
                currentMappings.map((mapping) => (
                  <tr key={mapping.EmployeeID || `temp-${Math.random()}`}>
                    <td>{mapping.FullName || 'N/A'}</td>
                    <td>{mapping.TotalEarnings || '0.00'}</td>
                    <td>{mapping.TotalDeductions || '0.00'}</td>
                    <td>
                      {mapping.CreatedAt
                        ? new Date(mapping.CreatedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {mapping.UpdatedAt
                        ? new Date(mapping.UpdatedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view-details-btn"
                        onClick={() => handleViewDetails(mapping)}
                        title="View Details"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No recent salary mappings found</td>
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
          >
            Prev
          </button>
          <button
            className="nav-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <span>
            Page {currentPage} of {totalPages || 1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecentSalaryMappingPage;