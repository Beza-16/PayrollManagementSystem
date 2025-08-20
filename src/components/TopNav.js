import React, { useState, useEffect } from 'react';
import { FaSearch, FaBell, FaUserCircle, FaMoon, FaSun, FaSignOutAlt, FaBars } from 'react-icons/fa';
import './TopNav.css';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';

const TopNav = ({ onToggleSidebar }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      return JSON.parse(savedTheme);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [topSearchTerm, setTopSearchTerm] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      dispatch(logout());
      navigate('/login');
      alert('You have been logged out.');
    }
  };

  const handleTopSearchChange = (e) => {
    setTopSearchTerm(e.target.value);
    // Optionally handle search logic here
  };

  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <button className="hamburger" onClick={onToggleSidebar} title="Toggle Menu">
          <FaBars size={10} />
        </button>
        <h2 className="logo">Payroll</h2>
      </div>
      <div className="top-nav-center">
        <div className="topnav-search-bar">
          <input
            type="text"
            placeholder="Search..."
            value={topSearchTerm}
            onChange={handleTopSearchChange}
          />
          <FaSearch className="icon search-icon" />
        </div>
      </div>
      <div className="top-nav-right">
        <div className="icon-container">
          <FaBell className="icon bell-icon" title="Notifications" />
          <FaUserCircle className="icon user-icon" title="Profile" />
          <div className="theme-toggle">
            {darkMode ? (
              <FaSun className="icon theme-icon" onClick={toggleTheme} title="Switch to Light Mode" />
            ) : (
              <FaMoon className="icon theme-icon" onClick={toggleTheme} title="Switch to Dark Mode" />
            )}
          </div>
          <FaSignOutAlt
            className="icon logout-icon"
            onClick={handleLogout}
            title="Logout"
          />
        </div>
      </div>
    </div>
  );
};

export default TopNav;