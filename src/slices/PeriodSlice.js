import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const usePeriodSlice = (baseUrl = 'https://localhost:14686/api/Period') => {
  const [periods, setPeriods] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const timeoutIds = useRef([]);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const axiosInstance = axios.create({
    baseURL: baseUrl,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
  });

  const fetchPeriods = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch periods after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      console.log('Raw API response:', JSON.stringify(response.data, null, 2));
      const mappedPeriods = response.data.map(period => ({
        periodId: period.PeriodId || period.periodId || period.PeriodID || period.id,
        name: period.Name || period.name || period.PeriodName || period.periodName || period.title,
        sequence: period.Sequence || period.sequence || period.PeriodSequence || period.sequenceNumber || period.order,
        startDate: period.startDate || period.StartDate,
        endDate: period.endDate || period.EndDate,
        calendarType: period.calendarType || period.CalendarType,
        cutoffDay: period.cutoffDay || period.CutoffDay,
        status: period.Status || period.status || 'Open', // Handle enum as string
        createdAt: period.createdAt || period.CreatedAt,
        updatedAt: period.updatedAt || period.UpdatedAt,
      }));
      console.log('Mapped periods:', JSON.stringify(mappedPeriods, null, 2));
      setPeriods(mappedPeriods || []);
      retryCount.current = 0;
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to fetch periods: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to fetch periods: ${error.message}`;
      console.error('Fetch error details:', errorMsg);
      setErrorMessage(errorMsg);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => fetchPeriods(), 100);
    return () => clearTimeout(debounceFetch);
  }, [fetchPeriods]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = payload.periodId && payload.periodId.trim() !== '';
      const formattedPayload = {
        periodId: isEdit ? payload.periodId : undefined,
        name: payload.name || '',
        sequence: payload.sequence || undefined,
        startDate: payload.startDate || '',
        endDate: payload.endDate || '',
        calendarType: payload.calendarType || 'Gregorian',
        cutoffDay: payload.cutoffDay || 0,
        status: payload.status || 'Open', // Send status as string
        createdAt: payload.createdAt || new Date().toISOString(),
        updatedAt: payload.updatedAt || new Date().toISOString(),
      };

      const cleanedPayload = Object.fromEntries(
        Object.entries(formattedPayload).filter(([_, value]) => value !== undefined && value !== '')
      );

      const payloadString = JSON.stringify(cleanedPayload);
      console.log('Cleaned payload being sent:', payloadString);

      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${formattedPayload.periodId}` : '',
        cleanedPayload
      );

      if (response.status === 201 || response.status === 200 || response.status === 204 || response.ok) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchPeriods();
        const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
        timeoutIds.current.push(successTimeout);
        return response.data;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      let errorMsg = error.response
        ? `Failed to ${payload.periodId ? 'update' : 'add'} period: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to ${payload.periodId ? 'update' : 'add'} period: ${error.message}`;
      console.error('Submit error details:', errorMsg);
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

  const handleDelete = async (periodId) => {
    if (!periodId || periodId === 'undefined') {
      setErrorMessage('Cannot delete period: Invalid period ID');
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const response = await axiosInstance.delete(`/${periodId}`);
      setSuccessMessage('Deleted successfully');
      await fetchPeriods();
      const successTimeout = setTimeout(() => setSuccessMessage(''), 10000);
      timeoutIds.current.push(successTimeout);
    } catch (error) {
      const errorMsg = error.response
        ? `Failed to delete period: ${error.response.status} - ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        : `Failed to delete period: ${error.message}`;
      console.error('Delete error details:', errorMsg);
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
    periods,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchPeriods,
    handleSubmit,
    handleDelete,
  };
};

export { usePeriodSlice };