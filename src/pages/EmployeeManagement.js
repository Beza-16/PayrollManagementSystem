import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaClock, FaGraduationCap, FaFileUpload } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const EmployeeManagement = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    console.log('EmployeeManagement - isAuthenticated:', isAuthenticated);
  }, [isAuthenticated]);

  return (
    <div className="employee-management min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Employee Management</h2>
      <div className="cards-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="card bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <FaUser className="card-icon profile-icon text-blue-500 text-4xl mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-700 text-center mb-4">Employee Details</h3>
          <Link
            to="/employee-details"
            className="block text-center text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => console.log('Navigating to Employee Details')}
          >
            Go to Form
          </Link>
        </div>
        <div className="card bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <FaClock className="card-icon work-icon text-purple-500 text-4xl mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-700 text-center mb-4">Work Arrangement</h3>
          <Link
            to="/work-arrangement"
            className="block text-center text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => console.log('Navigating to Work Arrangement')}
          >
            Go to Form
          </Link>
        </div>
        <div className="card bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <FaGraduationCap className="card-icon qualifications-icon text-red-500 text-4xl mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-700 text-center mb-4">Qualifications</h3>
          <Link
            to="/qualifications"
            className="block text-center text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => console.log('Navigating to Qualifications')}
          >
            Go to Form
          </Link>
        </div>
        <div className="card bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <FaFileUpload className="card-icon documents-icon text-yellow-500 text-4xl mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-700 text-center mb-4">Documents & Attachments</h3>
          <Link
            to="/documents-attachments"
            className="block text-center text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => console.log('Navigating to Documents & Attachments')}
          >
            Go to Form
          </Link>
        </div>

        {/* New Card for Create User Account */}
        <div className="card bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <FaUser className="card-icon user-account-icon text-green-500 text-4xl mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-700 text-center mb-4">Create User Account</h3>
          <Link
            to="/create-user-account"
            className="block text-center text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => console.log('Navigating to Create User Account')}
          >
            Go to Form
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
