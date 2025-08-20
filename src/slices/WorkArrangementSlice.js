import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useWorkArrangementSlice = (baseUrl = 'https://localhost:14686/api/WorkArrangement') => {
  const [workArrangements, setWorkArrangements] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 5;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const fetchWorkArrangements = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch work arrangements after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get('', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('Raw API response for work arrangements:', JSON.stringify(response.data, null, 2));
      const mappedArrangements = response.data.map((arrangement) => ({
        ...arrangement,
        EmployeeName: arrangement.EmployeeName || 'N/A',
      }));
      setWorkArrangements(mappedArrangements || []);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch work arrangements: ${error.response.status} - ${error.response.statusText}`
        : `Failed to fetch work arrangements: ${error.message}`;
      setErrorMessage(errorMsg);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => fetchWorkArrangements(), 100);
    return () => clearTimeout(debounceFetch);
  }, [fetchWorkArrangements]);

  const checkWorkArrangementExists = async (employeeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`/check-existence/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return response.data.exists; // Assuming API returns { exists: true/false }
    } catch (error) {
      console.error('Failed to check work arrangement existence:', error);
      return false; // Assume no arrangement exists if check fails
    }
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const token = localStorage.getItem('token');
      const isEdit = payload.WorkArrangementID && payload.WorkArrangementID.trim() !== '';
      const formattedPayload = {
        WorkArrangementID: isEdit ? payload.WorkArrangementID : undefined,
        EmployeeID: payload.EmployeeID,
        IsBasic: payload.IsBasic,
        IsRetired: payload.IsRetired,
        IsPension: payload.IsPension,
        CostSharing: payload.CostSharing,
        CostSharingAmount: payload.CostSharingAmount,
        TerminationDate: payload.TerminationDate,
        CreatedAt: payload.CreatedAt || new Date().toISOString(),
        UpdatedAt: payload.UpdatedAt || new Date().toISOString(),
        EmployeeName: payload.EmployeeName, // Include EmployeeName for mapping
      };

      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${formattedPayload.WorkArrangementID}` : '',
        formattedPayload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 201 || response.status === 204 || response.status === 200) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchWorkArrangements();
        const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      let errorMsg = error.response
        ? `Failed to ${payload.WorkArrangementID ? 'update' : 'add'} work arrangement: ${error.response.status} - ${error.response.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : error.response.statusText}`
        : `Failed to ${payload.WorkArrangementID ? 'update' : 'add'} work arrangement: ${error.message}`;
      if (error.response?.status === 400 && error.response.data?.errors) {
        errorMsg = errorMsg.replace(/EmployeeID [a-f0-9-]+/, `employee ${payload.EmployeeName || 'Unknown'}`);
      }
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
      throw error;
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  const handleDelete = async (workArrangementId) => {
    if (!workArrangementId || workArrangementId === 'undefined') {
      setErrorMessage('Cannot delete work arrangement: Invalid ID');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const token = localStorage.getItem('token');
      await axiosInstance.delete(`/${workArrangementId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setSuccessMessage('Deleted successfully');
      await fetchWorkArrangements();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to delete work arrangement: ${error.response.status} - ${error.response.statusText}`
        : `Failed to delete work arrangement: ${error.message}`;
      setErrorMessage(errorMsg);
      const errorTimeout = setTimeout(() => setErrorMessage(''), 10000);
      timeoutIds.current.push(errorTimeout);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  return {
    workArrangements,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchWorkArrangements,
    handleSubmit,
    handleDelete,
    checkWorkArrangementExists,
  };
};

export { useWorkArrangementSlice };