import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaCalculator, FaCheck } from 'react-icons/fa';
import EarningsForm from '../components/EarningsForm';
import { useEarningsSlice } from '../slices/EarningsSlice';
import '../styles/EarningsPage.css';
import axios from 'axios';

const getAuthToken = () => localStorage.getItem('token');

const getStatusText = (status) => {
  switch (status) {
    case 'Draft': return { text: 'Draft', class: 'draft' };
    case 'Pending': return { text: 'Pending', class: 'pending' };
    case 'Approved': return { text: 'Approved', class: 'approved' };
    case 'Paid': return { text: 'Paid', class: 'paid' };
    case 'Cancelled': return { text: 'Cancelled', class: 'cancelled' };
    default: return { text: 'N/A', class: 'unknown' };
  }
};

const EarningsPage = () => {
  const { earnings, handleDelete, successMessage, errorMessage, setErrorMessage, fetchEarnings, isFetching } = useEarningsSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [earningTypeFilter, setEarningTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [sortByAmount, setSortByAmount] = useState(null);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [editEarning, setEditEarning] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [payrollResult, setPayrollResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const earningsPerPage = 5;

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const filterEarnings = useCallback(
    (term, empFilter, typeFilter, statFilter, startDate, endDate) => {
      return earnings?.filter((earning) => {
        const matchesSearch =
          (earning.EmployeeName?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (earning.PeriodName?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (earning.EarningTypeName?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (earning.Status?.toLowerCase() || '').includes(statFilter.toLowerCase()) ||
          (earning.Amount?.toString() || '').includes(term.toLowerCase()) ||
          (earning.Remarks?.toLowerCase() || '').includes(term.toLowerCase()) ||
          (earning.CalculationRule?.toLowerCase() || '').includes(term.toLowerCase());
        const matchesEmployee = !empFilter || (earning.EmployeeName?.toLowerCase() || '').includes(empFilter.toLowerCase());
        const matchesEarningType = !typeFilter || (earning.EarningTypeName?.toLowerCase() || '').includes(typeFilter.toLowerCase());
        const matchesStatus = !statFilter || (earning.Status?.toLowerCase() || '').includes(statFilter.toLowerCase());
        const matchesStartDate = !startDate || (earning.StartDate && new Date(earning.StartDate) >= new Date(startDate));
        const matchesEndDate = !endDate || (earning.EndDate && new Date(earning.EndDate) <= new Date(endDate));
        return matchesSearch && matchesEmployee && matchesEarningType && matchesStatus && matchesStartDate && matchesEndDate;
      }) || [];
    },
    [earnings]
  );

  const [filteredEarnings, setFilteredEarnings] = useState([]);
  useEffect(() => {
    const debouncedFilter = setTimeout(() => {
      let filtered = filterEarnings(searchTerm, employeeFilter, earningTypeFilter, statusFilter, startDateFilter, endDateFilter);
      if (sortByAmount) {
        filtered.sort((a, b) => {
          const aAmount = a.IsFixedAmount ? (a.Amount || 0) : 0;
          const bAmount = b.IsFixedAmount ? (b.Amount || 0) : 0;
          return sortByAmount === 'asc' ? aAmount - bAmount : bAmount - aAmount;
        });
      }
      setFilteredEarnings(filtered);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debouncedFilter);
  }, [searchTerm, employeeFilter, earningTypeFilter, statusFilter, startDateFilter, endDateFilter, sortByAmount, filterEarnings]);

  const indexOfLastEarning = currentPage * earningsPerPage;
  const indexOfFirstEarning = indexOfLastEarning - earningsPerPage;
  const currentEarnings = filteredEarnings.slice(indexOfFirstEarning, indexOfLastEarning);
  const totalPages = Math.ceil(filteredEarnings.length / earningsPerPage);

  const handleAddOrEditEarning = (earning) => {
    setEditEarning(earning);
    setShowEarningsModal(true);
  };

  const handleDeleteClick = async (earningId) => {
    if (window.confirm('Are you sure you want to delete this earning?')) {
      try {
        await handleDelete(earningId);
      } catch (error) {
        console.error('Delete error:', error);
        setErrorMessage('Failed to delete earning. Please try again.');
      }
    }
  };

  const handleApproveEarning = async (earningId) => {
    try {
      const token = getAuthToken();
      await axios.put(`https://localhost:14686/api/Earning/${earningId}/approve`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchEarnings();
    } catch (error) {
      console.error('Approval error:', error);
      setErrorMessage('Failed to approve earning. Please try again.');
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

  const handleCloseEarningsModal = async () => {
    await fetchEarnings();
    setShowEarningsModal(false);
    setEditEarning(null);
    setCurrentPage(1);
    setPayrollResult(null);
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleSortByAmount = () => {
    setSortByAmount((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const toggleDetails = (earningId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [earningId]: !prev[earningId],
    }));
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  };

  return (
    <div className="earnings-page-container" role="main" aria-label="Earnings Management Page">
      <div className="header-section">
        <h2>All Earnings</h2>
        <div>
          <button className="add-btn" onClick={() => handleAddOrEditEarning(null)} aria-label="Add New Earning">
            + Add New Earning
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && <div className="loading-message" role="status">Loading earnings...</div>}
      {isCalculating && <div className="loading-message" role="status">Calculating payroll...</div>}

      {showEarningsModal && (
        <EarningsForm
          earning={editEarning}
          onClose={handleCloseEarningsModal}
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
            aria-label="Search earnings"
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
            placeholder="Filter by Earning Type..."
            value={earningTypeFilter}
            onChange={(e) => setEarningTypeFilter(e.target.value)}
            className="filter-input"
            aria-label="Filter by earning type"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
            aria-label="Filter by status"
          >
            <option value="">Filter by Status...</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
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
          <table className="earnings-table" aria-label="Earnings List">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th>Employee Name</th>
                <th>Period</th>
                <th>Earning Type</th>
                <th onClick={handleSortByAmount} style={{ cursor: 'pointer' }}>
                  Amount (ETB) {sortByAmount === 'asc' ? '↑' : sortByAmount === 'desc' ? '↓' : ''}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEarnings.length > 0 ? (
                currentEarnings.map((earning) => {
                  const status = getStatusText(earning.Status);
                  return (
                    <React.Fragment key={earning.EarningID || `temp-${Math.random()}`}>
                      <tr>
                        <td>
                          <button
                            className="action-btn details-btn"
                            onClick={() => toggleDetails(earning.EarningID)}
                            title={expandedRows[earning.EarningID] ? 'Hide Details' : 'View Details'}
                            aria-label={`${expandedRows[earning.EarningID] ? 'Hide' : 'Show'} details for ${earning.EmployeeName || 'unknown'}`}
                          >
                            {expandedRows[earning.EarningID] ? '-' : '+'}
                          </button>
                        </td>
                        <td>{earning.EmployeeName || 'N/A'}</td>
                        <td>{earning.PeriodName || 'N/A'}</td>
                        <td>{earning.EarningTypeName || 'N/A'}</td>
                        <td>
                          {earning.IsFixedAmount
                            ? (earning.Amount?.toFixed(2) ?? '0.00')
                            : 'Calculated'}
                        </td>
                        <td>
                          <span className={`status-badge ${status.class}`}>{status.text}</span>
                        </td>
                        <td className="actions-cell">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleAddOrEditEarning(earning)}
                            title="Edit"
                            aria-label={`Edit ${earning.EmployeeName}`}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteClick(earning.EarningID)}
                            title="Delete"
                            aria-label={`Delete ${earning.EmployeeName}`}
                          >
                            <FaTrash />
                          </button>
                          {(earning.Status === 'Draft' || earning.Status === 'Pending') && (
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleApproveEarning(earning.EarningID)}
                              title="Approve"
                              aria-label={`Approve ${earning.EmployeeName}`}
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            className="action-btn calc-btn"
                            onClick={() => handleCalculatePayroll(earning.EmployeeID, earning.PeriodID)}
                            title="Calculate Payroll"
                            aria-label={`Calculate Payroll for ${earning.EmployeeName}`}
                          >
                            <FaCalculator />
                          </button>
                        </td>
                      </tr>
                      {expandedRows[earning.EarningID] && (
                        <tr className="details-row">
                          <td colSpan="7">
                            <div className="details-content">
                              <p><strong>Start Date:</strong> {formatDate(earning.StartDate)}</p>
                              <p><strong>End Date:</strong> {formatDate(earning.EndDate)}</p>
                              <p><strong>Created At:</strong> {formatDate(earning.CreatedAt)}</p>
                              <p><strong>Updated At:</strong> {formatDate(earning.UpdatedAt)}</p>
                              <p><strong>Remarks:</strong> {earning.Remarks || 'N/A'}</p>
                              <p><strong>Taxability:</strong> {earning.Taxability || 'N/A'}</p>
                              {earning.Taxability === 'PartialTaxable' && (
                                <p><strong>Taxable Rate:</strong> {earning.TaxableRate?.toFixed(2) || 'N/A'}</p>
                              )}
                              <p><strong>Is Basic:</strong> {earning.IsBasic ? 'Yes' : 'No'}</p>
                              {!earning.IsFixedAmount && (
                                <p><strong>Calculation Rule:</strong> {earning.CalculationRule || 'N/A'}</p>
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
                  <td colSpan="7">No earnings found</td>
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

export default EarningsPage;