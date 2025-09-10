import React from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaListAlt } from 'react-icons/fa';
import './LeaveManagement.css';

const LeaveManagement = () => {
  return (
    <div className="leave-management">
      <h2>Leave Management</h2>
      <div className="cards-container">
        <div className="card">
          <FaListAlt className="card-icon leave-types-icon" />
          <h3>Leave Type</h3>
          <Link to="/leave-types">Go to Leave Types</Link>
        </div>
        <div className="card">
          <FaCalendarAlt className="card-icon leaves-icon" />
          <h3>Leave Request</h3>
          <Link to="/employee-leave-request">Go to Leave Requests</Link>
        </div>
        <div className="card">
          <FaCalendarAlt className="card-icon attendance-icon" />
          <h3>Attendance</h3>
          <Link to="/attendance">Go to Attendance</Link>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;