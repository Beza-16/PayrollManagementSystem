import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import DepartmentForm from '../components/DepartmentForm';
import { useDepartmentSlice } from '../slices/DepartmentSlice';
import '../styles/DepartmentPage.css';

const DepartmentPage = () => {
  const { departments, handleDelete, successMessage, errorMessage, isFetching, fetchDepartments } = useDepartmentSlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDepartment, setEditDepartment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDepartments(); // Initial fetch
  }, [fetchDepartments]);

  // Re-fetch departments when successMessage changes (e.g., after submission)
  useEffect(() => {
    if (successMessage) {
      fetchDepartments(); // Refresh the list on successful action
    }
  }, [successMessage, fetchDepartments]);

  const filteredDepartments = departments.filter((dept) =>
    (dept.DepartmentName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDepartments = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  const handleAddOrEdit = (department) => {
    setEditDepartment(department);
    setShowModal(true);
  };

  const handleDeleteClick = (departmentID) => {
    if (!departmentID) {
      console.error('Cannot delete: departmentID is undefined');
      return;
    }
    if (window.confirm('Are you sure you want to delete this department?')) {
      handleDelete(departmentID);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditDepartment(null);
    setCurrentPage(1); // Reset to first page on close
    fetchDepartments(); // Ensure fresh data on modal close
  };

  return (
    <div className="branch-page-container">
      <div className="header-section">
        <h2>All Departments</h2>
        <button className="add-btn" onClick={() => handleAddOrEdit(null)}>
          + Add New Department
        </button>
      </div>

      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      {isFetching && <div className="loading-message">Loading departments...</div>}

      {showModal && (
        <DepartmentForm department={editDepartment} onClose={handleCloseModal} />
      )}

      <div className="table-section">
        <input
          type="text"
          placeholder="Search by department name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <div className="table-wrapper">
          <table className="branch-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Branch Name</th>
                <th>Company Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentDepartments.length > 0 ? (
                currentDepartments.map((dept) => (
                  <tr key={dept.DepartmentID || `temp-${Math.random()}`}>
                    <td>{dept.DepartmentName || 'N/A'}</td>
                    <td>{dept.BranchName || 'N/A'}</td>
                    <td>{dept.CompanyName || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${dept.Status === 1 || dept.Status === 'Active' ? 'active' : 'inactive'}`}>
                        {dept.Status === 1 || dept.Status === 'Active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(dept.CreatedAt).toLocaleDateString() || 'N/A'}</td>
                    <td>{new Date(dept.UpdatedAt).toLocaleDateString() || 'N/A'}</td>
                    <td className="actions-cell">
                      <button className="action-btn edit-btn" onClick={() => handleAddOrEdit(dept)} title="Edit">
                        <FaEdit />
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDeleteClick(dept.DepartmentID)} title="Delete">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No departments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <button className="nav-btn" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            Prev
          </button>
          <button className="nav-btn" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            Next
          </button>
          <span>Page {currentPage} of {totalPages || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentPage;