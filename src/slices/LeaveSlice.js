import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useLeaveSlice = (leaveBaseUrl = 'https://localhost:14686/api/Leave', employeeBaseUrl = 'https://localhost:14686/api/Employee') => {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000;

  const leaveAxios = axios.create({
    baseURL: leaveBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const employeeAxios = axios.create({
    baseURL: employeeBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await employeeAxios.get('', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const employeeData = response.data.map(emp => ({
        EmployeeID: emp.EmployeeID?.toString() || '',
        FullName: emp.FullName || emp.EmployeeName || 'Unknown',
      }));
      console.log('Fetched employees:', employeeData);
      setEmployees(employeeData);
      return employeeData;
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
      return [];
    }
  }, []);

  const fetchLeaves = useCallback(async (isMyLeaves = false, attempt = 1) => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch leaves after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const endpoint = isMyLeaves ? '' : ''; // Adjust endpoint as needed
      const params = isMyLeaves ? { view: 'requests', status: 'All' } : { view: 'requests', status: 'All' };
      const response = await leaveAxios.get(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
        params,
      });

      if (employees.length === 0) {
        await fetchEmployees();
      }

      const mappedLeaves = response.data.map((leave) => ({
        LeaveID: leave.LeaveID,
        EmployeeID: leave.EmployeeID,
        EmployeeFullName: leave.EmployeeFullName || employees.find(emp => emp.EmployeeID === leave.EmployeeID)?.FullName || 'N/A',
        LeaveTypeID: leave.LeaveTypeID,
        LeaveTypeName: leave.LeaveTypeName || 'N/A',
        StartDate: leave.StartDate,
        EndDate: leave.EndDate,
        LeaveDescription: leave.LeaveDescription || 'N/A',
        Status: leave.Status, // Keep as integer
        MedicalDocument: leave.MedicalDocument || '',
        LeaveOfficesFiled: leave.LeaveOfficesFiled || false,
        AnnualLeaveDate: leave.AnnualLeaveDate,
        RejectionReason: leave.RejectionReason || '',
        ApprovedBy: leave.ApprovedBy || '',
        LeaveWithPay: leave.LeaveWithPay || false,
        MedicalApproval: leave.MedicalApproval || false,
        HRApprovalRequired: leave.HRApprovalRequired || false,
        CreatedAt: leave.CreatedAt,
        UpdatedAt: leave.UpdatedAt,
      }));
      setLeaves(mappedLeaves || []);
      retryCount.current = 0;
    } catch (error) {
      console.error('Fetch error:', error);
      const errorMsg = error.response
        ? `Failed to fetch leaves: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to fetch leaves: ${error.message}`;
      if (attempt <= maxRetries) {
        setTimeout(() => fetchLeaves(isMyLeaves, attempt + 1), retryDelay * attempt);
        retryCount.current += 1;
      } else {
        setErrorMessage(errorMsg);
      }
    } finally {
      setIsFetching(false);
    }
  }, [employees]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleSubmit = async (leaveData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const token = localStorage.getItem('token');
      const isEdit = leaveData.LeaveID && leaveData.LeaveID.trim() !== '';

      const requiredFields = ['EmployeeID', 'LeaveTypeID', 'StartDate', 'EndDate', 'LeaveDescription'];
      const missingFields = requiredFields.filter(field => !leaveData[field] || (typeof leaveData[field] === 'string' && !leaveData[field].trim()));
      if (missingFields.length > 0) {
        throw new Error(`Missing or empty required fields: ${missingFields.join(', ')}`);
      }

      const formatDate = (date) => {
        if (!date || !(date instanceof Date) || isNaN(date)) {
          console.warn('Invalid date detected, using current date:', date);
          return new Date().toISOString();
        }
        return date.toISOString();
      };

      const payload = {
        EmployeeID: leaveData.EmployeeID.trim(),
        LeaveTypeID: leaveData.LeaveTypeID,
        StartDate: formatDate(leaveData.StartDate),
        EndDate: formatDate(leaveData.EndDate),
        LeaveDescription: leaveData.LeaveDescription || '',
        MedicalDocument: leaveData.MedicalDocument || null,
        LeaveOfficesFiled: leaveData.LeaveOfficesFiled || false,
        AnnualLeaveDate: leaveData.AnnualLeaveDate ? formatDate(leaveData.AnnualLeaveDate) : null,
      };

      if (isEdit) {
        payload.LeaveID = leaveData.LeaveID;
        const statusPayload = {
          Status: parseInt(leaveData.Status, 10),
          RejectionReason: leaveData.Status === 2 ? leaveData.RejectionReason || null : null,
        };
        await leaveAxios.put(`/${leaveData.LeaveID}/status`, statusPayload, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } else {
        await leaveAxios.post('', payload, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }

      setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
      await fetchLeaves();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 5000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      console.error('Submit error:', error);
      const errorDetails = error.response?.data?.errors
        ? Object.values(error.response.data.errors).flat().join(', ')
        : error.response?.data?.error || error.message;
      const errorMsg = error.response
        ? `Failed to ${leaveData.LeaveID ? 'update' : 'add'} leave: ${error.response.status} - ${errorDetails}`
        : `Failed to ${leaveData.LeaveID ? 'update' : 'add'} leave: ${error.message}`;
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 5000);
      timeoutIds.current.push(errorTimeout);
      throw error;
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  const handleDelete = async (leaveId) => {
    if (!leaveId || leaveId === 'undefined') {
      setErrorMessage('Cannot delete leave: Invalid leave ID');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const token = localStorage.getItem('token');
      await leaveAxios.delete(`/${leaveId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setSuccessMessage('Deleted successfully');
      await fetchLeaves();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 5000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMsg = error.response
        ? `Failed to delete leave: ${error.response.status} - ${error.response.statusText}`
        : `Failed to delete leave: ${error.message}`;
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 5000);
      timeoutIds.current.push(errorTimeout);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  return {
    leaves,
    employees,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchLeaves,
    fetchEmployees,
    handleSubmit,
    handleDelete,
  };
};

export { useLeaveSlice };