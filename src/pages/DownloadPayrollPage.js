import React, { useState, useEffect } from 'react';
import { usePayrollSlice } from '../slices/usePayrollSlice';
import '../styles/DownloadPayrollPage.css';

const DownloadPayrollPage = () => {
  const { payrolls, fetchPayrollReports, downloadPayroll, successMessage, errorMessage, isDownloading, isFetching } = usePayrollSlice();
  const [periodId, setPeriodId] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
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

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleDownload = async () => {
    if (!periodId) return;
    await downloadPayroll(periodId, selectedEmployees);
  };

  const filteredPayrolls = payrolls || [];
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
        <h2>Download Payroll</h2>
        <div>
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
          <button
            className="add-btn"
            onClick={handleDownload}
            disabled={!periodId || isDownloading || selectedEmployees.length === 0}
          >
            Download Selected
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isDownloading && <div className="loading-message">Downloading payroll...</div>}

      <div className="table-section">
        <div className="table-wrapper">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Employee Name</th>
                <th>Gross Earnings</th>
                <th>Total Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentPayrolls.length > 0 ? (
                currentPayrolls.map((payroll) => (
                  <tr key={payroll.employeeId}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(payroll.employeeId)}
                        onChange={() => handleEmployeeSelect(payroll.employeeId)}
                        disabled={payroll.errorMessage}
                      />
                    </td>
                    <td>{payroll.employeeName}</td>
                    <td>{payroll.grossEarnings.toFixed(2)}</td>
                    <td>{payroll.totalDeductions.toFixed(2)}</td>
                    <td>{payroll.netSalary.toFixed(2)}</td>
                    <td>{payroll.errorMessage || 'Success'}</td>
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

export default DownloadPayrollPage;
