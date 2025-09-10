import React, { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { usePayrollSlice } from '../slices/usePayrollSlice';
import '../styles/PayrollReportsPage.css';

const PayrollReportsPage = () => {
  const { payrolls, fetchPayrollReports, successMessage, errorMessage, isFetching } = usePayrollSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periods, setPeriods] = useState([]);
  const [isFetchingPeriods, setIsFetchingPeriods] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const payrollsPerPage = 5;

  useEffect(() => {
    const fetchPeriods = async () => {
      setIsFetchingPeriods(true);
      try {
        const response = await fetch('https://localhost:14686/api/Period', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        setPeriods(data);
      } catch (error) {
        console.error('Failed to fetch periods:', error);
      } finally {
        setIsFetchingPeriods(false);
      }
    };
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (periodId) {
      fetchPayrollReports(periodId);
    }
  }, [periodId, fetchPayrollReports]);

  const filteredPayrolls = payrolls?.filter((payroll) => {
    const matchesSearch =
      (payroll?.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || (payroll?.errorMessage ? 'Error' : 'Success').toLowerCase().includes(statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  }) || [];

  const indexOfLastPayroll = currentPage * payrollsPerPage;
  const indexOfFirstPayroll = indexOfLastPayroll - payrollsPerPage;
  const currentPayrolls = filteredPayrolls.slice(indexOfFirstPayroll, indexOfLastPayroll);
  const totalPages = Math.ceil(filteredPayrolls.length / payrollsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="payroll-page-container">
      <div className="header-section">
        <h2>Payroll Reports</h2>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading payroll reports...</div>}

      <div className="table-section">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="filter-input"
            disabled={isFetchingPeriods}
          >
            <option value="">Select Period</option>
            {periods.map((period) => (
              <option key={period.PeriodId} value={period.PeriodId}>
                {period.Name} ({new Date(period.StartDate).toLocaleDateString()} - {new Date(period.EndDate).toLocaleDateString()})
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">Filter by Status...</option>
            <option value="Success">Success</option>
            <option value="Error">Error</option>
          </select>
        </div>
        <div className="table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Gross Earnings</th>
                <th>Total Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPayrolls.length > 0 ? (
                currentPayrolls.map((payroll) => (
                  <tr key={payroll.employeeId}>
                    <td>{payroll.employeeName}</td>
                    <td>{payroll.grossEarnings.toFixed(2)}</td>
                    <td>{payroll.totalDeductions.toFixed(2)}</td>
                    <td>{payroll.netSalary.toFixed(2)}</td>
                    <td>{payroll.errorMessage || 'Success'}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => alert(JSON.stringify(payroll, null, 2))}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No payroll data available</td>
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

export default PayrollReportsPage;
