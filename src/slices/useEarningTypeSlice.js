import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useEarningTypeSlice = (baseUrl = 'https://localhost:14686/api/EarningType') => {
  const [earningTypes, setEarningTypes] = useState([]);
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    timeout: 10000,
  });

  const fetchEarningTypes = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch earning types after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      console.log('Raw API Response:', response.data);
      const mappedEarningTypes = response.data.map((et) => ({
        EarningTypeID: et.EarningTypeID,
        EarningTypeName: et.EarningTypeName || 'N/A',
        Description: et.Description || 'N/A',
        IsTaxable: et.IsTaxable ?? false,
        IsFixedAmount: et.IsFixedAmount ?? true,
        CalculationRule: et.CalculationRule || 'N/A',
        IsActive: true, // Default to true for frontend-only IsActive
        CreatedAt: et.CreatedAt,
        UpdatedAt: et.UpdatedAt,
      }));
      setEarningTypes(mappedEarningTypes);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response?.data?.error || `Failed to fetch earning types: ${error.message}`;
      setErrorMessage(errorMsg);
      console.error('Fetch error:', error);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchEarningTypes();
  }, [fetchEarningTypes]);

  const handleSubmit = async (payload, earningTypeId = null) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = !!earningTypeId;
      // Remove IsActive from payload as it's not part of backend model
      const { IsActive, ...backendPayload } = payload;
      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${earningTypeId}` : '',
        backendPayload
      );
      if (response.status === 201 || response.status === 204) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchEarningTypes();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || `Failed to ${earningTypeId ? 'update' : 'add'} earning type: ${error.message}`;
      setErrorMessage(errorMsg);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  const handleDelete = async (earningTypeId) => {
    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      await axiosInstance.delete(`/${earningTypeId}`);
      setSuccessMessage('Deleted successfully');
      await fetchEarningTypes();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || `Failed to delete earning type: ${error.message}`;
      setErrorMessage(errorMsg);
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  return {
    earningTypes,
    successMessage,
    errorMessage,
    setErrorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchEarningTypes,
    handleSubmit,
    handleDelete,
  };
};

export { useEarningTypeSlice };