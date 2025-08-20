import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import DesignationForm from '../components/DesignationForm';
import { useDesignationSlice } from '../slices/DesignationSlice';
import '../styles/DesignationPage.css';

const DesignationPage = () => {
  const { designations, handleDelete, successMessage, errorMessage, isFetching, fetchDesignations } = useDesignationSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDesignation, setEditDesignation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  useEffect(() => {
    if (successMessage) {
      fetchDesignations();
    }
  }, [successMessage, fetchDesignations]);

  const filteredDesignations = designations.filter((des) =>
    (des.DesignationName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDesignations = filteredDesignations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDesignations.length / itemsPerPage);

  const handleAddOrEdit = (designation) => {
    setEditDesignation(designation);
    setShowModal(true);
  };

  const handleDeleteClick = (designationID) => {
    if (!designationID) {
      console.error('Cannot delete: designationID is undefined');
      return;
    }
    if (window.confirm('Are you sure you want to delete this designation?')) {
      handleDelete(designationID);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditDesignation(null);
    setCurrentPage(1);
    fetchDesignations();
  };

  return (
    <div className="designation-page-container">
      <div className="header-section">
        <h2 className="text-xl font-semibold">All Designations</h2>
        <button className="add-btn" onClick={() => handleAddOrEdit(null)}>
          + Add New Designation
        </button>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading designations...</div>}

      {showModal && <DesignationForm designation={editDesignation} onClose={handleCloseModal} />}

      <div className="table-section">
        <input
          type="text"
          placeholder="Search by designation name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <div className="table-wrapper">
          <table className="designation-table">
            <thead>
              <tr>
                <th>Designation Name</th>
                <th>Department Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDesignations.length > 0 ? (
                currentDesignations.map((des) => (
                  <tr key={des.DesignationID || `temp-${Math.random()}`}>
                    <td>{des.DesignationName || 'N/A'}</td>
                    <td>{des.DepartmentName || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${des.Status === 1 || des.Status === 'Active' ? 'active' : 'inactive'}`}>
                        {des.Status === 1 || des.Status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(des.CreatedAt).toLocaleDateString() || 'N/A'}</td>
                    <td>{new Date(des.UpdatedAt).toLocaleDateString() || 'N/A'}</td>
                    <td className="actions-cell">
                      <button className="action-btn edit-btn" onClick={() => handleAddOrEdit(des)} title="Edit">
                        <FaEdit />
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDeleteClick(des.DesignationID)} title="Delete">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No designations found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button
            className="nav-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <button
            className="nav-btn"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default DesignationPage;