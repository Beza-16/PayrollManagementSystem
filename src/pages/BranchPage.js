import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import BranchForm from '../components/BranchForm';
import { useBranchSlice } from '../slices/BranchSlice';
import '../styles/BranchPage.css';

const BranchPage = () => {
  const { branches, handleDelete, successMessage, errorMessage, fetchBranches, isFetching } = useBranchSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteError, setDeleteError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const branchesPerPage = 5;

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const filterBranches = useCallback((term) => {
    return branches?.filter((branch) =>
      [
        branch?.BranchName,
        branch?.PhoneNumber,
        branch?.Email,
        branch?.CompanyName,
        branch?.city,
        branch?.country,
        branch?.street,
      ]
        .some(field => (field?.toLowerCase() || '').includes(term.toLowerCase()))
    ) || [];
  }, [branches]);

  const [filteredBranches, setFilteredBranches] = useState([]);
  useEffect(() => {
    const debouncedFilter = debounce((term) => {
      setFilteredBranches(filterBranches(term));
      setCurrentPage(1);
    }, 300);
    debouncedFilter(searchTerm);
  }, [searchTerm, filterBranches]);

  const indexOfLastBranch = currentPage * branchesPerPage;
  const indexOfFirstBranch = indexOfLastBranch - branchesPerPage;
  const currentBranches = filteredBranches.slice(indexOfFirstBranch, indexOfLastBranch);
  const totalPages = Math.ceil(filteredBranches.length / branchesPerPage);

  const handleAddOrEditBranch = (branch) => {
    setEditBranch(branch);
    setShowBranchModal(true);
  };

  const handleDeleteClick = async (branchId) => {
    if (!branchId) {
      setDeleteError('Cannot delete: branchId is undefined');
      return;
    }
    try {
      await handleDelete(branchId);
      setDeleteError(null);
    } catch (error) {
      setDeleteError('Failed to delete branch. Please try again.');
      console.error('Delete error:', error);
    }
  };

  const handleCloseBranchModal = async () => {
    await fetchBranches();
    setShowBranchModal(false);
    setEditBranch(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const toggleDetails = (branchId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [branchId]: !prev[branchId],
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="branch-page-container" role="main" aria-label="Branch Management Page">
      <div className="header-section">
        <h2>All Branches</h2>
        <button
          className="add-btn"
          onClick={() => handleAddOrEditBranch(null)}
          aria-label="Add New Branch"
        >
          + Add New Branch
        </button>
      </div>

      {(errorMessage || deleteError) && (
        <div className="error-message" role="alert">
          {errorMessage || deleteError}
        </div>
      )}
      {successMessage && (
        <div className="success-message" role="alert">
          {successMessage}
        </div>
      )}
      {isFetching && (
        <div className="loading-message" role="status">
          Loading branches...
        </div>
      )}

      {showBranchModal && (
        <BranchForm
          branch={editBranch}
          onClose={handleCloseBranchModal}
        />
      )}

      <div className="table-section">
        <div className="search-and-size">
          <input
            type="text"
            placeholder="Search by name, phone, email, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
            aria-label="Search branches"
          />
        </div>
        <div className="table-wrapper">
          <table className="branch-table" aria-label="Branches List">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Branch Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Street</th>
                <th>City</th>
                <th>Country</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentBranches.length > 0 ? (
                currentBranches.map((branch) => (
                  <React.Fragment key={branch.BranchID || `temp-${Math.random()}`}>
                    <tr>
                      <td>{branch.CompanyName || 'N/A'}</td>
                      <td>{branch.BranchName || 'N/A'}</td>
                      <td>{branch.PhoneNumber || 'N/A'}</td>
                      <td>{branch.Email || 'N/A'}</td>
                      <td>{branch.street || 'N/A'}</td>
                      <td>{branch.city || 'N/A'}</td>
                      <td>{branch.country || 'N/A'}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleAddOrEditBranch(branch)}
                          title="Edit"
                          aria-label={`Edit ${branch.BranchName}`}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteClick(branch.BranchID)}
                          title="Delete"
                          aria-label={`Delete ${branch.BranchName}`}
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="action-btn details-btn"
                          onClick={() => toggleDetails(branch.BranchID)}
                          title={expandedRows[branch.BranchID] ? 'Hide Details' : 'View Details'}
                          aria-label={expandedRows[branch.BranchID] ? 'Hide Details' : 'View Details'}
                        >
                          {expandedRows[branch.BranchID] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[branch.BranchID] && (
                      <tr className="details-row">
                        <td colSpan="8">
                          <div className="details-content">
                            <p><strong>Street:</strong> {branch.street || 'N/A'}</p>
                            <p><strong>State/Region:</strong> {branch.state_or_region || 'N/A'}</p>
                            <p><strong>Latitude:</strong> {branch.latitude?.toFixed(4) || 'N/A'}</p>
                            <p><strong>Longitude:</strong> {branch.longitude?.toFixed(4) || 'N/A'}</p>
                            <p><strong>Created At:</strong> {formatDate(branch.created_at)}</p>
                            <p><strong>Updated At:</strong> {formatDate(branch.updatedAt)}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No branches found</td>
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

export default BranchPage;