import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlusCircle, FaListAlt, FaClock } from 'react-icons/fa';
import './OvertimeRateManagement.css';

const OvertimeRateManagement = () => {
  return (
    <div className="overtime-rate-management">
      <h2>Overtime Rate Management</h2>
      <div className="cards-container">
        <div className="card">
          <FaPlusCircle className="card-icon add-icon" />
          <h3>Add Overtime Rate</h3>
          <Link to="/overtime-rate-management/list">Go to List</Link>
        </div>
        <div className="card">
          <FaListAlt className="card-icon view-icon" />
          <h3>View All Rates</h3>
          <Link to="/overtime-rate-management/list">Go to List</Link>
        </div>
        <div className="card">
          <FaClock className="card-icon active-icon" />
          <h3>Active Rates</h3>
          <Link to="/overtime-rate-management/active">Go to List</Link>
        </div>
      </div>
    </div>
  );
};

export default OvertimeRateManagement;