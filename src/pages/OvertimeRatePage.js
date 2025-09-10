import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import OvertimeRateForm from '../components/OvertimeRateForm';
import { useOvertimeRateSlice } from '../slices/useOvertimeRateSlice';
import '../styles/OvertimeRatePage.css';

const OvertimeRatePage = () => {
  const { overtimeRates, handleDelete, successMessage, errorMessage, fetchOvertimeRates, isFetching } = useOvertimeRateSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [dayTypeFilter, setDayTypeFilter] = useState('');
  const [showOvertimeRateModal, setShowOvertimeRateModal] = useState(false);
  const [editOvertimeRate, setEditOvertimeRate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ratesPerPage = 5;

  useEffect(() => {
    fetchOvertimeRates();
  }, [fetchOvertimeRates]);

  const filterOvertimeRates = useCallback((term, dayTypeFilterValue) => {
    return overtimeRates?.filter((overtimeRate) =>
      [
        overtimeRate?.dayType,
        overtimeRate?.createdByName
      ].some(field => (field?.toLowerCase() || '').includes(term.toLowerCase())) &&
      (!dayTypeFilterValue || (overtimeRate?.dayType?.toLowerCase() || '').includes(dayTypeFilterValue.toLowerCase()))
    ) || [];
  }, [overtimeRates]);

  const [filteredOvertimeRates, setFilteredOvertimeRates] = useState([]);
  useEffect(() => {
    const debouncedFilter = setTimeout(() => {
      setFilteredOvertimeRates(filterOvertimeRates(searchTerm, dayTypeFilter));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debouncedFilter);
  }, [searchTerm, dayTypeFilter, filterOvertimeRates]);

  const indexOfLastRate = currentPage * ratesPerPage;
  const indexOfFirstRate = indexOfLastRate - ratesPerPage;
  const currentOvertimeRates = filteredOvertimeRates.slice(indexOfFirstRate, indexOfLastRate);
  const totalPages = Math.ceil(filteredOvertimeRates.length / ratesPerPage);

  const handleAddOrEditOvertimeRate = (overtimeRate) => {
    setEditOvertimeRate(overtimeRate);
    setShowOvertimeRateModal(true);
  };

  const handleDeleteClick = async (overtimeRateId) => {
    try {
      await handleDelete(overtimeRateId);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleCloseOvertimeRateModal = async () => {
    await fetchOvertimeRates();
    setShowOvertimeRateModal(false);
    setEditOvertimeRate(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className="overtime-rate-page-container" role="main" aria-label="Overtime Rate Management Page">
      <div className="header-section">
        <h2>All Overtime Rates</h2>
        <button
          className="add-btn"
          onClick={() => handleAddOrEditOvertimeRate(null)}
          aria-label="Add New Overtime Rate"
        >
          + Add New Overtime Rate
        </button>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && <div className="loading-message" role="status">Loading overtime rates...</div>}

      {showOvertimeRateModal && (
        <OvertimeRateForm
          overtimeRate={editOvertimeRate}
          onClose={handleCloseOvertimeRateModal}
        />
      )}

      <div className="table-section">
        <div className="filter-section">
          <input
            type="text"
            placeholder="Search by day type or created by..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
            aria-label="Search overtime rates"
          />
          <input
            type="text"
            placeholder="Filter by Day Type..."
            value={dayTypeFilter}
            onChange={(e) => setDayTypeFilter(e.target.value)}
            className="filter-input"
          />
        </div>
        <div className="table-wrapper">
          <table className="overtime-rate-table" aria-label="Overtime Rates List">
            <thead>
              <tr>
                <th>Day Type</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Multiplier</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOvertimeRates.length > 0 ? (
                currentOvertimeRates.map((overtimeRate) => (
                  <tr key={overtimeRate.overtimeRateID}>
                    <td>{overtimeRate.dayType || 'N/A'}</td>
                    <td>{overtimeRate.startTime || 'N/A'}</td>
                    <td>{overtimeRate.endTime || 'N/A'}</td>
                    <td>{overtimeRate.multiplier.toFixed(2)}</td>
                    <td>{overtimeRate.createdByName || 'N/A'}</td>
                    <td>{overtimeRate.createdAt ? new Date(overtimeRate.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>{overtimeRate.updatedAt ? new Date(overtimeRate.updatedAt).toLocaleDateString() : 'N/A'}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleAddOrEditOvertimeRate(overtimeRate)}
                        title="Edit"
                        aria-label={`Edit ${overtimeRate.dayType}`}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteClick(overtimeRate.overtimeRateID)}
                        title="Delete"
                        aria-label={`Delete ${overtimeRate.dayType}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No overtime rates found</td>
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

export default OvertimeRatePage;