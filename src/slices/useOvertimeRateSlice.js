import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const useOvertimeRateSlice = (baseUrl = 'https://localhost:14686/api/OvertimeRate') => {
  const [overtimeRates, setOvertimeRates] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 5;

  const { token } = useSelector((state) => state.auth); // Get token from Redux store

  // Create axios instance for each request with dynamic token
  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const fetchOvertimeRates = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch overtime rates after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      if (!token) throw new Error('No authentication token available');
      const response = await axiosInstance.get('', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mappedOvertimeRates = response.data.map(overtimeRate => ({
        overtimeRateID: overtimeRate.overtimeRateID,
        dayType: overtimeRate.dayType,
        startTime: overtimeRate.startTime,
        endTime: overtimeRate.endTime,
        multiplier: overtimeRate.multiplier,
        createdByName: overtimeRate.createdByName,
        createdAt: overtimeRate.createdAt,
        updatedAt: overtimeRate.updatedAt
      }));
      setOvertimeRates(mappedOvertimeRates);
      retryCount.current = 0;
    } catch (error) {
      console.error('Fetch error:', error.response?.data || error.message);
      setErrorMessage(`Failed to fetch overtime rates: ${error.message}`);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, [token]);

  useEffect(() => {
    const debounceFetch = setTimeout(() => fetchOvertimeRates(), 100);
    return () => clearTimeout(debounceFetch);
  }, [fetchOvertimeRates]);

  const handleSubmit = async (payload, overtimeRateId = null) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      if (!token) throw new Error('No authentication token available');
      const isEdit = !!overtimeRateId;
      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${overtimeRateId}` : '',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 201 || response.status === 200) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchOvertimeRates();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      console.error('Submit error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || `Failed to ${overtimeRateId ? 'update' : 'add'} overtime rate: ${error.message}`);
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
    }
  };

  const handleDelete = async (overtimeRateId) => {
    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      if (!token) throw new Error('No authentication token available');
      await axiosInstance.delete(`/${overtimeRateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage('Deleted successfully');
      await fetchOvertimeRates();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Delete error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || `Failed to delete overtime rate: ${error.message}`);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
    }
  };

  return {
    overtimeRates,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchOvertimeRates,
    handleSubmit,
    handleDelete
  };
};

export { useOvertimeRateSlice };