import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Components
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import CompanyManagement from './pages/CompanyManagement';
import CompanyPage from './pages/CompanyPage';
import DepartmentPage from './pages/DepartmentPage';
import DesignationPage from './pages/DesignationPage';
import BranchPage from './pages/BranchPage';
import EmployeeManagement from './pages/EmployeeManagement';
import EmployeePage from './pages/EmployeePage';
import WorkArrangementPage from './pages/WorkArrangementPage';
import LeavePage from './pages/LeavePage';
import LeaveTypePage from './pages/LeaveTypePage';
import Login from './pages/Login';
import SalaryComponentManagement from './pages/SalaryComponentManagement';
import EmployeeSalaryMapping from './pages/EmployeeSalaryMapping';
import OvertimeRateManagement from './pages/OvertimeRateManagement';
import EarningsRegistration from './pages/EarningsRegistration';
import PayrollGeneration from './pages/PayrollGeneration';
import ResetPassword from './pages/ResetPassword';
import RoleManagement from './pages/RoleManagement';
import PeriodPage from './pages/PeriodPage';
import LocationForm from './components/LocationForm';
import CreateUserAccount from './pages/CreateUserAccount';

import './App.css';

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/reset-password';

  const [sidebarVisible, setSidebarVisible] = useState(() => {
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setSidebarVisible(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="App">
      {!isLoginPage && <TopNav onToggleSidebar={() => setSidebarVisible(v => !v)} />}
      <div className="main-container">
        {!isLoginPage && (
          <Sidebar
            isVisible={sidebarVisible}
            onToggle={() => setSidebarVisible(v => !v)}
          />
        )}
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <h1>Dashboard</h1>
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-management"
              element={
                <ProtectedRoute>
                  <CompanyManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies/add"
              element={
                <ProtectedRoute>
                  <CompanyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company-form/:companyId"
              element={
                <ProtectedRoute>
                  <CompanyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <DepartmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/department-form/:departmentId"
              element={
                <ProtectedRoute>
                  <DepartmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/designations"
              element={
                <ProtectedRoute>
                  <DesignationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/designation-form/:designationId"
              element={
                <ProtectedRoute>
                  <DesignationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches"
              element={
                <ProtectedRoute>
                  <BranchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/branches/:branchID"
              element={
                <ProtectedRoute>
                  <BranchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/locations/add"
              element={
                <ProtectedRoute>
                  <LocationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-management"
              element={
                <ProtectedRoute>
                  <EmployeeManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-details"
              element={
                <ProtectedRoute>
                  <EmployeePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/work-arrangement"
              element={
                <ProtectedRoute>
                  <WorkArrangementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/qualifications"
              element={
                <ProtectedRoute>
                  <h1>Qualifications Form</h1>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents-attachments"
              element={
                <ProtectedRoute>
                  <h1>Documents & Attachments Form</h1>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-request"
              element={
                <ProtectedRoute>
                  <LeavePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-types"
              element={
                <ProtectedRoute>
                  <LeaveTypePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-leave-requests"
              element={
                <ProtectedRoute>
                  <LeavePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salary-component-management"
              element={
                <ProtectedRoute>
                  <SalaryComponentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-salary-mapping"
              element={
                <ProtectedRoute>
                  <EmployeeSalaryMapping />
                </ProtectedRoute>
              }
            />
            <Route
              path="/overtime-rate-management"
              element={
                <ProtectedRoute>
                  <OvertimeRateManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/earnings-registration"
              element={
                <ProtectedRoute>
                  <EarningsRegistration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll-generation"
              element={
                <ProtectedRoute>
                  <PayrollGeneration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll-generation/periods"
              element={
                <ProtectedRoute>
                  <PeriodPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/role-management"
              element={
                <ProtectedRoute>
                  <RoleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute>
                  <h1>Role Management Form</h1>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-user-account"
              element={
                <ProtectedRoute>
                  <CreateUserAccount />
                </ProtectedRoute>
              }
            />
            <Route
              path="/role-assignment"
              element={
                <ProtectedRoute>
                  <h1>Role Assignment Form</h1>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;