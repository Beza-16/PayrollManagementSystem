import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import WorkArrangementForm from '../components/WorkArrangementForm';
import { useWorkArrangementSlice } from '../slices/WorkArrangementSlice';
import '../styles/WorkArrangementPage.css';

const WorkArrangementPage = () => {
  const { workArrangements, handleDelete, successMessage, errorMessage, fetchWorkArrangements, isFetching } = useWorkArrangementSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showWorkArrangementModal, setShowWorkArrangementModal] = useState(false);
  const [editWorkArrangement, setEditWorkArrangement] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const workArrangementsPerPage = 5;

  useEffect(() => {
    fetchWorkArrangements();
  }, [fetchWorkArrangements]);

  useEffect(() => {
    console.log('Current work arrangements state:', workArrangements);
    workArrangements?.forEach((arrangement, index) => {
      console.log(`Work Arrangement ${index}:`, JSON.stringify(arrangement, null, 2));
    });
  }, [workArrangements]);

  const getArrangementType = (arrangement) => {
    const types = [];
    if (arrangement.IsPension) types.push('Pension');
    if (arrangement.IsBasic) types.push('Basic');
    if (arrangement.IsRetired) types.push('Retired');
    return types.length > 0 ? types.join(' + ') : 'N/A';
  };

  const filteredWorkArrangements = workArrangements?.filter((arrangement) => {
    const arrangementType = getArrangementType(arrangement);
    const matchesSearch =
      (arrangement?.EmployeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      arrangementType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (arrangement?.CostSharing ? 'yes' : 'no').includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const indexOfLastArrangement = currentPage * workArrangementsPerPage;
  const indexOfFirstArrangement = indexOfLastArrangement - workArrangementsPerPage;
  const currentWorkArrangements = filteredWorkArrangements.slice(indexOfFirstArrangement, indexOfLastArrangement);
  const totalPages = Math.ceil(filteredWorkArrangements.length / workArrangementsPerPage);

  const handleAddOrEditWorkArrangement = (arrangement) => {
    setEditWorkArrangement(arrangement);
    setShowWorkArrangementModal(true);
  };

  const handleDeleteClick = (workArrangementId) => {
    if (!workArrangementId) {
      console.error('Cannot delete: workArrangementId is undefined');
      return;
    }
    handleDelete(workArrangementId);
  };

  const handleCloseWorkArrangementModal = async () => {
    await fetchWorkArrangements();
    setShowWorkArrangementModal(false);
    setEditWorkArrangement(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="work-arrangement-page-container">
      <div className="header-section">
        <h2>All Work Arrangements</h2>
        <div>
          <button className="add-btn" onClick={() => handleAddOrEditWorkArrangement(null)}>
            + Add New Work Arrangement
          </button>
        </div>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading work arrangements...</div>}

      {showWorkArrangementModal && (
        <WorkArrangementForm
          workArrangement={editWorkArrangement}
          onClose={handleCloseWorkArrangementModal}
        />
      )}

      <div className="table-section">
        <input
          type="text"
          placeholder="Search by employee name or arrangement details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <div className="table-wrapper">
          <table className="work-arrangement-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Arrangement Type</th>
                <th>Is Pension</th>
                <th>Is Retired</th>
                <th>Is Basic</th>
                <th>Cost Sharing</th>
                <th>Termination Date</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkArrangements.length > 0 ? (
                currentWorkArrangements.map((arrangement) => (
                  <tr key={arrangement.WorkArrangementID || `temp-${Math.random()}`}>
                    <td>{arrangement.EmployeeName || 'N/A'}</td>
                    <td>{getArrangementType(arrangement)}</td>
                    <td>{arrangement.IsPension ? 'Yes' : 'No'}</td>
                    <td>{arrangement.IsRetired ? 'Yes' : 'No'}</td>
                    <td>{arrangement.IsBasic ? 'Yes' : 'No'}</td>
                    <td>{arrangement.CostSharing ? 'Yes' : 'No'}</td>
                    <td>
                      {arrangement.TerminationDate
                        ? new Date(arrangement.TerminationDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      {arrangement.CreatedAt ? new Date(arrangement.CreatedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleAddOrEditWorkArrangement(arrangement)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteClick(arrangement.WorkArrangementID)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No work arrangements found</td>
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

export default WorkArrangementPage;