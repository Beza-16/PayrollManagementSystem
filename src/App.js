import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { validateToken, fetchUserRole, logout } from './slices/authSlice';

// Components
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LeaveForm from './components/LeaveForm';
import LeaveTypeForm from './components/LeaveTypeForm';
import EarningsForm from './components/EarningsForm';
import LocationForm from './components/LocationForm';
import DeductionForm from './components/DeductionForm';
import CalendarImportForm from './components/CalendarImportForm';
import CalendarDisplay from './components/CalendarDisplay';
import OvertimeRateForm from './components/OvertimeRateForm';

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
import LeaveManagement from './pages/LeaveManagement';
import Login from './pages/Login';
import SalaryComponentManagement from './pages/SalaryComponentManagement';
import EmployeeSalaryMapping from './pages/EmployeeSalaryMapping';
import EmployeeSalaryMappingPage from './pages/EmployeeSalaryMappingPage';
import RecentSalaryMappingPage from './pages/RecentSalaryMappingPage';
import OvertimeRateManagement from './pages/OvertimeRateManagement';
import OvertimeRatePage from './pages/OvertimeRatePage';
import EarningsPage from './pages/EarningsPage';
import DeductionPage from './pages/DeductionPage';
import DeductionTypePage from './pages/DeductionTypePage';
import EarningsRegistration from './pages/EarningsRegistration';
import PayrollGeneration from './pages/PayrollGeneration';
import GeneratePayrollPage from './pages/GeneratePayrollPage';
import PayrollReportsPage from './pages/PayrollReportsPage';
import DownloadPayrollPage from './pages/DownloadPayrollPage';
import ConfigurePayrollPage from './pages/ConfigurePayrollPage';
import ResetPassword from './pages/ResetPassword';
import RoleManagement from './pages/RoleManagement';
import PeriodPage from './pages/PeriodPage';
import CreateUserAccount from './pages/CreateUserAccount';
import EmployeeRecordsPage from './pages/EmployeeRecordsPage';
import EarningTypePage from './pages/EarningTypePage';
import AttendancePage from './pages/AttendancePage';
import CalendarPage from './pages/CalendarPage';

import './App.css';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, isValidating, userRole } = useSelector((state) => state.auth);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated && !isValidating) {
      dispatch(validateToken()).then((result) => {
        if (validateToken.fulfilled.match(result)) {
          dispatch(fetchUserRole());
        }
      });
    }
  }, [dispatch, isAuthenticated, isValidating]);

  useEffect(() => {
    if (!isValidating && isAuthenticated && userRole) {
      if (userRole.toLowerCase() === 'admin') {
        if (location.pathname === '/login' || location.pathname === '/reset-password') {
          navigate('/admin-dashboard');
        }
      } else {
        dispatch(logout());
        navigate('/login');
      }
    } else if (!isValidating && !isAuthenticated && !isLoginPage) {
      navigate('/login');
    }
  }, [isAuthenticated, isValidating, userRole, navigate, dispatch, location.pathname, isLoginPage]);

  if (isValidating) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      {!isLoginPage && <TopNav onToggleSidebar={() => setSidebarVisible((v) => !v)} />}
      <div className="main-container">
        {!isLoginPage && (
          <Sidebar
            isVisible={sidebarVisible}
            onToggle={() => setSidebarVisible((v) => !v)}
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
              path="/admin-dashboard"
              element={
                <ProtectedRoute>
                  <h1>Admin Dashboard</h1>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-management"
              element={
                <ProtectedRoute>
                  <LeaveManagement />
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
              path="/employee-records"
              element={
                <ProtectedRoute>
                  <EmployeeRecordsPage />
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
              path="/employee-leave-request"
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
              path="/employee-salary-mapping/list"
              element={
                <ProtectedRoute>
                  <EmployeeSalaryMappingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-salary-mapping/recent"
              element={
                <ProtectedRoute>
                  <RecentSalaryMappingPage />
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
              path="/overtime-rate-management/list"
              element={
                <ProtectedRoute>
                  <OvertimeRatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/overtime-rate-management/active"
              element={
                <ProtectedRoute>
                  <h1>Active Overtime Rates</h1>
                </ProtectedRoute>
              }
            />
            <Route
              path="/earnings"
              element={
                <ProtectedRoute>
                  <EarningsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/earnings/add"
              element={
                <ProtectedRoute>
                  <EarningsForm />
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
              path="/earnings-registration/add"
              element={
                <ProtectedRoute>
                  <EarningsForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/earnings-registration/pending"
              element={
                <ProtectedRoute>
                  <h1>Pending Earnings</h1>
                </ProtectedRoute>
              }
            />
            <Route
              path="/earning-types"
              element={
                <ProtectedRoute>
                  <EarningTypePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions"
              element={
                <ProtectedRoute>
                  <DeductionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deductions/add"
              element={
                <ProtectedRoute>
                  <DeductionForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deduction-types"
              element={
                <ProtectedRoute>
                  <DeductionTypePage />
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
              path="/payroll-generation/generate"
              element={
                <ProtectedRoute>
                  <GeneratePayrollPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll-generation/reports"
              element={
                <ProtectedRoute>
                  <PayrollReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll-generation/download"
              element={
                <ProtectedRoute>
                  <DownloadPayrollPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll-generation/configure"
              element={
                <ProtectedRoute>
                  <ConfigurePayrollPage />
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
              path="/payroll-generation/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
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
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
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
