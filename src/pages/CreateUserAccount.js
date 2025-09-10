import React, { useState, useEffect, useCallback } from 'react';
import CreateUserAccountForm from '../components/CreateUserAccountForm';
import { FaEye, FaEyeSlash, FaEdit, FaTrash } from 'react-icons/fa';
import { useUserSlice } from '../slices/userSlice';
import { useSelector, useDispatch } from 'react-redux';
import { fetchRole } from '../slices/roleSlice';
import axios from 'axios';
import '../styles/CreateUserAccount.css';

const CreateUserAccount = () => {
  const dispatch = useDispatch();
  const { successMessage, errorMessage, isSubmitting, users, fetchUsers, employees } = useUserSlice();
  const { roles, loading: roleLoading, error: roleError } = useSelector((state) => state.role || {
    roles: [],
    loading: false,
    error: null,
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [passwordVisibility, setPasswordVisibility] = useState({});
  const [roleFilter, setRoleFilter] = useState('All');
  const [editUser, setEditUser] = useState(null);
  const usersPerPage = 5;

  useEffect(() => {
    fetchUsers();
    dispatch(fetchRole());
  }, [fetchUsers, dispatch]);

  const togglePasswordVisibility = (username) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const handleUserCreated = () => {
    fetchUsers();
    setShowUserModal(false);
    setEditUser(null);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditUser(null);
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_API_URL || 'https://localhost:14686'}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
  };

  const filterUsers = useCallback(
    (term, role) => {
      return users
        .filter((user) => !user.DeletedAt || user.DeletedAt === '0001-01-01T00:00:00Z')
        .filter((user, index, self) =>
          index === self.findIndex((u) => u.Username === user.Username && u.Email === user.Email && u.RoleName === user.RoleName)
        )
        .filter((user) => {
          const matchesSearch = [
            user.Username,
            user.Email,
            user.Employee,
            user.RoleName,
          ].some((field) => (field?.toLowerCase() || '').includes(term.toLowerCase()));
          const matchesRole = role === 'All' || user.RoleName === role;
          return matchesSearch && matchesRole;
        });
    },
    [users]
  );

  const [filteredUsers, setFilteredUsers] = useState([]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilteredUsers(filterUsers(searchTerm, roleFilter));
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, roleFilter, filterUsers]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.value === roleId);
    return role ? role.label : 'N/A';
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find((e) => e.EmployeeID === employeeId);
    return employee ? employee.FullName || employee.Name || 'N/A' : 'N/A';
  };

  return (
    <div className="user-page-container" role="main" aria-label="User Management Page">
      <div className="header-section">
        <h2>All Users</h2>
        <button className="add-btn" onClick={() => setShowUserModal(true)} aria-label="Add New User">
          + Create User
        </button>
      </div>

      {errorMessage && <div className="error-message" role="alert">{errorMessage}</div>}
      {roleError && <div className="error-message" role="alert">{roleError}</div>}
      {successMessage && <div className="success-message" role="alert">{successMessage}</div>}
      {(isSubmitting || roleLoading) && <div className="loading-message" role="status">Loading...</div>}

      {showUserModal && (
        <CreateUserAccountForm onClose={handleCloseUserModal} onUserCreated={handleUserCreated} userToEdit={editUser} />
      )}

      <div className="table-section">
        <div className="search-and-size">
          <input
            type="text"
            placeholder="Search by username, email, employee, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
            aria-label="Search users"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter"
            aria-label="Filter by role"
          >
            <option value="All">All Roles</option>
            {roles.map((role) => (
              <option key={role.value} value={role.label}>{role.label}</option>
            ))}
          </select>
        </div>
        <div className="table-wrapper">
          <table className="user-table" aria-label="Users List">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Password</th>
                <th>Role</th>
                <th>Employee</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length > 0 ? (
                currentUsers.map((user) => (
                  <tr key={user.UserID || `temp-${Math.random()}`}>
                    <td>{user.Username || 'N/A'}</td>
                    <td>{user.Email || 'N/A'}</td>
                    <td className="password-field">
                      {passwordVisibility[user.Username] ? user.Password || 'N/A' : '********'}
                      <span
                        className="password-toggle"
                        onClick={() => togglePasswordVisibility(user.Username)}
                        aria-label={passwordVisibility[user.Username] ? 'Hide password' : 'Show password'}
                      >
                        {passwordVisibility[user.Username] ? <FaEyeSlash /> : <FaEye />}
                      </span>
                    </td>
                    <td>{getRoleName(user.RoleId) || 'N/A'}</td>
                    <td>{getEmployeeName(user.EmployeeId) || 'N/A'}</td>
                    <td>{formatDate(user.CreatedAt)}</td>
                    <td>{formatDate(user.UpdatedAt)}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditUser(user)}
                        title="Edit"
                        aria-label={`Edit ${user.Username}`}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteUser(user.UserID)}
                        title="Delete"
                        aria-label={`Delete ${user.Username}`}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8">No users found</td>
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
          <span>Page {currentPage} of {totalPages || 1} (5 rows per page)</span>
        </div>
      </div>
    </div>
  );
};

export default CreateUserAccount;