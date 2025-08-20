import React from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaFileAlt, FaDownload, FaCog, FaClock, FaCalendar } from 'react-icons/fa';
import './PayrollGeneration.css';

const PayrollGeneration = () => {
  return (
    <div className="payroll-generation">
      <h2>Payroll Generation</h2>
      <div className="cards-container">
        <div className="card">
          <FaPlay className="card-icon generate-icon" />
          <h3>Generate Payroll</h3>
          <Link to="/payroll-generation/generate">Go to Form</Link>
        </div>
        <div className="card">
          <FaFileAlt className="card-icon reports-icon" />
          <h3>View Payroll Reports</h3>
          <Link to="/payroll-generation/reports">Go to List</Link>
        </div>
        <div className="card">
          <FaDownload className="card-icon download-icon" />
          <h3>Download Payroll</h3>
          <Link to="/payroll-generation/download">Go to Form</Link>
        </div>
        <div className="card">
          <FaCog className="card-icon config-icon" />
          <h3>Configure Payroll</h3>
          <Link to="/payroll-generation/configure">Go to Form</Link>
        </div>
        <div className="card">
          <FaClock className="card-icon periods-icon" />
          <h3>Payroll Periods</h3>
          <Link to="/payroll-generation/periods">Go to Form</Link>
        </div>
        <div className="card">
          <FaCalendar className="card-icon calendar-icon" />
          <h3>Payroll Calendar</h3>
          <Link to="/payroll-generation/calendar">Go to Form</Link>
        </div>
      </div>
    </div>
  );
};

export default PayrollGeneration;