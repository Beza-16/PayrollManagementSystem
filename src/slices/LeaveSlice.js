import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useLeaveSlice = (baseUrl = 'https://localhost:14686/api/Leave') => {
  const [leaves, setLeaves] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const token = localStorage.getItem('token');

  // Debug token and base URL
  useEffect(() => {
    console.log('Token from localStorage:', token);
    console.log('Using baseUrl:', baseUrl);
    if (!token) {
      console.warn('No token found in localStorage. Authentication may fail.');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
      } catch (e) {
        console.warn('Unable to decode token:', e.message);
      }
    }
  }, [token, baseUrl]);

  const axiosInstance = useRef(
    axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      timeout: 10000,
    })
  ).current;

  const fetchAllLeaves = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch leaves after multiple attempts. Check authentication or server.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      console.log('Request config:', { url: 'all', headers: axiosInstance.defaults.headers });
      const response = await axiosInstance.get('all');
      console.log(`Fetched ${response.data.length} leaves. Full response:`, response.data);

      const mappedLeaves = response.data.map((leave) => ({
        LeaveID: leave.LeaveID,
        EmployeeID: leave.EmployeeID,
        EmployeeName: leave.EmployeeName,
        LeaveTypeID: leave.LeaveTypeID,
        LeaveTypeName: leave.LeaveTypeName,
        StartDate: leave.StartDate,
        EndDate: leave.EndDate,
        NumberOfDays: leave.NumberOfDays,
        IsHalfDay: leave.IsHalfDay,
        LeaveDescription: leave.LeaveDescription,
        MedicalDocument: leave.MedicalDocument,
        AttachmentFilePath: leave.AttachmentFilePath,
        Status: leave.Status,
        RejectionReason: leave.RejectionReason,
        ApprovedByName: leave.ApprovedByName,
        CreatedAt: leave.CreatedAt,
        UpdatedAt: leave.UpdatedAt,
      }));

      setLeaves(mappedLeaves);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch leaves: ${error.response.status} - ${error.response.statusText} - ${error.response.data?.message || 'No details'}`
        : `Failed to fetch leaves: ${error.message}`;
      console.error('Fetch error details:', error, { config: error.config, response: error.response });
      setErrorMessage(errorMsg);
      if (error.response?.status === 401) {
        console.warn('401 Unauthorized: Ensure token includes "Admin" role and is valid.');
      } else if (error.response?.status === 404) {
        console.warn('404 Not Found: Check if the server is running at', baseUrl, 'or if the endpoint is registered.');
      }
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, [axiosInstance, baseUrl]);

  const fetchPendingLeaves = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch pending leaves after multiple attempts. Check authentication or server.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      console.log('Request config:', { url: 'pending', headers: axiosInstance.defaults.headers });
      const response = await axiosInstance.get('pending');
      console.log(`Fetched ${response.data.length} pending leaves. Full response:`, response.data);

      const mappedLeaves = response.data.map((leave) => ({
        LeaveID: leave.LeaveID,
        EmployeeID: leave.EmployeeID,
        EmployeeName: leave.EmployeeName,
        LeaveTypeID: leave.LeaveTypeID,
        LeaveTypeName: leave.LeaveTypeName,
        StartDate: leave.StartDate,
        EndDate: leave.EndDate,
        NumberOfDays: leave.NumberOfDays,
        IsHalfDay: leave.IsHalfDay,
        LeaveDescription: leave.LeaveDescription,
        MedicalDocument: leave.MedicalDocument,
        AttachmentFilePath: leave.AttachmentFilePath,
        Status: leave.Status,
        RejectionReason: leave.RejectionReason,
        ApprovedByName: leave.ApprovedByName,
        CreatedAt: leave.CreatedAt,
        UpdatedAt: leave.UpdatedAt,
      }));

      setLeaves(mappedLeaves);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch pending leaves: ${error.response.status} - ${error.response.statusText} - ${error.response.data?.message || 'No details'}`
        : `Failed to fetch pending leaves: ${error.message}`;
      console.error('Fetch error details:', error, { config: error.config, response: error.response });
      setErrorMessage(errorMsg);
      if (error.response?.status === 401) {
        console.warn('401 Unauthorized: Ensure token includes "Admin" role and is valid.');
      } else if (error.response?.status === 404) {
        console.warn('404 Not Found: Check if the server is running at', baseUrl, 'or if the endpoint is registered.');
      }
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, [axiosInstance, baseUrl]);

  useEffect(() => {
    fetchAllLeaves();
  }, [fetchAllLeaves]);

  const handleAction = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.put(`action/${payload.LeaveID}`, {
        Status: payload.Status,
        RejectionReason: payload.RejectionReason,
      });

      if ([200, 204].includes(response.status)) {
        setSuccessMessage(`Leave ${payload.Status === 1 ? 'approved' : 'rejected'} successfully`);
        await fetchAllLeaves(); // Refresh all leaves after action
        const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to update leave: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`
        : `Failed to update leave: ${error.message}`;
      console.error('Action error details:', error.response?.data || error);
      setErrorMessage(errorMsg);
      if (error.response?.status === 400) {
        console.warn('400 Bad Request: Check payload structure.');
      } else if (error.response?.status === 401) {
        console.warn('401 Unauthorized: Ensure token includes "Admin" role and is valid.');
      }
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
      throw error;
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  return {
    leaves,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    fetchAllLeaves,
    fetchPendingLeaves,
    handleAction,
  };
};

export { useLeaveSlice };