import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdDashboard, MdOutlineAttachMoney } from 'react-icons/md';
import { FaBuilding, FaUsers, FaMoneyCheckAlt, FaRegClock, FaMoneyBillWave, FaCalendarAlt, FaCogs } from 'react-icons/fa';
import { GiPayMoney } from 'react-icons/gi';
import './Sidebar.css';

function Sidebar({ isVisible: propVisible, onToggle: propOnToggle }) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(propVisible || false);

  useEffect(() => {
    setIsVisible(propVisible || false);
  }, [propVisible]);

  const isActive = (path) => location.pathname === path ? 'bg-blue-100 text-blue-700' : '';

  return (
    <div className={`sidebar ${isVisible ? 'visible' : ''}`} style={{ paddingTop: '60px' }}>
      <nav>
        <ul>
          <li>
            <Link
              to="/"
              className={`flex items-center px-5 py-2 ${isActive('/')}`}
              aria-label="Dashboard"
              title="Dashboard"
            >
              <MdDashboard className="icon" style={{ color: '#4CAF50' }} />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/company-management"
              className={`flex items-center px-5 py-2 ${isActive('/company-management')}`}
              aria-label="Company Management"
              title="Company Management"
            >
              <FaBuilding className="icon" style={{ color: '#2196F3' }} />
              <span>Company Management</span>
            </Link>
          </li>
          <li>
            <Link
              to="/employee-management"
              className={`flex items-center px-5 py-2 ${isActive('/employee-management')}`}
              aria-label="Employee Management"
              title="Employee Management"
            >
              <FaUsers className="icon" style={{ color: '#FF9800' }} />
              <span>Employee Management</span>
            </Link>
          </li>
          <li>
            <Link
              to="/leave-request"
              className={`flex items-center px-5 py-2 ${isActive('/leave-request')}`}
              aria-label="Leave Management"
              title="Leave Management (default: Leave Requests)"
            >
              <FaCalendarAlt className="icon" style={{ color: '#F44336' }} />
              <span>Leave Management</span>
            </Link>
          </li>
          <li>
            <Link
              to="/salary-component-management"
              className={`flex items-center px-5 py-2 ${isActive('/salary-component-management')}`}
              aria-label="Salary Component Management"
              title="Salary Component Management"
            >
              <FaMoneyCheckAlt className="icon" style={{ color: '#795548' }} />
              <span>Salary Component Management</span>
            </Link>
          </li>
          <li>
            <Link
              to="/employee-salary-mapping"
              className={`flex items-center px-5 py-2 ${isActive('/employee-salary-mapping')}`}
              aria-label="Employee-Salary Mapping"
              title="Employee-Salary Mapping"
            >
              <MdOutlineAttachMoney className="icon" style={{ color: '#009688' }} />
              <span>Employee-Salary Mapping</span>
            </Link>
          </li>
          <li>
            <Link
              to="/overtime-rate-management"
              className={`flex items-center px-5 py-2 ${isActive('/overtime-rate-management')}`}
              aria-label="Overtime Rate Management"
              title="Overtime Rate Management"
            >
              <FaRegClock className="icon" style={{ color: '#673AB7' }} />
              <span>Overtime Rate Management</span>
            </Link>
          </li>
          <li>
            <Link
              to="/earnings-registration"
              className={`flex items-center px-5 py-2 ${isActive('/earnings-registration')}`}
              aria-label="Earnings Registration"
              title="Earnings Registration"
            >
              <FaMoneyBillWave className="icon" style={{ color: '#E91E63' }} />
              <span>Earnings Registration</span>
            </Link>
          </li>
          <li>
            <Link
              to="/payroll-generation"
              className={`flex items-center px-5 py-2 ${isActive('/payroll-generation')}`}
              aria-label="Payroll Generation"
              title="Payroll Generation"
            >
              <GiPayMoney className="icon" style={{ color: '#3F51B5' }} />
              <span>Payroll Generation</span>
            </Link>
          </li>
          <li>
            <Link
              to="/role-management"
              className={`flex items-center px-5 py-2 ${isActive('/role-management')}`}
              aria-label="Role Management"
              title="Role Management"
            >
              <FaCogs className="icon" style={{ color: '#17a2b8' }} />
              <span>Role Management</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;