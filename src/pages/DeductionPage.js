import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaCalculator, FaCheck } from 'react-icons/fa';
import DeductionForm from '../components/DeductionForm';
import { useDeductionSlice } from '../slices/DeductionSlice';
import '../styles/DeductionPage.css';
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('token');

const getStatusText = (status) => {
  const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'Applied', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return { text: 'Unknown', class: 'unknown' };
  }
  switch (status) {
    case 'Draft': return { text: 'Draft', class: 'draft' };
    case 'Pending Approval': return { text: 'Pending Approval', class: 'pending' };
    case 'Approved': return { text: 'Approved', class: 'approved' };
    case 'Applied': return { text: 'Applied', class: 'applied' };
    case 'Cancelled': return { text: 'Cancelled', class: 'cancelled' };
    default: return { text: 'Unknown', class: 'unknown' };
  }
};

const DeductionPage = () => {
  const { deductions, handleDelete, successMessage, errorMessage, setErrorMessage, fetchDeductions, isFetching } = useDeductionSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [deductionTypeFilter, setDeductionTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [sortByAmount, setSortByAmount] = useState(null);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [editDeduction, setEditDeduction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [payrollResult, setPayrollResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const deductionsPerPage = 5;

  useEffect(() => {
    fetchDeductions();
  }, [fetchDeductions]);

  const filterDeductions = useCallback(
    (term, empFilter, typeFilter, statFilter, startDate, endDate) => {
      return deductions?.filter((deduction) => {
        const matchesSearch =
          (deduction.EmployeeName?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (deduction.PeriodName?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (deduction.DeductionTypeName?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (deduction.Status?.toLowerCase() || '').includes(statFilter.toLowerCase()) ||
          (deduction.Amount?.toString() || '').includes(term.toLowerCase()) ||
          (deduction.Remarks?.toLowerCase() || '').includes(term.toLowerCase());
        const matchesEmployee = !empFilter || (deduction.EmployeeName?.toLowerCase() || '').includes(empFilter.toLowerCase());
        const matchesDeductionType = !typeFilter || (deduction.DeductionTypeName?.toLowerCase() || '').includes(typeFilter.toLowerCase());
        const matchesStatus = !statFilter || (deduction.Status?.toLowerCase() || '').includes(statFilter.toLowerCase());
        const matchesStartDate = !startDate || (deduction.StartDate && new Date(deduction.StartDate) >= new Date(startDate));
        const matchesEndDate = !endDate || (deduction.EndDate && new Date(deduction.EndDate) <= new Date(endDate));
        return matchesSearch && matchesEmployee && matchesDeductionType && matchesStatus && matchesStartDate && matchesEndDate;
      }) || [];
    },
    [deductions]
  );

  const [filteredDeductions, setFilteredDeductions] = useState([]);
  useEffect(() => {
    const debouncedFilter = setTimeout(() => {
      let filtered = filterDeductions(searchTerm, employeeFilter, deductionTypeFilter, statusFilter, startDateFilter, endDateFilter);
      if (sortByAmount) {
        filtered.sort((a, b) => {
          const aAmount = a.Amount || 0;
          const bAmount = b.Amount || 0;
          return sortByAmount === 'asc' ? aAmount - bAmount : bAmount - aAmount;
        });
      }
      setFilteredDeductions(filtered);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debouncedFilter);
  }, [searchTerm, employeeFilter, deductionTypeFilter, statusFilter, startDateFilter, endDateFilter, sortByAmount, filterDeductions]);

  const indexOfLastDeduction = currentPage * deductionsPerPage;
  const indexOfFirstDeduction = indexOfLastDeduction - deductionsPerPage;
  const currentDeductions = filteredDeductions.slice(indexOfFirstDeduction, indexOfLastDeduction);
  const totalPages = Math.ceil(filteredDeductions.length / deductionsPerPage);

  const handleAddOrEditDeduction = (deduction) => {
    setEditDeduction(deduction);
    setShowDeductionModal(true);
  };

  const handleDeleteClick = async (deductionId) => {
    if (window.confirm('Are you sure you want to delete this deduction?')) {
      try {
        await handleDelete(deductionId);
      } catch (error) {
        console.error('Delete error:', error);
        setErrorMessage('Failed to delete deduction. Please try again.');
      }
    }
  };

  const handleApproveDeduction = async (deductionId) => {
    try {
      const token = getAuthToken();
      await axios.put(`https://localhost:14686/api/Deduction/${deductionId}/approve`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchDeductions();
    } catch (error) {
      console.error('Approval error:', error);
      setErrorMessage('Failed to approve deduction. Please try again.');
    }
  };

  const handleCalculatePayroll = async (employeeId, periodId) => {
    try {
      setIsCalculating(true);
      const token = getAuthToken();
      const response = await axios.post(
        'https://localhost:14686/api/Payroll/net-salary',
        { EmployeeID: employeeId, PeriodID: periodId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPayrollResult(response.data);
    } catch (error) {
      console.error('Payroll calculation error:', error);
      setErrorMessage('Failed to calculate payroll. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCloseDeductionModal = async () => {
    await fetchDeductions();
    setShowDeductionModal(false);
    setEditDeduction(null);
    setCurrentPage(1);
    setPayrollResult(null);
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleSortByAmount = () => {
    setSortByAmount((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleDetails = (deductionId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [deductionId]: !prev[deductionId],
    }));
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  };

  return (
    <div className="deduction-page-container" role="main" aria-label="Deduction Management Page">
      <div className="header-section">
        <h2>All Deductions</h2>
        <div>
          <button className="add-btn" onClick={() => handleAddOrEditDeduction(null)} aria-label="Add New Deduction">
            + Add New Deduction
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && <div className="loading-message" role="status">Loading deductions...</div>}
      {isCalculating && <div className="loading-message" role="status">Calculating payroll...</div>}

      {showDeductionModal && (
        <DeductionForm
          deduction={editDeduction}
          onClose={handleCloseDeductionModal}
        />
      )}

      <div className="table-section">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by employee, period, type, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
            aria-label="Search deductions"
          />
          <input
            type="text"
            placeholder="Filter by Employee..."
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="filter-input"
            aria-label="Filter by employee name"
          />
          <input
            type="text"
            placeholder="Filter by Deduction Type..."
            value={deductionTypeFilter}
            onChange={(e) => setDeductionTypeFilter(e.target.value)}
            className="filter-input"
            aria-label="Filter by deduction type"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
            aria-label="Filter by status"
          >
            <option value="">Filter by Status...</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Applied">Applied</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            placeholder="Filter by Start Date..."
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="filter-input"
            aria-label="Filter by start date"
          />
          <input
            type="date"
            placeholder="Filter by End Date..."
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="filter-input"
            aria-label="Filter by end date"
          />
        </div>
        <div className="table-wrapper">
          <table className="deduction-table" aria-label="Deductions List">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th>Employee Name</th>
                <th>Period</th>
                <th>Deduction Type</th>
                <th onClick={handleSortByAmount} style={{ cursor: 'pointer' }}>
                  Amount (ETB) {sortByAmount === 'asc' ? '↑' : sortByAmount === 'desc' ? '↓' : ''}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDeductions.length > 0 ? (
                currentDeductions.map((deduction) => {
                  const status = getStatusText(deduction.Status);
                  return (
                    <React.Fragment key={deduction.DeductionID || `temp-${Math.random()}`}>
                      <tr>
                        <td>
                          <button
                            className="action-btn details-btn"
                            onClick={() => toggleDetails(deduction.DeductionID)}
                            title={expandedRows[deduction.DeductionID] ? 'Hide Details' : 'View Details'}
                            aria-label={`${expandedRows[deduction.DeductionID] ? 'Hide' : 'Show'} details for ${deduction.EmployeeName || 'unknown'}`}
                          >
                            {expandedRows[deduction.DeductionID] ? '-' : '+'}
                          </button>
                        </td>
                        <td>{deduction.EmployeeName || 'N/A'}</td>
                        <td>{deduction.PeriodName || 'N/A'}</td>
                        <td>{deduction.DeductionTypeName || 'N/A'}</td>
                        <td>
                          {deduction.IsFixedAmount
                            ? (deduction.Amount?.toFixed(2) ?? '0.00')
                            : 'Calculated'}
                        </td>
                        <td>
                          <span className={`status-badge ${status.class}`}>{status.text}</span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleAddOrEditDeduction(deduction)}
                            title="Edit"
                            aria-label={`Edit ${deduction.EmployeeName}`}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteClick(deduction.DeductionID)}
                            title="Delete"
                            aria-label={`Delete ${deduction.EmployeeName}`}
                          >
                            <FaTrash />
                          </button>
                          {(deduction.Status === 'Draft' || deduction.Status === 'Pending Approval') && (
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApproveDeduction(deduction.DeductionID)}
                              title="Approve"
                              aria-label={`Approve ${deduction.EmployeeName}`}
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            className="action-btn calc-btn"
                            onClick={() => handleCalculatePayroll(deduction.EmployeeID, deduction.PeriodID)}
                            title="Calculate Payroll"
                            aria-label={`Calculate Payroll for ${deduction.EmployeeName}`}
                          >
                            <FaCalculator />
                          </button>
                        </td>
                      </tr>
                      {expandedRows[deduction.DeductionID] && (
                        <tr className="details-row">
                          <td colSpan="7">
                            <div className="details-content">
                              <p><strong>Start Date:</strong> {formatDate(deduction.StartDate)}</p>
                              <p><strong>End Date:</strong> {formatDate(deduction.EndDate)}</p>
                              <p><strong>Created At:</strong> {formatDate(deduction.CreatedAt)}</p>
                              <p><strong>Updated At:</strong> {formatDate(deduction.UpdatedAt)}</p>
                              <p><strong>Remarks:</strong> {deduction.Remarks || 'N/A'}</p>
                              {!deduction.IsFixedAmount && (
                                <p><strong>Calculation Rule:</strong> {deduction.CalculationRule || 'N/A'}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7">No deductions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {payrollResult && (
          <div className="payroll-summary">
            <h3>Payroll Summary (ETB)</h3>
            <p>Gross Earnings: {payrollResult.GrossEarnings?.toFixed(2) ?? 'N/A'}</p>
            <p>Taxable Income: {payrollResult.TaxableIncome?.toFixed(2) ?? 'N/A'}</p>
            <p>Income Tax: {payrollResult.IncomeTax?.toFixed(2) ?? 'N/A'}</p>
            <p>Employee Pension: {payrollResult.EmployeePension?.toFixed(2) ?? 'N/A'}</p>
            <p>Employer Pension: {payrollResult.EmployerPension?.toFixed(2) ?? 'N/A'}</p>
            <p>Total Deductions: {payrollResult.TotalDeductions?.toFixed(2) ?? 'N/A'}</p>
            <p>Net Salary: {payrollResult.NetSalary?.toFixed(2) ?? 'N/A'}</p>
            <button onClick={() => setPayrollResult(null)} aria-label="Close payroll summary">
              Close
            </button>
          </div>
        )}
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

export default DeductionPage;