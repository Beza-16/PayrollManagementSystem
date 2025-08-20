import React from 'react';
import { Link } from 'react-router-dom';
import { FaMoneyBillWave, FaListAlt, FaHourglassHalf } from 'react-icons/fa';
import './EarningsRegistration.css';

const EarningsRegistration = () => {
  return (
    <div className="earnings-registration">
      <h2>Earnings Registration</h2>
      <div className="cards-container">
        <div className="card">
          <FaMoneyBillWave className="card-icon register-icon" />
          <h3>Register Earnings</h3>
          <Link to="/earnings-registration/add">Go to Form</Link>
        </div>
        <div className="card">
          <FaListAlt className="card-icon view-icon" />
          <h3>View All Earnings</h3>
          <Link to="/earnings-registration">Go to List</Link>
        </div>
        <div className="card">
          <FaHourglassHalf className="card-icon pending-icon" />
          <h3>Pending Earnings</h3>
          <Link to="/earnings-registration/pending">Go to List</Link>
        </div>
      </div>
    </div>
  );
};

export default EarningsRegistration;