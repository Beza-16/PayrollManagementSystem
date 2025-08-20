import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for client-side navigation
import { FaBuilding, FaMapMarkerAlt, FaUsers, FaSlidersH, FaCogs } from 'react-icons/fa';
import './CompanyManagement.css';

const CompanyManagement = () => {
  return (
    <div className="company-management">
      <h2>Company Management</h2>
      <div className="cards-container">
        <div className="card">
          <FaBuilding className="card-icon companies-icon" />
          <h3>Company</h3>
          <Link to="/companies/add">Go to Form</Link>
        </div>
        <div className="card">
          <FaMapMarkerAlt className="card-icon branches-icon" />
          <h3>Branches</h3>
          <Link to="/branches">Go to Form</Link>
        </div>
        <div className="card">
          <FaUsers className="card-icon locations-icon" />
          <h3>Locations</h3>
          <Link to="/locations">Go to Form</Link>
        </div>
        <div className="card">
          <FaSlidersH className="card-icon departments-icon" />
          <h3>Departments</h3>
          <Link to="/departments">Go to Form</Link>
        </div>
        <div className="card">
          <FaCogs className="card-icon designations-icon" />
          <h3>Designations</h3>
          <Link to="/designations">Go to Form</Link>
        </div>
        <div className="card">
          <FaCogs className="card-icon capability-icon" />
          <h3>Companies</h3>
          <Link to="/designation-capabilities">Go to Form</Link>
        </div>
      </div>
    </div>
  );
};

export default CompanyManagement;