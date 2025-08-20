// ... (imports remain unchanged)
import React, { useState, useEffect, useCallback } from 'react';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import CompanyForm from '../components/CompanyForm';
import { useCompanySlice } from '../slices/CompanySlice';
import '../styles/CompanyPage.css';

const CompanyPage = () => {
  const { companies, handleDelete, successMessage, errorMessage, fetchCompanies, isFetching } = useCompanySlice();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteError, setDeleteError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const companiesPerPage = 5;

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const filterCompanies = useCallback((term) => {
    return companies?.filter((company) =>
      [
        company?.CompanyName,
        company?.PhoneNumber,
        company?.Email,
        company?.city,
        company?.country,
        company?.state_or_region,
        company?.street, // already present
      ]
        .some(field => (field?.toLowerCase() || '').includes(term.toLowerCase()))
    ) || [];
  }, [companies]);

  const [filteredCompanies, setFilteredCompanies] = useState([]);
  useEffect(() => {
    const debouncedFilter = debounce((term) => {
      setFilteredCompanies(filterCompanies(term));
      setCurrentPage(1);
    }, 300);
    debouncedFilter(searchTerm);
  }, [searchTerm, filterCompanies]);

  const indexOfLastCompany = currentPage * companiesPerPage;
  const indexOfFirstCompany = indexOfLastCompany - companiesPerPage;
  const currentCompanies = filteredCompanies.slice(indexOfFirstCompany, indexOfLastCompany);
  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);

  const handleAddOrEditCompany = (company) => {
    setEditCompany(company);
    setShowCompanyModal(true);
  };

  const handleDeleteClick = async (companyId) => {
    if (!companyId) {
      setDeleteError('Cannot delete: companyId is undefined');
      return;
    }
    try {
      await handleDelete(companyId);
      setDeleteError(null);
    } catch (error) {
      setDeleteError('Failed to delete company. Please try again.');
      console.error('Delete error:', error);
    }
  };

  const handleCloseCompanyModal = async () => {
    await fetchCompanies();
    setShowCompanyModal(false);
    setEditCompany(null);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const toggleDetails = (companyId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [companyId]: !prev[companyId],
    }));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="company-page-container" role="main" aria-label="Company Management Page">
      <div className="header-section">
        <h2>All Companies</h2>
        <button
          className="add-btn"
          onClick={() => handleAddOrEditCompany(null)}
          aria-label="Add New Company"
        >
          + Add New Company
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
          Loading companies...
        </div>
      )}

      {showCompanyModal && (
        <CompanyForm
          company={editCompany}
          onClose={handleCloseCompanyModal}
        />
      )}

      <div className="table-section">
        <div className="search-and-size">
          <input
            type="text"
            placeholder="Search by name, phone, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
            aria-label="Search companies"
          />
        </div>
        <div className="table-wrapper">
          <table className="company-table" aria-label="Companies List">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>City</th>
                <th>Country</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCompanies.length > 0 ? (
                currentCompanies.map((company) => (
                  <React.Fragment key={company.CompanyID || `temp-${Math.random()}`}>
                    <tr>
                      <td>{company.CompanyName || 'N/A'}</td>
                      <td>{company.PhoneNumber || 'N/A'}</td>
                      <td>{company.Email || 'N/A'}</td>
                      <td>{company.city || 'N/A'}</td>
                      <td>{company.country || 'N/A'}</td>
                      <td className="actions-cell">
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleAddOrEditCompany(company)}
                          title="Edit"
                          aria-label={`Edit ${company.CompanyName}`}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteClick(company.CompanyID)}
                          title="Delete"
                          aria-label={`Delete ${company.CompanyName}`}
                        >
                          <FaTrash />
                        </button>
                        <button
                          className="action-btn details-btn"
                          onClick={() => toggleDetails(company.CompanyID)}
                          title={expandedRows[company.CompanyID] ? 'Hide Details' : 'View Details'}
                          aria-label={expandedRows[company.CompanyID] ? 'Hide Details' : 'View Details'}
                        >
                          {expandedRows[company.CompanyID] ? <FaChevronUp /> : <FaChevronDown />}
                        </button>
                      </td>
                    </tr>
                    {expandedRows[company.CompanyID] && (
                      <tr className="details-row">
                        <td colSpan="6">
                          <div className="details-content">
                            <p><strong>Street:</strong> {company.street || 'N/A'}</p>
                            <p><strong>State/Region:</strong> {company.state_or_region || 'N/A'}</p>
                            <p><strong>Latitude:</strong> {company.latitude?.toFixed(4) || 'N/A'}</p>
                            <p><strong>Longitude:</strong> {company.longitude?.toFixed(4) || 'N/A'}</p>
                            <p><strong>Created At:</strong> {formatDate(company.created_at)}</p>
                            <p><strong>Updated At:</strong> {formatDate(company.updatedAt)}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No companies found</td>
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

export default CompanyPage;
