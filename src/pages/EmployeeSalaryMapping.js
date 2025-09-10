import React from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaListAlt, FaHistory } from 'react-icons/fa';
import './EmployeeSalaryMapping.css';

const EmployeeSalaryMapping = () => {
  return (
    <div className="employee-salary-mapping">
      <h2>Employee-Salary Mapping</h2>
      <div className="cards-container">
        <div className="card">
          <FaUser className="card-icon add-icon" />
          <h3>Add Mapping</h3>
          <Link to="/employee-salary-mapping/add">Go to Form</Link>
        </div>
        <div className="card">
          <FaListAlt className="card-icon view-icon" />
          <h3>View All Mappings</h3>
          <Link to="/employee-salary-mapping/list">Go to List</Link>
        </div>
        <div className="card">
          <FaHistory className="card-icon recent-icon" />
          <h3>Recent Mappings</h3>
          <Link to="/employee-salary-mapping/recent">Go to List</Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSalaryMapping;