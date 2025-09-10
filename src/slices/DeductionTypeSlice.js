import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const useDeductionTypeSlice = (baseUrl = 'https://localhost:14686/api/DeductionType') => {
  const [deductionTypes, setDeductionTypes] = useState([]);
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

  const fetchDeductionTypes = useCallback(async () => {
    if (retryCount.current >= maxRetries) {
      setErrorMessage('Failed to fetch deduction types after multiple attempts.');
      return;
    }

    setIsFetching(true);
    setErrorMessage('');
    try {
      const response = await axiosInstance.get('');
      const mappedDeductionTypes = response.data.map((dt) => ({
        DeductionTypeID: dt.DeductionTypeID,
        DeductionTypeName: dt.DeductionTypeName,
        Description: dt.Description,
        IsTaxable: dt.IsTaxable,
        IsFixedAmount: dt.IsFixedAmount,
        CalculationRule: dt.CalculationRule,
        IsActive: dt.IsActive,
        CreatedAt: dt.CreatedAt,
        UpdatedAt: dt.UpdatedAt,
      }));
      setDeductionTypes(mappedDeductionTypes);
      retryCount.current = 0;
    } catch (error) {
      setErrorMessage(`Failed to fetch deduction types: ${error.message}`);
      retryCount.current += 1;
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const debounceFetch = setTimeout(() => fetchDeductionTypes(), 100);
    return () => clearTimeout(debounceFetch);
  }, [fetchDeductionTypes]);

  const handleSubmit = async (payload, deductionTypeId = null) => {
    setIsSubmitting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      const isEdit = !!deductionTypeId;
      const response = await axiosInstance[isEdit ? 'put' : 'post'](
        isEdit ? `/${deductionTypeId}` : '',
        payload
      );
      if (response.status === 201 || response.status === 200) {
        setSuccessMessage(isEdit ? 'Updated successfully' : 'Submitted successfully');
        await fetchDeductionTypes();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.error || `Failed to ${deductionTypeId ? 'update' : 'add'} deduction type: ${error.message}`
      );
    } finally {
      setIsSubmitting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  const handleDelete = async (deductionTypeId) => {
    setIsDeleting(true);
    setErrorMessage('');
    const timeoutId = setTimeout(() => setErrorMessage('Request timed out'), 10000);
    timeoutIds.current.push(timeoutId);

    try {
      await axiosInstance.delete(`/${deductionTypeId}`);
      setSuccessMessage('Deleted successfully');
      await fetchDeductionTypes();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage(error.response?.data?.error || `Failed to delete deduction type: ${error.message}`);
    } finally {
      setIsDeleting(false);
      clearTimeout(timeoutId);
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }
  };

  return {
    deductionTypes,
    successMessage,
    errorMessage,
    isFetching,
    isSubmitting,
    isDeleting,
    fetchDeductionTypes,
    handleSubmit,
    handleDelete,
  };
};

export { useDeductionTypeSlice };