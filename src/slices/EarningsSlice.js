import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useEarningsSlice = (baseUrl = 'https://localhost:14686/api/Earnings') => {
  const [earnings, setEarnings] = useState([]);
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

  const fetchEarnings = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch earnings after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      const validStatuses = ['Draft', 'Pending Approval', 'Approved', 'Applied', 'Cancelled'];
      const validTaxabilities = ['Taxable', 'NonTaxable', 'PartiallyTaxable'];
      const mappedEarnings = response.data.map(earning => ({
        EarningID: earning.EarningID,
        EmployeeID: earning.EmployeeID,
        PeriodID: earning.PeriodID,
        EarningTypeID: earning.EarningTypeID,
        EmployeeName: earning.EmployeeName || 'N/A',
        PeriodName: earning.PeriodName || 'N/A',
        EarningTypeName: earning.EarningTypeName || 'N/A',
        Amount: earning.Amount ?? 0,
        Taxability: validTaxabilities.includes(earning.Taxability) ? earning.Taxability : 'Taxable',
        TaxableRate: earning.Taxability === 'PartiallyTaxable' ? (earning.TaxableRate ?? null) : null,
        IsBasic: earning.IsBasic ?? false,
        StartDate: earning.StartDate,
        EndDate: earning.EndDate,
        Status: validStatuses.includes(earning.Status) ? earning.Status : 'Draft',
        Remarks: earning.Remarks || 'N/A',
        CreatedAt: earning.CreatedAt,
        UpdatedAt: earning.UpdatedAt,
      }));
      setEarnings(mappedEarnings);
      retryCount.current = 0;
    } catch (error) {
      const errorDetails = error.response?.data?.details || error.message;
      setErrorMessage(`Failed to fetch earnings: ${errorDetails}`);
      retryCount.current += 1;
      console.error('Fetch error:', error);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => fetchEarnings(), 100);
    return () => clearTimeout(debounceFetch);
  }, [fetchEarnings]);

  const handleSubmit = async (payload, earningId = null) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = !!earningId;
      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${earningId}` : '',
        payload
      );
      if (response.status === 201 || response.status === 204) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchEarnings();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      const errorDetails = error.response?.data?.error || error.message;
      setErrorMessage(`Failed to ${earningId ? 'update' : 'add'} earning: ${errorDetails}`);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
    }
  };

  const handleDelete = async (earningId) => {
    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      await axiosInstance.delete(`/${earningId}`);
      setSuccessMessage('Deleted successfully');
      await fetchEarnings();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      const errorDetails = error.response?.data?.error || error.message;
      setErrorMessage(`Failed to delete earning: ${errorDetails}`);
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter(id => id !== timeoutId);
    }
  };

  return {
    earnings,
    successMessage,
    errorMessage,
    setErrorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchEarnings,
    handleSubmit,
    handleDelete,
  };
};

export { useEarningsSlice };