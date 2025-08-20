import React from 'react';
import { Link } from 'react-router-dom';
import { FaMoneyBillWave, FaMinusCircle, FaPlusCircle, FaListAlt, FaHistory } from 'react-icons/fa';
import './SalaryComponentManagement.css';

const SalaryComponentManagement = () => {
  return (
    <div className="salary-component-management">
      <h2>Salary Component Management</h2>
      <div className="cards-container">
        <div className="card">
          <FaMoneyBillWave className="card-icon earnings-icon" />
          <h3>Earnings</h3>
          <Link to="/earnings/add">Go to Form</Link>
        </div>
        <div className="card">
          <FaMinusCircle className="card-icon deductions-icon" />
          <h3>Deductions</h3>
          <Link to="/deductions/add">Go to Form</Link>
        </div>
        <div className="card">
          <FaPlusCircle className="card-icon create-icon" />
          <h3>Create Salary Component</h3>
          <Link to="/salary-components/add">Go to Form</Link>
        </div>
        <div className="card">
          <FaListAlt className="card-icon summary-icon" />
          <h3>All Salary Components</h3>
          <Link to="/salary-components">Go to Form</Link>
        </div>
        <div className="card">
          <FaHistory className="card-icon activity-icon" />
          <h3>Recent Activity</h3>
          <Link to="/salary-components/activity">Go to Form</Link>
        </div>
      </div>
    </div>
  );
};

export default SalaryComponentManagement;