import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import EarningTypeForm from '../components/EarningTypeForm';
import { useEarningTypeSlice } from '../slices/useEarningTypeSlice';
import '../styles/EarningTypePage.css';

const EarningTypePage = () => {
  const { earningTypes, handleDelete, successMessage, errorMessage, fetchEarningTypes, isFetching } = useEarningTypeSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showEarningTypeModal, setShowEarningTypeModal] = useState(false);
  const [editEarningType, setEditEarningType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const earningTypesPerPage = 5;

  useEffect(() => {
    fetchEarningTypes();
  }, [fetchEarningTypes]);

  const filterEarningTypes = useCallback(
    (term) => {
      return earningTypes?.filter((et) =>
        et.IsActive && // Filter only active earning types
        [
          et.EarningTypeName,
          et.Description,
          et.IsTaxable ? 'Taxable' : 'NonTaxable',
          et.IsFixedAmount ? 'Fixed' : 'NonFixed',
          et.CalculationRule,
        ].some((field) => (field?.toLowerCase() || '').includes(term.toLowerCase()))
      ) || [];
    },
    [earningTypes]
  );

  const [filteredEarningTypes, setFilteredEarningTypes] = useState([]);
  useEffect(() => {
    const debouncedFilter = setTimeout(() => {
      setFilteredEarningTypes(filterEarningTypes(searchTerm));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debouncedFilter);
  }, [searchTerm, filterEarningTypes]);

  const indexOfLastEarningType = currentPage * earningTypesPerPage;
  const indexOfFirstEarningType = indexOfLastEarningType - earningTypesPerPage;
  const currentEarningTypes = filteredEarningTypes.slice(indexOfFirstEarningType, indexOfLastEarningType);
  const totalPages = Math.ceil(filteredEarningTypes.length / earningTypesPerPage);

  const handleAddOrEditEarningType = (earningType) => {
    setEditEarningType(earningType);
    setShowEarningTypeModal(true);
  };

  const handleDeleteClick = async (earningTypeId) => {
    try {
      await handleDelete(earningTypeId);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleCloseEarningTypeModal = async () => {
    await fetchEarningTypes();
    setShowEarningTypeModal(false);
    setEditEarningType(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="earning-type-page-container" role="main" aria-label="Earning Type Management Page">
      <div className="header-section">
        <h2>All Earning Types</h2>
        <button
          className="add-btn"
          onClick={() => handleAddOrEditEarningType(null)}
          aria-label="Add New Earning Type"
        >
          + Add New Earning Type
        </button>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && <div className="loading-message" role="status">Loading earning types...</div>}

      {showEarningTypeModal && (
        <EarningTypeForm
          earningType={editEarningType}
          onClose={handleCloseEarningTypeModal}
        />
      )}

      <div className="table-section">
        <div className="search-and-size">
          <input
            type="text"
            placeholder="Search by name, description, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
            aria-label="Search earning types"
          />
        </div>
        <div className="table-wrapper">
          <table className="earning-type-table" aria-label="Earning Types List">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Taxable</th>
                <th>Fixed Amount</th>
                <th>Calculation Rule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEarningTypes.length > 0 ? (
                currentEarningTypes.map((et) => (
                  <tr key={et.EarningTypeID}>
                    <td>{et.EarningTypeName || 'N/A'}</td>
                    <td>{et.Description || 'N/A'}</td>
                    <td>{et.IsTaxable ? 'Yes' : 'No'}</td>
                    <td>{et.IsFixedAmount ? 'Yes' : 'No'}</td>
                    <td>{et.CalculationRule || 'N/A'}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleAddOrEditEarningType(et)}
                        title="Edit"
                        aria-label={`Edit ${et.EarningTypeName}`}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteClick(et.EarningTypeID)}
                        title="Delete"
                        aria-label={`Delete ${et.EarningTypeName}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No earning types found</td>
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

export default EarningTypePage;