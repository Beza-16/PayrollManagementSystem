import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import DeductionTypeForm from '../components/DeductionTypeForm';
import { useDeductionTypeSlice } from '../slices/DeductionTypeSlice';
import '../styles/DeductionTypePage.css';

const DeductionTypePage = () => {
  const { deductionTypes, handleDelete, successMessage, errorMessage, fetchDeductionTypes, isFetching } = useDeductionTypeSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeductionTypeModal, setShowDeductionTypeModal] = useState(false);
  const [editDeductionType, setEditDeductionType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const deductionTypesPerPage = 5;

  useEffect(() => {
    fetchDeductionTypes();
  }, [fetchDeductionTypes]);

  const filterDeductionTypes = useCallback(
    (term) => {
      return deductionTypes?.filter((dt) =>
        [
          dt.DeductionTypeName,
          dt.Description,
          dt.IsTaxable ? 'Taxable' : 'NonTaxable',
          dt.IsFixedAmount ? 'Fixed' : 'NonFixed',
          dt.CalculationRule,
        ].some((field) => (field?.toLowerCase() || '').includes(term.toLowerCase()))
      ) || [];
    },
    [deductionTypes]
  );

  const [filteredDeductionTypes, setFilteredDeductionTypes] = useState([]);
  useEffect(() => {
    const debouncedFilter = setTimeout(() => {
      setFilteredDeductionTypes(filterDeductionTypes(searchTerm));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(debouncedFilter);
  }, [searchTerm, filterDeductionTypes]);

  const indexOfLastDeductionType = currentPage * deductionTypesPerPage;
  const indexOfFirstDeductionType = indexOfLastDeductionType - deductionTypesPerPage;
  const currentDeductionTypes = filteredDeductionTypes.slice(indexOfFirstDeductionType, indexOfLastDeductionType);
  const totalPages = Math.ceil(filteredDeductionTypes.length / deductionTypesPerPage);

  const handleAddOrEditDeductionType = (deductionType) => {
    setEditDeductionType(deductionType);
    setShowDeductionTypeModal(true);
  };

  const handleDeleteClick = async (deductionTypeId) => {
    try {
      await handleDelete(deductionTypeId);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleCloseDeductionTypeModal = async () => {
    await fetchDeductionTypes();
    setShowDeductionTypeModal(false);
    setEditDeductionType(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="deduction-type-page-container" role="main" aria-label="Deduction Type Management Page">
      <div className="header-section">
        <h2>All Deduction Types</h2>
        <button
          className="add-btn"
          onClick={() => handleAddOrEditDeductionType(null)}
          aria-label="Add New Deduction Type"
        >
          + Add New Deduction Type
        </button>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {isFetching && <div className="loading-message" role="status">Loading deduction types...</div>}

      {showDeductionTypeModal && (
        <DeductionTypeForm
          deductionType={editDeductionType}
          onClose={handleCloseDeductionTypeModal}
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
            aria-label="Search deduction types"
          />
        </div>
        <div className="table-wrapper">
          <table className="deduction-type-table" aria-label="Deduction Types List">
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
              {currentDeductionTypes.length > 0 ? (
                currentDeductionTypes.map((dt) => (
                  <tr key={dt.DeductionTypeID}>
                    <td>{dt.DeductionTypeName || 'N/A'}</td>
                    <td>{dt.Description || 'N/A'}</td>
                    <td>{dt.IsTaxable ? 'Yes' : 'No'}</td>
                    <td>{dt.IsFixedAmount ? 'Yes' : 'No'}</td>
                    <td>{dt.CalculationRule || 'N/A'}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleAddOrEditDeductionType(dt)}
                        title="Edit"
                        aria-label={`Edit ${dt.DeductionTypeName}`}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteClick(dt.DeductionTypeID)}
                        title="Delete"
                        aria-label={`Delete ${dt.DeductionTypeName}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No deduction types found</td>
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

export default DeductionTypePage;